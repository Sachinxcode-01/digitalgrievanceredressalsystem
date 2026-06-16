const grievanceRepository = require('../repositories/grievanceRepository');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');
const { logAudit } = require('./auditService');

const grievanceService = {
  async getAllGrievances(user, queryUserId = null) {
    let scopedUserId = null;
    if (user.role !== 'admin' && user.role !== 'super admin') {
      scopedUserId = user.id;
    } else if (queryUserId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(queryUserId) || queryUserId.startsWith('demo-') || queryUserId.startsWith('user_')) {
        scopedUserId = queryUserId;
      }
    }
    return grievanceRepository.getAll(scopedUserId);
  },

  async createGrievance(grievanceData, user, ip, userAgent) {
    const finalUserId = user ? user.id : (grievanceData.user_id || 'anonymous');
    const finalEmail = user ? user.email : (grievanceData.email || '');

    // Category mapping logic
    const category = grievanceData.category || 'General';
    const cat = category.toLowerCase();
    let deptName = 'Facilities & Maintenance'; // Fallback default
    if (cat.includes('academic')) {
      deptName = 'Academic Affairs';
    } else if (cat.includes('it') || cat.includes('support')) {
      deptName = 'IT Support';
    } else if (cat.includes('financial') || cat.includes('fee')) {
      deptName = 'Financial Services';
    }

    // Auto-assignment look up
    let assignedOfficerId = null;
    try {
      const depts = await grievanceRepository.getDepartments();
      const deptInfo = depts.find(d => d.name === deptName);
      if (deptInfo && deptInfo.head_user_id) {
        assignedOfficerId = deptInfo.head_user_id;
      }
    } catch (err) {
      console.warn('Department coordinator lookup failed:', err.message);
    }

    // SLA hours mapping
    const priority = grievanceData.urgency || 'Medium';
    let slaHours = priority === 'High' ? 24 : priority === 'Medium' ? 72 : 120;
    try {
      const rules = await grievanceRepository.getSlaRules();
      const matchingRule = rules.find(r => r.category === deptName && r.priority === priority);
      if (matchingRule) {
        slaHours = matchingRule.resolution_time_hours;
      }
    } catch (err) {
      console.warn('SLA rules mapping failed, applying defaults:', err.message);
    }

    const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    const statusInput = grievanceData.status || 'Submitted';
    const finalStatus = statusInput === 'Draft' ? 'Draft' : (assignedOfficerId ? 'Assigned' : 'Submitted');
    const finalAssignee = finalStatus === 'Draft' ? null : assignedOfficerId;

    const newGrievance = await grievanceRepository.create({
      ticket_id: grievanceData.ticket_id,
      user_id: finalUserId,
      title: grievanceData.title,
      description: grievanceData.description,
      category: category,
      department: deptName,
      urgency: priority,
      frustration_index: grievanceData.frustration_index || 1,
      attachment_url: grievanceData.attachment_url,
      location: grievanceData.location,
      latitude: grievanceData.latitude,
      longitude: grievanceData.longitude,
      status: finalStatus,
      assigned_to: finalAssignee,
      sla_due_at: slaDueAt
    });

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: newGrievance.id,
      status: newGrievance.status,
      activity_type: 'created',
      performed_by: finalUserId === 'anonymous' ? null : finalUserId,
      notes: finalStatus === 'Draft'
        ? 'Grievance draft saved.'
        : (finalAssignee 
            ? `Grievance registered and auto-routed to ${deptName} coordinator.`
            : `Grievance registered. Ticket Reference: #${grievanceData.ticket_id}`)
    });

    // If auto-assigned, log assignment event in timeline too
    if (finalAssignee) {
      await grievanceRepository.addTimelineEvent({
        grievance_id: newGrievance.id,
        status: 'Assigned',
        activity_type: 'assignment',
        performed_by: null,
        notes: `Auto-assigned to department: ${deptName}`
      });
    }

    // Audit log
    await logAudit(
      finalUserId === 'anonymous' ? null : finalUserId,
      'GRIEVANCE_CREATED',
      ip,
      userAgent,
      { ticket_id: grievanceData.ticket_id, category: category, urgency: priority, department: deptName, assigned_to: assignedOfficerId }
    );

    // Notifications
    if (finalEmail) {
      emailService.sendGrievanceEmail(finalEmail, grievanceData.ticket_id, grievanceData.title, finalUserId === 'anonymous' ? null : finalUserId).catch(err => 
        console.error(`Email confirmation dispatch failed: ${err.message}`)
      );
    }
    
    if (assignedOfficerId) {
      // Fetch coordinator email
      userRepository.findById(assignedOfficerId).then(coordinator => {
        if (coordinator && coordinator.email) {
          emailService.sendGrievanceAssignedEmail(coordinator.email, grievanceData.ticket_id, grievanceData.title, priority, deptName).catch(err =>
            console.error(`Coordinator notification dispatch failed: ${err.message}`)
          );
        }
      }).catch(err => console.error('Failed to retrieve coordinator email:', err.message));
    } else {
      emailService.sendNewGrievanceAlertEmail(grievanceData.ticket_id, grievanceData.title, category, priority).catch(err => 
        console.error(`Admin notification dispatch failed: ${err.message}`)
      );
    }

    return newGrievance;
  },

  async getGrievanceById(id, user) {
    const grievance = await grievanceRepository.findById(id);
    if (!grievance) {
      throw new Error('Grievance not found');
    }

    if (user.role !== 'admin' && user.role !== 'super admin' && grievance.user_id !== user.id) {
      const err = new Error('Access Denied: Scoped access violation');
      err.status = 403;
      throw err;
    }

    return grievance;
  },

  async updateGrievanceStatus(id, status, resolutionNotes, user, ip, userAgent) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      throw new Error('Grievance not found');
    }

    // Enforce state transition rules
    const ALLOWED_TRANSITIONS = {
      'Draft': ['Submitted'],
      'Submitted': ['Under Review', 'Assigned', 'Closed'],
      'Under Review': ['Assigned', 'In Progress', 'Closed'],
      'Assigned': ['In Progress', 'Pending User Response', 'Escalated', 'Closed'],
      'In Progress': ['Pending User Response', 'Resolved', 'Escalated', 'Closed'],
      'Pending User Response': ['In Progress', 'Resolved', 'Closed'],
      'Escalated': ['In Progress', 'Resolved', 'Closed'],
      'Resolved': ['Closed', 'Reopened'],
      'Closed': ['Reopened'],
      'Reopened': ['Assigned', 'In Progress', 'Resolved', 'Closed']
    };

    const currentStatus = ticket.status || 'Submitted';
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    
    // Any ticket can be escalated from non-terminal states
    const isEscalation = status === 'Escalated' && !['Resolved', 'Closed'].includes(currentStatus);
    
    if (currentStatus !== status && !allowed.includes(status) && !isEscalation) {
      const err = new Error(`Invalid status transition from '${currentStatus}' to '${status}'.`);
      err.status = 400;
      throw err;
    }

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'Resolved') {
      updates.resolution_notes = resolutionNotes || 'Grievance resolved successfully.';
      updates.resolved_at = new Date().toISOString();
    }

    const updatedTicket = await grievanceRepository.update(id, updates);

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status,
      activity_type: status === 'Resolved' ? 'resolution' : 'status_change',
      performed_by: user.id,
      notes: status === 'Resolved' ? resolutionNotes : `Status updated from ${ticket.status} to ${status}`
    });

    // Audit Log
    await logAudit(
      user.id, 
      `GRIEVANCE_STATUS_UPDATE`, 
      ip, 
      userAgent, 
      { ticket_id: ticket.ticket_id, old_status: ticket.status, new_status: status }
    );

    // System Alert
    await grievanceRepository.addSystemAlert({
      type: 'GRIEVANCE_UPDATE',
      message: `Ticket ${ticket.ticket_id} status updated to ${status}`,
      priority: status === 'Resolved' ? 'normal' : 'high',
      metadata: { ticket_id: ticket.ticket_id, status, grievance_id: id }
    });

    return updatedTicket;
  },

  async assignGrievance(id, assignedTo, department, user, ip, userAgent) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      throw new Error('Grievance not found');
    }

    const updates = {
      status: 'Assigned',
      assigned_to: assignedTo || null,
      department: department || ticket.department,
      updated_at: new Date().toISOString()
    };

    const updatedTicket = await grievanceRepository.update(id, updates);

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status: 'Assigned',
      activity_type: 'assignment',
      performed_by: user.id,
      notes: `Assigned to department: ${department || 'General'}${assignedTo ? ` (Officer Assigned)` : ''}`
    });

    // Assignee email
    let assigneeEmail = '';
    if (assignedTo) {
      const assigneeUser = await userRepository.findById(assignedTo).catch(() => null);
      if (assigneeUser) assigneeEmail = assigneeUser.email;
    }

    if (assigneeEmail) {
      emailService.sendGrievanceAssignedEmail(assigneeEmail, ticket.ticket_id, ticket.title, ticket.urgency, department || 'General').catch(console.error);
    }

    // Audit log
    await logAudit(
      user.id, 
      `GRIEVANCE_ASSIGNMENT`, 
      ip, 
      userAgent, 
      { ticket_id: ticket.ticket_id, assigned_to: assignedTo, department }
    );

    // System Alert
    await grievanceRepository.addSystemAlert({
      type: 'GRIEVANCE_ASSIGNMENT',
      message: `Ticket ${ticket.ticket_id} assigned to ${department || 'department'}`,
      priority: 'normal',
      metadata: { ticket_id: ticket.ticket_id, assigned_to: assignedTo, department }
    });

    return updatedTicket;
  },

  async escalateGrievance(id, reason, user, ip, userAgent) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      throw new Error('Grievance not found');
    }

    const updates = {
      status: 'Escalated',
      escalated_at: new Date().toISOString(),
      escalated_reason: reason || 'SLA Threshold Breach',
      updated_at: new Date().toISOString()
    };

    const updatedTicket = await grievanceRepository.update(id, updates);

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status: 'Escalated',
      activity_type: 'escalation',
      performed_by: user ? user.id : null,
      notes: `Ticket escalated: ${reason || 'SLA Breach'}`
    });

    // Escalation alert email
    emailService.sendEscalatedGrievanceAlertEmail(ticket.ticket_id, ticket.title, ticket.category, ticket.frustration_index || 5).catch(console.error);

    // Audit log
    await logAudit(
      user ? user.id : null, 
      `GRIEVANCE_ESCALATION`, 
      ip, 
      userAgent, 
      { ticket_id: ticket.ticket_id, reason }
    );

    // System Alert
    await grievanceRepository.addSystemAlert({
      type: 'GRIEVANCE_ESCALATION',
      message: `CRITICAL: Ticket ${ticket.ticket_id} escalated!`,
      priority: 'high',
      metadata: { ticket_id: ticket.ticket_id, reason }
    });

    return updatedTicket;
  },

  async checkSLABreaches(ip, userAgent) {
    const now = new Date().toISOString();
    const overdue = await grievanceRepository.getOverdueGrievances(now);
    if (overdue.length === 0) return { count: 0 };

    let count = 0;
    for (const ticket of overdue) {
      try {
        await this.escalateGrievance(ticket.id, 'Automatic SLA Breach Escalation', null, ip, userAgent);
        count++;
      } catch (err) {
        console.error(`SLA auto-escalation failed for ticket ${ticket.ticket_id}:`, err.message);
      }
    }
    return { count };
  },

  async getGrievanceTimeline(id, user) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      throw new Error('Grievance not found');
    }

    if (user.role !== 'admin' && user.role !== 'super admin' && ticket.user_id !== user.id) {
      const err = new Error('Access Denied: Timeline scoped violation');
      err.status = 403;
      throw err;
    }

    return grievanceRepository.getTimeline(id);
  },

  async submitFeedback(id, rating, comments, user, ip, userAgent) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      throw new Error('Grievance not found');
    }

    if (ticket.user_id !== user.id && user.role !== 'admin' && user.role !== 'super admin') {
      const err = new Error('Access Denied: Scoped access violation');
      err.status = 403;
      throw err;
    }

    const updates = {
      rating: parseInt(rating, 10),
      feedback_comments: comments,
      status: 'Closed',
      updated_at: new Date().toISOString()
    };

    const updatedTicket = await grievanceRepository.update(id, updates);

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status: 'Closed',
      activity_type: 'feedback',
      performed_by: user.id,
      notes: `Feedback submitted: Rating ${rating}/5. Comments: ${comments || 'None'}. Ticket closed.`
    });

    // Audit Log
    await logAudit(
      user.id,
      'GRIEVANCE_FEEDBACK_SUBMITTED',
      ip,
      userAgent,
      { ticket_id: ticket.ticket_id, rating, comments }
    );

    return updatedTicket;
  }
};

module.exports = grievanceService;

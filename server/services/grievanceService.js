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

    const newGrievance = await grievanceRepository.create({
      ticket_id: grievanceData.ticket_id,
      user_id: finalUserId,
      title: grievanceData.title,
      description: grievanceData.description,
      category: grievanceData.category,
      department: grievanceData.department || 'General',
      urgency: grievanceData.urgency,
      frustration_index: grievanceData.frustration_index || 1,
      attachment_url: grievanceData.attachment_url,
      location: grievanceData.location,
      latitude: grievanceData.latitude,
      longitude: grievanceData.longitude,
      status: 'New'
    });

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: newGrievance.id,
      status: 'New',
      activity_type: 'created',
      performed_by: finalUserId === 'anonymous' ? null : finalUserId,
      notes: `Grievance registered. Ticket Reference: #${grievanceData.ticket_id}`
    });

    // Audit log
    await logAudit(
      finalUserId === 'anonymous' ? null : finalUserId,
      'GRIEVANCE_CREATED',
      ip,
      userAgent,
      { ticket_id: grievanceData.ticket_id, category: grievanceData.category, urgency: grievanceData.urgency }
    );

    // Notifications
    if (finalEmail) {
      emailService.sendGrievanceEmail(finalEmail, grievanceData.ticket_id, grievanceData.title, finalUserId === 'anonymous' ? null : finalUserId).catch(err => 
        console.error(`Email confirmation dispatch failed: ${err.message}`)
      );
    }
    
    emailService.sendNewGrievanceAlertEmail(grievanceData.ticket_id, grievanceData.title, grievanceData.category, grievanceData.urgency).catch(err => 
      console.error(`Admin notification dispatch failed: ${err.message}`)
    );

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
      status: 'Pending',
      escalated_at: new Date().toISOString(),
      escalated_reason: reason || 'SLA Threshold Breach',
      updated_at: new Date().toISOString()
    };

    const updatedTicket = await grievanceRepository.update(id, updates);

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status: ticket.status,
      activity_type: 'escalation',
      performed_by: user.id,
      notes: `Ticket escalated: ${reason || 'SLA Breach'}`
    });

    // Escalation alert email
    emailService.sendEscalatedGrievanceAlertEmail(ticket.ticket_id, ticket.title, ticket.category, ticket.frustration_index || 5).catch(console.error);

    // Audit log
    await logAudit(
      user.id, 
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
  }
};

module.exports = grievanceService;

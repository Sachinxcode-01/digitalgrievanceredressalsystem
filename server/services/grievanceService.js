const grievanceRepository = require('../repositories/grievanceRepository');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');
const messagingService = require('./messagingService');
const aiService = require('./aiService');
const cacheManager = require('../utils/cacheManager');
const { generateGrievanceHash, generateAnonymousPasskey, verifyGrievanceHash } = require('../utils/cryptoUtil');
const { logAudit } = require('./auditService');

/**
 * Generates a collision-resistant ticket reference on the server.
 * Format: TKT-<YEAR>-<8 chars> (4 time-based + 4 random, base36 uppercase).
 * Verifies uniqueness against the DB with a few retries; a DB unique constraint
 * remains the final safety net.
 */
async function generateUniqueTicketId() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 6; attempt++) {
    const timePart = Date.now().toString(36).slice(-4).toUpperCase();
    const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    const candidate = `TKT-${year}-${timePart}${randPart}`;
    try {
      const existing = await grievanceRepository.findByTicketId(candidate);
      if (!existing) return candidate;
    } catch {
      // If the uniqueness lookup fails, use the candidate — collisions here are
      // astronomically unlikely and a DB unique constraint is the final guard.
      return candidate;
    }
  }
  return `TKT-${year}-${Date.now().toString(36).toUpperCase()}`;
}

const grievanceService = {
  async getAllGrievances(user, queryUserId = null, queryDepartment = null) {
    let scopedUserId = null;
    let scopedDepartment = null;

    const isAdmin = user.role === 'admin' || user.role === 'super admin';
    const isOfficer = user.role === 'officer' || user.role === 'faculty' || user.role === 'staff';

    if (isAdmin) {
      if (queryUserId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(queryUserId) || queryUserId.startsWith('demo-') || queryUserId.startsWith('user_')) {
          scopedUserId = queryUserId;
        }
      }
      if (queryDepartment) {
        scopedDepartment = queryDepartment;
      }
    } else if (isOfficer) {
      // Officers view department-specific grievances or their own assignments
      scopedDepartment = user.department || queryDepartment || null;
    } else {
      // Students and general citizens are strictly isolated to their own grievances
      scopedUserId = user.id;
    }

    return grievanceRepository.getAll(scopedUserId, scopedDepartment);
  },

  async createGrievance(grievanceData, user, ip, userAgent) {
    const finalUserId = user ? user.id : (grievanceData.user_id || 'anonymous');
    const finalEmail = user ? user.email : (grievanceData.email || '');

    // Ticket ID is ALWAYS generated server-side. Any client-supplied ticket_id is
    // ignored to guarantee uniqueness and a consistent, collision-safe format.
    const ticketId = await generateUniqueTicketId();

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
    let routedToAdminFallback = false;
    try {
      const depts = await grievanceRepository.getDepartments();
      const deptInfo = depts.find(d => d.name === deptName);
      if (deptInfo && deptInfo.head_user_id) {
        assignedOfficerId = deptInfo.head_user_id;
      }
    } catch (err) {
      console.warn('Department coordinator lookup failed:', err.message);
    }

    // Fallback: if no department head is configured, route to the administrator so a
    // ticket is never left unowned.
    if (!assignedOfficerId && process.env.ADMIN_EMAIL) {
      try {
        const adminUser = await userRepository.findByEmail(process.env.ADMIN_EMAIL);
        if (adminUser && adminUser.id) {
          assignedOfficerId = adminUser.id;
          routedToAdminFallback = true;
        }
      } catch (err) {
        console.warn('Admin fallback assignment lookup failed:', err.message);
      }
    }

    // Emergency SOS SLA mapping
    const isEmergency = Boolean(grievanceData.is_emergency || grievanceData.isEmergency || grievanceData.urgency === 'CRITICAL');
    const priority = isEmergency ? 'CRITICAL' : (grievanceData.urgency || 'Medium');
    
    let slaHours = isEmergency ? 2 : (priority === 'High' ? 24 : priority === 'Medium' ? 72 : 120);
    try {
      if (!isEmergency) {
        const rules = await grievanceRepository.getSlaRules();
        const matchingRule = rules.find(r => r.category === deptName && r.priority === priority);
        if (matchingRule) {
          slaHours = matchingRule.resolution_time_hours;
        }
      }
    } catch (err) {
      console.warn('SLA rules mapping failed, applying defaults:', err.message);
    }

    const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    // Whistleblower Anonymous Passkey check
    let passkeyInfo = null;
    let finalTicketId = ticketId;
    if (grievanceData.is_anonymous || grievanceData.isAnonymous) {
      passkeyInfo = generateAnonymousPasskey();
      finalTicketId = passkeyInfo.ticketKey;
    }

    // SHA-256 Cryptographic Audit Hash
    const proofHash = generateGrievanceHash({
      ticket_key: finalTicketId,
      subject: grievanceData.title,
      description: grievanceData.description,
      category: category,
      created_at: new Date().toISOString()
    });

    // AI Knowledge Base Auto-Resolution Evaluation
    const kbMatch = await aiService.matchKnowledgeBaseAutoResolution({
      subject: grievanceData.title,
      description: grievanceData.description
    });

    const statusInput = grievanceData.status || 'Submitted';
    let finalStatus = statusInput === 'Draft' ? 'Draft' : (assignedOfficerId ? 'Assigned' : 'Submitted');
    
    if (kbMatch && kbMatch.isAutoResolved) {
      finalStatus = 'AUTO_RESOLVED';
    } else if (isEmergency) {
      finalStatus = 'EMERGENCY_SOS';
    }

    const finalAssignee = finalStatus === 'Draft' ? null : assignedOfficerId;

    const newGrievance = await grievanceRepository.create({
      ticket_id: finalTicketId,
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
      sla_due_at: slaDueAt,
      is_emergency: isEmergency,
      is_anonymous: Boolean(passkeyInfo),
      secret_passkey: passkeyInfo ? passkeyInfo.secretPasskey : null,
      proof_hash: proofHash,
      auto_resolution_notes: kbMatch.isAutoResolved ? kbMatch.solutionNotes : null
    });

    // Attach passkey details for Whistleblower client response
    if (passkeyInfo) {
      newGrievance.passkeyInfo = passkeyInfo;
    }

    // Trigger Emergency Broadcast if emergency SOS
    if (isEmergency) {
      messagingService.dispatchEmergencyBroadcast(newGrievance).catch(err => {
        console.warn('[Emergency SOS Dispatch Warning]:', err.message);
      });
    }

    // Timeline event — record registration and how the ticket was routed.
    const routingNote = finalStatus === 'Draft'
      ? 'Grievance draft saved.'
      : (finalAssignee
          ? (routedToAdminFallback
              ? `Grievance registered and routed to ${deptName}. No department head configured — assigned to administrator.`
              : `Grievance registered and auto-routed to the ${deptName} coordinator.`)
          : `Grievance registered under ${deptName}. Ticket Reference: #${ticketId}`);

    await grievanceRepository.addTimelineEvent({
      grievance_id: newGrievance.id,
      status: newGrievance.status,
      activity_type: 'created',
      performed_by: finalUserId === 'anonymous' ? null : finalUserId,
      notes: routingNote
    });

    // If auto-assigned, log a dedicated assignment event in the timeline too.
    if (finalAssignee) {
      await grievanceRepository.addTimelineEvent({
        grievance_id: newGrievance.id,
        status: 'Assigned',
        activity_type: 'assignment',
        performed_by: null,
        notes: routedToAdminFallback
          ? `Auto-assigned to administrator (fallback — no ${deptName} head configured).`
          : `Auto-assigned to ${deptName} department coordinator.`
      });
    }

    // Audit log
    await logAudit(
      finalUserId === 'anonymous' ? null : finalUserId,
      'GRIEVANCE_CREATED',
      ip,
      userAgent,
      { ticket_id: ticketId, category: category, urgency: priority, department: deptName, assigned_to: assignedOfficerId }
    );

    // Notifications (fire-and-forget — email failures must never block submission)
    if (finalEmail) {
      emailService.sendGrievanceEmail(
        finalEmail, 
        ticketId, 
        grievanceData.title, 
        category, 
        priority, 
        deptName, 
        slaDueAt, 
        finalUserId === 'anonymous' ? null : finalUserId
      ).catch(err => 
        console.error(`Email confirmation dispatch failed: ${err.message}`)
      );
    }
    
    // Always notify Admin of new grievance submission
    emailService.sendNewGrievanceAlertEmail(
      ticketId, 
      grievanceData.title, 
      category, 
      priority, 
      deptName, 
      slaDueAt
    ).catch(err => 
      console.error(`Admin notification dispatch failed: ${err.message}`)
    );

    // Notify assigned officer/department coordinator if assigned
    if (assignedOfficerId) {
      userRepository.findById(assignedOfficerId).then(coordinator => {
        if (coordinator && coordinator.email) {
          emailService.sendGrievanceAssignedEmail(coordinator.email, ticketId, grievanceData.title, priority, deptName).catch(err =>
            console.error(`Coordinator notification dispatch failed: ${err.message}`)
          );
        }
      }).catch(err => console.error('Failed to retrieve coordinator email:', err.message));
    }

    return newGrievance;
  },

  async getGrievanceById(id, user) {
    const grievance = await grievanceRepository.findById(id);
    if (!grievance) {
      const err = new Error('Grievance not found');
      err.status = 404;
      throw err;
    }

    const isAdmin = user.role === 'admin' || user.role === 'super admin';
    const isAssignee = grievance.assigned_to === user.id || (user.email && grievance.assigned_to === user.email);
    const isOfficer = user.role === 'officer' || user.role === 'faculty' || user.role === 'staff';
    const isOwner = grievance.user_id === user.id || (user.email && grievance.email === user.email);

    if (!isAdmin && !isOwner && !isAssignee && !isOfficer) {
      const err = new Error('Access Denied: Scoped access violation');
      err.status = 403;
      throw err;
    }

    return grievance;
  },

  async updateGrievanceStatus(id, status, resolutionNotes, user, ip, userAgent) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      const err = new Error('Grievance not found');
      err.status = 404;
      throw err;
    }

    const isAdmin = user.role === 'admin' || user.role === 'super admin';
    const isAssignee = ticket.assigned_to === user.id || (user.email && ticket.assigned_to === user.email);
    const isOfficer = user.role === 'officer' || user.role === 'faculty' || user.role === 'staff';
    const isOwner = ticket.user_id === user.id || (user.email && ticket.email === user.email);

    if (!isAdmin && !isAssignee && !isOfficer && !isOwner) {
      const err = new Error('Access Denied: Not authorized to update grievance status');
      err.status = 403;
      throw err;
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

    // Dispatch non-blocking email notifications for status transitions
    if (currentStatus !== status) {
      const notificationService = require('./notificationService');
      if (status === 'Resolved') {
        const resolutionTime = new Date().toISOString();
        notificationService.sendResolutionCompletedEmail(ticket.user_id, ticket.ticket_id, ticket.title, updates.resolution_notes, resolutionTime).catch(err =>
          console.error(`Resolution email dispatch failed: ${err.message}`)
        );
        notificationService.sendFeedbackRequestEmail(ticket.user_id, ticket.ticket_id, ticket.title).catch(err =>
          console.error(`Feedback request email dispatch failed: ${err.message}`)
        );
      } else if (status === 'Escalated') {
        notificationService.sendEscalatedGrievanceAlertEmail(ticket.ticket_id, ticket.title, ticket.category, ticket.frustration_index || 5).catch(err =>
          console.error(`Escalation email dispatch failed: ${err.message}`)
        );
      } else {
        notificationService.sendGrievanceStatusUpdatedEmail(ticket.user_id, ticket.ticket_id, ticket.title, currentStatus, status, {
          officerName: user.full_name || user.email,
          department: ticket.department
        }).catch(err =>
          console.error(`Status update email dispatch failed: ${err.message}`)
        );
      }
    }

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

    // Assignee email lookup (officer ID or department head)
    let assigneeEmail = '';
    if (assignedTo) {
      const assigneeUser = await userRepository.findById(assignedTo).catch(() => null);
      if (assigneeUser) assigneeEmail = assigneeUser.email;
    } else if (department || ticket.department) {
      const targetDept = department || ticket.department;
      try {
        const depts = await grievanceRepository.getDepartments();
        const deptInfo = depts.find(d => d.name === targetDept);
        if (deptInfo && deptInfo.head_user_id) {
          const headUser = await userRepository.findById(deptInfo.head_user_id).catch(() => null);
          if (headUser) assigneeEmail = headUser.email;
        }
      } catch (err) {
        console.warn('Department head email lookup failed:', err.message);
      }
    }

    if (assigneeEmail) {
      emailService.sendGrievanceAssignedEmail(assigneeEmail, ticket.ticket_id, ticket.title, ticket.urgency, department || ticket.department || 'General').catch(console.error);
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

  async escalateGrievance(id, reason, user, ip, userAgent, targetTier = null) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      throw new Error('Grievance not found');
    }

    const currentTier = targetTier || (ticket.escalation_tier === 'Tier 2' ? 'Tier 3' : (ticket.escalation_tier === 'Tier 1' ? 'Tier 2' : 'Tier 1'));
    let tierTitle = 'Tier 1 (Handling Officer)';
    let escalatedToRole = 'Officer Supervisor';

    if (currentTier === 'Tier 2' || currentTier === 'Tier 2 (HOD Review)') {
      tierTitle = 'Tier 2 (Department Head / HOD)';
      escalatedToRole = 'Department Head';
    } else if (currentTier === 'Tier 3' || currentTier === 'Critical Breach (Tier 3 - Ombudsman)') {
      tierTitle = 'Tier 3 (Institutional Ombudsman / Director)';
      escalatedToRole = 'Ombudsman';
    }

    const updates = {
      status: 'Escalated',
      escalation_tier: tierTitle,
      tier_escalated_at: new Date().toISOString(),
      escalated_to: escalatedToRole,
      escalated_at: new Date().toISOString(),
      escalated_reason: reason || `SLA Breach Escalated to ${tierTitle}`,
      updated_at: new Date().toISOString()
    };

    const updatedTicket = await grievanceRepository.update(id, updates);
    cacheManager.invalidate(`public:track:${ticket.ticket_id}`);
    cacheManager.invalidate(`public:track:${ticket.id}`);

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status: 'Escalated',
      activity_type: 'escalation',
      performed_by: user ? user.id : null,
      notes: `[SLA Multi-Tier Matrix] Ticket escalated to ${tierTitle}. Reason: ${reason || 'SLA Threshold Breach'}`
    });

    // Escalation alert email
    emailService.sendEscalatedGrievanceAlertEmail(
      ticket.ticket_id, 
      `[${tierTitle}] ${ticket.title}`, 
      ticket.category, 
      ticket.frustration_index || 7
    ).catch(console.error);

    // Audit log
    await logAudit(
      user ? user.id : null, 
      `GRIEVANCE_ESCALATION`, 
      ip, 
      userAgent, 
      { ticket_id: ticket.ticket_id, tier: tierTitle, reason }
    );

    // System Alert
    await grievanceRepository.addSystemAlert({
      type: 'GRIEVANCE_ESCALATION',
      message: `CRITICAL: Ticket ${ticket.ticket_id} escalated to ${tierTitle}!`,
      priority: currentTier.includes('Tier 3') ? 'high' : 'normal',
      metadata: { ticket_id: ticket.ticket_id, tier: tierTitle, reason }
    });

    return updatedTicket;
  },

  async checkSLABreaches(ip, userAgent) {
    const now = new Date();
    const nowIso = now.toISOString();
    const overdue = await grievanceRepository.getOverdueGrievances(nowIso);
    if (overdue.length === 0) return { count: 0, details: [] };

    let count = 0;
    const details = [];

    for (const ticket of overdue) {
      try {
        const slaDue = ticket.sla_due_at ? new Date(ticket.sla_due_at) : new Date(ticket.created_at);
        const overdueHours = (now.getTime() - slaDue.getTime()) / (1000 * 60 * 60);

        let targetTier = 'Tier 1';
        if (overdueHours > 96) {
          targetTier = 'Tier 3';
        } else if (overdueHours > 48) {
          targetTier = 'Tier 2';
        }

        const reason = `Auto SLA Multi-Tier Breach: Overdue by ${Math.round(overdueHours)} hours. Transferred to ${targetTier}.`;
        await this.escalateGrievance(ticket.id, reason, null, ip, userAgent, targetTier);
        count++;
        details.push({ ticket_id: ticket.ticket_id, overdueHours: Math.round(overdueHours), tier: targetTier });
      } catch (err) {
        console.error(`SLA auto-escalation failed for ticket ${ticket.ticket_id}:`, err.message);
      }
    }
    return { count, details };
  },

  /**
   * Citizen Appeal & Dispute Mechanism
   * Allows citizens/students to dispute a closed/resolved ticket.
   */
  async appealGrievance(id, appealReason, user, ip, userAgent) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      const err = new Error('Grievance ticket not found.');
      err.status = 404;
      throw err;
    }

    // Ownership or admin check
    const isOwner = ticket.user_id === user.id || (user.email && ticket.email === user.email);
    const isAdmin = user.role === 'admin' || user.role === 'super admin';
    if (!isOwner && !isAdmin) {
      const err = new Error('Access Denied: You are not authorized to appeal this grievance.');
      err.status = 403;
      throw err;
    }

    if (!appealReason || typeof appealReason !== 'string' || appealReason.trim().length < 5) {
      const err = new Error('A detailed justification (at least 5 characters) is required to file an appeal.');
      err.status = 400;
      throw err;
    }

    const updates = {
      status: 'Disputed',
      appeal_reason: appealReason.trim(),
      appeal_date: new Date().toISOString(),
      appeal_status: 'Pending Review',
      escalation_tier: 'Tier 2 (HOD Dispute Review)',
      updated_at: new Date().toISOString()
    };

    const updatedTicket = await grievanceRepository.update(id, updates);
    cacheManager.invalidate(`public:track:${ticket.ticket_id}`);
    cacheManager.invalidate(`public:track:${ticket.id}`);

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status: 'Disputed',
      activity_type: 'appeal',
      performed_by: user.id,
      notes: `Citizen Appeal Registered: "${appealReason.trim()}". Ticket escalated to Department Head for dispute resolution.`
    });

    // Alert Admin and Assigned Officer
    await grievanceRepository.addSystemAlert({
      type: 'GRIEVANCE_APPEAL',
      message: `DISPUTE: Ticket #${ticket.ticket_id} has been appealed by citizen.`,
      priority: 'high',
      metadata: { ticket_id: ticket.ticket_id, reason: appealReason.trim(), appeal_by: user.id }
    });

    await logAudit(
      user.id,
      'GRIEVANCE_APPEAL_SUBMITTED',
      ip,
      userAgent,
      { ticket_id: ticket.ticket_id, appeal_reason: appealReason }
    );

    return updatedTicket;
  },

  async getGrievanceTimeline(id, user) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      const err = new Error('Grievance not found');
      err.status = 404;
      throw err;
    }

    const isAdmin = user.role === 'admin' || user.role === 'super admin';
    const isAssignee = ticket.assigned_to === user.id || (user.email && ticket.assigned_to === user.email);
    const isOfficer = user.role === 'officer' || user.role === 'faculty' || user.role === 'staff';
    const isOwner = ticket.user_id === user.id || (user.email && ticket.email === user.email);

    if (!isAdmin && !isOwner && !isAssignee && !isOfficer) {
      const err = new Error('Access Denied: Timeline scoped violation');
      err.status = 403;
      throw err;
    }

    return grievanceRepository.getTimeline(id);
  },

  async submitFeedback(id, rating, comments, user, ip, userAgent, feedbackTags = []) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      throw new Error('Grievance not found');
    }

    if (ticket.user_id !== user.id && user.role !== 'admin' && user.role !== 'super admin') {
      const err = new Error('Access Denied: Scoped access violation');
      err.status = 403;
      throw err;
    }

    const numericRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
    // Automated CSAT sentiment score: 4-5 is positive (+1), 3 is neutral (0), 1-2 is negative (-1)
    let sentimentScore = numericRating >= 4 ? 1 : (numericRating === 3 ? 0 : -1);

    const updates = {
      rating: numericRating,
      feedback_comments: comments || '',
      feedback_tags: Array.isArray(feedbackTags) ? feedbackTags : [],
      sentiment_score: sentimentScore,
      status: 'Closed',
      updated_at: new Date().toISOString()
    };

    const updatedTicket = await grievanceRepository.update(id, updates);
    cacheManager.invalidate(`public:track:${ticket.ticket_id}`);
    cacheManager.invalidate(`public:track:${ticket.id}`);

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status: 'Closed',
      activity_type: 'feedback',
      performed_by: user.id,
      notes: `CSAT Feedback submitted: Rating ${numericRating}/5. Tags: ${(updates.feedback_tags || []).join(', ') || 'None'}. Comments: ${comments || 'None'}. Ticket closed.`
    });

    // Audit Log
    await logAudit(
      user.id,
      'GRIEVANCE_FEEDBACK_SUBMITTED',
      ip,
      userAgent,
      { ticket_id: ticket.ticket_id, rating: numericRating, sentiment: sentimentScore, comments }
    );

    return updatedTicket;
  },

  async deleteGrievance(id, user, ip, userAgent) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      const err = new Error('Grievance not found.');
      err.status = 404;
      throw err;
    }

    const isAdmin = user && (user.role === 'admin' || user.role === 'super admin');

    if (!isAdmin) {
      const err = new Error('Access Denied: Insufficient administrative privileges to delete grievance records.');
      err.status = 403;
      throw err;
    }

    await grievanceRepository.delete(id);

    await logAudit(
      user.id,
      'GRIEVANCE_DELETED',
      ip,
      userAgent,
      { ticket_id: ticket.ticket_id, title: ticket.title, status: ticket.status }
    );

    return { message: `Grievance ticket #${ticket.ticket_id} has been canceled and deleted successfully.`, id };
  },

  async getCommunityClusters(limit = 10) {
    return grievanceRepository.getCommunityClusters(limit);
  },

  async upvoteGrievance(id, user, ip, userAgent) {
    const userId = user ? user.id : 'demo-user';
    const userName = user ? (user.fullName || user.email || 'Student') : 'Student';
    const result = await grievanceRepository.upvote(id, userId, userName);

    if (!result.alreadyUpvoted) {
      // Add timeline event
      await grievanceRepository.addTimelineEvent({
        grievance_id: id,
        status: result.grievance.status || 'Active',
        activity_type: 'community_upvote',
        performed_by: userId,
        notes: `Community Endorsement (+1): Issue endorsed by ${userName}. Total Supporters: ${result.grievance.upvote_count}.${result.escalated ? ` [Priority Elevated to ${result.grievance.urgency}]` : ''}`
      });

      // If cluster petition escalated, notify admin & department
      if (result.escalated) {
        emailService.sendGrievanceAssignedEmail(
          'admin@resolvenow.system',
          result.grievance.ticket_id || id,
          `[🚨 CLUSTER PETITION - ${result.grievance.upvote_count} SUPPORTERS] ${result.grievance.title}`,
          result.grievance.urgency,
          result.grievance.department || 'Administration'
        ).catch(() => {});
      }
    }

    await logAudit(
      userId,
      'GRIEVANCE_UPVOTED',
      ip,
      userAgent,
      { 
        grievance_id: id, 
        upvote_count: result.grievance.upvote_count, 
        alreadyUpvoted: result.alreadyUpvoted,
        urgency: result.grievance.urgency
      }
    );

    return result;
  },

  /**
   * Retrieve anonymous grievance by ticketKey and secretPasskey
   */
  async getAnonymousGrievanceByPasskey(ticketKey, secretPasskey) {
    if (!ticketKey || !secretPasskey) {
      const err = new Error('Ticket reference key and secret passkey are required.');
      err.status = 400;
      throw err;
    }

    const ticket = await grievanceRepository.findByTicketId(ticketKey);
    if (!ticket) {
      const err = new Error('Anonymous grievance not found.');
      err.status = 404;
      throw err;
    }

    if (ticket.secret_passkey && ticket.secret_passkey !== secretPasskey) {
      const err = new Error('Invalid secret passkey for this anonymous grievance.');
      err.status = 403;
      throw err;
    }

    return ticket;
  },

  /**
   * Add anonymous Q&A message between whistleblower and department officer
   */
  async addAnonymousMessage(ticketKey, secretPasskey, senderRole, messageText) {
    const ticket = await this.getAnonymousGrievanceByPasskey(ticketKey, secretPasskey);

    const timelineEvent = await grievanceRepository.addTimelineEvent({
      grievance_id: ticket.id,
      status: ticket.status || 'Active',
      activity_type: 'anonymous_message',
      performed_by: senderRole === 'whistleblower' ? 'Anonymous Whistleblower' : 'Department Officer',
      notes: `💬 [${senderRole === 'whistleblower' ? 'Whistleblower' : 'Officer'}]: ${messageText}`
    });

    return {
      success: true,
      ticketId: ticket.ticket_id,
      messageText,
      senderRole,
      timelineEvent
    };
  }
};

module.exports = grievanceService;


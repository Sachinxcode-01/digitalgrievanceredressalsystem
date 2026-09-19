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
    const isOfficer = user.role === 'officer';

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
      if (!scopedDepartment) {
        scopedUserId = user.id;
      }
    } else {
      // Students, faculty, and general citizens are strictly isolated to their own grievances
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
      resolved_at: (kbMatch && kbMatch.isAutoResolved) ? (kbMatch.resolvedAt || new Date().toISOString()) : null,
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

    // If instant auto-resolution was matched, log dedicated resolution event
    if (kbMatch && kbMatch.isAutoResolved) {
      await grievanceRepository.addTimelineEvent({
        grievance_id: newGrievance.id,
        status: 'AUTO_RESOLVED',
        activity_type: 'auto_resolution',
        performed_by: null,
        notes: 'Instant Knowledge Base resolution matched. Official verified resolution instructions issued to citizen.'
      });
    }

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
    const isOfficer = user.role === 'officer' && (user.department === grievance.department || !grievance.department || isAssignee);
    const isOwner = grievance.user_id === user.id || (user.email && grievance.email === user.email);

    if (!isAdmin && !isOwner && !isAssignee && !isOfficer) {
      const err = new Error('Access Denied: Scoped access violation');
      err.status = 403;
      throw err;
    }

    // Strip internal_notes for non-officer / non-admin users
    if (!isAdmin && !isOfficer && !isAssignee) {
      const sanitized = { ...grievance };
      delete sanitized.internal_notes;
      return sanitized;
    }

    return grievance;
  },

  async updateGrievanceStatus(id, status, resolutionNotes, user, ip, userAgent, options = {}) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      const err = new Error('Grievance not found');
      err.status = 404;
      throw err;
    }

    const isAdmin = user.role === 'admin' || user.role === 'super admin';
    const isAssignee = ticket.assigned_to === user.id || (user.email && ticket.assigned_to === user.email);
    const isOfficer = user.role === 'officer' && (user.department === ticket.department || !ticket.department || isAssignee);
    const isOwner = ticket.user_id === user.id || (user.email && ticket.email === user.email);

    if (!isAdmin && !isAssignee && !isOfficer && !isOwner) {
      const err = new Error('Access Denied: Not authorized to update grievance status');
      err.status = 403;
      throw err;
    }

    if (!isAdmin && !isAssignee && !isOfficer) {
      // Regular citizen owner can only submit a draft or cancel a pending/draft ticket
      const ownerAllowed = (ticket.status === 'Draft' && status === 'Submitted') || (['Submitted', 'Pending', 'Draft'].includes(ticket.status) && status === 'Closed');
      if (!ownerAllowed) {
        const err = new Error('Access Denied: Grievance submitters cannot transition operational or resolution statuses.');
        err.status = 403;
        throw err;
      }
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

    const {
      resolution_proof_url,
      internal_notes,
      root_cause,
      clarification_question
    } = options || {};

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    let timelineNotes = status === 'Resolved' ? (resolutionNotes || 'Grievance resolved successfully.') : `Status updated from ${ticket.status} to ${status}`;

    if (status === 'Resolved') {
      updates.resolution_notes = resolutionNotes || 'Grievance resolved successfully.';
      updates.resolved_at = new Date().toISOString();
      if (resolution_proof_url) updates.resolution_proof_url = resolution_proof_url;
      if (internal_notes) updates.internal_notes = internal_notes;
      if (root_cause) {
        updates.root_cause = root_cause;
        timelineNotes += ` [Root Cause: ${root_cause}]`;
      }
      if (ticket.sla_paused_at) {
        const pauseMs = Date.now() - new Date(ticket.sla_paused_at).getTime();
        updates.sla_paused_at = null;
        updates.sla_total_paused_ms = (ticket.sla_total_paused_ms || 0) + pauseMs;
      }
    } else if (status === 'Pending User Response') {
      const question = clarification_question || resolutionNotes || 'Additional clarification requested by investigating officer.';
      updates.clarification_requested = question;
      updates.sla_paused_at = new Date().toISOString();
      if (internal_notes) updates.internal_notes = internal_notes;
      timelineNotes = `Officer requested citizen clarification: "${question}" (SLA paused)`;
    } else if (internal_notes) {
      updates.internal_notes = internal_notes;
    }

    const updatedTicket = await grievanceRepository.update(id, updates);

    // Timeline event
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status,
      activity_type: status === 'Resolved' ? 'resolution' : (status === 'Pending User Response' ? 'clarification_requested' : 'status_change'),
      performed_by: user.id,
      notes: timelineNotes
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
    const isOfficer = user.role === 'officer' && (user.department === ticket.department || !ticket.department || isAssignee);
    const isOwner = ticket.user_id === user.id || (user.email && ticket.email === user.email);

    if (!isAdmin && !isOwner && !isAssignee && !isOfficer) {
      const err = new Error('Access Denied: Timeline scoped violation');
      err.status = 403;
      throw err;
    }

    return grievanceRepository.getTimeline(id);
  },

  async submitFeedback(id, rating, comments, user, ip, userAgent, feedbackTags = [], npsScore = null, resolutionSatisfied = true) {
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

    const parsedNps = (npsScore !== null && npsScore !== undefined && npsScore !== '')
      ? Math.max(0, Math.min(10, parseInt(npsScore, 10)))
      : null;

    const isSatisfied = resolutionSatisfied !== undefined ? Boolean(resolutionSatisfied) : true;

    const updates = {
      rating: numericRating,
      feedback_comments: comments || '',
      feedback_tags: Array.isArray(feedbackTags) ? feedbackTags : [],
      sentiment_score: sentimentScore,
      nps_score: parsedNps,
      resolution_satisfied: isSatisfied,
      status: 'Closed',
      updated_at: new Date().toISOString()
    };

    const updatedTicket = await grievanceRepository.update(id, updates);
    cacheManager.invalidate(`public:track:${ticket.ticket_id}`);
    cacheManager.invalidate(`public:track:${ticket.id}`);

    // Timeline event
    const npsText = parsedNps !== null ? ` | NPS: ${parsedNps}/10` : '';
    const satText = isSatisfied ? 'Satisfied' : 'Unsatisfied';
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status: 'Closed',
      activity_type: 'feedback',
      performed_by: user.id,
      notes: `CSAT Feedback submitted: Rating ${numericRating}/5${npsText} (${satText}). Tags: ${(updates.feedback_tags || []).join(', ') || 'None'}. Comments: ${comments || 'None'}. Ticket closed.`
    });

    // Audit Log
    await logAudit(
      user.id,
      'GRIEVANCE_FEEDBACK_SUBMITTED',
      ip,
      userAgent,
      { 
        ticket_id: ticket.ticket_id, 
        rating: numericRating, 
        nps_score: parsedNps, 
        resolution_satisfied: isSatisfied,
        sentiment: sentimentScore, 
        comments 
      }
    );

    return updatedTicket;
  },

  /**
   * Reopen a resolved grievance within the 72-hour grace period.
   * Enforces 72-hour time boundary from resolution timestamp.
   */
  async reopenGrievance(id, reason, user, ip, userAgent) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      const err = new Error('Grievance ticket not found.');
      err.status = 404;
      throw err;
    }

    const isOwner = ticket.user_id === user.id || (user.email && ticket.email === user.email);
    const isAdmin = user.role === 'admin' || user.role === 'super admin';
    if (!isOwner && !isAdmin) {
      const err = new Error('Access Denied: You are not authorized to reopen this grievance.');
      err.status = 403;
      throw err;
    }

    const validPriorStatuses = ['Resolved', 'Closed', 'AUTO_RESOLVED'];
    if (!validPriorStatuses.includes(ticket.status)) {
      const err = new Error(`Cannot reopen ticket #${ticket.ticket_id} because its current status is '${ticket.status}'. Only resolved or closed tickets can be reopened.`);
      err.status = 400;
      throw err;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      const err = new Error('A detailed reason (at least 5 characters) is required to reopen this grievance.');
      err.status = 400;
      throw err;
    }

    // Enforce 72-Hour Reopen Window
    const resolutionTimestamp = ticket.resolved_at || ticket.updated_at || ticket.created_at;
    if (resolutionTimestamp) {
      const elapsedHours = (Date.now() - new Date(resolutionTimestamp).getTime()) / (1000 * 60 * 60);
      if (elapsedHours > 72 && !isAdmin) {
        const err = new Error('Reopen window expired: Grievances can only be reopened within 72 hours of resolution. Please submit a new grievance or file an official appeal.');
        err.status = 400;
        throw err;
      }
    }

    const newReopenCount = (parseInt(ticket.reopen_count, 10) || 0) + 1;
    const updates = {
      status: 'Reopened',
      reopen_reason: reason.trim(),
      reopened_at: new Date().toISOString(),
      reopen_count: newReopenCount,
      updated_at: new Date().toISOString()
    };

    const updatedTicket = await grievanceRepository.update(id, updates);
    cacheManager.invalidate(`public:track:${ticket.ticket_id}`);
    cacheManager.invalidate(`public:track:${ticket.id}`);

    // Timeline Event
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status: 'Reopened',
      activity_type: 'reopened',
      performed_by: user.id,
      notes: `Grievance Reopened by student within 72h window (Reopen #${newReopenCount}). Justification: "${reason.trim()}". Ticket returned to departmental queue for expedited review.`
    });

    // System Alert
    await grievanceRepository.addSystemAlert({
      type: 'GRIEVANCE_REOPENED',
      message: `TICKET REOPENED: Citizen #${ticket.ticket_id} reopened resolution within 72h: "${reason.trim()}"`,
      priority: 'high',
      metadata: { ticket_id: ticket.ticket_id, reason: reason.trim(), reopen_count: newReopenCount }
    });

    // Audit Log
    await logAudit(
      user.id,
      'GRIEVANCE_REOPENED',
      ip,
      userAgent,
      { ticket_id: ticket.ticket_id, reopen_reason: reason.trim(), reopen_count: newReopenCount }
    );

    return updatedTicket;
  },

  /**
   * Submit citizen clarification response to officer request.
   * Resumes SLA countdown and extends sla_due_at by paused time.
   */
  async submitClarification(id, responseText, attachmentUrl, user, ip, userAgent) {
    const ticket = await grievanceRepository.findById(id);
    if (!ticket) {
      const err = new Error('Grievance not found');
      err.status = 404;
      throw err;
    }

    const isAdmin = user && (user.role === 'admin' || user.role === 'super admin');
    const isOwner = user && (ticket.user_id === user.id || (user.email && ticket.email === user.email));

    if (!isOwner && !isAdmin) {
      const err = new Error('Access Denied: You are not authorized to respond to this ticket');
      err.status = 403;
      throw err;
    }

    if (ticket.status !== 'Pending User Response') {
      const err = new Error(`Cannot submit clarification because ticket status is '${ticket.status}'. Clarification is only accepted when pending citizen response.`);
      err.status = 400;
      throw err;
    }

    if (!responseText || responseText.trim().length < 3) {
      const err = new Error('Please provide a substantive clarification response (at least 3 characters).');
      err.status = 400;
      throw err;
    }

    // Calculate SLA pause duration and extend sla_due_at
    const now = Date.now();
    let pauseDurationMs = 0;
    if (ticket.sla_paused_at) {
      pauseDurationMs = Math.max(0, now - new Date(ticket.sla_paused_at).getTime());
    }

    let extendedSlaDueAt = ticket.sla_due_at;
    if (ticket.sla_due_at && pauseDurationMs > 0) {
      extendedSlaDueAt = new Date(new Date(ticket.sla_due_at).getTime() + pauseDurationMs).toISOString();
    }

    const updates = {
      status: 'In Progress',
      clarification_response: responseText.trim(),
      sla_paused_at: null,
      sla_total_paused_ms: (Number(ticket.sla_total_paused_ms) || 0) + pauseDurationMs,
      sla_due_at: extendedSlaDueAt,
      updated_at: new Date().toISOString()
    };

    if (attachmentUrl) {
      updates.attachment_url = attachmentUrl;
    }

    const updatedTicket = await grievanceRepository.update(id, updates);

    // Invalidate cache
    cacheManager.invalidate(`public:track:${ticket.ticket_id}`);
    cacheManager.invalidate(`public:track:${ticket.id}`);

    // Timeline event
    const pauseMinutes = Math.round(pauseDurationMs / 60000);
    await grievanceRepository.addTimelineEvent({
      grievance_id: id,
      status: 'In Progress',
      activity_type: 'clarification_provided',
      performed_by: user.id,
      notes: `Citizen provided clarification: "${responseText.trim()}" (SLA resumed${pauseMinutes > 0 ? `, adjusted +${pauseMinutes}m` : ''})`
    });

    // Audit log
    await logAudit(
      user.id,
      'GRIEVANCE_CLARIFICATION_SUBMITTED',
      ip,
      userAgent,
      { ticket_id: ticket.ticket_id, pause_duration_ms: pauseDurationMs }
    );

    // System Alert
    await grievanceRepository.addSystemAlert({
      type: 'GRIEVANCE_CLARIFICATION',
      message: `Citizen answered clarification request for #${ticket.ticket_id}: "${responseText.trim().slice(0, 80)}"`,
      priority: 'normal',
      metadata: { ticket_id: ticket.ticket_id, status: 'In Progress', grievance_id: id }
    });

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
    const isOwner = user && ticket.user_id && String(ticket.user_id) === String(user.id);

    if (!isAdmin && !isOwner) {
      const err = new Error('Access Denied: Insufficient privileges to delete or cancel this grievance record.');
      err.status = 403;
      throw err;
    }

    // Students/owners can only cancel pending, unserviced, or draft tickets (not tickets actively being worked on)
    if (!isAdmin && isOwner) {
      const cancellableStatuses = ['Pending', 'Submitted', 'Assigned', 'Draft', 'AUTO_RESOLVED'];
      if (!cancellableStatuses.includes(ticket.status)) {
        const err = new Error(`Cannot cancel ticket #${ticket.ticket_id} because its current status is '${ticket.status}'. Only pending submissions can be canceled.`);
        err.status = 400;
        throw err;
      }
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
    if (!ticket || !ticket.is_anonymous || !ticket.secret_passkey) {
      const err = new Error('Anonymous grievance not found.');
      err.status = 404;
      throw err;
    }

    const expected = Buffer.from(String(ticket.secret_passkey));
    const actual = Buffer.from(String(secretPasskey));
    const isMatch = expected.length === actual.length && require('crypto').timingSafeEqual(expected, actual);
    if (!isMatch) {
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


const supabase = require('../config/supabase');
const { 
  sendGrievanceEmail, 
  sendAdminNotification, 
  sendGrievanceAssignedEmail, 
  sendEscalatedGrievanceAlertEmail 
} = require('../services/emailService');
const { logAudit } = require('../services/sessionService');

/**
 * Fetch grievances ordered by creation date.
 * Enforces security scoping: Users can only see their own tickets, Admins can see all.
 */
const getAllGrievances = async (req, res, next) => {
  try {
    let query = supabase
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false });

    // 1. Authorization scoping: Non-admins are scoped strictly to their own user ID
    if (req.user.role !== 'admin' && req.user.role !== 'super admin') {
      query = query.eq('user_id', req.user.id);
    } else {
      // Admins can filter by query parameter if needed
      const { user_id } = req.query;
      if (user_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(user_id)) {
          query = query.eq('user_id', user_id);
        } else if (user_id.startsWith('demo-') || user_id.startsWith('user_')) {
          // Fallback for custom or demo roles
          query = query.eq('user_id', user_id);
        }
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

/**
 * Handle new grievance creation.
 */
const createGrievance = async (req, res, next) => {
  const { 
    ticket_id, 
    user_id, 
    email, 
    title, 
    description, 
    category, 
    department,
    urgency, 
    frustration_index, 
    attachment_url, 
    location, 
    latitude, 
    longitude 
  } = req.body;

  try {
    // Force the user_id to match the authenticated user session for data integrity
    const finalUserId = req.user ? req.user.id : (user_id || 'anonymous');
    const finalEmail = req.user ? req.user.email : (email || '');

    const { data, error } = await supabase
      .from('grievances')
      .insert([
        { 
          ticket_id,
          user_id: finalUserId,
          title, 
          description, 
          category, 
          department: department || 'General',
          urgency,
          frustration_index: frustration_index || 1,
          attachment_url,
          location,
          latitude,
          longitude,
          status: 'New' // Start workflow at New
        }
      ])
      .select();
    
    if (error) throw error;

    const newGrievance = data[0];

    // Log the initial timeline event
    await supabase.from('grievance_timeline').insert([
      {
        grievance_id: newGrievance.id,
        status: 'New',
        activity_type: 'created',
        performed_by: finalUserId === 'anonymous' ? null : finalUserId,
        notes: `Grievance registered. Ticket Reference: #${ticket_id}`
      }
    ]);

    // Log the audit event
    await logAudit(
      finalUserId === 'anonymous' ? null : finalUserId,
      'GRIEVANCE_CREATED',
      req.ip,
      req.headers['user-agent'],
      { ticket_id, category, urgency }
    );

    // Send notifications async
    if (finalEmail) {
      sendGrievanceEmail(finalEmail, ticket_id, title, finalUserId === 'anonymous' ? null : finalUserId).catch(err => 
        console.error(`Email confirmation dispatch failed: ${err.message}`)
      );
    }
    
    sendAdminNotification(ticket_id, title, category, urgency).catch(err => 
      console.error(`Admin notification dispatch failed: ${err.message}`)
    );
    
    res.status(201).json(newGrievance);
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch a single grievance by ID.
 * Enforces owner-only and admin scoping.
 */
const getGrievanceById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('grievances')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Grievance not found' });

    // Scoping check: users can only see their own grievances, admins can see all
    if (req.user.role !== 'admin' && req.user.role !== 'super admin' && data.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access Denied: Scoped access violation' });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Transition a grievance status.
 */
const updateGrievanceStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, resolution_notes } = req.body;


  try {
    // 1. Get current ticket to know previous status
    const { data: ticket, error: fetchError } = await supabase
      .from('grievances')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !ticket) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    // 2. Perform database update
    const updates = { 
      status,
      updated_at: new Date().toISOString()
    };
    if (status === 'Resolved') {
      updates.resolution_notes = resolution_notes || 'Grievance resolved successfully.';
      updates.resolved_at = new Date().toISOString();
    }

    const { data: updatedTicket, error: updateError } = await supabase
      .from('grievances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) throw updateError;

    // 3. Create Timeline Event
    await supabase.from('grievance_timeline').insert([
      {
        grievance_id: id,
        status,
        activity_type: status === 'Resolved' ? 'resolution' : 'status_change',
        performed_by: req.user.id,
        notes: status === 'Resolved' ? resolution_notes : `Status updated from ${ticket.status} to ${status}`
      }
    ]);

    // 4. Create Audit Log
    await logAudit(
      req.user.id, 
      `GRIEVANCE_STATUS_UPDATE`, 
      req.ip, 
      req.headers['user-agent'], 
      { ticket_id: ticket.ticket_id, old_status: ticket.status, new_status: status }
    );

    // 5. Create System Alert (for live dashboard sync/notifications)
    await supabase.from('system_alerts').insert([
      {
        type: 'GRIEVANCE_UPDATE',
        message: `Ticket ${ticket.ticket_id} status updated to ${status}`,
        priority: status === 'Resolved' ? 'normal' : 'high',
        metadata: { ticket_id: ticket.ticket_id, status, grievance_id: id }
      }
    ]);

    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
};

/**
 * Assign a grievance ticket to an administrative officer or department.
 */
const assignGrievance = async (req, res, next) => {
  const { id } = req.params;
  const { assigned_to, department } = req.body;

  try {
    const { data: ticket, error: fetchError } = await supabase
      .from('grievances')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !ticket) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    const updates = { 
      status: 'Assigned',
      assigned_to: assigned_to || null,
      department: department || ticket.department,
      updated_at: new Date().toISOString()
    };

    const { data: updatedTicket, error: updateError } = await supabase
      .from('grievances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) throw updateError;

    // Create Timeline Event
    await supabase.from('grievance_timeline').insert([
      {
        grievance_id: id,
        status: 'Assigned',
        activity_type: 'assignment',
        performed_by: req.user.id,
        notes: `Assigned to department: ${department || 'General'}${assigned_to ? ` (Officer Assigned)` : ''}`
      }
    ]);

    // Fetch assignee email to send notification
    let assigneeEmail = '';
    if (assigned_to) {
      const { data: assigneeUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', assigned_to)
        .single();
      if (assigneeUser) assigneeEmail = assigneeUser.email;
    }

    // Dispatch email to officer
    if (assigneeEmail) {
      sendGrievanceAssignedEmail(assigneeEmail, ticket.ticket_id, ticket.title, ticket.urgency, department || 'General').catch(console.error);
    }

    // Create Audit Log
    await logAudit(
      req.user.id, 
      `GRIEVANCE_ASSIGNMENT`, 
      req.ip, 
      req.headers['user-agent'], 
      { ticket_id: ticket.ticket_id, assigned_to, department }
    );

    // Create System Alert
    await supabase.from('system_alerts').insert([
      {
        type: 'GRIEVANCE_ASSIGNMENT',
        message: `Ticket ${ticket.ticket_id} assigned to ${department || 'department'}`,
        priority: 'normal',
        metadata: { ticket_id: ticket.ticket_id, assigned_to, department }
      }
    ]);

    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
};

/**
 * Escalate a grievance ticket.
 */
const escalateGrievance = async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const { data: ticket, error: fetchError } = await supabase
      .from('grievances')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !ticket) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    const updates = { 
      status: 'Pending', // Put back in high priority review queue
      escalated_at: new Date().toISOString(),
      escalated_reason: reason || 'SLA Threshold Breach',
      updated_at: new Date().toISOString()
    };

    const { data: updatedTicket, error: updateError } = await supabase
      .from('grievances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) throw updateError;

    // Create Timeline Event
    await supabase.from('grievance_timeline').insert([
      {
        grievance_id: id,
        status: ticket.status,
        activity_type: 'escalation',
        performed_by: req.user.id,
        notes: `Ticket escalated: ${reason || 'SLA Breach'}`
      }
    ]);

    // Trigger admin escalation email
    sendEscalatedGrievanceAlertEmail(ticket.ticket_id, ticket.title, ticket.category, ticket.frustration_index || 5).catch(console.error);

    // Create Audit Log
    await logAudit(
      req.user.id, 
      `GRIEVANCE_ESCALATION`, 
      req.ip, 
      req.headers['user-agent'], 
      { ticket_id: ticket.ticket_id, reason }
    );

    // Create System Alert
    await supabase.from('system_alerts').insert([
      {
        type: 'GRIEVANCE_ESCALATION',
        message: `CRITICAL: Ticket ${ticket.ticket_id} escalated!`,
        priority: 'high',
        metadata: { ticket_id: ticket.ticket_id, reason }
      }
    ]);

    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve timeline events for a ticket.
 */
const getGrievanceTimeline = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check if user has permission to view this grievance
    const { data: ticket, error: ticketError } = await supabase
      .from('grievances')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'super admin' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access Denied: Timeline scoped violation' });
    }

    // Join with user_profiles (aliased as profiles) on performed_by = user_id
    const { data: timeline, error: timelineError } = await supabase
      .from('grievance_timeline')
      .select(`
        *,
        profiles:user_profiles (full_name)
      `)
      .eq('grievance_id', id)
      .order('created_at', { ascending: true });
    
    if (timelineError) throw timelineError;
    res.json(timeline || []);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllGrievances,
  createGrievance,
  getGrievanceById,
  updateGrievanceStatus,
  assignGrievance,
  escalateGrievance,
  getGrievanceTimeline
};

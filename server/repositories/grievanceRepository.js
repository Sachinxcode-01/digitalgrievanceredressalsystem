const supabase = require('../config/supabase');

const inMemoryGrievances = [
  {
    id: 'g-demo-101',
    ticket_id: 'TKT-2026-IT8821',
    user_id: 'demo-student-id-101',
    title: 'Wi-Fi connectivity drops in Central Library Study Hall',
    description: 'The campus Wi-Fi constantly disconnects every 10-15 minutes while accessing online journals and submission portals in the library 2nd floor.',
    category: 'IT Support',
    department: 'IT Support',
    urgency: 'Medium',
    status: 'In-Progress',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    sla_due_at: new Date(Date.now() + 3600000 * 24).toISOString(),
    frustration_index: 6
  },
  {
    id: 'g-demo-102',
    ticket_id: 'TKT-2026-AC4920',
    user_id: 'demo-student-id-101',
    title: 'Delay in Semester 4 Marksheet Grade Card Verification',
    description: 'Submitted physical copy of marksheet verification form 3 weeks ago. Status still pending at Academic Registrar section.',
    category: 'Academic Affairs',
    department: 'Academic Affairs',
    urgency: 'High',
    status: 'Assigned',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    sla_due_at: new Date(Date.now() + 3600000 * 12).toISOString(),
    frustration_index: 8
  },
  {
    id: 'g-demo-103',
    ticket_id: 'TKT-2026-FN1029',
    user_id: 'demo-student-id-101',
    title: 'Scholarship Fee Credit Reimbursement Discrepancy',
    description: 'The state merit scholarship credit of Rs 15,000 has not been adjusted in the current semester tuition fee invoice.',
    category: 'Financial Services',
    department: 'Financial Services',
    urgency: 'Medium',
    status: 'Resolved',
    resolution_notes: 'Verified with Accounts Section. Fee credit adjusted in student portal balance.',
    resolved_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    frustration_index: 4
  }
];

const grievanceRepository = {
  async getAll(userId = null) {
    if (supabase) {
      try {
        let query = supabase
          .from('grievances')
          .select('*')
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.eq('user_id', userId);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('[Grievances DB Fetch Warning — using memory pool]:', err.message);
      }
    }

    if (userId) {
      return inMemoryGrievances.filter(g => !g.user_id || g.user_id === userId || userId.startsWith('demo-'));
    }
    return inMemoryGrievances;
  },

  async findById(id) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('grievances')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.debug('[grievanceRepository.findById warning]:', err.message);
      }
    }
    return inMemoryGrievances.find(g => g.id === id || g.ticket_id === id) || null;
  },

  async findByTicketId(ticketId) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('grievances')
          .select('id, ticket_id')
          .eq('ticket_id', ticketId)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.debug('[grievanceRepository.findByTicketId warning]:', err.message);
      }
    }
    return inMemoryGrievances.find(g => g.ticket_id === ticketId) || null;
  },

  async create(grievanceData) {
    const allowedColumns = [
      'ticket_id', 'user_id', 'title', 'description', 'category', 'urgency',
      'status', 'admin_comment', 'location', 'latitude', 'longitude',
      'attachment_url', 'department', 'assigned_to', 'resolution_notes',
      'resolved_at', 'escalated_at', 'escalated_reason', 'sla_due_at',
      'rating', 'feedback_comments'
    ];

    const sanitizedPayload = {
      id: `g-gen-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    for (const key of allowedColumns) {
      if (grievanceData[key] !== undefined) {
        sanitizedPayload[key] = grievanceData[key];
      }
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('grievances')
          .insert([sanitizedPayload])
          .select();
        if (!error && data && data.length > 0) {
          inMemoryGrievances.unshift(data[0]);
          return data[0];
        }
      } catch (err) {
        console.warn('[Grievance DB Insert Warning — using memory store]:', err.message);
      }
    }

    inMemoryGrievances.unshift(sanitizedPayload);
    return sanitizedPayload;
  },

  async update(id, updates) {
    const allowedColumns = [
      'ticket_id', 'user_id', 'title', 'description', 'category', 'urgency',
      'status', 'admin_comment', 'location', 'latitude', 'longitude',
      'attachment_url', 'department', 'assigned_to', 'resolution_notes',
      'resolved_at', 'escalated_at', 'escalated_reason', 'sla_due_at',
      'rating', 'feedback_comments'
    ];

    const sanitizedUpdates = {};
    for (const key of allowedColumns) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('grievances')
          .update(sanitizedUpdates)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (!error && data) {
          const index = inMemoryGrievances.findIndex(g => g.id === id);
          if (index !== -1) inMemoryGrievances[index] = data;
          return data;
        }
      } catch (err) {
        console.debug('[grievanceRepository.update warning]:', err.message);
      }
    }

    const item = inMemoryGrievances.find(g => g.id === id || g.ticket_id === id);
    if (item) {
      Object.assign(item, sanitizedUpdates);
      return item;
    }
    return null;
  },

  async delete(id) {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('grievances')
          .delete()
          .eq('id', id);
        if (!error) {
          const index = inMemoryGrievances.findIndex(g => g.id === id || g.ticket_id === id);
          if (index !== -1) inMemoryGrievances.splice(index, 1);
          return true;
        }
      } catch (err) {
        console.debug('[grievanceRepository.delete warning]:', err.message);
      }
    }

    const index = inMemoryGrievances.findIndex(g => g.id === id || g.ticket_id === id);
    if (index !== -1) {
      inMemoryGrievances.splice(index, 1);
      return true;
    }
    return false;
  },

  async addTimelineEvent(eventData) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('grievance_timeline')
        .insert([eventData])
        .select();
      if (error) return null;
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.debug('[grievanceRepository.addTimelineEvent warning]:', err.message);
      return null;
    }
  },

  async addSystemAlert(alertData) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .insert([alertData])
        .select();
      if (error) return null;
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.debug('[grievanceRepository.addSystemAlert warning]:', err.message);
      return null;
    }
  },

  async getTimeline(grievanceId) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('grievance_timeline')
      .select(`
        *,
        profiles:user_profiles (full_name)
      `)
      .eq('grievance_id', grievanceId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Departments
  async getDepartments() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getDepartmentById(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createDepartment(deptData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('departments')
      .insert([deptData])
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateDepartment(id, updates) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async deleteDepartment(id) {
    if (!supabase) throw new Error('Database unavailable');
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // SLA Rules
  async getSlaRules() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('sla_rules')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getSlaRuleById(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sla_rules')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createSlaRule(ruleData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('sla_rules')
      .insert([ruleData])
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateSlaRule(id, updates) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('sla_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async deleteSlaRule(id) {
    if (!supabase) throw new Error('Database unavailable');
    const { error } = await supabase
      .from('sla_rules')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Escalation Rules
  async getEscalationRules() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('escalation_rules')
      .select('*, sla_rules(name, priority, category)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getEscalationRuleById(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('escalation_rules')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createEscalationRule(ruleData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('escalation_rules')
      .insert([ruleData])
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateEscalationRule(id, updates) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('escalation_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async deleteEscalationRule(id) {
    if (!supabase) throw new Error('Database unavailable');
    const { error } = await supabase
      .from('escalation_rules')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async getOverdueGrievances(nowString) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('grievances')
      .select('*')
      .lt('sla_due_at', nowString)
      .not('status', 'in', '("Resolved","Closed","Rejected","Escalated","Draft")');
    if (error) throw error;
    return data || [];
  }
};

module.exports = grievanceRepository;

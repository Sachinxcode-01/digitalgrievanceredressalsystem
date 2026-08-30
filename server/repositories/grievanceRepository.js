const supabase = require('../config/supabase');
const { withDbRetry } = require('../utils/dbRetry');

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
    upvote_count: 4,
    upvoted_by: ['user-101', 'user-102', 'user-103', 'user-104'],
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
    upvote_count: 2,
    upvoted_by: ['user-105', 'user-106'],
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
    upvote_count: 1,
    upvoted_by: ['user-107'],
    resolution_notes: 'Verified with Accounts Section. Fee credit adjusted in student portal balance.',
    resolved_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    frustration_index: 4
  }
];


const grievanceRepository = {
  async getAll(userId = null, department = null) {
    if (supabase) {
      try {
        const { data, error } = await withDbRetry(async () => {
          let query = supabase
            .from('grievances')
            .select('*')
            .order('created_at', { ascending: false });

          if (userId) {
            query = query.eq('user_id', userId);
          }
          if (department) {
            query = query.eq('department', department);
          }
          return await query;
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('[Grievances DB Fetch Warning — using memory pool]:', err.message);
      }
    }

    let results = inMemoryGrievances;
    if (userId) {
      results = results.filter(g => !g.user_id || g.user_id === userId || userId.startsWith('demo-'));
    }
    if (department) {
      results = results.filter(g => g.department === department);
    }
    return results;
  },

  async findById(id) {
    const isUuid = typeof id === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    if (supabase && isUuid) {
      try {
        const { data, error } = await withDbRetry(async () => {
          return await supabase
            .from('grievances')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        });
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
        const { data, error } = await withDbRetry(async () => {
          return await supabase
            .from('grievances')
            .select('id, ticket_id')
            .eq('ticket_id', ticketId)
            .maybeSingle();
        });
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
      'rating', 'feedback_comments', 'feedback_tags', 'sentiment_score',
      'appeal_reason', 'appeal_date', 'appeal_status', 'escalation_tier',
      'tier_escalated_at', 'escalated_to', 'upvote_count', 'upvoted_by'
    ];

    const sanitizedPayload = {
      id: `g-gen-${Date.now()}`,
      created_at: new Date().toISOString(),
      upvote_count: grievanceData.upvote_count || 1,
      upvoted_by: grievanceData.upvoted_by || (grievanceData.user_id ? [grievanceData.user_id] : [])
    };
    for (const key of allowedColumns) {
      if (grievanceData[key] !== undefined) {
        sanitizedPayload[key] = grievanceData[key];
      }
    }

    if (supabase) {
      try {
        const { data, error } = await withDbRetry(async () => {
          return await supabase
            .from('grievances')
            .insert([sanitizedPayload])
            .select();
        });
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
    const isUuid = typeof id === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    const allowedColumns = [
      'title', 'description', 'category', 'urgency', 'status',
      'admin_comment', 'location', 'latitude', 'longitude', 'attachment_url',
      'department', 'assigned_to', 'resolution_notes', 'resolved_at',
      'escalated_at', 'escalated_reason', 'sla_due_at', 'rating',
      'feedback_comments', 'feedback_tags', 'sentiment_score',
      'appeal_reason', 'appeal_date', 'appeal_status', 'escalation_tier',
      'tier_escalated_at', 'escalated_to', 'updated_at'
    ];

    const sanitizedUpdates = {};
    for (const key of allowedColumns) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    if (supabase && isUuid) {
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
    const isUuid = typeof id === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    if (supabase && isUuid) {
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
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('grievance_timeline')
          .select(`
            *,
            profiles:user_profiles (full_name)
          `)
          .eq('grievance_id', grievanceId)
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch {
        // Fallback query if join fails
      }

      try {
        const { data, error } = await supabase
          .from('grievance_timeline')
          .select('*')
          .eq('grievance_id', grievanceId)
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch {
        // Fallback
      }
    }

    // Default timeline milestones fallback
    return [
      {
        id: `tl-${grievanceId}-1`,
        grievance_id: grievanceId,
        status: 'Submitted',
        activity_type: 'creation',
        notes: 'Grievance ticket created and submitted by student.',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: `tl-${grievanceId}-2`,
        grievance_id: grievanceId,
        status: 'Assigned',
        activity_type: 'triage',
        notes: 'AI smart triage completed. Categorized & initial SLA assigned.',
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];
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
  },

  async getCommunityClusters(limit = 10) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('grievances')
          .select('*')
          .not('status', 'in', '("Resolved","Closed","Rejected")')
          .order('upvote_count', { ascending: false })
          .limit(limit);
        if (!error && data) return data;
      } catch (err) {
        console.warn('[grievanceRepository.getCommunityClusters warning]:', err.message);
      }
    }

    return inMemoryGrievances
      .filter(g => !['Resolved', 'Closed', 'Rejected'].includes(g.status))
      .sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0))
      .slice(0, limit);
  },

  async upvote(id, userId, userName = 'Student') {
    const item = await this.findById(id);
    if (!item) throw new Error('Grievance not found');

    const upvotedBy = Array.isArray(item.upvoted_by) ? item.upvoted_by : [];
    if (userId && upvotedBy.includes(userId)) {
      return { grievance: item, message: 'Already upvoted by this user', alreadyUpvoted: true };
    }

    const newCount = (item.upvote_count || 0) + 1;
    const newUpvotedBy = userId ? [...upvotedBy, userId] : upvotedBy;
    
    // Dynamic Urgency & Petition Cluster Escalation
    let newUrgency = item.urgency;
    if (newCount >= 7) {
      newUrgency = 'Critical';
    } else if (newCount >= 3 && item.urgency !== 'Critical') {
      newUrgency = 'High';
    }

    // Dynamic SLA Tightening: Accelerate deadline for collective community petitions
    let newSlaDueAt = item.sla_due_at;
    const now = new Date();
    if (newCount >= 10) {
      const emergency12h = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
      if (!newSlaDueAt || new Date(newSlaDueAt) > new Date(emergency12h)) {
        newSlaDueAt = emergency12h;
      }
    } else if (newCount >= 5) {
      const urgent24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      if (!newSlaDueAt || new Date(newSlaDueAt) > new Date(urgent24h)) {
        newSlaDueAt = urgent24h;
      }
    }

    const updates = {
      upvote_count: newCount,
      upvoted_by: newUpvotedBy,
      urgency: newUrgency,
      sla_due_at: newSlaDueAt,
      is_petition_cluster: newCount >= 3,
      updated_at: now.toISOString()
    };

    if (supabase) {
      try {
        await supabase.from('grievances').update(updates).eq('id', item.id);
      } catch (err) {
        console.warn('[grievanceRepository.upvote warning]:', err.message);
      }
    }

    Object.assign(item, updates);
    return { 
      grievance: item, 
      message: newCount >= 3 
        ? `Collective Petition Escalated! ${newCount} students have endorsed this issue.` 
        : 'Grievance endorsed successfully.', 
      alreadyUpvoted: false,
      escalated: newCount === 3 || newCount === 7 || newCount === 10
    };
  }
};

module.exports = grievanceRepository;


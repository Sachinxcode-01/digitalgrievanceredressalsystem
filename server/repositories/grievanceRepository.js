const supabase = require('../config/supabase');

const grievanceRepository = {
  async getAll(userId = null) {
    if (!supabase) return [];
    let query = supabase
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('grievances')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByTicketId(ticketId) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('grievances')
      .select('id, ticket_id')
      .eq('ticket_id', ticketId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(grievanceData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('grievances')
      .insert([grievanceData])
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Grievance could not be created (no row returned).');
    }
    return data[0];
  },

  async update(id, updates) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('grievances')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async addTimelineEvent(eventData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('grievance_timeline')
      .insert([eventData])
      .select();
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async addSystemAlert(alertData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('system_alerts')
      .insert([alertData])
      .select();
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
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

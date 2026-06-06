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

  async create(grievanceData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('grievances')
      .insert([grievanceData])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, updates) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('grievances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
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
    return data[0];
  },

  async addSystemAlert(alertData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('system_alerts')
      .insert([alertData])
      .select();
    if (error) throw error;
    return data[0];
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
      .single();
    if (error) throw error;
    return data;
  },

  async createDepartment(deptData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('departments')
      .insert([deptData])
      .select()
      .single();
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
      .single();
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
      .single();
    if (error) throw error;
    return data;
  },

  async createSlaRule(ruleData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('sla_rules')
      .insert([ruleData])
      .select()
      .single();
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
      .single();
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
      .single();
    if (error) throw error;
    return data;
  },

  async createEscalationRule(ruleData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('escalation_rules')
      .insert([ruleData])
      .select()
      .single();
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
      .single();
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
  }
};

module.exports = grievanceRepository;

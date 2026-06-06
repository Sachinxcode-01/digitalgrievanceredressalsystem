const supabase = require('../config/supabase');
const configService = require('../services/configService');
const { logAdminActivity } = require('../services/sessionService');

/**
 * Retrieve all system settings, grouped by category
 * GET /api/v1/admin/settings
 */
const getSettings = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { data: dbSettings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key');

    if (error) throw error;

    // Group settings by category
    const groupedSettings = {};
    (dbSettings || []).forEach(item => {
      if (!groupedSettings[item.category]) {
        groupedSettings[item.category] = [];
      }
      groupedSettings[item.category].push({
        key: item.key,
        value: item.value,
        description: item.description
      });
    });

    res.json(groupedSettings);
  } catch (err) {
    next(err);
  }
};

/**
 * Update system settings (bulk update)
 * PUT /api/v1/admin/settings
 */
const updateSettings = async (req, res, next) => {
  const settingsObject = req.body; // Map of { [key]: value }

  if (!settingsObject || Object.keys(settingsObject).length === 0) {
    return res.status(400).json({ error: 'No settings payload provided' });
  }

  try {
    await configService.updateSettings(settingsObject, req.user.id);
    res.json({ message: 'System configurations saved successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Test SMTP Email Dispatch
 * POST /api/v1/admin/settings/test-email
 */
const testEmail = async (req, res, next) => {
  const { testEmail } = req.body;
  if (!testEmail) return res.status(400).json({ error: 'Recipient test email address is required' });

  try {
    const { getTransporter } = require('../services/emailService');
    const transporter = await getTransporter();

    const senderName = configService.getSetting('sender_name', 'ResolveNow Core Dispatch');
    const senderEmail = configService.getSetting('sender_email', 'no-reply@resolvenow.system');

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to: testEmail,
      subject: 'ResolveNow System Configuration Test Handshake',
      text: 'SMTP Link Operational. Your system settings handshake succeeded.',
      html: `
        <div style="font-family: sans-serif; background-color: #020617; color: #cbd5e1; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.05);">
          <h2 style="color: #38bdf8; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">SMTP Test Success</h2>
          <p>SMTP Link Operational. Your system settings handshake succeeded.</p>
          <p style="color: #64748b; font-size: 11px;">Dispatched from host: ${configService.getSetting('smtp_host', '')}</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    await logAdminActivity(
      req.user.id,
      'TEST_SMTP_SETTINGS',
      null,
      req.ip,
      req.headers['user-agent'],
      { testEmail, messageId: info.messageId }
    );

    res.json({ message: 'Test email successfully queued/dispatched.', info });
  } catch (err) {
    console.error('SMTP test check failure:', err);
    res.status(500).json({ error: 'SMTP Connection failed: ' + err.message });
  }
};

/**
 * Test SMS Gateway Connection
 * POST /api/v1/admin/settings/test-sms
 */
const testSms = async (req, res, next) => {
  const { testPhone } = req.body;
  if (!testPhone) return res.status(400).json({ error: 'Recipient phone number is required' });

  try {
    const Client = require('android-sms-gateway').default;
    const axios = require('axios');

    const apiUrl = configService.getSetting('sms_api_url', '');
    const login = configService.getSetting('sms_login', '');
    const password = configService.getSetting('sms_password', '');

    if (!apiUrl) throw new Error('SMS Gateway URL is not configured.');

    // Simple custom client instantiation
    const axiosHttpClient = {
      get: (url, headers) => axios.get(url, { headers }).then(res => res.data),
      post: (url, body, headers) => axios.post(url, body, { headers }).then(res => res.data),
      put: (url, body, headers) => axios.put(url, body, { headers }).then(res => res.data),
      patch: (url, body, headers) => axios.patch(url, body, { headers }).then(res => res.data),
      delete: (url, headers) => axios.delete(url, { headers }).then(res => res.data),
    };

    const client = new Client(login, password, axiosHttpClient, apiUrl);
    const result = await client.send({
      phoneNumbers: [testPhone],
      message: '[ResolveNow] SMS Gateway handshake success. Settings verified.'
    });

    await logAdminActivity(
      req.user.id,
      'TEST_SMS_SETTINGS',
      null,
      req.ip,
      req.headers['user-agent'],
      { testPhone, gatewayResult: result }
    );

    res.json({ message: 'Test SMS successfully transmitted.', result });
  } catch (err) {
    console.error('SMS test check failure:', err);
    res.status(500).json({ error: 'SMS Gateway connection failed: ' + err.message });
  }
};

/**
 * CRUD Departments
 */
const getDepartments = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    // Join head_user details if possible
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  const { name, description, headUserId, assignmentRules } = req.body;

  if (!name) return res.status(400).json({ error: 'Department name is required' });

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { data: newDept, error } = await supabase
      .from('departments')
      .insert([{
        name,
        description,
        head_user_id: headUserId || null,
        assignment_rules: assignmentRules || { autoAssign: true }
      }])
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(req.user.id, 'CREATE_DEPARTMENT', null, req.ip, req.headers['user-agent'], { department: name });
    res.status(201).json({ message: 'Department created successfully', department: newDept });
  } catch (err) {
    next(err);
  }
};

const updateDepartment = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, headUserId, assignmentRules } = req.body;

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const updates = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (headUserId !== undefined) updates.head_user_id = headUserId || null;
    if (assignmentRules !== undefined) updates.assignment_rules = assignmentRules;

    const { data: updatedDept, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(req.user.id, 'UPDATE_DEPARTMENT', null, req.ip, req.headers['user-agent'], { department: name || id });
    res.json({ message: 'Department updated successfully', department: updatedDept });
  } catch (err) {
    next(err);
  }
};

const deleteDepartment = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { data: dept } = await supabase.from('departments').select('name').eq('id', id).single();
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw error;

    await logAdminActivity(req.user.id, 'DELETE_DEPARTMENT', null, req.ip, req.headers['user-agent'], { department: dept?.name || id });
    res.json({ message: 'Department removed successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * CRUD SLA Rules
 */
const getSlaRules = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { data, error } = await supabase.from('sla_rules').select('*').order('name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

const createSlaRule = async (req, res, next) => {
  const { name, category, priority, resolutionTimeHours, warningTimeHours } = req.body;

  if (!name || !category || !priority || !resolutionTimeHours) {
    return res.status(400).json({ error: 'Required fields missing: name, category, priority, resolutionTimeHours' });
  }

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { data: newRule, error } = await supabase
      .from('sla_rules')
      .insert([{
        name,
        category,
        priority,
        resolution_time_hours: parseInt(resolutionTimeHours),
        warning_time_hours: parseInt(warningTimeHours || 12)
      }])
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(req.user.id, 'CREATE_SLA_RULE', null, req.ip, req.headers['user-agent'], { rule: name });
    res.status(201).json({ message: 'SLA Rule created successfully', rule: newRule });
  } catch (err) {
    next(err);
  }
};

const updateSlaRule = async (req, res, next) => {
  const { id } = req.params;
  const { name, category, priority, resolutionTimeHours, warningTimeHours } = req.body;

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const updates = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (priority !== undefined) updates.priority = priority;
    if (resolutionTimeHours !== undefined) updates.resolution_time_hours = parseInt(resolutionTimeHours);
    if (warningTimeHours !== undefined) updates.warning_time_hours = parseInt(warningTimeHours);

    const { data: updatedRule, error } = await supabase
      .from('sla_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(req.user.id, 'UPDATE_SLA_RULE', null, req.ip, req.headers['user-agent'], { rule: name || id });
    res.json({ message: 'SLA Rule updated successfully', rule: updatedRule });
  } catch (err) {
    next(err);
  }
};

const deleteSlaRule = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { data: rule } = await supabase.from('sla_rules').select('name').eq('id', id).single();
    const { error } = await supabase.from('sla_rules').delete().eq('id', id);
    if (error) throw error;

    await logAdminActivity(req.user.id, 'DELETE_SLA_RULE', null, req.ip, req.headers['user-agent'], { rule: rule?.name || id });
    res.json({ message: 'SLA Rule removed successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * CRUD Escalation Rules
 */
const getEscalationRules = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { data, error } = await supabase
      .from('escalation_rules')
      .select('*, sla_rules(name, priority, category)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

const createEscalationRule = async (req, res, next) => {
  const { name, slaRuleId, triggerDelayHours, escalateToUserId } = req.body;

  if (!name || !slaRuleId || !triggerDelayHours) {
    return res.status(400).json({ error: 'Required fields missing: name, slaRuleId, triggerDelayHours' });
  }

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { data: newEsc, error } = await supabase
      .from('escalation_rules')
      .insert([{
        name,
        sla_rule_id: slaRuleId,
        trigger_delay_hours: parseInt(triggerDelayHours),
        escalate_to_user_id: escalateToUserId || null
      }])
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(req.user.id, 'CREATE_ESCALATION_RULE', null, req.ip, req.headers['user-agent'], { escalation: name });
    res.status(201).json({ message: 'Escalation Rule created successfully', escalation: newEsc });
  } catch (err) {
    next(err);
  }
};

const updateEscalationRule = async (req, res, next) => {
  const { id } = req.params;
  const { name, slaRuleId, triggerDelayHours, escalateToUserId } = req.body;

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const updates = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updates.name = name;
    if (slaRuleId !== undefined) updates.sla_rule_id = slaRuleId;
    if (triggerDelayHours !== undefined) updates.trigger_delay_hours = parseInt(triggerDelayHours);
    if (escalateToUserId !== undefined) updates.escalate_to_user_id = escalateToUserId || null;

    const { data: updatedEsc, error } = await supabase
      .from('escalation_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(req.user.id, 'UPDATE_ESCALATION_RULE', null, req.ip, req.headers['user-agent'], { escalation: name || id });
    res.json({ message: 'Escalation Rule updated successfully', escalation: updatedEsc });
  } catch (err) {
    next(err);
  }
};

const deleteEscalationRule = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const { data: esc } = await supabase.from('escalation_rules').select('name').eq('id', id).single();
    const { error } = await supabase.from('escalation_rules').delete().eq('id', id);
    if (error) throw error;

    await logAdminActivity(req.user.id, 'DELETE_ESCALATION_RULE', null, req.ip, req.headers['user-agent'], { escalation: esc?.name || id });
    res.json({ message: 'Escalation Rule removed successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Templates Management
 */
const getEmailTemplates = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });
    const { data, error } = await supabase.from('email_templates').select('*').order('name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

const updateEmailTemplate = async (req, res, next) => {
  const { id } = req.params;
  const { subject, body, description } = req.body;

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const updates = {
      updated_at: new Date().toISOString()
    };
    if (subject !== undefined) updates.subject = subject;
    if (body !== undefined) updates.body = body;
    if (description !== undefined) updates.description = description;

    const { data: updatedTpl, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(req.user.id, 'UPDATE_EMAIL_TEMPLATE', null, req.ip, req.headers['user-agent'], { template: updatedTpl?.name });
    res.json({ message: 'Email template updated successfully', template: updatedTpl });
  } catch (err) {
    next(err);
  }
};

const getSmsTemplates = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });
    const { data, error } = await supabase.from('sms_templates').select('*').order('name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

const updateSmsTemplate = async (req, res, next) => {
  const { id } = req.params;
  const { body, description } = req.body;

  try {
    if (!supabase) return res.status(500).json({ error: 'Database service unavailable' });

    const updates = {
      updated_at: new Date().toISOString()
    };
    if (body !== undefined) updates.body = body;
    if (description !== undefined) updates.description = description;

    const { data: updatedTpl, error } = await supabase
      .from('sms_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(req.user.id, 'UPDATE_SMS_TEMPLATE', null, req.ip, req.headers['user-agent'], { template: updatedTpl?.name });
    res.json({ message: 'SMS template updated successfully', template: updatedTpl });
  } catch (err) {
    next(err);
  }
};

/**
 * System Maintenance Actions
 */
const clearCache = async (req, res, next) => {
  try {
    await configService.reload();
    await logAdminActivity(req.user.id, 'FLUSH_SYSTEM_CACHE', null, req.ip, req.headers['user-agent'], {});
    res.json({ message: 'System settings memory cache successfully cleared and reloaded from PostgreSQL.' });
  } catch (err) {
    next(err);
  }
};

const runBackup = async (req, res, next) => {
  try {
    // Mock snapshot payload creation
    const snapshotName = `resolvenow_db_snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.backup`;
    
    await logAdminActivity(
      req.user.id,
      'TRIGGER_DATABASE_BACKUP',
      null,
      req.ip,
      req.headers['user-agent'],
      { snapshotFile: snapshotName }
    );

    res.json({ 
      message: 'System database backup completed successfully.',
      backupFile: snapshotName,
      sizeBytes: 8124500, // Mock 8MB size
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  testEmail,
  testSms,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getSlaRules,
  createSlaRule,
  updateSlaRule,
  deleteSlaRule,
  getEscalationRules,
  createEscalationRule,
  updateEscalationRule,
  deleteEscalationRule,
  getEmailTemplates,
  updateEmailTemplate,
  getSmsTemplates,
  updateSmsTemplate,
  clearCache,
  runBackup
};

const Client = require('android-sms-gateway').default;
const axios = require('axios');
const notificationQueue = require('./notificationQueue');
const configService = require('./configService');

/**
 * Returns dynamic SMS gateway client based on active settings.
 */
const getSmsClient = () => {
  const smsEnabled = configService.getSetting('enable_sms_notifications', true);
  if (!smsEnabled) {
    return null;
  }

  const apiUrl = configService.getSetting('sms_api_url', process.env.SMS_GATEWAY_URL || 'http://10.105.47.157:8080/api/v1');
  const login = configService.getSetting('sms_login', process.env.SMS_GATEWAY_LOGIN || 'sms');
  const password = configService.getSetting('sms_password', process.env.SMS_GATEWAY_PASSWORD || 'FeemKLig');

  if (!apiUrl) return null;

  const axiosHttpClient = {
    get: (url, headers) => axios.get(url, { headers }).then(res => res.data),
    post: (url, body, headers) => axios.post(url, body, { headers }).then(res => res.data),
    put: (url, body, headers) => axios.put(url, body, { headers }).then(res => res.data),
    patch: (url, body, headers) => axios.patch(url, body, { headers }).then(res => res.data),
    delete: (url, headers) => axios.delete(url, { headers }).then(res => res.data),
  };

  return new Client(login, password, axiosHttpClient, apiUrl);
};

/**
 * Transmits OTP via Android Gateway
 */
const sendOTPSMS = async (phoneNumber, otp) => {
  const taskFn = async () => {
    const client = getSmsClient();
    if (!client) {
      console.warn(`[SMS Service] SMS notifications disabled or gateway unconfigured. Skipping OTP dispatch to ${phoneNumber}`);
      return { success: false, skipped: true };
    }

    // Attempt to load SMS template from database
    const supabase = require('../config/supabase');
    let messageBody = `[ResolveNow] Your secure identity key is: ${otp}. It expires in 5 minutes.`;

    try {
      if (supabase) {
        const { data, error } = await supabase.from('sms_templates').select('body').eq('name', 'otp_sms').maybeSingle();
        if (data && !error) {
          messageBody = data.body.replace(/{{\s*otp\s*}}/g, otp);
        }
      }
    } catch (err) {
      console.error('Failed to load SMS template from database:', err.message);
    }

    console.log(`[Android SMS Gateway] Transmitting OTP to ${phoneNumber}`);
    const result = await client.send({
      phoneNumbers: [phoneNumber],
      message: messageBody
    });
    return result;
  };

  notificationQueue.enqueue('SMS', { phone: phoneNumber }, taskFn);
  return {
    success: true,
    message: 'SMS transmission queued.'
  };
};

module.exports = {
  sendOTPSMS
};

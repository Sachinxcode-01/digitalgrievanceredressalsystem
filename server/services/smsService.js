const Client = require('android-sms-gateway').default;
const axios = require('axios');
const notificationQueue = require('./notificationQueue');
const configService = require('./configService');
const notificationRepository = require('../repositories/notificationRepository');

/**
 * Returns dynamic SMS gateway client based on active settings.
 */
const getSmsClient = () => {
  const smsEnabled = configService.getSetting('enable_sms_notifications', true);
  if (!smsEnabled) {
    return null;
  }

  // Credentials must come from settings/env only — never hardcode gateway hosts or
  // passwords. If the gateway is not fully configured, SMS is skipped gracefully
  // (email remains the primary notification channel).
  const apiUrl = configService.getSetting('sms_api_url', process.env.SMS_GATEWAY_URL || '');
  const login = configService.getSetting('sms_login', process.env.SMS_GATEWAY_LOGIN || '');
  const password = configService.getSetting('sms_password', process.env.SMS_GATEWAY_PASSWORD || '');

  if (!apiUrl || !login || !password) {
    return null;
  }

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

    let messageBody = `[ResolveNow] Your secure identity key is: ${otp}. It expires in 5 minutes.`;

    try {
      const data = await notificationRepository.findSmsTemplate('otp_sms');
      if (data && data.body) {
        messageBody = data.body.replace(/{{\s*otp\s*}}/g, otp);
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

const sendTestSms = async (testPhone) => {
  const client = getSmsClient();
  if (!client) throw new Error('SMS Gateway URL is not configured.');
  return client.send({
    phoneNumbers: [testPhone],
    message: '[ResolveNow] SMS Gateway handshake success. Settings verified.'
  });
};

/**
 * Transmits Delivery Milestone Alert SMS to citizen
 */
const sendMilestoneSMS = async (phoneNumber, { ticketId, status, officerName, department, trackingUrl }) => {
  const taskFn = async () => {
    const client = getSmsClient();
    const messageBody = `[ResolveNow] Ticket #${ticketId}: Status updated to '${status}' by ${officerName || department || 'Officer'}. Track live: ${trackingUrl || 'http://localhost:5173'}`;

    if (!client) {
      console.log(`[SMS Simulation Alert] To: ${phoneNumber} | Message: ${messageBody}`);
      return { success: true, simulated: true, message: messageBody };
    }

    console.log(`[Android SMS Gateway] Transmitting Milestone Alert to ${phoneNumber}`);
    return client.send({
      phoneNumbers: [phoneNumber],
      message: messageBody
    });
  };

  notificationQueue.enqueue('SMS', { phone: phoneNumber, ticketId, status }, taskFn);
  return {
    success: true,
    message: 'Milestone SMS transmission queued.'
  };
};

module.exports = {
  sendOTPSMS,
  sendTestSms,
  sendMilestoneSMS
};

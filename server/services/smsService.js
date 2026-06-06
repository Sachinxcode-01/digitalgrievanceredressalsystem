const Client = require('android-sms-gateway').default;
const axios = require('axios');
const notificationQueue = require('./notificationQueue');

/**
 * Android SMS Gateway Client Configuration
 */
const GATEWAY_CONFIG = {
  baseUrl: process.env.SMS_GATEWAY_URL || 'http://10.105.47.157:8080/api/v1',
  login: process.env.SMS_GATEWAY_LOGIN || 'sms',
  password: process.env.SMS_GATEWAY_PASSWORD || 'FeemKLig'
};

// Simple Axios wrapper for the SMS Gateway Client
const axiosHttpClient = {
  get: (url, headers) => axios.get(url, { headers }).then(res => res.data),
  post: (url, body, headers) => axios.post(url, body, { headers }).then(res => res.data),
  put: (url, body, headers) => axios.put(url, body, { headers }).then(res => res.data),
  patch: (url, body, headers) => axios.patch(url, body, { headers }).then(res => res.data),
  delete: (url, headers) => axios.delete(url, { headers }).then(res => res.data),
};

const client = new Client(
  GATEWAY_CONFIG.login,
  GATEWAY_CONFIG.password,
  axiosHttpClient,
  GATEWAY_CONFIG.baseUrl
);

/**
 * Transmits OTP via Android Gateway
 */
const sendOTPSMS = async (phoneNumber, otp) => {
  const taskFn = async () => {
    console.log(`[Android SMS Gateway] Transmitting OTP ${otp} to ${phoneNumber}`);
    const result = await client.send({
      phoneNumbers: [phoneNumber],
      message: `[ResolveNow] Your secure identity key is: ${otp}. It expires in 5 minutes.`
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

module.exports = {
  email: {
    alert: (data) => ({
      subject: `ResolveNow: Security Alert`,
      template: 'securityAlertEmail.html',
      variables: {
        message: 'A security alert has been logged on your account.',
        cardStyle: 'border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05);',
        cardClass: 'card-alert',
        cardTitle: 'Security Log',
        cardContent: `<p style="margin: 0; color: #f87171;">${data.alertMessage}</p>`,
        actionText: 'If you did not execute this action, lock your account immediately and contact security support.'
      }
    }),
    newDevice: (data) => ({
      subject: `ResolveNow: Access from New Device Detected`,
      template: 'securityAlertEmail.html',
      variables: {
        message: 'We detected a new sign-in to your account from an unknown device.',
        cardStyle: '',
        cardClass: '',
        cardTitle: 'Session Details',
        cardContent: `
          <p style="margin: 5px 0;"><strong>Device OS:</strong> ${data.device}</p>
          <p style="margin: 5px 0;"><strong>Browser Engine:</strong> ${data.browser}</p>
          <p style="margin: 5px 0;"><strong>Access Time:</strong> ${data.time}</p>
          <p style="margin: 5px 0;"><strong>Geographic Origin:</strong> ${data.location}</p>
        `,
        actionText: 'If this was you, no action is required. Otherwise, change your credentials immediately.'
      }
    }),
    passwordChanged: (data) => ({
      subject: `ResolveNow: Password Changed Successfully`,
      template: 'passwordResetEmail.html',
      variables: {}
    })
  },
  sms: {
    alert: (data) => `[ResolveNow] Security Alert: ${data.alertMessage}`,
    newDevice: (data) => `[ResolveNow] New sign-in detected on your account from ${data.device}.`
  }
};

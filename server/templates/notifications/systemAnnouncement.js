module.exports = {
  email: {
    maintenance: (data) => ({
      subject: `ResolveNow Scheduled Maintenance Notification`,
      template: 'securityAlertEmail.html',
      variables: {
        message: 'The ResolveNow institutional network has scheduled system maintenance to deploy kernel upgrades.',
        cardStyle: 'border-left: 4px solid #38bdf8;',
        cardTitle: 'Maintenance Window',
        cardContent: `
          <p style="margin: 5px 0;"><strong>Start Time:</strong> ${data.maintenanceTime}</p>
          <p style="margin: 5px 0;"><strong>Estimated Period:</strong> ${data.duration}</p>
        `,
        actionText: 'During this window, neural classifiers and real-time synchronizations might be temporarily degraded.'
      }
    }),
    announcement: (data) => ({
      subject: data.subject || `ResolveNow Global Broadcast`,
      template: 'securityAlertEmail.html',
      variables: {
        message: data.body,
        cardStyle: 'display: none;',
        cardTitle: '',
        cardContent: '',
        actionText: ''
      }
    })
  },
  sms: {
    maintenance: (data) => `[ResolveNow] Scheduled maintenance starting ${data.maintenanceTime} for ${data.duration}.`
  }
};

module.exports = {
  email: {
    user: (data) => ({
      subject: `Grievance Recorded: #${data.ticketId}`,
      template: 'grievanceSubmittedEmail.html',
      variables: {
        message: 'We have successfully registered your grievance. An administrative officer will review the report shortly.',
        cardTitle: 'Filing Metadata',
        ticketId: data.ticketId,
        title: data.title,
        extraDetails: '<p style="margin: 5px 0;"><strong>Processing Status:</strong> Pending Review</p>',
        actionText: 'Use the link below to track real-time milestones and read administrator updates.',
        actionUrl: `${data.frontendUrl || 'http://localhost:5173'}/track?ticketId=${data.ticketId}`,
        btnClass: 'btn-user',
        btnText: 'Track Filing Milestones'
      }
    }),
    admin: (data) => ({
      subject: `ALERT: New Grievance #${data.ticketId} Submitted`,
      template: 'grievanceSubmittedEmail.html',
      variables: {
        message: 'A new ticket has been reported on the network index and is awaiting triage clearance.',
        cardTitle: 'Ticket Index',
        ticketId: data.ticketId,
        title: data.title,
        extraDetails: `<p style="margin: 5px 0;"><strong>Sector Category:</strong> ${data.category}</p><p style="margin: 5px 0;"><strong>Urgency Rating:</strong> <span style="color: #ef4444; font-weight: 900;">${data.urgency}</span></p>`,
        actionText: 'Access the command console to process this incident.',
        actionUrl: `${data.frontendUrl || 'http://localhost:5173'}/admin/dashboard?tab=grievances`,
        btnClass: 'btn-admin',
        btnText: 'Access Command Panel'
      }
    })
  },
  sms: {
    user: (data) => `[ResolveNow] Grievance #${data.ticketId} successfully registered. Track status on portal.`,
    admin: (data) => `[ResolveNow] ALERT: New High-Priority Grievance #${data.ticketId} requires triage.`
  }
};

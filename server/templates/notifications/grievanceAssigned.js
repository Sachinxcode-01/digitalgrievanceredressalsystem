module.exports = {
  email: {
    officer: (data) => ({
      subject: `ASSIGNMENT ALERT: Ticket #${data.ticketId}`,
      template: 'grievanceAssignedEmail.html',
      variables: {
        ticketId: data.ticketId,
        title: data.title,
        category: data.category,
        priority: data.priority,
        frontendUrl: data.frontendUrl || 'http://localhost:5173'
      }
    }),
    highPriority: (data) => ({
      subject: `HIGH PRIORITY ASSIGNMENT: #${data.ticketId}`,
      template: 'grievanceSubmittedEmail.html',
      variables: {
        message: 'A high-priority incident is registered in your segment queue requiring immediate intervention.',
        cardTitle: 'Incident parameters',
        ticketId: data.ticketId,
        title: data.title,
        extraDetails: `<p style="margin: 5px 0;"><strong>Category:</strong> ${data.category}</p>`,
        actionText: 'Triage the incident immediately.',
        actionUrl: `${data.frontendUrl || 'http://localhost:5173'}/admin/dashboard?tab=grievances`,
        btnClass: 'btn-escalated',
        btnText: 'Triage Incident'
      }
    })
  },
  sms: {
    officer: (data) => `[ResolveNow] ALERT: Ticket #${data.ticketId} assigned to your review queue.`
  }
};

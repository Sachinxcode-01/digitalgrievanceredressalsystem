module.exports = {
  email: {
    user: (data) => ({
      subject: `RESOLVED: Grievance #${data.ticketId} Resolved`,
      template: 'grievanceResolvedEmail.html',
      variables: {
        ticketId: data.ticketId,
        title: data.title,
        notes: data.notes,
        time: data.time,
        frontendUrl: data.frontendUrl || 'http://localhost:5173'
      }
    })
  },
  sms: {
    user: (data) => `[ResolveNow] Your grievance #${data.ticketId} has been successfully resolved.`
  }
};

module.exports = {
  email: {
    user: (data) => ({
      subject: `New Response: #${data.ticketId}`,
      template: 'grievanceSubmittedEmail.html',
      variables: {
        message: `A new comment has been added to ticket <strong>#${data.ticketId}</strong> by <strong>${data.authorName}</strong>.`,
        cardTitle: 'Comment Details',
        ticketId: data.ticketId,
        title: data.title,
        extraDetails: `<p style="font-style: italic; margin: 5px 0;">"${data.commentText}"</p>`,
        actionText: 'Reply to this message on the dashboard.',
        actionUrl: `${data.frontendUrl || 'http://localhost:5173'}/dashboard`,
        btnClass: 'btn-user',
        btnText: 'Reply to Message'
      }
    }),
    admin: (data) => ({
      subject: `User Response on Ticket #${data.ticketId}`,
      template: 'grievanceSubmittedEmail.html',
      variables: {
        message: `A citizen has posted a comment to ticket <strong>#${data.ticketId}</strong>:`,
        cardTitle: 'Comment text',
        ticketId: data.ticketId,
        title: data.title,
        extraDetails: `<p style="font-style: italic; margin: 5px 0;">"${data.commentText}"</p><p style="margin: 5px 0;"><strong>Author:</strong> ${data.authorName}</p>`,
        actionText: 'Open Command Panel to reply.',
        actionUrl: `${data.frontendUrl || 'http://localhost:5173'}/admin/dashboard?tab=grievances`,
        btnClass: 'btn-admin',
        btnText: 'Open Command Panel'
      }
    })
  },
  sms: {
    user: (data) => `[ResolveNow] New comment from ${data.authorName} on ticket #${data.ticketId}.`
  }
};

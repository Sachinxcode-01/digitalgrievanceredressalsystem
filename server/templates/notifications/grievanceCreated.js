module.exports = {
  email: {
    user: (data) => {
      const formattedSla = data.slaDueAt ? new Date(data.slaDueAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }) : 'Standard SLA (72 Hours)';

      const urgencyColor = 
        data.urgency === 'High' ? '#DC2626' : 
        data.urgency === 'Medium' ? '#D97706' : '#2563EB';

      return {
        subject: `Grievance Confirmation: Ticket #${data.ticketId}`,
        template: 'grievanceSubmittedEmail.html',
        variables: {
          message: 'Thank you for submitting your grievance. We have registered your filing in the ResolveNow system, and our administration team is taking action.',
          cardTitle: 'Grievance Filing Summary',
          ticketId: data.ticketId,
          title: data.title,
          category: data.category || 'General',
          urgency: data.urgency || 'Medium',
          urgencyColor: urgencyColor,
          department: data.department || 'Facilities & Maintenance',
          slaDueAt: formattedSla,
          extraDetails: `
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;">
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px 0; color: #64748B; font-weight: 500;">Category:</td>
                <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">${data.category || 'General'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px 0; color: #64748B; font-weight: 500;">Priority / Urgency:</td>
                <td style="padding: 8px 0; color: ${urgencyColor}; font-weight: 700; text-align: right;">${data.urgency || 'Medium'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px 0; color: #64748B; font-weight: 500;">Assigned Department:</td>
                <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">${data.department || 'Facilities & Maintenance'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748B; font-weight: 500;">Target SLA Due Date:</td>
                <td style="padding: 8px 0; color: #2563EB; font-weight: 600; text-align: right;">${formattedSla}</td>
              </tr>
            </table>
          `,
          nextSteps: `
            <div style="background-color: #EFF6FF; border-left: 4px solid #2563EB; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <h4 style="margin: 0 0 8px 0; color: #1E40AF; font-size: 14px; font-weight: 700;">Clear Next Steps:</h4>
              <ol style="margin: 0; padding-left: 20px; color: #1E3A8A; font-size: 13px; line-height: 1.6;">
                <li>The assigned department coordinator will review your grievance parameters.</li>
                <li>You will receive automatic email and status updates as officers process your ticket.</li>
                <li>You can track progress live or post additional comments using your tracking link.</li>
              </ol>
            </div>
          `,
          actionText: 'Track your grievance status in real time on the ResolveNow Portal:',
          actionUrl: `${data.frontendUrl || 'http://localhost:5173'}/track?ticketId=${data.ticketId}`,
          btnClass: 'btn-user',
          btnText: 'Track Ticket Progress'
        }
      };
    },
    admin: (data) => {
      const formattedSla = data.slaDueAt ? new Date(data.slaDueAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }) : 'Standard SLA';

      return {
        subject: `NEW GRIEVANCE ALERT: #${data.ticketId} [${data.urgency || 'Normal'}]`,
        template: 'grievanceSubmittedEmail.html',
        variables: {
          message: 'A new student grievance has been registered on ResolveNow and requires your attention.',
          cardTitle: 'Ticket Details',
          ticketId: data.ticketId,
          title: data.title,
          category: data.category || 'General',
          urgency: data.urgency || 'Medium',
          department: data.department || 'General',
          slaDueAt: formattedSla,
          extraDetails: `
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;">
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px 0; color: #64748B;">Category:</td>
                <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">${data.category || 'General'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px 0; color: #64748B;">Urgency:</td>
                <td style="padding: 8px 0; color: #DC2626; font-weight: 700; text-align: right;">${data.urgency || 'Medium'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px 0; color: #64748B;">Department:</td>
                <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">${data.department || 'General'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748B;">SLA Due:</td>
                <td style="padding: 8px 0; color: #2563EB; font-weight: 600; text-align: right;">${formattedSla}</td>
              </tr>
            </table>
          `,
          nextSteps: '',
          actionText: 'Open the administrator console to triage or reassign this ticket:',
          actionUrl: `${data.frontendUrl || 'http://localhost:5173'}/admin/dashboard?tab=grievances`,
          btnClass: 'btn-admin',
          btnText: 'Open Admin Console'
        }
      };
    }
  },
  sms: {
    user: (data) => `[ResolveNow] Grievance #${data.ticketId} successfully registered. Track status on portal.`,
    admin: (data) => `[ResolveNow] ALERT: New High-Priority Grievance #${data.ticketId} requires triage.`
  }
};

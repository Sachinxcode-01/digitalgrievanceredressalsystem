const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

// If the user provides real SMTP credentials in .env, we use them. Otherwise, fallback to Ethereal.
let transporterPromise;

if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
  transporterPromise = Promise.resolve(nodemailer.createTransport({
    service: 'gmail', // You can change this if using another provider like SendGrid or Outlook
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  }));
  console.log('📧 Real SMTP Email active. Emails will be delivered to real inboxes.');
} else {
  transporterPromise = nodemailer.createTestAccount().then((account) => {
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
    console.log('📧 Ethereal Test Email fallback active. Provide SMTP variables in .env for real emails.');
    return transporter;
  }).catch(err => {
    console.error('Failed to create a test email account', err);
  });
}

// -------------------------------------------------------------
// BEAUTIFUL HTML EMAIL TEMPLATES
// -------------------------------------------------------------

const getBaseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .content { padding: 40px; color: #374151; line-height: 1.6; font-size: 16px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
    .highlight { background: #eff6ff; color: #1e40af; padding: 15px; border-radius: 8px; font-weight: 600; font-size: 20px; text-align: center; letter-spacing: 4px; border: 1px dashed #bfdbfe; margin: 25px 0; }
    .btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Digital Grievance System. All rights reserved.</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Sends an OTP email.
 */
const sendOTPEmail = async (email, otp) => {
  const transporter = await transporterPromise;
  if (!transporter) throw new Error("Email service failed to initialize");
  
  const content = `
    <p>Hello,</p>
    <p>You requested a One-Time Password (OTP) to securely access the Digital Grievance System.</p>
    <div class="highlight">${otp}</div>
    <p>Please enter this code on the verification page. For your security, this code will expire in exactly <b>5 minutes</b>.</p>
    <p>If you did not request this code, you can safely ignore this email.</p>
  `;

  const mailOptions = {
    from: '"Digital Grievance System" <no-reply@grievance.system>',
    to: email,
    subject: `Your Secure OTP Code is ${otp}`,
    html: getBaseTemplate('Secure Login Verification', content)
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`\n📨 OTP Email Sent to: ${email}`);
  if (info.messageId && !process.env.SMTP_EMAIL) {
     console.log(`➡️ Preview Email (Test URL): ${nodemailer.getTestMessageUrl(info)}\n`);
  }
  return info;
};

/**
 * Sends a grievance notification email.
 */
const sendGrievanceEmail = async (email, ticketId, title) => {
  const transporter = await transporterPromise;
  if (!transporter) return;

  const content = `
    <p>Hello,</p>
    <p>Thank you for reaching out. We have successfully recorded your grievance and our support team will begin reviewing it shortly.</p>
    <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #1e3a8a;">Ticket Details</h3>
      <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
      <p style="margin: 5px 0;"><strong>Subject:</strong> ${title}</p>
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #d97706; font-weight: bold;">Pending Review</span></p>
    </div>
    <p>You can track the status of your ticket live from your dashboard. We will notify you when there are updates.</p>
    <a href="#" class="btn">View Ticket Dashboard</a>
  `;

  const mailOptions = {
    from: '"Digital Grievance System" <support@grievance.system>',
    to: email,
    subject: `Grievance Received: #${ticketId}`,
    html: getBaseTemplate('Ticket Confirmation', content)
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`\n📨 Notification Email Sent to: ${email}`);
  if (info.messageId && !process.env.SMTP_EMAIL) {
    console.log(`➡️ Preview Email (Test URL): ${nodemailer.getTestMessageUrl(info)}\n`);
  }
  return info;
};

/**
 * Sends a notification to the Admin when a new grievance is submitted.
 */
const sendAdminNotification = async (ticketId, title, category, urgency) => {
  const transporter = await transporterPromise;
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!transporter || !adminEmail) return;

  const content = `
    <p>Hello Admin,</p>
    <p>A new grievance ticket has just been submitted into the system and is awaiting your review.</p>
    <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #f59e0b; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #b45309;">New Ticket Action Required</h3>
      <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
      <p style="margin: 5px 0;"><strong>Subject:</strong> ${title}</p>
      <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
      <p style="margin: 5px 0;"><strong>Urgency:</strong> <span style="color: #dc2626; font-weight: bold;">${urgency}</span></p>
    </div>
    <a href="#" class="btn" style="background: #f59e0b;">Access Admin Dashboard</a>
  `;

  const mailOptions = {
    from: '"Digital Grievance System" <admin-alerts@grievance.system>',
    to: adminEmail,
    subject: `ACTION REQUIRED: New Ticket #${ticketId}`,
    html: getBaseTemplate('Admin Alert: New Grievance', content)
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`\n📨 Admin Alert Email Sent to: ${adminEmail}`);
  return info;
};

/**
 * Sends a welcome email after account creation.
 */
const sendWelcomeEmail = async (email, fullName) => {
  const transporter = await transporterPromise;
  if (!transporter) return;

  const content = `
    <p>Hello <b>${fullName}</b>,</p>
    <p>Welcome to the <b>Digital Grievance System</b>. Your institutional account has been successfully initialized and secured.</p>
    <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #10b981; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #065f46;">Account Status: Active</h3>
      <p style="margin: 5px 0;"><strong>Identity:</strong> ${email}</p>
      <p style="margin: 5px 0;"><strong> Clearance:</strong> Level 1 (General Access)</p>
    </div>
    <p>You can now log in to submit grievances, track existing tickets, and access your secure user profile.</p>
    <a href="${process.env.VITE_FRONTEND_URL || '#'}" class="btn" style="background: #10b981;">Access Secure Portal</a>
    <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">If you did not initiate this account creation, please contact our security team immediately.</p>
  `;

  const mailOptions = {
    from: '"Digital Grievance System" <security@grievance.system>',
    to: email,
    subject: 'Identity Confirmed: Welcome to Digital Grievance System',
    html: getBaseTemplate('Account Activation Successful', content)
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`\n📨 Welcome Email Sent to: ${email}`);
  return info;
};

module.exports = {
  sendOTPEmail,
  sendGrievanceEmail,
  sendAdminNotification,
  sendWelcomeEmail
};


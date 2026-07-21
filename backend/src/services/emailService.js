// backend/src/services/emailService.js
import nodemailer from 'nodemailer';

export const sendDriverRejectionEmail = async (driverEmail, driverName, reason) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email Service] Skipping email dispatch: EMAIL_USER or EMAIL_PASS not set in .env');
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"CampusRide Fleet Team" <${process.env.EMAIL_USER}>`,
    to: driverEmail,
    subject: 'CampusRide Driver Application Status Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1E3A8A;">CampusRide Verification Update</h2>
        <p>Dear <strong>${driverName}</strong>,</p>
        <p>Thank you for applying to join the CampusRide driver fleet.</p>
        <p>After reviewing your application credentials, our verification team was unable to approve your profile at this time due to the following reason:</p>
        
        <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <strong style="color: #991B1B;">Reason for Rejection:</strong>
          <p style="color: #7F1D1D; margin: 6px 0 0 0;">${reason}</p>
        </div>

        <p>You may update your documents or re-apply directly through the CampusRide mobile app.</p>
        <br/>
        <p style="color: #64748B; font-size: 13px;">Best regards,<br/><strong>CampusRide Operations Team</strong></p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
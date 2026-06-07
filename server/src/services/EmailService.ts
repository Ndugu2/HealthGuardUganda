import nodemailer from 'nodemailer';

export class EmailService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('[EmailService] SMTP credentials are not configured. Emails will only be simulated in the console.');
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Sends an OTP verification email to the user.
   */
  public static async sendOTP(email: string, code: string, name: string): Promise<boolean> {
    console.log(`[EmailService] Preparing to send OTP ${code} to ${email}`);
    
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || '"HealthGuard Uganda" <no-reply@healthguard.ug>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #0d9488; padding: 15px; text-align: center; border-radius: 6px 6px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">HealthGuard Uganda</h2>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 16px;">Thank you for registering with HealthGuard Uganda. To complete your registration and activate your account, please use the 6-digit verification code below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #f3f4f6; padding: 12px 24px; border-radius: 6px; color: #0f766e; border: 1px solid #e5e7eb;">${code}</span>
          </div>

          <p style="font-size: 14px; color: #666666;">This code is valid for 15 minutes. Please do not share this code with anyone.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999999; text-align: center;">HealthGuard Uganda National Digital Portal &copy; 2026. All rights reserved.</p>
        </div>
      </div>
    `;

    if (!transporter) {
      console.log(`[EmailService] [SIMULATED] Email sent successfully to ${email} (Code: ${code})`);
      return true;
    }

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'HealthGuard Uganda - Verify Your Account',
        text: `Hello ${name},\n\nYour HealthGuard Uganda verification code is: ${code}\n\nThis code is valid for 15 minutes.`,
        html: htmlContent,
      });
      console.log(`[EmailService] OTP email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send OTP email:', error);
      return false;
    }
  }

  /**
   * Sends a password reset code via Email.
   */
  public static async sendPasswordReset(email: string, code: string, name: string): Promise<boolean> {
    console.log(`[EmailService] Preparing to send Password Reset Code to ${email}`);
    
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || '"HealthGuard Uganda" <no-reply@healthguard.ug>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #dc2626; padding: 15px; text-align: center; border-radius: 6px 6px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">HealthGuard Uganda</h2>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 16px;">We received a request to reset the password for your HealthGuard account. Please use the verification code below to set a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #f3f4f6; padding: 12px 24px; border-radius: 6px; color: #dc2626; border: 1px solid #e5e7eb;">${code}</span>
          </div>

          <p style="font-size: 14px; color: #666666;">This code is valid for 15 minutes. If you did not request this, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999999; text-align: center;">HealthGuard Uganda National Digital Portal &copy; 2026. All rights reserved.</p>
        </div>
      </div>
    `;

    if (!transporter) {
      console.log(`[EmailService] [SIMULATED] Password reset email sent successfully to ${email} (Code: ${code})`);
      return true;
    }

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'HealthGuard Uganda - Reset Your Password',
        text: `Hello ${name},\n\nYour password reset verification code is: ${code}\n\nThis code is valid for 15 minutes.`,
        html: htmlContent,
      });
      console.log(`[EmailService] Password reset email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Sends an Admin Registration Alert to the system super-admin (owner).
   * Triggered whenever someone registers with the ADMIN role.
   */
  public static async sendAdminRegistrationAlert(applicant: {
    name: string;
    phone: string;
    email?: string;
    district?: string;
    village?: string;
  }): Promise<boolean> {
    const ownerEmail = process.env.SMTP_USER;
    if (!ownerEmail) {
      console.warn('[EmailService] SMTP_USER not set — cannot send admin registration alert.');
      return false;
    }

    console.log(`[EmailService] Sending admin registration alert to owner (${ownerEmail}) for applicant: ${applicant.name}`);

    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || '"HealthGuard Uganda" <no-reply@healthguard.ug>';
    const registeredAt = new Date().toLocaleString('en-UG', { timeZone: 'Africa/Kampala' });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #7c3aed; padding: 15px; text-align: center; border-radius: 6px 6px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 22px; font-weight: bold;">🛡️ HealthGuard Uganda — Admin Alert</h2>
        </div>
        <div style="padding: 24px; color: #333333; line-height: 1.7;">
          <p style="font-size: 16px; font-weight: bold; color: #7c3aed;">New Administrator Registration Request</p>
          <p style="font-size: 15px;">A new user has submitted a registration request for an <strong>Administrator</strong> account. Please review their details below and log in to approve or reject.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #6b7280; width: 120px;">Full Name</td>
              <td style="padding: 10px 14px; font-size: 14px; color: #111827;"><strong>${applicant.name}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #6b7280;">Phone</td>
              <td style="padding: 10px 14px; font-size: 14px; color: #111827;">${applicant.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #6b7280;">Email</td>
              <td style="padding: 10px 14px; font-size: 14px; color: #111827;">${applicant.email || '—'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #6b7280;">District</td>
              <td style="padding: 10px 14px; font-size: 14px; color: #111827;">${applicant.district || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #6b7280;">Registered At</td>
              <td style="padding: 10px 14px; font-size: 14px; color: #111827;">${registeredAt} (EAT)</td>
            </tr>
          </table>

          <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">⚠️ This account is <strong>pending your approval</strong>. The user cannot sign in until you activate their account from the Settings panel inside the HealthGuard app.</p>
          </div>

          <p style="font-size: 13px; color: #6b7280;">Log in to the HealthGuard Admin portal → More → Settings → Pending Approvals to review this request.</p>

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999999; text-align: center;">HealthGuard Uganda National Digital Portal &copy; 2026. All rights reserved.</p>
        </div>
      </div>
    `;

    if (!transporter) {
      console.log(`[EmailService] [SIMULATED] Admin registration alert logged for ${applicant.name} (${applicant.phone})`);
      return true;
    }

    try {
      await transporter.sendMail({
        from,
        to: ownerEmail,
        subject: `🛡️ HealthGuard — New Admin Registration: ${applicant.name}`,
        text: `New Administrator Registration\n\nName: ${applicant.name}\nPhone: ${applicant.phone}\nEmail: ${applicant.email || 'N/A'}\nDistrict: ${applicant.district || 'N/A'}\nRegistered At: ${registeredAt}\n\nThis account is pending your approval. Log in to the app Settings to approve.`,
        html: htmlContent,
      });
      console.log(`[EmailService] Admin registration alert sent to ${ownerEmail}`);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send admin registration alert:', error);
      return false;
    }
  }
}

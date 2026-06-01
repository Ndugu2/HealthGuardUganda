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
   * Sends a Password Reset email.
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
}

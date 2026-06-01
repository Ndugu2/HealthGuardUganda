import { Alert } from 'react-native';

export class NotificationService {
  /**
   * Helper to format a Ugandan phone number to international E.164 format.
   * e.g., "0772123456" -> "+256772123456"
   */
  private static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    if (cleaned.startsWith('07')) {
      return '+256' + cleaned.substring(1);
    }
    
    if (cleaned.startsWith('7')) {
      return '+256' + cleaned;
    }
    
    if (cleaned.startsWith('256')) {
      return '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Simulates or sends an OTP code via SMS.
   * If EXPO_PUBLIC_AT_USERNAME and EXPO_PUBLIC_AT_API_KEY are defined, sends a real SMS.
   */
  public static async sendOTP(phone: string, code: string): Promise<boolean> {
    console.log(`[NotificationService] Sending OTP ${code} to ${phone}`);
    
    const username = process.env.EXPO_PUBLIC_AT_USERNAME;
    const apiKey = process.env.EXPO_PUBLIC_AT_API_KEY;
    const senderId = process.env.EXPO_PUBLIC_AT_SENDER_ID;

    if (username && apiKey) {
      const formattedTo = this.formatPhoneNumber(phone);
      const isSandbox = username.toLowerCase() === 'sandbox';
      const url = isSandbox
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging';

      const params = new URLSearchParams();
      params.append('username', username);
      params.append('to', formattedTo);
      params.append('message', `Your HealthGuard Uganda verification code is: ${code}`);

      if (senderId && !isSandbox) {
        params.append('from', senderId);
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': apiKey,
          },
          body: params.toString(),
        });

        if (response.ok) {
          console.log(`[NotificationService] Real SMS sent successfully to ${formattedTo}!`);
          return true;
        } else {
          const errText = await response.text();
          console.warn(`[NotificationService] Africa's Talking API returned error status ${response.status}:`, errText);
        }
      } catch (error) {
        console.error('[NotificationService] Direct client-side SMS sending failed:', error);
      }
    }

    // Fallback/Simulated SMS
    await new Promise(resolve => setTimeout(resolve, 800));
    Alert.alert(
      'New Message',
      `HealthGuard SMS:\nYour verification code is ${code}`,
      [{ text: 'Dismiss' }]
    );

    return true;
  }

  /**
   * Sends an OTP code via Email by calling the server's real SMTP endpoint.
   * Falls back to a simulated alert if the server is unreachable.
   */
  public static async sendOTPViaEmail(email: string, code: string, name?: string): Promise<boolean> {
    console.log(`[NotificationService] Sending OTP ${code} to email ${email}`);

    // Try sending via the server's real SMTP email endpoint
    try {
      const { getApiBaseUrl } = require('../db/apiConfig');
      const API_URL = await getApiBaseUrl();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${API_URL}/auth/send-otp-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, name: name || 'User' }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        console.log(`[NotificationService] Real OTP email sent successfully to ${email}!`);
        return true;
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn(`[NotificationService] Server email API error:`, errData);
      }
    } catch (error) {
      console.warn('[NotificationService] Server unreachable for email, falling back to alert:', error);
    }

    // Fallback: show a local alert so the user can still see the code
    Alert.alert(
      'Email Delivery',
      `Could not send email to ${email}.\nYour verification code is: ${code}`,
      [{ text: 'OK' }]
    );

    return true;
  }

  /**
   * Simulates sending a welcome email.
   */
  public static async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    console.log(`[NotificationService] Sending Welcome Email to ${email} for ${name}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Show a local alert to simulate receiving an email
    Alert.alert(
      'New Email Received',
      `Subject: Welcome to HealthGuard!\nTo: ${email}\n\nHi ${name},\nWelcome to HealthGuard Uganda. We are thrilled to have you!`,
      [{ text: 'Dismiss' }]
    );

    return true;
  }

  /**
   * Simulates or sends a password reset code via SMS.
   */
  public static async sendPasswordResetSMS(phone: string, code: string): Promise<boolean> {
    console.log(`[NotificationService] Sending reset code ${code} via SMS to ${phone}`);
    
    const username = process.env.EXPO_PUBLIC_AT_USERNAME;
    const apiKey = process.env.EXPO_PUBLIC_AT_API_KEY;
    const senderId = process.env.EXPO_PUBLIC_AT_SENDER_ID;

    if (username && apiKey) {
      const formattedTo = this.formatPhoneNumber(phone);
      const isSandbox = username.toLowerCase() === 'sandbox';
      const url = isSandbox
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging';

      const params = new URLSearchParams();
      params.append('username', username);
      params.append('to', formattedTo);
      params.append('message', `Your password reset code is: ${code}. It expires in 15 minutes.`);

      if (senderId && !isSandbox) {
        params.append('from', senderId);
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': apiKey,
          },
          body: params.toString(),
        });

        if (response.ok) {
          console.log(`[NotificationService] Real reset SMS sent successfully to ${formattedTo}!`);
          return true;
        } else {
          const errText = await response.text();
          console.warn(`[NotificationService] Africa's Talking API returned error status ${response.status}:`, errText);
        }
      } catch (error) {
        console.error('[NotificationService] Direct client-side reset SMS sending failed:', error);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    Alert.alert(
      'New Message',
      `HealthGuard SMS:\nYour password reset code is ${code}. It expires in 15 minutes.`,
      [{ text: 'Dismiss' }]
    );
    return true;
  }

  /**
   * Simulates sending a password reset code via Email.
   */
  public static async sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
    console.log(`[NotificationService] Sending reset code ${code} via Email to ${email}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    Alert.alert(
      'New Email Received',
      `Subject: HealthGuard Password Reset\nTo: ${email}\n\nYour password reset code is ${code}. It expires in 15 minutes.`,
      [{ text: 'Dismiss' }]
    );
    return true;
  }
}

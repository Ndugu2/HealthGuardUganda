import { Alert } from 'react-native';

export class NotificationService {
  /**
   * Simulates sending an OTP code via SMS.
   * In a production environment, this would call a backend endpoint (e.g. Twilio API).
   */
  public static async sendOTP(phone: string, code: string): Promise<boolean> {
    console.log(`[NotificationService] Sending OTP ${code} to ${phone}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Show a local alert to simulate receiving an SMS
    Alert.alert(
      'New Message',
      `HealthGuard SMS:\nYour verification code is ${code}`,
      [{ text: 'Dismiss' }]
    );

    return true;
  }

  /**
   * Simulates sending a welcome email.
   * In a production environment, this would call a backend endpoint (e.g. SendGrid API).
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
}

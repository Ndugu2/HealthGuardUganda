export class SMSService {
  /**
   * Helper to format a Ugandan phone number to international E.164 format.
   * e.g., "0772123456" -> "+256772123456"
   */
  public static formatPhoneNumber(phone: string): string {
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
   * Sends an SMS via Africa's Talking API.
   */
  public static async sendSMS(to: string, message: string): Promise<boolean> {
    const username = process.env.AT_USERNAME;
    const apiKey = process.env.AT_API_KEY;
    const senderId = process.env.AT_SENDER_ID;

    if (!username || !apiKey) {
      console.warn('[SMSService] Africa\'s Talking credentials not configured. SMS will be simulated in console.');
      console.log(`[SMSService] [SIMULATED] SMS to ${to}: ${message}`);
      return true;
    }

    const formattedTo = this.formatPhoneNumber(to);
    console.log(`[SMSService] Sending SMS to ${formattedTo} via Africa's Talking...`);

    const isSandbox = username.toLowerCase() === 'sandbox';
    const url = isSandbox
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('to', formattedTo);
    params.append('message', message);

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

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.warn('[SMSService] Failed to parse JSON response from Africa\'s Talking:', text);
      }

      if (response.ok) {
        const recipients = data?.SMSMessageData?.Recipients || [];
        const successRecipients = recipients.filter((r: any) => r.status === 'Success' || r.status === 'Success (Sent to Gateway)');
        if (successRecipients.length > 0) {
          console.log(`[SMSService] SMS sent successfully to ${formattedTo}. MessageId: ${successRecipients[0].messageId}`);
          return true;
        } else {
          console.error('[SMSService] Africa\'s Talking returned recipient error:', recipients);
          return false;
        }
      } else {
        console.error(`[SMSService] Africa's Talking API Error (${response.status}):`, text);
        return false;
      }
    } catch (error) {
      console.error('[SMSService] Network error sending SMS via Africa\'s Talking:', error);
      return false;
    }
  }
}

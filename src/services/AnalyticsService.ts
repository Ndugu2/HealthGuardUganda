/**
 * AnalyticsService - A mocked service to log user interactions.
 * In a real-world scenario, this would integrate with a backend
 * or a service like Firebase/Mixpanel.
 */

export interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

export class AnalyticsService {
  static async logEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    const event: AnalyticsEvent = {
      eventName,
      properties,
      timestamp: new Date().toISOString(),
    };

    // MOCK: Simply log to the console for now
    console.log(`[Analytics] Event Logged: ${eventName}`, properties || '');

    // Later: Add SQLite logging or remote sending
  }

  static async logAudioPlayed(feature: string, contentId: number | string, language: string): Promise<void> {
    await this.logEvent('audio_played', { feature, contentId, language });
  }

  static async logCallInitiated(facilityId: number | string, facilityName: string): Promise<void> {
    await this.logEvent('call_initiated', { facilityId, facilityName });
  }

  static async logQuizAnswered(questionId: number, correct: boolean): Promise<void> {
    await this.logEvent('quiz_answered', { questionId, correct });
  }

  static async logQuizCompleted(score: number, total: number): Promise<void> {
    await this.logEvent('quiz_completed', { score, total, percentage: (score / total) * 100 });
  }

  static async logMythViewed(mythId: number | string): Promise<void> {
    await this.logEvent('myth_viewed', { mythId });
  }
}

/**
 * AnalyticsService — Persistent Event Tracking
 *
 * Stores events in localStorage (Web) or SQLite settings (Native).
 * Maintains a rolling buffer of the last 200 events.
 * Supports aggregation for the ReportsScreen dashboard.
 */

import { getSetting, saveSetting } from '../db/Database';

export interface AnalyticsEvent {
  id: number;
  eventName: string;
  properties?: Record<string, any>;
  timestamp: string;
}

const STORE_KEY = 'healthguard_analytics_events';
const MAX_EVENTS = 200;

export class AnalyticsService {

  // ── Core persistence ────────────────────────────────────────────────────────

  private static async readEvents(): Promise<AnalyticsEvent[]> {
    try {
      const raw = await getSetting(STORE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as AnalyticsEvent[];
    } catch {
      return [];
    }
  }

  private static async writeEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      await saveSetting(STORE_KEY, JSON.stringify(events));
    } catch (e) {
      console.warn('[Analytics] Failed to persist events:', e);
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Log a named event with optional properties.
   * Events are persisted offline and available for the reports dashboard.
   */
  static async logEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    const existing = await AnalyticsService.readEvents();

    const event: AnalyticsEvent = {
      id: Date.now(),
      eventName,
      properties,
      timestamp: new Date().toISOString(),
    };

    // Prepend and cap at MAX_EVENTS (rolling buffer)
    const updated = [event, ...existing].slice(0, MAX_EVENTS);
    await AnalyticsService.writeEvents(updated);
  }

  /**
   * Retrieve all stored events, newest first.
   */
  static async getRecentEvents(limit: number = 50): Promise<AnalyticsEvent[]> {
    const events = await AnalyticsService.readEvents();
    return events.slice(0, limit);
  }

  /**
   * Return aggregated counts grouped by event name.
   * Useful for the ReportsScreen summary cards.
   */
  static async getSummary(): Promise<Record<string, number>> {
    const events = await AnalyticsService.readEvents();
    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.eventName] = (counts[e.eventName] || 0) + 1;
    }
    return counts;
  }

  /**
   * Return total event count.
   */
  static async getEventCount(): Promise<number> {
    const events = await AnalyticsService.readEvents();
    return events.length;
  }

  /**
   * Clear all stored analytics events.
   */
  static async clearEvents(): Promise<void> {
    await AnalyticsService.writeEvents([]);
  }

  // ── Typed convenience helpers ────────────────────────────────────────────────

  static async logClaimAnalyzed(
    label: string,
    confidence: number,
    source: 'rule' | 'ml' | 'bert' | 'ai',
    topic?: string | null
  ): Promise<void> {
    await AnalyticsService.logEvent('claim_analyzed', { label, confidence, source, topic });
  }

  static async logAudioPlayed(feature: string, contentId: number | string, language: string): Promise<void> {
    await AnalyticsService.logEvent('audio_played', { feature, contentId, language });
  }

  static async logCallInitiated(facilityId: number | string, facilityName: string): Promise<void> {
    await AnalyticsService.logEvent('call_initiated', { facilityId, facilityName });
  }

  static async logQuizAnswered(questionId: number, correct: boolean): Promise<void> {
    await AnalyticsService.logEvent('quiz_answered', { questionId, correct });
  }

  static async logQuizCompleted(score: number, total: number): Promise<void> {
    await AnalyticsService.logEvent('quiz_completed', {
      score,
      total,
      percentage: Math.round((score / total) * 100),
    });
  }

  static async logMythViewed(mythId: number | string): Promise<void> {
    await AnalyticsService.logEvent('myth_viewed', { mythId });
  }

  static async logScreenVisit(screenName: string): Promise<void> {
    await AnalyticsService.logEvent('screen_visit', { screenName });
  }

  static async logTriageCompleted(result: 'RED' | 'YELLOW' | 'GREEN', ageGroup: string): Promise<void> {
    await AnalyticsService.logEvent('triage_completed', { result, ageGroup });
  }

  static async logSyncAttempt(type: 'push' | 'pull', success: boolean, count?: number): Promise<void> {
    await AnalyticsService.logEvent('sync_attempt', { type, success, count });
  }
}

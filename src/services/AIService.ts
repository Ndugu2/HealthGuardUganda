/**
 * AIService — Cloud Intelligence Layer
 *
 * 3-Tier Expert Strategy:
 *  Tier 1: OpenRouter API (direct, free Llama-3 model) — online
 *  Tier 2: National Backend server — fallback
 *  Tier 3: Local Hybrid AI simulation — always-on offline fallback
 */

import { getSetting } from '../db/Database';
import { Platform } from 'react-native';

const OPENROUTER_URL   = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'meta-llama/llama-3-8b-instruct:free';
const BACKEND_URL      = Platform.OS === 'web'
  ? 'http://localhost:3000/api'
  : 'http://10.0.2.2:3000/api';

export interface ExpertAnalysis {
  label: 'ACCURATE' | 'INACCURATE' | 'UNCERTAIN';
  explanation: string;
  recommendation: string;
  source?: 'online' | 'backend' | 'offline';
}

export class AIService {

  /**
   * Main entry point — tries 3 strategies in order.
   */
  public static async consultExpert(
    claim: string,
    language: string = 'en'
  ): Promise<ExpertAnalysis | null> {

    // ── TIER 1: Direct Online Call (OpenRouter or Pollinations) ───────────────
    const apiKey = await getSetting('openrouter_api_key');
    if (apiKey) {
      const online = await AIService.callOpenRouter(claim, language, apiKey);
      if (online) return { ...online, source: 'online' };
    } else {
      const online = await AIService.callPollinations(claim, language);
      if (online) return { ...online, source: 'online' };
    }

    // ── TIER 2: National Backend Server ──────────────────────────────────────
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${BACKEND_URL}/ai/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, language }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return { ...json.data, source: 'backend' };
      }
    } catch {
      console.warn('AIService: Backend unreachable, using offline fallback.');
    }

    // ── TIER 3: Local Offline Simulation ─────────────────────────────────────
    const offline = await AIService.simulateLocalExpert(claim, language);
    return offline ? { ...offline, source: 'offline' } : null;
  }

  /**
   * Direct call to OpenRouter API (free Llama-3 model).
   */
  private static async callOpenRouter(
    claim: string,
    language: string,
    apiKey: string
  ): Promise<ExpertAnalysis | null> {
    const lang = language === 'lg' ? 'Luganda' : 'English';
    const systemPrompt = `You are a senior medical expert advising Ugandan community health workers.
Analyse the health claim and respond ONLY as valid JSON (no markdown) in this exact shape:
{"label":"ACCURATE|INACCURATE|UNCERTAIN","explanation":"...","recommendation":"..."}
- label: ACCURATE if medically correct, INACCURATE if a myth, UNCERTAIN if unclear.
- explanation: 2-3 sentences in ${lang} addressing the claim directly.
- recommendation: One actionable sentence for the health worker.
Base answers on WHO and Uganda MOH guidelines.`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://healthguard.ug',
          'X-Title': 'HealthGuard Uganda',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: `Health claim to verify: "${claim}"` },
          ],
          max_tokens: 350,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        console.warn('OpenRouter error:', response.status, await response.text());
        return null;
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content ?? '';

      // Extract JSON from the response (strip any surrounding markdown)
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return null;

      const parsed = JSON.parse(match[0]);
      if (!parsed.label || !parsed.explanation) return null;

      return {
        label: (['ACCURATE', 'INACCURATE', 'UNCERTAIN'].includes(parsed.label)
          ? parsed.label : 'UNCERTAIN') as ExpertAnalysis['label'],
        explanation: parsed.explanation,
        recommendation: parsed.recommendation ?? 'Follow Uganda Ministry of Health guidelines.',
      };
    } catch (err) {
      console.warn('OpenRouter call failed:', err);
      return null;
    }
  }

  /**
   * Direct call to Pollinations API (free, no API key).
   */
  private static async callPollinations(
    claim: string,
    language: string
  ): Promise<ExpertAnalysis | null> {
    const lang = language === 'lg' ? 'Luganda' : 'English';
    const systemPrompt = `You are a senior medical expert advising Ugandan community health workers.
Analyse the health claim and respond ONLY as valid JSON (no markdown) in this exact shape:
{"label":"ACCURATE|INACCURATE|UNCERTAIN","explanation":"...","recommendation":"..."}
- label: ACCURATE if medically correct, INACCURATE if a myth, UNCERTAIN if unclear.
- explanation: 2-3 sentences in ${lang} addressing the claim directly.
- recommendation: One actionable sentence for the health worker.
Base answers on WHO and Uganda MOH guidelines.`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: `Health claim to verify: "${claim}"` },
          ],
          jsonMode: true
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        return null;
      }

      const raw = await response.text();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return null;

      const parsed = JSON.parse(match[0]);
      if (!parsed.label || !parsed.explanation) return null;

      return {
        label: (['ACCURATE', 'INACCURATE', 'UNCERTAIN'].includes(parsed.label)
          ? parsed.label : 'UNCERTAIN') as ExpertAnalysis['label'],
        explanation: parsed.explanation,
        recommendation: parsed.recommendation ?? 'Follow Uganda Ministry of Health guidelines.',
      };
    } catch (err) {
      console.warn('Pollinations call failed:', err);
      return null;
    }
  }

  /**
   * Always-on local expert using the on-device HybridClassifier + knowledge base.
   */
  private static async simulateLocalExpert(
    claim: string,
    language: string
  ): Promise<ExpertAnalysis | null> {
    const { HybridClassifier } = require('../ai/HybridClassifier');
    const { getResponseForKeyword } = require('../db/Database');

    const classifier = new HybridClassifier();
    const result     = await classifier.classify(claim);
    const evidence   = await getResponseForKeyword(result.triggerKeyword);

    if (evidence) {
      const text = language === 'lg'
        ? (evidence.correct_text_lg || evidence.correct_text_en)
        : evidence.correct_text_en;

      const parts: string[] = [text];
      if (evidence.symptoms)   parts.push(`Symptoms: ${evidence.symptoms}`);
      if (evidence.treatment)  parts.push(`Treatment: ${evidence.treatment}`);

      return {
        label: result.label === 'INACCURATE' ? 'INACCURATE' : result.label as any,
        explanation: parts.join(' | '),
        recommendation: evidence.prevention
          ? `Prevention: ${evidence.prevention}`
          : 'Follow Ministry of Health guidelines. Seek clinical testing to confirm status.',
      };
    }

    return {
      label: 'UNCERTAIN',
      explanation: 'No specific clinical match found in local knowledge base.',
      recommendation: 'Refer the patient to the nearest Regional Referral Hospital.',
    };
  }
}

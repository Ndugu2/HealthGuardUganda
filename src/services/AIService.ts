/**
 * AIService — Cloud Intelligence Layer via OpenRouter
 * Provides access to state-of-the-art LLMs (like Llama 3 Free) 
 * for advanced health claim verification and reasoning.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'meta-llama/llama-3-8b-instruct:free';

export interface ExpertAnalysis {
  label: 'ACCURATE' | 'INACCURATE' | 'UNCERTAIN';
  explanation: string;
  recommendation: string;
}

import { getSetting } from '../db/Database';

export class AIService {
  /**
   * Consults a high-level AI model for an expert opinion on a claim.
   */
  public static async consultExpert(claim: string, language: string = 'en'): Promise<ExpertAnalysis | null> {
    try {
      const apiKey = await getSetting('openrouter_api_key');
      
      if (!apiKey) {
        console.warn('AIService: OpenRouter API key is missing. Expert consultation disabled.');
        return null;
      }

      const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://healthguard-uganda.com', // Optional
          'X-Title': 'HealthGuard Uganda',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a medical verification expert for the Uganda Ministry of Health. 
              Analyze the provided health claim. 
              Output your response in valid JSON format ONLY with the following structure:
              {
                "label": "ACCURATE" | "INACCURATE" | "UNCERTAIN",
                "explanation": "A concise scientific explanation (max 3 sentences)",
                "recommendation": "What the person should do next (e.g., 'Seek immediate care at a health facility')"
              }
              The explanation and recommendation MUST be written in ${language === 'lg' ? 'Luganda (the primary language of central Uganda)' : 'English'}.
              Always prioritize official Ugandan Ministry of Health and WHO guidelines. 
              Be professional, empathetic, and culturally aware of the Ugandan context.`
            },
            {
              role: 'user',
              content: claim
            }
          ]
        })
      });

      if (!response.ok) {
        console.error('OpenRouter API Error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        // Basic JSON extraction in case the model adds prose
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
             return JSON.parse(jsonMatch[0]);
          } catch (e) {
             console.error('Failed to parse expert JSON:', e);
             return null;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('OpenRouter Expert Error:', error);
      return null;
    }
  }
}

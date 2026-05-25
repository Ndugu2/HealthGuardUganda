// src/api/translate.ts
import axios from 'axios';

/**
 * Translate a piece of text to the target language.
 * Uses a placeholder LLM translation endpoint – replace with your actual service.
 * Falls back to the original text if the request fails.
 */
export async function translateText(text: string, targetLang: string = 'en'): Promise<string> {
  try {
    const response = await axios.post('https://api.example.com/translate', {
      source: text,
      targetLanguage: targetLang,
    });
    return response.data.translation as string;
  } catch (e) {
    console.warn('Translation failed, returning original text', e);
    return text;
  }
}

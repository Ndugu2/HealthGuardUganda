// src/api/faq.ts
import axios from 'axios';

/**
 * Calls a language model (or LLM endpoint) to generate a concise health FAQ answer.
 * This is a stub that hits a placeholder endpoint; replace with your actual LLM service.
 */
export async function getFaqAnswer(question: string, lang: string = 'en'): Promise<string> {
  const response = await axios.post('https://api.example.com/health-faq', {
    prompt: question,
    language: lang,
  });
  return response.data.answer as string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * Returns a static list of FAQ items. Replace with actual API call when available.
 */
export async function fetchFAQs(): Promise<FAQItem[]> {
  return [
    { id: '1', question: 'What is malaria?', answer: 'Malaria is a mosquito‑borne disease causing fever and chills.' },
    { id: '2', question: 'How to prevent COVID‑1?', answer: 'Wear masks, wash hands regularly, and get vaccinated.' },
    { id: '3', question: 'What are symptoms of dengue?', answer: 'High fever, severe headache, pain behind the eyes, joint and muscle pain.' },
  ];
}

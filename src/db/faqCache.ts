// src/db/faqCache.ts
import { openDatabase } from './sqlite';

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export async function saveFAQItems(items: FAQItem[]): Promise<void> {
  const db = await openDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS faq_cache (id INTEGER PRIMARY KEY, question TEXT, answer TEXT)');
  for (const item of items) {
    await db.runAsync('INSERT OR REPLACE INTO faq_cache (id, question, answer) VALUES (?, ?, ?)', [item.id, item.question, item.answer]);
  }
}

export async function getFAQByQuestion(question: string): Promise<FAQItem | undefined> {
  const db = await openDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS faq_cache (id INTEGER PRIMARY KEY, question TEXT, answer TEXT)');
  const rows = await db.getAllAsync<FAQItem>('SELECT * FROM faq_cache WHERE question = ?', question);
  return rows[0];
}

export async function getAllFAQs(): Promise<FAQItem[]> {
  const db = await openDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS faq_cache (id INTEGER PRIMARY KEY, question TEXT, answer TEXT)');
  const rows = await db.getAllAsync<FAQItem>('SELECT * FROM faq_cache');
  return rows;
}

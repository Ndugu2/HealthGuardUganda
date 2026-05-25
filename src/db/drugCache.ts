// src/db/drugCache.ts (updated)
import { openDatabase } from './sqlite';

export interface DrugInfo {
  id: number;
  name: string;
  description: string;
  safetyInfo: string;
}

export async function saveDrugInfo(drugs: DrugInfo[]): Promise<void> {
  const db = await openDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS drug_cache (id INTEGER PRIMARY KEY, name TEXT, description TEXT, safetyInfo TEXT)');
  for (const d of drugs) {
    await db.runAsync('INSERT OR REPLACE INTO drug_cache (id, name, description, safetyInfo) VALUES (?, ?, ?, ?)', [d.id, d.name, d.description, d.safetyInfo]);
  }
}

export async function getDrugInfoByName(name: string): Promise<DrugInfo | undefined> {
  const db = await openDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS drug_cache (id INTEGER PRIMARY KEY, name TEXT, description TEXT, safetyInfo TEXT)');
  const rows = await db.getAllAsync<DrugInfo>('SELECT * FROM drug_cache WHERE name = ?', name);
  return rows[0];
}

/**
 * Retrieve all drug entries from the cache.
 */
export async function getAllDrugs(): Promise<DrugInfo[]> {
  const db = await openDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS drug_cache (id INTEGER PRIMARY KEY, name TEXT, description TEXT, safetyInfo TEXT)');
  const rows = await db.getAllAsync<DrugInfo>('SELECT * FROM drug_cache');
  return rows;
}

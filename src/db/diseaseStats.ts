// src/db/diseaseStats.ts
import { openDatabase } from './sqlite';

export interface DiseaseStat {
  id: string;
  title: string;
  description: string;
  reportedAt: string; // ISO date string
  severity?: string;
}

export async function saveDiseaseStats(stats: DiseaseStat[]): Promise<void> {
  const db = await openDatabase();
  await db.execAsync(`CREATE TABLE IF NOT EXISTS disease_stats (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    reportedAt TEXT,
    severity TEXT
  )`);
  for (const s of stats) {
    await db.runAsync(
      `INSERT OR REPLACE INTO disease_stats (id, title, description, reportedAt, severity) VALUES (?, ?, ?, ?, ?)`,
      [s.id, s.title, s.description, s.reportedAt, s.severity ?? null]
    );
  }
}

export async function getDiseaseStats(): Promise<DiseaseStat[]> {
  const db = await openDatabase();
  await db.execAsync(`CREATE TABLE IF NOT EXISTS disease_stats (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    reportedAt TEXT,
    severity TEXT
  )`);
  const rows = await db.getAllAsync<DiseaseStat>('SELECT * FROM disease_stats ORDER BY reportedAt DESC');
  return rows;
}

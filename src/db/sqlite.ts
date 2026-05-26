import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { KnowledgeItem, ClaimRecord, Facility, Broadcast, PatientRecord, MythBusterItem, AilmentGuide, MaternalRecord, ChildRecord, InventoryItem } from './types';

const DB_NAME = 'healthguard.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

const INITIAL_MOCK_PATIENTS: PatientRecord[] = [
  { id: 1, name: 'Nakato Sarah', age: 28, gender: 'F', village: 'Nakawa', symptoms: 'High fever, headache, body aches', status: 'waiting', priority: 'high', screenedDate: 'Today, 09:15' },
  { id: 2, name: 'Okello James', age: 45, gender: 'M', village: 'Kisenyi', symptoms: 'Persistent cough, weight loss', status: 'in-progress', priority: 'critical', screenedDate: 'Today, 08:30' },
  { id: 3, name: 'Auma Grace', age: 32, gender: 'F', village: 'Bwaise', symptoms: 'Prenatal checkup — 7 months', status: 'completed', priority: 'medium', screenedDate: 'Today, 07:45' },
  { id: 4, name: 'Mugisha David', age: 5, gender: 'M', village: 'Nakawa', symptoms: 'Diarrhea, vomiting since 2 days', status: 'referred', priority: 'high', screenedDate: 'Yesterday', referredTo: 'Mulago Hospital' },
  { id: 5, name: 'Nambi Ruth', age: 22, gender: 'F', village: 'Kawempe', symptoms: 'Skin rash, itching', status: 'follow-up', priority: 'low', screenedDate: '18 May', followUpDate: '25 May 2026' },
  { id: 6, name: 'Ssekandi Moses', age: 60, gender: 'M', village: 'Makindye', symptoms: 'Chest pains, shortness of breath', status: 'referred', priority: 'critical', screenedDate: '17 May', referredTo: 'Nsambya Hospital' },
  { id: 7, name: 'Babirye Esther', age: 19, gender: 'F', village: 'Rubaga', symptoms: 'Missed period, nausea', status: 'completed', priority: 'medium', screenedDate: '16 May' },
  { id: 8, name: 'Kato Brian', age: 8, gender: 'M', village: 'Nakawa', symptoms: 'Malaria (confirmed RDT+)', status: 'follow-up', priority: 'medium', screenedDate: '15 May', followUpDate: '22 May 2026' },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 1, name: 'Coartem (Artemether/Lumefantrine)', quantity: 150, unit: 'doses', minimumThreshold: 50, lastUpdated: new Date().toISOString() },
  { id: 2, name: 'Paracetamol 500mg', quantity: 500, unit: 'tablets', minimumThreshold: 100, lastUpdated: new Date().toISOString() },
  { id: 3, name: 'Amoxicillin 250mg', quantity: 40, unit: 'capsules', minimumThreshold: 100, lastUpdated: new Date().toISOString() },
  { id: 4, name: 'ORS Sachets', quantity: 200, unit: 'sachets', minimumThreshold: 50, lastUpdated: new Date().toISOString() },
];

const WebStore = {
  async init(): Promise<void> {
    const hasSeeded = localStorage.getItem('knowledge_seeded_v75');
    if (!hasSeeded) {
      try {
        const localData = require('./knowledge_base.json');
        if (Array.isArray(localData)) {
          localStorage.setItem('healthguard_knowledge', JSON.stringify(localData));
          localStorage.setItem('knowledge_seeded_v75', 'true');
        }
      } catch (e) {
        console.error('Web seed knowledge failed', e);
      }
    }
    const facilitiesRaw = localStorage.getItem('healthguard_facilities');
    if (!facilitiesRaw) {
      try {
        const seed = require('./facilities_seed.json') as Facility[];
        localStorage.setItem('healthguard_facilities', JSON.stringify(seed));
      } catch (e) {
        console.error('Web seed facilities failed', e);
      }
    }
    const patientsRaw = localStorage.getItem('healthguard_patients');
    if (!patientsRaw) {
      localStorage.setItem('healthguard_patients', JSON.stringify(INITIAL_MOCK_PATIENTS));
    }
    const inventoryRaw = localStorage.getItem('healthguard_inventory');
    if (!inventoryRaw) {
      localStorage.setItem('healthguard_inventory', JSON.stringify(INITIAL_INVENTORY));
    }
    console.log('[Database] Web localStorage initialized');
  },

  async saveEncounter(
    claim: string,
    label: string,
    confidence: number,
    location: string,
    lat?: number,
    lng?: number
  ): Promise<number> {
    const existing = JSON.parse(localStorage.getItem('healthguard_claims') || '[]');
    const id = Date.now();
    const newItem: ClaimRecord = {
      id,
      claim_text: claim,
      label,
      confidence_pct: confidence * 100,
      location_note: location,
      latitude: lat,
      longitude: lng,
      submitted_at: new Date().toISOString(),
      flagged: false,
    };
    existing.unshift(newItem);
    localStorage.setItem('healthguard_claims', JSON.stringify(existing));
    return id;
  },

  async updateEncounterFeedback(id: number, actualLabel: string): Promise<void> {
    const existing = JSON.parse(localStorage.getItem('healthguard_claims') || '[]');
    const updated = existing.map((c: any) => c.id === id ? { ...c, actual_label: actualLabel } : c);
    localStorage.setItem('healthguard_claims', JSON.stringify(updated));
  },

  async getAllClaims(): Promise<ClaimRecord[]> {
    const existing = JSON.parse(localStorage.getItem('healthguard_claims') || '[]');
    return existing;
  },

  async getStats(): Promise<{ total: number; accurate: number; misinfo: number }> {
    const claims = JSON.parse(localStorage.getItem('healthguard_claims') || '[]');
    const accurate = claims.filter((c: any) => c.label === 'ACCURATE').length;
    const misinfo = claims.filter((c: any) => c.label === 'INACCURATE').length;
    return {
      total: claims.length,
      accurate,
      misinfo,
    };
  },

  async searchKnowledge(query: string): Promise<KnowledgeItem[]> {
    const knowledge = JSON.parse(localStorage.getItem('healthguard_knowledge') || '[]');
    const q = query.trim().toLowerCase();
    if (!q) {
      return knowledge;
    }
    return knowledge.filter((k: any) => {
      const topicMatch = k.topic && String(k.topic).toLowerCase().includes(q);
      const mythMatch = k.myth_text_en && String(k.myth_text_en).toLowerCase().includes(q);
      const correctMatch = k.correct_text_en && String(k.correct_text_en).toLowerCase().includes(q);
      const keywordMatch = k.keyword && String(k.keyword).toLowerCase().includes(q);
      return topicMatch || mythMatch || correctMatch || keywordMatch;
    }).map(normalizeKnowledgeInput);
  },

  async saveKnowledge(items: Record<string, unknown>[]): Promise<boolean> {
    localStorage.setItem('healthguard_knowledge', JSON.stringify(items));
    return true;
  },

  async getResponseForKeyword(keyword: string | null): Promise<KnowledgeItem | null> {
    if (!keyword) return null;
    const knowledge = JSON.parse(localStorage.getItem('healthguard_knowledge') || '[]');
    const parts = keyword.split(':', 2);
    const topic = parts[0];
    const kw = parts.length > 1 ? parts[1] : '';

    let match = knowledge.find((k: any) => k.keyword === keyword);
    if (!match && topic) {
      match = knowledge.find((k: any) => k.topic === topic && k.keyword === kw);
    }
    if (!match && topic) {
      match = knowledge.find((k: any) => k.topic === topic && (k.keyword === `${topic}:general` || k.keyword === 'general'));
    }
    return match ? normalizeKnowledgeInput(match) : null;
  },

  async flagClaim(id: number): Promise<void> {
    const existing = JSON.parse(localStorage.getItem('healthguard_claims') || '[]');
    const updated = existing.map((c: any) => c.id === id ? { ...c, flagged: true } : c);
    localStorage.setItem('healthguard_claims', JSON.stringify(updated));
  },

  async saveSession(token: string, userData: string): Promise<void> {
    localStorage.setItem('healthguard_session', JSON.stringify({ token, user_data: userData }));
  },

  async getSession(): Promise<{ token: string; user_data: string } | null> {
    const raw = localStorage.getItem('healthguard_session');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    localStorage.removeItem('healthguard_session');
  },

  async getAllFacilities(): Promise<Facility[]> {
    const facilities = JSON.parse(localStorage.getItem('healthguard_facilities') || '[]');
    if (facilities.length === 0) {
      try {
        const seed = require('./facilities_seed.json') as Facility[];
        localStorage.setItem('healthguard_facilities', JSON.stringify(seed));
        return seed;
      } catch (_) {}
    }
    return facilities;
  },

  async saveBroadcast(broadcast: Omit<Broadcast, 'id'>): Promise<void> {
    const existing = JSON.parse(localStorage.getItem('healthguard_broadcasts') || '[]');
    const newItem = { ...broadcast, id: Date.now() };
    existing.unshift(newItem);
    localStorage.setItem('healthguard_broadcasts', JSON.stringify(existing));
  },

  async getBroadcasts(): Promise<Broadcast[]> {
    const existing = JSON.parse(localStorage.getItem('healthguard_broadcasts') || '[]');
    return existing;
  },

  async saveSetting(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  },

  async getSetting(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },

  async getPatients(): Promise<PatientRecord[]> {
    const raw = localStorage.getItem('healthguard_patients');
    if (!raw) {
      localStorage.setItem('healthguard_patients', JSON.stringify(INITIAL_MOCK_PATIENTS));
      return [...INITIAL_MOCK_PATIENTS];
    }
    try {
      return JSON.parse(raw);
    } catch (_) {
      return [...INITIAL_MOCK_PATIENTS];
    }
  },

  async addPatient(patient: Omit<PatientRecord, 'id' | 'screenedDate'>): Promise<PatientRecord> {
    const existing = JSON.parse(localStorage.getItem('healthguard_patients') || '[]');
    const id = Date.now();
    const screenedDate = 'Today, ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const newPatient: PatientRecord = { ...patient, id, screenedDate };
    existing.unshift(newPatient);
    localStorage.setItem('healthguard_patients', JSON.stringify(existing));
    return newPatient;
  },

  async updatePatientStatus(
    id: number,
    status: PatientRecord['status'],
    extra?: { referredTo?: string; followUpDate?: string }
  ): Promise<boolean> {
    const existing = JSON.parse(localStorage.getItem('healthguard_patients') || '[]');
    let found = false;
    const updated = existing.map((p: any) => {
      if (p.id === id) {
        found = true;
        return {
          ...p,
          status,
          referredTo: extra?.referredTo ?? p.referredTo,
          followUpDate: extra?.followUpDate ?? p.followUpDate,
        };
      }
      return p;
    });
    if (found) {
      localStorage.setItem('healthguard_patients', JSON.stringify(updated));
    }
    return found;
  },

  async saveRegisteredUser(phone: string, password: string, user: Record<string, unknown>): Promise<void> {
    localStorage.setItem(`healthguard_user_${phone}`, JSON.stringify({ password, user }));
  },

  async getRegisteredUser(phone: string): Promise<{ password: string; user: Record<string, unknown> } | null> {
    const raw = localStorage.getItem(`healthguard_user_${phone}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  },

  async getAllRegisteredUsers(): Promise<Record<string, unknown>[]> {
    const users: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('healthguard_user_') && key !== 'healthguard_user_registry') {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (data.user) {
              users.push(data.user);
            }
          } catch (_) {}
        }
      }
    }
    return users;
  },

  async loadLocalWeights(): Promise<string | null> {
    return localStorage.getItem('healthguard_model_v3');
  },

  async saveLocalWeights(weightsJson: string): Promise<void> {
    localStorage.setItem('healthguard_model_v3', weightsJson);
  },

  async getMaternalRecords(): Promise<MaternalRecord[]> {
    const raw = localStorage.getItem('healthguard_maternal_records');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (_) { return []; }
  },

  async saveMaternalRecord(r: MaternalRecord): Promise<number> {
    const existing = await this.getMaternalRecords();
    const idx = existing.findIndex(x => x.id === r.id);
    if (idx >= 0) {
      existing[idx] = r;
    } else {
      existing.unshift(r);
    }
    localStorage.setItem('healthguard_maternal_records', JSON.stringify(existing));
    return r.id;
  },

  async deleteMaternalRecord(id: number): Promise<void> {
    const existing = await this.getMaternalRecords();
    const filtered = existing.filter(x => x.id !== id);
    localStorage.setItem('healthguard_maternal_records', JSON.stringify(filtered));
  },

  async getChildRecords(): Promise<ChildRecord[]> {
    const raw = localStorage.getItem('healthguard_child_records');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (_) { return []; }
  },

  async saveChildRecord(c: ChildRecord): Promise<number> {
    const existing = await this.getChildRecords();
    const idx = existing.findIndex(x => x.id === c.id);
    if (idx >= 0) {
      existing[idx] = c;
    } else {
      existing.unshift(c);
    }
    localStorage.setItem('healthguard_child_records', JSON.stringify(existing));
    return c.id;
  },

  async deleteChildRecord(id: number): Promise<void> {
    const existing = await this.getChildRecords();
    const filtered = existing.filter(x => x.id !== id);
    localStorage.setItem('healthguard_child_records', JSON.stringify(filtered));
  },

  async getAilmentGuides(): Promise<AilmentGuide[]> {
    const raw = localStorage.getItem('healthguard_ailments');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (_) { return []; }
  },

  async saveAilmentGuides(guides: AilmentGuide[]): Promise<void> {
    localStorage.setItem('healthguard_ailments', JSON.stringify(guides));
  },

  async getInventory(): Promise<InventoryItem[]> {
    const raw = localStorage.getItem('healthguard_inventory');
    if (!raw) return [...INITIAL_INVENTORY];
    try { return JSON.parse(raw); } catch (_) { return [...INITIAL_INVENTORY]; }
  },

  async addInventoryItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> {
    const existing = await this.getInventory();
    const newItem: InventoryItem = { ...item, id: Date.now(), lastUpdated: new Date().toISOString() };
    existing.push(newItem);
    localStorage.setItem('healthguard_inventory', JSON.stringify(existing));
    return newItem;
  },

  async deductInventory(id: number, amount: number): Promise<boolean> {
    const existing = await this.getInventory();
    let found = false;
    const updated = existing.map(x => {
      if (x.id === id) {
        found = true;
        return { ...x, quantity: Math.max(0, x.quantity - amount), lastUpdated: new Date().toISOString() };
      }
      return x;
    });
    if (found) localStorage.setItem('healthguard_inventory', JSON.stringify(updated));
    return found;
  },

  async addInventoryStock(id: number, amount: number): Promise<boolean> {
    const existing = await this.getInventory();
    let found = false;
    const updated = existing.map(x => {
      if (x.id === id) {
        found = true;
        return { ...x, quantity: x.quantity + amount, lastUpdated: new Date().toISOString() };
      }
      return x;
    });
    if (found) localStorage.setItem('healthguard_inventory', JSON.stringify(updated));
    return found;
  }
};


export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

// Export a wrapper for compatibility with modules expecting openDatabase
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  return getDb();
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_text TEXT NOT NULL,
  label TEXT NOT NULL,
  actual_label TEXT,
  confidence_pct REAL NOT NULL,
  location_note TEXT,
  latitude REAL,
  longitude REAL,
  submitted_at TEXT NOT NULL,
  flagged INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS knowledge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  keyword TEXT,
  myth_text_en TEXT,
  correct_text_en TEXT NOT NULL,
  correct_text_lg TEXT,
  detailed_guidance_en TEXT,
  detailed_guidance_lg TEXT,
  symptoms TEXT,
  prevention TEXT,
  treatment TEXT,
  source TEXT
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS session (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  token TEXT,
  user_data TEXT
);
CREATE TABLE IF NOT EXISTS facilities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  contact TEXT
);
CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  title_lg TEXT,
  message TEXT NOT NULL,
  message_lg TEXT,
  severity TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  isRead INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  village TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  screenedDate TEXT NOT NULL,
  followUpDate TEXT,
  referredTo TEXT
);
CREATE TABLE IF NOT EXISTS registered_users (
  phone TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  user_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS myths (
  id INTEGER PRIMARY KEY,
  claim TEXT NOT NULL,
  claim_lg TEXT,
  verdict TEXT NOT NULL,
  explanation TEXT NOT NULL,
  explanation_lg TEXT,
  source TEXT NOT NULL,
  time TEXT NOT NULL,
  icon TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ailments (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  title_lg TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  steps_lg_json TEXT
);
CREATE TABLE IF NOT EXISTS maternal_records (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  lastMenstrualPeriod TEXT NOT NULL,
  expectedDeliveryDate TEXT NOT NULL,
  ancVisitsJson TEXT NOT NULL,
  nextAncDate TEXT,
  highRiskFactors TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS child_records (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  birthDate TEXT NOT NULL,
  gender TEXT NOT NULL,
  immunizationsJson TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  minimumThreshold INTEGER NOT NULL,
  lastUpdated TEXT NOT NULL
);
`;

function mapKnowledgeRow(row: Record<string, unknown>): KnowledgeItem {
  return {
    id: Number(row.id) || 0,
    topic: String(row.topic),
    keyword: String(row.keyword || ''),
    myth_text_en: row.myth_text_en != null ? String(row.myth_text_en) : null,
    correct_text_en: String(row.correct_text_en),
    correct_text_lg: row.correct_text_lg != null ? String(row.correct_text_lg) : null,
    detailed_guidance_en: row.detailed_guidance_en != null ? String(row.detailed_guidance_en) : null,
    detailed_guidance_lg: row.detailed_guidance_lg != null ? String(row.detailed_guidance_lg) : null,
    symptoms: row.symptoms != null ? String(row.symptoms) : null,
    prevention: row.prevention != null ? String(row.prevention) : null,
    treatment: row.treatment != null ? String(row.treatment) : null,
    source: String(row.source || 'MOH Uganda'),
  };
}

function normalizeKnowledgeInput(item: Record<string, unknown>): KnowledgeItem {
  return {
    id: Number(item.id) || 0,
    topic: String(item.topic),
    keyword: String(item.keyword || ''),
    myth_text_en: (item.mythTextEn ?? item.myth_text_en ?? null) as string | null,
    correct_text_en: String(item.correctTextEn ?? item.correct_text_en ?? ''),
    correct_text_lg: (item.correctTextLg ?? item.correct_text_lg ?? null) as string | null,
    detailed_guidance_en: (item.detailedGuidanceEn ?? item.detailed_guidance_en ?? null) as string | null,
    detailed_guidance_lg: (item.detailedGuidanceLg ?? item.detailed_guidance_lg ?? null) as string | null,
    symptoms: (item.symptoms ?? null) as string | null,
    prevention: (item.prevention ?? null) as string | null,
    treatment: (item.treatment ?? null) as string | null,
    source: String(item.source || 'MOH Uganda'),
  };
}

async function migrateFromLocalStorage(db: SQLite.SQLiteDatabase): Promise<void> {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  const done = await getSetting('ls_migration_v1');
  if (done === 'true') return;

  const insertClaims = async (raw: string | null) => {
    if (!raw) return;
    try {
      const items = JSON.parse(raw) as Record<string, unknown>[];
      for (const c of items) {
        await db.runAsync(
          `INSERT INTO claims (id, claim_text, label, confidence_pct, location_note, latitude, longitude, submitted_at, flagged)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            Number(c.id ?? Date.now()),
            String(c.claim_text ?? ''),
            String(c.label ?? 'UNCERTAIN'),
            Number(c.confidence_pct ?? 0),
            String(c.location_note ?? ''),
            c.latitude != null ? Number(c.latitude) : null,
            c.longitude != null ? Number(c.longitude) : null,
            String(c.submitted_at ?? new Date().toISOString()),
            c.flagged ? 1 : 0,
          ]
        );
      }
    } catch (_) {}
  };

  await insertClaims(localStorage.getItem('healthguard_claims'));

  const knowledgeRaw = localStorage.getItem('healthguard_knowledge');
  if (knowledgeRaw) {
    try {
      const items = JSON.parse(knowledgeRaw) as Record<string, unknown>[];
      await db.runAsync('DELETE FROM knowledge');
      for (const item of items) {
        const k = normalizeKnowledgeInput(item);
        await insertKnowledgeRow(db, k);
      }
    } catch (_) {}
  }

  const sessionRaw = localStorage.getItem('healthguard_session');
  if (sessionRaw) {
    try {
      const s = JSON.parse(sessionRaw) as { token: string; user_data: string };
      await db.runAsync(
        'INSERT OR REPLACE INTO session (id, token, user_data) VALUES (1, ?, ?)',
        [s.token, s.user_data]
      );
    } catch (_) {}
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('healthguard_user_') && key !== 'healthguard_user_registry') {
      const phone = key.replace('healthguard_user_', '');
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '{}') as {
          password: string;
          user: Record<string, unknown>;
        };
        await db.runAsync(
          'INSERT OR REPLACE INTO registered_users (phone, password, user_json) VALUES (?, ?, ?)',
          [phone, stored.password, JSON.stringify(stored.user)]
        );
      } catch (_) {}
    }
    if (!key.startsWith('healthguard_') && key !== 'knowledge_seeded_v75') {
      const val = localStorage.getItem(key);
      if (val != null) {
        await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, val]);
      }
    }
  }

  const patientsRaw = localStorage.getItem('healthguard_patients');
  if (patientsRaw) {
    try {
      const patients = JSON.parse(patientsRaw) as PatientRecord[];
      for (const p of patients) {
        await upsertPatient(db, p);
      }
    } catch (_) {}
  }

  await saveSetting('ls_migration_v1', 'true');
  console.log('[Database] Migrated legacy localStorage data into SQLite');
}

async function insertKnowledgeRow(db: SQLite.SQLiteDatabase, k: KnowledgeItem): Promise<void> {
  await db.runAsync(
    `INSERT INTO knowledge (topic, keyword, myth_text_en, correct_text_en, correct_text_lg,
      detailed_guidance_en, detailed_guidance_lg, symptoms, prevention, treatment, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      k.topic,
      k.keyword,
      k.myth_text_en,
      k.correct_text_en,
      k.correct_text_lg,
      k.detailed_guidance_en ?? null,
      k.detailed_guidance_lg ?? null,
      k.symptoms ?? null,
      k.prevention ?? null,
      k.treatment ?? null,
      k.source,
    ]
  );
}

export async function initSqlite(): Promise<void> {
  if (Platform.OS === 'web') return WebStore.init();
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const db = await getDb();
    await db.execAsync(SCHEMA);
    await migrateFromLocalStorage(db);
    const facilityCount = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM facilities');
    if (!facilityCount?.c) {
      const seed = require('./facilities_seed.json') as Facility[];
      for (const f of seed) {
        await db.runAsync(
          'INSERT OR REPLACE INTO facilities (id, name, type, latitude, longitude, contact) VALUES (?, ?, ?, ?, ?, ?)',
          [f.id, f.name, f.type, f.latitude, f.longitude, f.contact]
        );
      }
    }
    console.log('[Database] SQLite ready');
  })();
  return initPromise;
}

export async function saveEncounter(
  claim: string,
  label: string,
  confidence: number,
  location: string,
  lat?: number,
  lng?: number
): Promise<number> {
  if (Platform.OS === 'web') return WebStore.saveEncounter(claim, label, confidence, location, lat, lng);
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO claims (claim_text, label, confidence_pct, location_note, latitude, longitude, submitted_at, flagged)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [claim, label, confidence * 100, location, lat ?? null, lng ?? null, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function updateEncounterFeedback(id: number, actualLabel: string): Promise<void> {
  if (Platform.OS === 'web') return WebStore.updateEncounterFeedback(id, actualLabel);
  const db = await getDb();
  await db.runAsync('UPDATE claims SET actual_label = ? WHERE id = ?', [actualLabel, id]);
}

export async function getAllClaims(): Promise<ClaimRecord[]> {
  if (Platform.OS === 'web') return WebStore.getAllClaims();
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM claims ORDER BY submitted_at DESC'
  );
  return rows.map((r) => ({
    id: Number(r.id),
    claim_text: String(r.claim_text),
    label: String(r.label),
    actual_label: r.actual_label != null ? String(r.actual_label) : undefined,
    confidence_pct: Number(r.confidence_pct),
    location_note: String(r.location_note || ''),
    latitude: r.latitude != null ? Number(r.latitude) : undefined,
    longitude: r.longitude != null ? Number(r.longitude) : undefined,
    submitted_at: String(r.submitted_at),
    flagged: Boolean(r.flagged),
  }));
}

export async function getStats(): Promise<{ total: number; accurate: number; misinfo: number }> {
  if (Platform.OS === 'web') return WebStore.getStats();
  const db = await getDb();
  const total = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM claims');
  const accurate = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM claims WHERE label = 'ACCURATE'`
  );
  const misinfo = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM claims WHERE label = 'INACCURATE'`
  );
  return {
    total: total?.c ?? 0,
    accurate: accurate?.c ?? 0,
    misinfo: misinfo?.c ?? 0,
  };
}

export async function searchKnowledge(query: string): Promise<KnowledgeItem[]> {
  if (Platform.OS === 'web') return WebStore.searchKnowledge(query);
  const db = await getDb();
  const q = query.trim().toLowerCase();
  let rows: Record<string, unknown>[];
  if (!q) {
    rows = await db.getAllAsync('SELECT * FROM knowledge ORDER BY topic');
  } else {
    rows = await db.getAllAsync(
      `SELECT * FROM knowledge WHERE
        LOWER(topic) LIKE ? OR LOWER(IFNULL(myth_text_en,'')) LIKE ?
        OR LOWER(correct_text_en) LIKE ? OR LOWER(IFNULL(keyword,'')) LIKE ?`,
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
    );
  }
  return rows.map(mapKnowledgeRow);
}

export async function saveKnowledge(items: Record<string, unknown>[]): Promise<boolean> {
  if (Platform.OS === 'web') return WebStore.saveKnowledge(items);
  const db = await getDb();
  await db.runAsync('DELETE FROM knowledge');
  for (const item of items) {
    await insertKnowledgeRow(db, normalizeKnowledgeInput(item));
  }
  return true;
}

export async function getResponseForKeyword(keyword: string | null): Promise<KnowledgeItem | null> {
  if (Platform.OS === 'web') return WebStore.getResponseForKeyword(keyword);
  if (!keyword) return null;
  const db = await getDb();
  const parts = keyword.split(':', 2);
  const topic = parts[0];
  const kw = parts.length > 1 ? parts[1] : '';

  let row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM knowledge WHERE keyword = ? LIMIT 1',
    [keyword]
  );
  if (!row && topic) {
    row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM knowledge WHERE topic = ? AND keyword = ? LIMIT 1',
      [topic, kw]
    );
  }
  if (!row && topic) {
    row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM knowledge WHERE topic = ? AND (keyword = ? OR keyword = 'general') LIMIT 1`,
      [topic, `${topic}:general`]
    );
  }
  return row ? mapKnowledgeRow(row) : null;
}

export async function flagClaim(id: number): Promise<void> {
  if (Platform.OS === 'web') return WebStore.flagClaim(id);
  const db = await getDb();
  await db.runAsync('UPDATE claims SET flagged = 1 WHERE id = ?', [id]);
}

export async function saveSession(token: string, userData: string): Promise<void> {
  if (Platform.OS === 'web') return WebStore.saveSession(token, userData);
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO session (id, token, user_data) VALUES (1, ?, ?)', [
    token,
    userData,
  ]);
}

export async function getSession(): Promise<{ token: string; user_data: string } | null> {
  if (Platform.OS === 'web') return WebStore.getSession();
  const db = await getDb();
  const row = await db.getFirstAsync<{ token: string; user_data: string }>(
    'SELECT token, user_data FROM session WHERE id = 1'
  );
  if (!row?.token) return null;
  return row;
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === 'web') return WebStore.clearSession();
  const db = await getDb();
  await db.runAsync('DELETE FROM session WHERE id = 1');
}

export async function getAllFacilities(): Promise<Facility[]> {
  if (Platform.OS === 'web') return WebStore.getAllFacilities();
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM facilities ORDER BY name');
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    type: String(r.type || ''),
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    contact: String(r.contact || ''),
  }));
}

export async function saveBroadcast(broadcast: Omit<Broadcast, 'id'>): Promise<void> {
  if (Platform.OS === 'web') return WebStore.saveBroadcast(broadcast);
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO broadcasts (title, title_lg, message, message_lg, severity, timestamp, isRead)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      broadcast.title,
      broadcast.title_lg ?? null,
      broadcast.message,
      broadcast.message_lg ?? null,
      broadcast.severity,
      broadcast.timestamp,
      broadcast.isRead ? 1 : 0,
    ]
  );
}

export async function getBroadcasts(): Promise<Broadcast[]> {
  if (Platform.OS === 'web') return WebStore.getBroadcasts();
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM broadcasts ORDER BY timestamp DESC'
  );
  return rows.map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    title_lg: r.title_lg != null ? String(r.title_lg) : undefined,
    message: String(r.message),
    message_lg: r.message_lg != null ? String(r.message_lg) : undefined,
    severity: r.severity as Broadcast['severity'],
    timestamp: String(r.timestamp),
    isRead: Boolean(r.isRead),
  }));
}

export async function saveSetting(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') return WebStore.saveSetting(key, value);
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

export async function getSetting(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return WebStore.getSetting(key);
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

// Initial mock patients moved to the top of the file

async function upsertPatient(db: SQLite.SQLiteDatabase, p: PatientRecord): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO patients (id, name, age, gender, village, symptoms, status, priority, screenedDate, followUpDate, referredTo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.id,
      p.name,
      p.age,
      p.gender,
      p.village,
      p.symptoms,
      p.status,
      p.priority,
      p.screenedDate,
      p.followUpDate ?? null,
      p.referredTo ?? null,
    ]
  );
}

export async function getPatients(): Promise<PatientRecord[]> {
  if (Platform.OS === 'web') return WebStore.getPatients();
  const db = await getDb();
  const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM patients');
  if (!count?.c) {
    for (const p of INITIAL_MOCK_PATIENTS) {
      await upsertPatient(db, p);
    }
    await saveSetting('patients_seeded_v1', 'true');
    return [...INITIAL_MOCK_PATIENTS];
  }
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM patients ORDER BY id DESC'
  );
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    age: Number(r.age),
    gender: String(r.gender),
    village: String(r.village),
    symptoms: String(r.symptoms),
    status: r.status as PatientRecord['status'],
    priority: r.priority as PatientRecord['priority'],
    screenedDate: String(r.screenedDate),
    followUpDate: r.followUpDate != null ? String(r.followUpDate) : undefined,
    referredTo: r.referredTo != null ? String(r.referredTo) : undefined,
  }));
}

export async function addPatient(
  patient: Omit<PatientRecord, 'id' | 'screenedDate'>
): Promise<PatientRecord> {
  if (Platform.OS === 'web') return WebStore.addPatient(patient);
  const db = await getDb();
  const id = Date.now();
  const screenedDate =
    'Today, ' +
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const newPatient: PatientRecord = { ...patient, id, screenedDate };
  await upsertPatient(db, newPatient);
  return newPatient;
}

export async function updatePatientStatus(
  id: number,
  status: PatientRecord['status'],
  extra?: { referredTo?: string; followUpDate?: string }
): Promise<boolean> {
  if (Platform.OS === 'web') return WebStore.updatePatientStatus(id, status, extra);
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT id FROM patients WHERE id = ?', [id]);
  if (!row) return false;
  await db.runAsync(
    `UPDATE patients SET status = ?,
      referredTo = COALESCE(?, referredTo),
      followUpDate = COALESCE(?, followUpDate)
     WHERE id = ?`,
    [status, extra?.referredTo ?? null, extra?.followUpDate ?? null, id]
  );
  return true;
}

export async function saveRegisteredUser(
  phone: string,
  password: string,
  user: Record<string, unknown>
): Promise<void> {
  if (Platform.OS === 'web') return WebStore.saveRegisteredUser(phone, password, user);
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO registered_users (phone, password, user_json) VALUES (?, ?, ?)',
    [phone, password, JSON.stringify(user)]
  );
}

export async function getRegisteredUser(
  phone: string
): Promise<{ password: string; user: Record<string, unknown> } | null> {
  if (Platform.OS === 'web') return WebStore.getRegisteredUser(phone);
  const db = await getDb();
  const row = await db.getFirstAsync<{ password: string; user_json: string }>(
    'SELECT password, user_json FROM registered_users WHERE phone = ?',
    [phone]
  );
  if (!row) return null;
  return { password: row.password, user: JSON.parse(row.user_json) };
}

export async function getAllRegisteredUsers(): Promise<Record<string, unknown>[]> {
  if (Platform.OS === 'web') return WebStore.getAllRegisteredUsers();
  const db = await getDb();
  const rows = await db.getAllAsync<{ user_json: string }>(
    'SELECT user_json FROM registered_users'
  );
  return rows.map((r) => JSON.parse(r.user_json));
}

export async function updateRegisteredUserApproval(phone: string, approved: boolean): Promise<boolean> {
  if (Platform.OS === 'web') {
    const stored = await WebStore.getRegisteredUser(phone);
    if (!stored) return false;
    const user = stored.user as Record<string, unknown>;
    user.approved = approved;
    await WebStore.saveRegisteredUser(phone, stored.password, user);
    return true;
  }
  const stored = await getRegisteredUser(phone);
  if (!stored) return false;
  const user = stored.user as Record<string, unknown>;
  user.approved = approved;
  await saveRegisteredUser(phone, stored.password, user);
  return true;
}

export async function loadLocalWeights(): Promise<string | null> {
  if (Platform.OS === 'web') return WebStore.loadLocalWeights();
  return getSetting('healthguard_model_v3');
}

export async function saveLocalWeights(weightsJson: string): Promise<void> {
  if (Platform.OS === 'web') return WebStore.saveLocalWeights(weightsJson);
  const db = await getDb();
  await saveSetting('healthguard_model_v3', weightsJson);
}

export async function getCommunityMyths(): Promise<MythBusterItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM myths ORDER BY id ASC');
  return rows.map((r) => ({
    id: Number(r.id),
    claim: String(r.claim),
    claim_lg: r.claim_lg ? String(r.claim_lg) : undefined,
    verdict: r.verdict as MythBusterItem['verdict'],
    explanation: String(r.explanation),
    explanation_lg: r.explanation_lg ? String(r.explanation_lg) : undefined,
    source: String(r.source),
    time: String(r.time),
    icon: String(r.icon)
  }));
}
export async function saveCommunityMyths(myths: MythBusterItem[]): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM myths');
  for (const m of myths) {
    await db.runAsync(
      `INSERT INTO myths (id, claim, claim_lg, verdict, explanation, explanation_lg, source, time, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.claim, m.claim_lg ?? null, m.verdict, m.explanation, m.explanation_lg ?? null, m.source, m.time, m.icon]
    );
  }
}

export async function getAilmentGuides(): Promise<AilmentGuide[]> {
  if (Platform.OS === 'web') return WebStore.getAilmentGuides();
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM ailments ORDER BY id ASC');
  return rows.map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    title_lg: r.title_lg ? String(r.title_lg) : undefined,
    icon: String(r.icon),
    color: String(r.color),
    steps: JSON.parse(String(r.steps_json)),
    steps_lg: r.steps_lg_json ? JSON.parse(String(r.steps_lg_json)) : undefined,
  }));
}

export async function saveAilmentGuides(guides: AilmentGuide[]): Promise<void> {
  if (Platform.OS === 'web') return WebStore.saveAilmentGuides(guides);
  const db = await getDb();
  await db.runAsync('DELETE FROM ailments');
  for (const g of guides) {
    await db.runAsync(
      `INSERT INTO ailments (id, title, title_lg, icon, color, steps_json, steps_lg_json) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [g.id, g.title, g.title_lg ?? null, g.icon, g.color, JSON.stringify(g.steps), g.steps_lg ? JSON.stringify(g.steps_lg) : null]
    );
  }
}


export async function getMaternalRecords(): Promise<MaternalRecord[]> {
  if (Platform.OS === 'web') return WebStore.getMaternalRecords();
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM maternal_records ORDER BY id DESC');
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    age: Number(r.age),
    lastMenstrualPeriod: String(r.lastMenstrualPeriod),
    expectedDeliveryDate: String(r.expectedDeliveryDate),
    ancVisitsJson: String(r.ancVisitsJson),
    nextAncDate: r.nextAncDate != null ? String(r.nextAncDate) : null,
    highRiskFactors: String(r.highRiskFactors || ''),
    notes: r.notes != null ? String(r.notes) : null,
  }));
}

export async function saveMaternalRecord(r: Omit<MaternalRecord, 'id'> & { id?: number }): Promise<number> {
  const recordId = r.id || Date.now();
  if (Platform.OS === 'web') return WebStore.saveMaternalRecord({ ...r, id: recordId } as MaternalRecord);
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO maternal_records (id, name, age, lastMenstrualPeriod, expectedDeliveryDate, ancVisitsJson, nextAncDate, highRiskFactors, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recordId,
      r.name,
      r.age,
      r.lastMenstrualPeriod,
      r.expectedDeliveryDate,
      r.ancVisitsJson,
      r.nextAncDate ?? null,
      r.highRiskFactors,
      r.notes ?? null,
    ]
  );
  return recordId;
}

export async function deleteMaternalRecord(id: number): Promise<void> {
  if (Platform.OS === 'web') return WebStore.deleteMaternalRecord(id);
  const db = await getDb();
  await db.runAsync('DELETE FROM maternal_records WHERE id = ?', [id]);
}

export async function getChildRecords(): Promise<ChildRecord[]> {
  if (Platform.OS === 'web') return WebStore.getChildRecords();
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM child_records ORDER BY id DESC');
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    birthDate: String(r.birthDate),
    gender: String(r.gender),
    immunizationsJson: String(r.immunizationsJson),
  }));
}

export async function saveChildRecord(c: Omit<ChildRecord, 'id'> & { id?: number }): Promise<number> {
  const childId = c.id || Date.now();
  if (Platform.OS === 'web') return WebStore.saveChildRecord({ ...c, id: childId } as ChildRecord);
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO child_records (id, name, birthDate, gender, immunizationsJson)
     VALUES (?, ?, ?, ?, ?)`,
    [
      childId,
      c.name,
      c.birthDate,
      c.gender,
      c.immunizationsJson,
    ]
  );
  return childId;
}

export async function deleteChildRecord(id: number): Promise<void> {
  if (Platform.OS === 'web') return WebStore.deleteChildRecord(id);
  const db = await getDb();
  await db.runAsync('DELETE FROM child_records WHERE id = ?', [id]);
}

export async function getInventory(): Promise<InventoryItem[]> {
  if (Platform.OS === 'web') return WebStore.getInventory();
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM inventory ORDER BY name ASC');
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    quantity: Number(r.quantity),
    unit: String(r.unit),
    minimumThreshold: Number(r.minimumThreshold),
    lastUpdated: String(r.lastUpdated),
  }));
}

export async function addInventoryItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> {
  if (Platform.OS === 'web') return WebStore.addInventoryItem(item);
  const db = await getDb();
  const lastUpdated = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO inventory (name, quantity, unit, minimumThreshold, lastUpdated) VALUES (?, ?, ?, ?, ?)`,
    [item.name, item.quantity, item.unit, item.minimumThreshold, lastUpdated]
  );
  return { ...item, id: result.lastInsertRowId, lastUpdated };
}

export async function deductInventory(id: number, amount: number): Promise<boolean> {
  if (Platform.OS === 'web') return WebStore.deductInventory(id, amount);
  const db = await getDb();
  const lastUpdated = new Date().toISOString();
  const result = await db.runAsync(
    `UPDATE inventory SET quantity = MAX(0, quantity - ?), lastUpdated = ? WHERE id = ?`,
    [amount, lastUpdated, id]
  );
  return result.changes > 0;
}

export async function addInventoryStock(id: number, amount: number): Promise<boolean> {
  if (Platform.OS === 'web') return WebStore.addInventoryStock(id, amount);
  const db = await getDb();
  const lastUpdated = new Date().toISOString();
  const result = await db.runAsync(
    `UPDATE inventory SET quantity = quantity + ?, lastUpdated = ? WHERE id = ?`,
    [amount, lastUpdated, id]
  );
  return result.changes > 0;
}

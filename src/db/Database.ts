import { NativeModules, Platform } from 'react-native';

const { HealthGuardEngine } = NativeModules;

export interface KnowledgeItem {
  id: number;
  topic: string;
  keyword: string;
  myth_text_en: string | null;
  correct_text_en: string;
  correct_text_lg: string | null;
  detailed_guidance_en?: string | null;
  detailed_guidance_lg?: string | null;
  symptoms?: string | null;
  prevention?: string | null;
  treatment?: string | null;
  source: string;
}

export interface ClaimRecord {
  id: number;
  claim_text: string;
  label: string;
  actual_label?: string;
  confidence_pct: number;
  location_note: string;
  latitude?: number;
  longitude?: number;
  submitted_at: string;
  flagged: boolean;
}

export interface Facility {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  contact: string;
}

export interface Broadcast {
  id: number;
  title: string;
  title_lg?: string;
  message: string;
  message_lg?: string;
  severity: 'URGENT' | 'INFO' | 'UPDATE';
  timestamp: string;
  isRead: boolean;
}

/**
 * Database — In the Hybrid Architecture, all SQLite operations are offloaded
 * to the Native Android DatabaseHelper for performance and stability.
 */
export const initDatabase = () => {
  // No-op on JS side as Native Android handles initialization on module load
  console.log('Database: Native Engine initialized.');
};

export const saveEncounter = async (claim: string, label: string, confidence: number, location: string, lat?: number, lng?: number): Promise<number> => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    return await HealthGuardEngine.saveEncounter(claim, label, confidence, location, lat, lng);
  }
  const existing = JSON.parse(localStorage.getItem('healthguard_claims') || '[]');
  const newItem = { 
    id: Date.now(), 
    claim_text: claim, 
    label, 
    confidence_pct: confidence * 100, 
    location_note: location,
    latitude: lat,
    longitude: lng,
    submitted_at: new Date().toISOString(),
    flagged: false,
    validator_id: undefined,
    validation_status: 'PENDING'
  };
  localStorage.setItem('healthguard_claims', JSON.stringify([newItem, ...existing]));
  return newItem.id;
};

export const updateEncounterFeedback = async (id: number, actualLabel: string) => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    await HealthGuardEngine.updateFeedback(id, actualLabel);
  }
};

export const getAllClaims = async (): Promise<ClaimRecord[]> => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    return await HealthGuardEngine.getAllClaims() || [];
  }
  return [];
};

export const getStats = async () => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    return await HealthGuardEngine.getStats();
  }
  return { total: 0, accurate: 0, misinfo: 0 };
};

export const searchKnowledge = async (query: string): Promise<KnowledgeItem[]> => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    return await HealthGuardEngine.searchKnowledge(query);
  }
  
  // Web Fallback: Search in localStorage
  const knowledge: any[] = JSON.parse(localStorage.getItem('healthguard_knowledge') || '[]');
  if (!query) return knowledge.map(k => ({
    id: k.id || 0,
    topic: k.topic,
    keyword: k.keyword || "",
    myth_text_en: k.mythTextEn || k.myth_text_en || null,
    correct_text_en: k.correctTextEn || k.correct_text_en,
    correct_text_lg: k.correctTextLg || k.correct_text_lg || null,
    source: k.source || "MOH Uganda"
  }));

  const q = query.toLowerCase();
  return knowledge
    .filter(k => 
      (k.topic && k.topic.toLowerCase().includes(q)) || 
      (k.mythTextEn && k.mythTextEn.toLowerCase().includes(q)) ||
      (k.myth_text_en && k.myth_text_en.toLowerCase().includes(q)) ||
      (k.correctTextEn && k.correctTextEn.toLowerCase().includes(q)) ||
      (k.correct_text_en && k.correct_text_en.toLowerCase().includes(q))
    )
    .map(k => ({
      id: k.id || 0,
      topic: k.topic,
      keyword: k.keyword || "",
      myth_text_en: k.mythTextEn || k.myth_text_en || null,
      correct_text_en: k.correctTextEn || k.correct_text_en,
      correct_text_lg: k.correctTextLg || k.correct_text_lg || null,
      detailed_guidance_en: k.detailedGuidanceEn || k.detailed_guidance_en || null,
      detailed_guidance_lg: k.detailedGuidanceLg || k.detailed_guidance_lg || null,
      symptoms: k.symptoms || null,
      prevention: k.prevention || null,
      treatment: k.treatment || null,
      source: k.source || "MOH Uganda"
    }));
};

export const getAllKnowledge = async (): Promise<KnowledgeItem[]> => {
  return await searchKnowledge("");
};

export const flagClaim = async (id: number) => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    // Implement if needed in native, or just log
    console.log('Flagged claim:', id);
  }
};

export const saveKnowledge = async (items: any[]) => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    const nativeItems = items.map(item => ({
      topic: item.topic,
      keyword: item.keyword || null,
      mythTextEn: item.mythTextEn || item.myth_text_en || null,
      correctTextEn: item.correctTextEn || item.correct_text_en,
      correctTextLg: item.correctTextLg || item.correct_text_lg || null,
      detailedGuidanceEn: item.detailedGuidanceEn || item.detailed_guidance_en || null,
      detailedGuidanceLg: item.detailedGuidanceLg || item.detailed_guidance_lg || null,
      symptoms: item.symptoms || null,
      prevention: item.prevention || null,
      treatment: item.treatment || null,
      source: item.source || null
    }));
    return await HealthGuardEngine.bulkInsertKnowledge(nativeItems);
  } else {
    // Web Fallback: Store in localStorage
    localStorage.setItem('healthguard_knowledge', JSON.stringify(items));
    return true;
  }
};

export const loadLocalWeights = async (): Promise<any | null> => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    // Implement if needed in native, or just return null to use defaults
    return null;
  }
  return null;
};

export const saveLocalWeights = async (weights: any) => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    // Implement if needed in native
  }
};

export const saveSession = async (token: string, userData: string) => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    await HealthGuardEngine.saveSession(token, userData);
  } else {
    // Web Fallback
    localStorage.setItem('healthguard_session', JSON.stringify({ token, user_data: userData }));
  }
};

export const getSession = async (): Promise<{token: string, user_data: string} | null> => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    return await HealthGuardEngine.getSession();
  } else {
    // Web Fallback
    const session = localStorage.getItem('healthguard_session');
    return session ? JSON.parse(session) : null;
  }
};

export const clearSession = async () => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    await HealthGuardEngine.clearSession();
  } else {
    // Web Fallback
    localStorage.removeItem('healthguard_session');
  }
};

export const getResponseForKeyword = async (keyword: string | null): Promise<KnowledgeItem | null> => {
  if (Platform.OS === 'android' && HealthGuardEngine && keyword) {
    return await HealthGuardEngine.getResponseForKeyword(keyword);
  }
  
  // Web Fallback: Search in localStorage
  if (keyword) {
    const knowledge: any[] = JSON.parse(localStorage.getItem('healthguard_knowledge') || '[]');
    const parts = keyword.split(':', 2);
    const topic = parts[0];
    const kw = parts.length > 1 ? parts[1] : "";

    let match = knowledge.find(k => 
      (k.keyword === keyword) ||
      (k.topic === topic && k.keyword === kw)
    );

    // Fallback: If specific keyword not found, try general topic info
    if (!match && topic) {
       match = knowledge.find(k => k.topic === topic && (k.keyword === `${topic}:general` || k.keyword === 'general'));
    }

    if (match) {
      return {
        id: match.id || 0,
        topic: match.topic,
        keyword: match.keyword || "",
        myth_text_en: match.mythTextEn || match.myth_text_en || null,
        correct_text_en: match.correctTextEn || match.correct_text_en,
        correct_text_lg: match.correctTextLg || match.correct_text_lg || null,
        detailed_guidance_en: match.detailedGuidanceEn || match.detailed_guidance_en || null,
        detailed_guidance_lg: match.detailedGuidanceLg || match.detailed_guidance_lg || null,
        symptoms: match.symptoms || null,
        prevention: match.prevention || null,
        treatment: match.treatment || null,
        source: match.source || "MOH Uganda"
      };
    }
  }
  return null;
};

export const getAllFacilities = async (): Promise<Facility[]> => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    return await HealthGuardEngine.getAllFacilities();
  }
  // Web Fallback (Mock)
  return [
    { id: 1, name: "Mulago National Referral Hospital", type: "National Hospital", latitude: 0.3385, longitude: 32.5761, contact: "+256 414 554001" },
    { id: 3, name: "Entebbe Regional Referral Hospital", type: "Regional Hospital", latitude: 0.0577, longitude: 32.4646, contact: "+256 414 320141" }
  ];
};

export const saveBroadcast = async (broadcast: Omit<Broadcast, 'id'>) => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    await HealthGuardEngine.saveBroadcast(broadcast.title, broadcast.message, broadcast.severity);
  } else {
    const existing = JSON.parse(localStorage.getItem('healthguard_broadcasts') || '[]');
    const newItem = { ...broadcast, id: Date.now() };
    localStorage.setItem('healthguard_broadcasts', JSON.stringify([newItem, ...existing]));
  }
};

export const getBroadcasts = async (): Promise<Broadcast[]> => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    return await HealthGuardEngine.getBroadcasts() || [];
  }
  return JSON.parse(localStorage.getItem('healthguard_broadcasts') || '[]');
};

export const saveSetting = async (key: string, value: string) => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    await HealthGuardEngine.saveSetting(key, value);
  } else {
    localStorage.setItem(key, value);
  }
};

export const getSetting = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'android' && HealthGuardEngine) {
    return await HealthGuardEngine.getSetting(key);
  }
  return localStorage.getItem(key);
};

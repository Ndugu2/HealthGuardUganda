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

export interface PatientRecord {
  id: number;
  name: string;
  age: number;
  gender: string;
  village: string;
  symptoms: string;
  status: 'waiting' | 'in-progress' | 'referred' | 'completed' | 'follow-up';
  priority: 'low' | 'medium' | 'high' | 'critical';
  screenedDate: string;
  followUpDate?: string;
  referredTo?: string;
}

export interface MythBusterItem {
  id: number;
  claim: string;
  claim_lg?: string;
  verdict: 'MYTH' | 'FACT' | 'UNCERTAIN';
  explanation: string;
  explanation_lg?: string;
  source: string;
  time: string;
  icon: string;
}

export interface AilmentGuide {
  id: number;
  title: string;
  title_lg?: string;
  icon: string;
  color: string;
  steps: string[];
  steps_lg?: string[];
}

export interface HealthQuizItem {
  id: number;
  question: string;
  question_lg: string;
  answer: boolean;
  explanation: string;
  explanation_lg: string;
}

export interface EmergencyHotline {
  id: number;
  label: string;
  label_lg?: string;
  number: string;
  icon: string;
  color: string;
}

export interface MaternalRecord {
  id: number;
  name: string;
  age: number;
  lastMenstrualPeriod: string;
  expectedDeliveryDate: string;
  ancVisitsJson: string; // JSON array of: { date: string, weight?: number, bp?: string, notes?: string }
  nextAncDate: string | null;
  highRiskFactors: string; // comma-separated values
  notes: string | null;
}

export interface ChildRecord {
  id: number;
  name: string;
  birthDate: string;
  gender: string;
  immunizationsJson: string; // JSON array of: { name: string, dueWeeks: number, status: 'pending' | 'given', givenDate?: string }
}


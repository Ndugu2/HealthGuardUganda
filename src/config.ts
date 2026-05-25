import { Platform } from 'react-native';

/** Default host (no /api suffix) — Android emulator uses 10.0.2.2 for host machine */
const DEFAULT_HOST =
  Platform.OS === 'web'
    ? 'https://healthguarduganda.onrender.com'
    : Platform.OS === 'android'
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000';

export const DEFAULT_SERVER_URL = DEFAULT_HOST;
export const DEFAULT_API_BASE = `${DEFAULT_HOST}/api`;
export const ORS_API_URL = process.env.REACT_APP_ORS_API_URL ?? 'https://api.openrouteservice.org';
export const OPENROUTER_URL = process.env.REACT_APP_OPENROUTER_URL ?? 'https://openrouter.ai/api/v1/chat/completions';
export const POLLINATIONS_URL = process.env.REACT_APP_POLLINATIONS_URL ?? 'https://text.pollinations.ai';


/** Override via Settings → stored as `api_base_url` (full URL including /api) */
export const API_BASE_SETTING_KEY = 'api_base_url';

export const DEMO_ACCOUNTS = [
  { phone: '0700000000', password: 'password123', name: 'Dr. Mukasa John', role: 'ADMIN', district: 'Kampala', village: 'Kalerwe' },
  { phone: '0701000001', password: 'healthworker', name: 'Nurse Nalubega', role: 'HW', district: 'Wakiso', village: 'Nansana' },
  { phone: '0702000002', password: 'community123', name: 'Babirye Florence', role: 'COMMUNITY', district: 'Mukono', village: 'Ggaba' },
] as const;

export function isOfflineToken(token: string): boolean {
  return token.startsWith('offline_');
}

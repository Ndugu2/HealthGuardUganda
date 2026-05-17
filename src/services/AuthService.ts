import { Platform } from 'react-native';
import { saveSession, getSession, clearSession } from '../db/Database';

// ─── Offline Demo Credentials (always works without server) ──────────────────
const DEMO_ACCOUNTS = [
  { phone: '0700000000', password: 'password123', name: 'Dr. Mukasa John', role: 'ADMIN', district: 'Kampala', village: 'Kalerwe' },
  { phone: '0701000001', password: 'healthworker', name: 'Nurse Nalubega', role: 'HW', district: 'Wakiso', village: 'Nansana' },
];

export interface User {
  id: string;
  phone: string;
  name: string;
  role: string;
  village?: string;
  district?: string;
}

const API_URL = Platform.OS === 'web' ? 'http://localhost:3000/api' : 'http://10.136.128.21:3000/api';

export class AuthService {
  public static async login(phone: string, password: string): Promise<{ success: boolean; error?: string }> {
    // 1. Try online server first
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (data.success) {
        await saveSession(data.token, JSON.stringify(data.user));
        return { success: true };
      } else {
        // Server responded but credentials wrong — don't fallback
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (error: any) {
      // Server unreachable — try offline fallback
      console.warn('AuthService: Server unreachable, trying offline login...');
    }

    // 2. Offline fallback — check demo accounts
    const demo = DEMO_ACCOUNTS.find(a => a.phone === phone && a.password === password);
    if (demo) {
      const fakeToken = `offline_${Date.now()}_${demo.role}`;
      const user = { id: demo.phone, name: demo.name, role: demo.role, district: demo.district, village: demo.village };
      await saveSession(fakeToken, JSON.stringify(user));
      return { success: true };
    }

    // 3. Check locally cached credentials (for previously registered users)
    try {
      const cached = localStorage.getItem(`healthguard_user_${phone}`);
      if (cached) {
        const stored = JSON.parse(cached);
        if (stored.password === password) {
          const fakeToken = `offline_cached_${Date.now()}`;
          await saveSession(fakeToken, JSON.stringify(stored.user));
          return { success: true };
        }
        return { success: false, error: 'Invalid password' };
      }
    } catch (_) {}

    return { success: false, error: 'Server offline. Use demo credentials:\nPhone: 0700000000\nPassword: password123' };
  }

  public static async getSession(): Promise<{ token: string; user: User } | null> {
    try {
      const res = await getSession();
      if (res) {
        return {
          token: res.token,
          user: JSON.parse(res.user_data),
        };
      }
    } catch (e) {
      console.warn('No session found or error reading session');
    }
    return null;
  }

  public static async logout() {
    try {
      await clearSession();
    } catch (e) {
      console.error('Logout error', e);
    }
  }

  public static async register(userData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error: any) {
      return { success: false, error: 'Could not connect to server' };
    }
  }
}

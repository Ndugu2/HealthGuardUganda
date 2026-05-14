import { Platform } from 'react-native';
import { saveSession, getSession, clearSession } from '../db/Database';

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
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store new session natively
        await saveSession(data.token, JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, error: 'Could not connect to server' };
    }
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

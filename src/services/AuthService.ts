import { DEMO_ACCOUNTS } from '../config';
import { getApiBaseUrl } from '../db/apiConfig';
import {
  saveSession,
  getSession as readStoredSession,
  clearSession,
  saveRegisteredUser,
  getRegisteredUser,
  getAllRegisteredUsersFromDb,
  updateRegisteredUserApproval,
} from '../db/Database';

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: string;
  village?: string;
  district?: string;
  approved?: boolean;
}

export class AuthService {
  public static async login(phone: string, password: string, roleHint?: 'COMMUNITY' | 'HW' | 'ADMIN'): Promise<{ success: boolean; error?: string }> {
    const API_URL = await getApiBaseUrl();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (data.success) {
        const user = data.user as User;
        if (roleHint && user.role !== roleHint) {
          const expectedRoleText = roleHint === 'HW' ? 'Health Worker' : roleHint === 'ADMIN' ? 'Administrator' : 'Community Member';
          const actualRoleText = user.role === 'HW' ? 'Health Worker' : user.role === 'ADMIN' ? 'Administrator' : 'Community Member';
          return {
            success: false,
            error: `This account is registered as a ${actualRoleText}. Please use the ${expectedRoleText} portal to sign in.`
          };
        }
        await saveSession(data.token, JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch {
      console.warn('AuthService: Server unreachable, trying offline login...');
    }

    const demo = DEMO_ACCOUNTS.find((a) => a.phone === phone && a.password === password);
    if (demo) {
      if (roleHint && demo.role !== roleHint) {
        const expectedRoleText = roleHint === 'HW' ? 'Health Worker' : roleHint === 'ADMIN' ? 'Administrator' : 'Community Member';
        const actualRoleText = demo.role === 'HW' ? 'Health Worker' : demo.role === 'ADMIN' ? 'Administrator' : 'Community Member';
        return {
          success: false,
          error: `This account is registered as a ${actualRoleText}. Please use the ${expectedRoleText} portal to sign in.`
        };
      }
      const fakeToken = `offline_${Date.now()}_${demo.role}`;
      const user = {
        id: demo.phone,
        phone: demo.phone,
        name: demo.name,
        role: demo.role,
        district: demo.district,
        village: demo.village,
      };
      await saveSession(fakeToken, JSON.stringify(user));
      return { success: true };
    }

    const cached = await getRegisteredUser(phone);
    if (cached) {
      if (cached.password === password) {
        const user = cached.user as unknown as User;
        if (roleHint && user.role !== roleHint) {
          const expectedRoleText = roleHint === 'HW' ? 'Health Worker' : roleHint === 'ADMIN' ? 'Administrator' : 'Community Member';
          const actualRoleText = user.role === 'HW' ? 'Health Worker' : user.role === 'ADMIN' ? 'Administrator' : 'Community Member';
          return {
            success: false,
            error: `This account is registered as a ${actualRoleText}. Please use the ${expectedRoleText} portal to sign in.`
          };
        }
        if (user.role === 'HW' && !user.approved) {
          return { success: false, error: 'Your account is pending administrator approval.' };
        }
        await saveSession(`offline_cached_${Date.now()}`, JSON.stringify(user));
        return { success: true };
      }
      return { success: false, error: 'Invalid password' };
    }

    const expectedDemoText = roleHint === 'HW' 
      ? 'Phone: 0701000001\nPassword: healthworker' 
      : roleHint === 'COMMUNITY' 
        ? 'Phone: 0702000002\nPassword: community123' 
        : 'Phone: 0700000000\nPassword: password123';

    return {
      success: false,
      error: `Server offline. Use the correct demo credentials:\n${expectedDemoText}`,
    };
  }

  public static async getSession(): Promise<{ token: string; user: User } | null> {
    try {
      const res = await readStoredSession();
      if (res) {
        return { token: res.token, user: JSON.parse(res.user_data) };
      }
    } catch (e) {
      console.warn('No session found or error reading session', e);
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

  public static async register(userData: {
    phone: string;
    password: string;
    name: string;
    email?: string;
    role?: string;
    district?: string;
    village?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const isApproved = userData.role !== 'HW';
    const user: User = {
      id: userData.phone,
      phone: userData.phone,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'HW',
      district: userData.district,
      village: userData.village,
      approved: isApproved,
    };
    await saveRegisteredUser(userData.phone, userData.password, user as unknown as Record<string, unknown>);

    try {
      const API_URL = await getApiBaseUrl();
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (data.success) return { success: true };
      return { success: false, error: data.error || 'Registration failed' };
    } catch {
      return { success: true };
    }
  }

  public static async getAllRegisteredUsers(): Promise<User[]> {
    const pendingPhone = '0703000003';
    const existing = await getRegisteredUser(pendingPhone);
    if (!existing) {
      await saveRegisteredUser(pendingPhone, 'pendingpassword', {
        id: pendingPhone,
        phone: pendingPhone,
        name: 'Musa Okello',
        email: 'musa@healthguard.ug',
        role: 'HW',
        district: 'Gulu',
        village: 'Laroo',
        approved: false,
      });
    }
    const users = await getAllRegisteredUsersFromDb();
    return users as unknown as User[];
  }

  public static async approveUser(phone: string): Promise<boolean> {
    return updateRegisteredUserApproval(phone, true);
  }
}

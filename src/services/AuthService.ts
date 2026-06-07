import { DEMO_ACCOUNTS } from '../config';
import { NotificationService } from './NotificationService';
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
  public static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

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
      if (response.ok && data.success) {
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
        approved: true,
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
        if ((user.role === 'HW' || user.role === 'ADMIN') && !user.approved) {
          return { success: false, error: 'Your account is pending super-administrator approval. You will be notified once it is activated.' };
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
  }): Promise<{ success: boolean; error?: string; otp?: string; isOffline?: boolean }> {
    // Generate a default offline OTP
    let finalOtp = AuthService.generateOTP();
    let isOffline = true;

    const isApproved = userData.role !== 'HW' && userData.role !== 'ADMIN';
    const user: User = {
      id: userData.phone,
      phone: userData.phone,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'COMMUNITY',
      district: userData.district,
      village: userData.village,
      approved: isApproved,
    };

    // Persist locally first (works offline)
    await saveRegisteredUser(userData.phone, userData.password, user as unknown as Record<string, unknown>);

    // Attempt server registration
    try {
      const API_URL = await getApiBaseUrl();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      const data = await response.json();
      if (response.ok) {
        isOffline = false;
      } else if (response.status === 400) {
        return { success: false, error: data.error || 'This phone number is already registered.' };
      }
    } catch (e) {
      console.warn('AuthService: Server unreachable during registration, proceeding offline.', e);
    }

    // Only send offline simulated notifications if the server didn't handle it
    if (isOffline) {
      try {
        await NotificationService.sendOTP(userData.phone, finalOtp);
      } catch {
        console.warn('AuthService: SMS OTP delivery failed (non-fatal)');
      }
      if (userData.email) {
        try {
          await NotificationService.sendOTPViaEmail(userData.email, finalOtp, userData.name);
        } catch {
          console.warn('AuthService: Email OTP delivery failed (non-fatal)');
        }
      }
    }

    return { success: true, otp: isOffline ? finalOtp : undefined, isOffline };
  }

  public static async verifyOTP(
    phone: string,
    code: string,
    localOTP?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const API_URL = await getApiBaseUrl();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Verification failed. Incorrect code.' };
    } catch (e) {
      console.warn('AuthService: Server unreachable during OTP verification, falling back to offline check.');
      if (localOTP && code === localOTP) {
        return { success: true };
      }
      return { success: false, error: 'Incorrect verification code.' };
    }
  }

  public static async getAllRegisteredUsers(): Promise<User[]> {
    try {
      const session = await AuthService.getSession();
      if (session) {
        const API_URL = await getApiBaseUrl();
        const response = await fetch(`${API_URL}/auth/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
          }
        });
        if (response.ok) {
          const users = await response.json() as User[];
          for (const u of users) {
            const existing = await getRegisteredUser(u.phone);
            const pwd = existing ? existing.password : 'synced_user_no_password';
            await saveRegisteredUser(u.phone, pwd, u as unknown as Record<string, unknown>);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch users from server, using local:', e);
    }

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
    await updateRegisteredUserApproval(phone, true);

    try {
      const session = await AuthService.getSession();
      if (session) {
        const API_URL = await getApiBaseUrl();
        const response = await fetch(`${API_URL}/auth/users/${phone}/approve`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
          }
        });
        const data = await response.json();
        return data.success === true;
      }
    } catch (e) {
      console.warn('Could not approve user on server:', e);
    }
    return true;
  }

  /**
   * Request a password reset code. The backend generates a code and (in production)
   * would send it via SMS or Email. For this demo, the backend returns the code
   * so the client can simulate the delivery notification.
   */
  public static async forgotPassword(
    method: 'email' | 'phone',
    value: string
  ): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      const API_URL = await getApiBaseUrl();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, value }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, code: data.code };
      }
      return { success: false, error: data.error || 'Could not initiate password reset' };
    } catch {
      // Offline fallback: check local registered users
      if (method === 'phone') {
        const cached = await getRegisteredUser(value);
        if (cached) {
          const code = AuthService.generateOTP();
          return { success: true, code };
        }
      } else {
        // Email lookup in local DB not directly supported; search all users
        const allUsers = await getAllRegisteredUsersFromDb();
        const match = allUsers.find((u: any) => u.email === value);
        if (match) {
          const code = AuthService.generateOTP();
          return { success: true, code };
        }
      }
      return { success: false, error: 'User not found. Check your phone number or email.' };
    }
  }

  /**
   * Reset the password using the verification code.
   */
  public static async resetPassword(
    method: 'email' | 'phone',
    value: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const API_URL = await getApiBaseUrl();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, value, code, newPassword }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Could not reset password' };
    } catch {
      // Offline fallback: update local DB password directly
      if (method === 'phone') {
        const cached = await getRegisteredUser(value);
        if (cached) {
          await saveRegisteredUser(value, newPassword, cached.user);
          return { success: true };
        }
      } else {
        const allUsers = await getAllRegisteredUsersFromDb();
        const match = allUsers.find((u: any) => u.email === value);
        if (match) {
          const phone = (match as any).phone;
          const cached = await getRegisteredUser(phone);
          if (cached) {
            await saveRegisteredUser(phone, newPassword, cached.user);
            return { success: true };
          }
        }
      }
      return { success: false, error: 'Could not reset password offline.' };
    }
  }
}

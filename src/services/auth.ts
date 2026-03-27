// src/services/auth.ts
import { apiClient } from '../config/api';
import { User, LoginCredentials } from '../types';

export class AuthService {
  // Sign in with email and password
  static async signIn(credentials: LoginCredentials) {
    try {
      const data = await apiClient.post<{
        access_token: string;
        refresh_token: string;
        user: User;
        language_pack?: Record<string, string>;
      }>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      // Store tokens in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      return {
        user: data.user as User,
        session: null,
        language_pack: data.language_pack,
      };
    } catch (error: any) {
      const msg = error.message || 'Login failed';
      if (msg.includes('deactivated')) {
        throw new Error('Your company account has been deactivated. Please contact your administrator. / Şirket hesabınız devre dışı bırakılmıştır. Lütfen yöneticinizle iletişime geçin.');
      }
      if (msg.includes('Invalid') || error.status === 401) {
        throw new Error('Invalid email or password. Please try again. / Geçersiz e-posta veya şifre. Lütfen tekrar deneyin.');
      }
      throw new Error(msg);
    }
  }

  // Sign out
  static async signOut() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch {
      // Ignore errors during logout — we clear tokens regardless
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    return true;
  }

  // Check current session
  static async getCurrentSession() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;

      const data = await apiClient.get<{ user: User }>('/auth/session');

      if (!data?.user) return null;

      return {
        user: data.user as User,
        session: null,
      };
    } catch (error: any) {
      console.error('Session error:', error);
      return null;
    }
  }

  // First-time password reset
  static async resetFirstTimePassword(email: string, newPassword: string) {
    try {
      await apiClient.post('/auth/change-password', {
        new_password: newPassword,
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed / Şifre sıfırlama başarısız');
    }
  }

  // Request a password reset email
  static async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  // Reset password using a token from the reset email
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  }

  // Check if user needs password change
  static async checkPasswordChangeRequired(userId: string): Promise<boolean> {
    try {
      const data = await apiClient.get<User>(`/users/${userId}`);
      return data?.requires_password_change || false;
    } catch (error) {
      console.error('Error checking password change:', error);
      return false;
    }
  }
}

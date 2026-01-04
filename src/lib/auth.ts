import { User } from '@/types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const TOKEN_KEY = 'euroship_auth_token';

/**
 * Request OTP
 */
export async function requestOtp(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email?.trim()) {
    return { success: false, error: 'Email is required' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to request OTP' };
    }

    return { success: true };
  } catch (err) {
    console.error('OTP request error:', err);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Verify OTP and store JWT token
 */
export async function verifyOtp(
  otp: string,
  email: string
): Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
  if (!email?.trim()) return { success: false, error: 'Email is required' };
  if (!otp || otp.length !== 6) return { success: false, error: 'OTP must be 6 digits' };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Invalid OTP' };
    }

    if (data.success && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      return {
        success: true,
        token: data.token,
        user: data.user,
      };
    }

    return { success: false, error: 'Authentication failed' };
  } catch (err) {
    console.error('OTP verification error:', err);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (err) {
    console.error('Get current user error:', err);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return localStorage.getItem(TOKEN_KEY) !== null;
}

/**
 * Get stored JWT token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Check if user has specific role
 */
export function hasRole(role: 'ADMIN' | 'AGENT'): boolean {
  const userStr = localStorage.getItem('euroship_user');
  if (!userStr) return false;
  const user: User = JSON.parse(userStr);
  return user.role.toUpperCase() === role;
}

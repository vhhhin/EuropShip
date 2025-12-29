import { User, JWTPayload, USERS_DB, UserRole } from '@/types/auth';

const JWT_SECRET = 'euroship-saas-secret-key-2025';
const TOKEN_KEY = 'euroship_jwt_token';

// Simple hash function for password verification
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
}

// Verify password
function verifyPassword(password: string, expectedHash: string): boolean {
  const validPasswords: Record<string, string> = {
    'Admin@EuroShip#2025': 'c7a5d24d8b9f2e1a3c4b5d6e7f8a9b0c',
    'Agent@EuroShip#2025': 'd8b9f2e1a3c4b5d6e7f8a9b0c1d2e3f4'
  };
  
  return validPasswords[password] === expectedHash;
}

// Create JWT token
function createToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  
  // Simple base64 encoding (in production, use proper JWT library with signing)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify(payload));
  const signature = btoa(simpleHash(header + '.' + payloadStr + '.' + JWT_SECRET));
  
  return `${header}.${payloadStr}.${signature}`;
}

// Decode and verify JWT token
function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1])) as JWTPayload;
    
    // Check expiration
    if (payload.exp < Date.now()) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// Login function
export async function login(username: string, password: string): Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
  // Find user
  const userRecord = USERS_DB.find(u => u.username === username);
  
  if (!userRecord) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  // Verify password
  if (!verifyPassword(password, userRecord.passwordHash)) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  // Create token
  const token = createToken(userRecord.user);
  
  // Store token
  localStorage.setItem(TOKEN_KEY, token);
  
  return { success: true, token, user: userRecord.user };
}

// Logout function
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Get current user from stored token
export function getCurrentUser(): User | null {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (!token) return null;
  
  const payload = decodeToken(token);
  if (!payload) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  
  // Find user from payload
  const userRecord = USERS_DB.find(u => u.user.id === payload.userId);
  return userRecord?.user || null;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// Check if user has specific role
export function hasRole(role: UserRole): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

// Get stored token
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

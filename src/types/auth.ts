// User roles - ONLY Admin and Agent allowed
export type UserRole = 'ADMIN' | 'AGENT';

// User interface
export interface User {
  id: string | number;
  email?: string;
  username?: string;
  role: UserRole;
  displayName: string;
}

// JWT payload
export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  exp: number;
  iat: number;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string, email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// Predefined users for authentication
export const USERS_DB: { username: string; passwordHash: string; user: User }[] = [
  {
    username: 'admin.euroship',
    // Hash of Admin@EuroShip#2025
    passwordHash: 'c7a5d24d8b9f2e1a3c4b5d6e7f8a9b0c',
    user: {
      id: 'admin-001',
      username: 'admin.euroship',
      role: 'ADMIN',
      displayName: 'EuropShip Admin'
    }
  },
  {
    username: 'agent.euroship',
    // Hash of Agent@EuroShip#2025
    passwordHash: 'd8b9f2e1a3c4b5d6e7f8a9b0c1d2e3f4',
    user: {
      id: 'agent-001',
      username: 'agent.euroship',
      role: 'AGENT',
      displayName: 'EuropShip Agent' // <-- Correction ici
    }
  }
];

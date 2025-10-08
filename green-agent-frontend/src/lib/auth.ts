/**
 * Authentication utilities for agent portal
 * Handles role verification and authentication state
 */

export type UserRole = 'customer' | 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  location?: string;
  verified_agent?: boolean;
}

const AUTH_KEY = 'gta_agent_auth';
const TOKEN_KEY = 'gta_agent_token';

/**
 * Get current authenticated user
 */
export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    
    const user = JSON.parse(raw) as User;
    
    // Verify user has agent role
    if (user.role !== 'agent') {
      console.warn('User does not have agent role');
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
}

/**
 * Set authenticated user
 */
export function setUser(user: User): void {
  if (user.role !== 'agent') {
    throw new Error('Only users with agent role can access this portal');
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

/**
 * Clear authentication data
 */
export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get authentication token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set authentication token
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Check if user is authenticated as an agent
 */
export function isAuthenticated(): boolean {
  const user = getUser();
  return user !== null && user.role === 'agent';
}

/**
 * Verify agent role and return user or throw error
 */
export function requireAgent(): User {
  const user = getUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  if (user.role !== 'agent') {
    throw new Error('Agent role required');
  }
  return user;
}

/**
 * Demo login for development
 */
export function demoLogin(email: string = 'agent@greentech.africa'): User {
  const user: User = {
    id: 'agent-001',
    email,
    name: 'Demo Agent',
    role: 'agent',
    phone: '+233 24 123 4567',
    location: 'Accra, Ghana',
    verified_agent: true,
  };
  
  setUser(user);
  setToken('demo-token-' + Date.now());
  
  return user;
}

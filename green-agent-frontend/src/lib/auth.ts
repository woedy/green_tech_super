/**
 * Authentication utilities for agent portal
 * Handles role verification and authentication state
 */

export type UserRole = 'customer' | 'agent' | 'admin' | 'builder';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  location?: string;
  verified_agent?: boolean;
  is_verified: boolean;
}

const AUTH_KEY = 'gta_agent_auth';
const TOKEN_KEY = 'gta_agent_token';
const REFRESH_TOKEN_KEY = 'gta_agent_refresh_token';

/**
 * Convert backend user_type to frontend role
 */
function mapUserTypeToRole(userType: string): UserRole {
  switch (userType) {
    case 'AGENT':
      return 'agent';
    case 'BUILDER':
      return 'builder';
    case 'ADMIN':
      return 'admin';
    case 'CUSTOMER':
    default:
      return 'customer';
  }
}

/**
 * Get current authenticated user
 */
export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    
    const user = JSON.parse(raw) as User;
    
    // Verify user has agent or builder role
    if (user.role !== 'agent' && user.role !== 'builder') {
      console.warn('User does not have agent or builder role');
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
}

/**
 * Set authenticated user and tokens
 */
export function setAuth(backendUser: any, accessToken: string, refreshToken: string): void {
  const role = mapUserTypeToRole(backendUser.user_type);
  
  if (role !== 'agent' && role !== 'builder') {
    throw new Error('Only users with agent or builder role can access this portal');
  }
  
  const user: User = {
    id: backendUser.id,
    email: backendUser.email,
    first_name: backendUser.first_name,
    last_name: backendUser.last_name,
    role,
    phone_number: backendUser.phone_number,
    is_verified: backendUser.is_verified,
    verified_agent: role === 'agent',
  };
  
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Update access token
 */
export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const user = getUser();
  const token = getAccessToken();
  return !!(user && token);
}

/**
 * Verify agent role and return user or throw error
 */
export function requireAgent(): User {
  const user = getUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  if (user.role !== 'agent' && user.role !== 'builder') {
    throw new Error('Agent or builder role required');
  }
  return user;
}
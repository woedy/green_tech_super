/**
 * Authentication utilities for admin portal
 */

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'ADMIN' | 'AGENT' | 'BUILDER' | 'CUSTOMER';
  is_verified: boolean;
}

const ACCESS_TOKEN_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';
const USER_KEY = 'admin_user';

/**
 * Get current authenticated user
 */
export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    
    const user = JSON.parse(raw) as User;
    
    // Verify user has admin role
    if (user.user_type !== 'ADMIN') {
      console.warn('User does not have admin role');
      clearAuth();
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to parse user data:', error);
    clearAuth();
    return null;
  }
}

/**
 * Set authenticated user and tokens
 */
export function setAuth(user: User, accessToken: string, refreshToken: string): void {
  if (user.user_type !== 'ADMIN') {
    throw new Error('Only users with admin role can access this portal');
  }
  
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
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
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // Remove legacy auth key
  localStorage.removeItem('adminAuthed');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const user = getUser();
  const token = getAccessToken();
  return !!(user && token);
}
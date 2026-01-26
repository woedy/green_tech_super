/**
 * Authentication hook for admin portal
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, getUser, setAuth, clearAuth, isAuthenticated, getRefreshToken } from '../lib/auth';
import { login as apiLogin, getProfile, refreshToken } from '../api';

export function useAuth() {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication on mount
    const initAuth = async () => {
      try {
        if (isAuthenticated()) {
          const currentUser = getUser();
          if (currentUser) {
            // Verify token is still valid by fetching profile
            try {
              const profile = await getProfile();
              setUserState(profile);
            } catch (error) {
              // Token might be expired, try to refresh
              const refresh = getRefreshToken();
              if (refresh) {
                try {
                  const { access } = await refreshToken(refresh);
                  localStorage.setItem('admin_access_token', access);
                  const profile = await getProfile();
                  setUserState(profile);
                } catch (refreshError) {
                  // Refresh failed, clear auth
                  clearAuth();
                  setUserState(null);
                }
              } else {
                clearAuth();
                setUserState(null);
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        clearAuth();
        setUserState(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiLogin({ email, password });
      
      if (response.user.user_type !== 'ADMIN') {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      if (!response.user.is_verified) {
        throw new Error('Please verify your email before signing in.');
      }
      
      setAuth(response.user, response.access, response.refresh);
      setUserState(response.user);
      navigate('/admin');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
    navigate('/admin/login');
  }, [navigate]);

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
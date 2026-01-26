/**
 * Authentication hook for agent portal
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, getUser, setAuth, clearAuth, isAuthenticated, getRefreshToken, setAccessToken } from '@/lib/auth';
import { loginUser, getUserProfile, refreshAccessToken, registerUser } from '@/lib/api';

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
              const profile = await getUserProfile();
              // Update user state with fresh profile data
              const updatedUser: User = {
                id: profile.id,
                email: profile.email,
                first_name: profile.first_name,
                last_name: profile.last_name,
                role: profile.user_type === 'AGENT' ? 'agent' : 
                      profile.user_type === 'BUILDER' ? 'builder' : 'customer',
                phone_number: profile.phone_number,
                is_verified: profile.is_verified,
                verified_agent: profile.user_type === 'AGENT',
              };
              setUserState(updatedUser);
            } catch (error) {
              // Token might be expired, try to refresh
              const refresh = getRefreshToken();
              if (refresh) {
                try {
                  const { access } = await refreshAccessToken(refresh);
                  setAccessToken(access);
                  const profile = await getUserProfile();
                  const updatedUser: User = {
                    id: profile.id,
                    email: profile.email,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    role: profile.user_type === 'AGENT' ? 'agent' : 
                          profile.user_type === 'BUILDER' ? 'builder' : 'customer',
                    phone_number: profile.phone_number,
                    is_verified: profile.is_verified,
                    verified_agent: profile.user_type === 'AGENT',
                  };
                  setUserState(updatedUser);
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
      const response = await loginUser({ email, password });
      
      if (response.user.user_type !== 'AGENT' && response.user.user_type !== 'BUILDER') {
        throw new Error('Access denied. Agent or builder privileges required.');
      }
      
      if (!response.user.is_verified) {
        throw new Error('Please verify your email before signing in.');
      }
      
      setAuth(response.user, response.access, response.refresh);
      
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        role: response.user.user_type === 'AGENT' ? 'agent' : 'builder',
        phone_number: response.user.phone_number,
        is_verified: response.user.is_verified,
        verified_agent: response.user.user_type === 'AGENT',
      };
      
      setUserState(user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [navigate]);

  const register = useCallback(async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    user_type: 'AGENT' | 'BUILDER';
  }): Promise<void> => {
    try {
      await registerUser({
        ...userData,
        confirm_password: userData.password
      });
      // Registration successful - redirect to verification page
      navigate('/verify-email');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
    navigate('/login');
  }, [navigate]);

  const updateUser = useCallback((updatedUser: User) => {
    setAuth(updatedUser, getRefreshToken() || '', getRefreshToken() || '');
    setUserState(updatedUser);
  }, []);

  return {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };
}
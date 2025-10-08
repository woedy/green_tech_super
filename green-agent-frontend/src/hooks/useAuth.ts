/**
 * Authentication hook for agent portal
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, getUser, setUser, clearAuth, isAuthenticated, demoLogin } from '@/lib/auth';

export function useAuth() {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication on mount
    const currentUser = getUser();
    setUserState(currentUser);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      // For now, use demo login
      const loggedInUser = demoLogin(email);
      setUserState(loggedInUser);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
    navigate('/auth/login');
  }, [navigate]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setUserState(updatedUser);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    updateUser,
  };
}

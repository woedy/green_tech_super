/**
 * Tests for agent authentication functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  User,
  getUser,
  setUser,
  clearAuth,
  getToken,
  setToken,
  isAuthenticated,
  requireAgent,
  demoLogin,
} from '../lib/auth';

describe('Agent Authentication', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('User Management', () => {
    it('should return null when no user is stored', () => {
      const user = getUser();
      expect(user).toBeNull();
    });

    it('should store and retrieve agent user', () => {
      const testUser: User = {
        id: 'test-001',
        email: 'agent@test.com',
        name: 'Test Agent',
        role: 'agent',
        verified_agent: true,
      };

      setUser(testUser);
      const retrieved = getUser();

      expect(retrieved).toEqual(testUser);
    });

    it('should reject non-agent users', () => {
      const customerUser: User = {
        id: 'customer-001',
        email: 'customer@test.com',
        name: 'Test Customer',
        role: 'customer',
      };

      expect(() => setUser(customerUser)).toThrow('Only users with agent role can access this portal');
    });

    it('should return null for non-agent users in storage', () => {
      // Manually set a customer user in localStorage
      const customerUser = {
        id: 'customer-001',
        email: 'customer@test.com',
        name: 'Test Customer',
        role: 'customer',
      };
      localStorage.setItem('gta_agent_auth', JSON.stringify(customerUser));

      const user = getUser();
      expect(user).toBeNull();
    });

    it('should clear authentication data', () => {
      const testUser: User = {
        id: 'test-001',
        email: 'agent@test.com',
        name: 'Test Agent',
        role: 'agent',
      };

      setUser(testUser);
      setToken('test-token');

      clearAuth();

      expect(getUser()).toBeNull();
      expect(getToken()).toBeNull();
    });
  });

  describe('Token Management', () => {
    it('should store and retrieve token', () => {
      const token = 'test-token-123';
      setToken(token);

      const retrieved = getToken();
      expect(retrieved).toBe(token);
    });

    it('should return null when no token is stored', () => {
      const token = getToken();
      expect(token).toBeNull();
    });
  });

  describe('Authentication Status', () => {
    it('should return false when not authenticated', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return true when agent is authenticated', () => {
      const testUser: User = {
        id: 'test-001',
        email: 'agent@test.com',
        name: 'Test Agent',
        role: 'agent',
      };

      setUser(testUser);
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false for non-agent users', () => {
      // Manually set a customer user
      const customerUser = {
        id: 'customer-001',
        email: 'customer@test.com',
        name: 'Test Customer',
        role: 'customer',
      };
      localStorage.setItem('gta_agent_auth', JSON.stringify(customerUser));

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('Role Verification', () => {
    it('should throw error when no user is authenticated', () => {
      expect(() => requireAgent()).toThrow('Authentication required');
    });

    it('should throw error for non-agent users', () => {
      // Manually set a customer user
      const customerUser = {
        id: 'customer-001',
        email: 'customer@test.com',
        name: 'Test Customer',
        role: 'customer',
      };
      localStorage.setItem('gta_agent_auth', JSON.stringify(customerUser));

      // getUser() returns null for non-agent users, so requireAgent throws 'Authentication required'
      expect(() => requireAgent()).toThrow('Authentication required');
    });

    it('should return user for authenticated agents', () => {
      const testUser: User = {
        id: 'test-001',
        email: 'agent@test.com',
        name: 'Test Agent',
        role: 'agent',
      };

      setUser(testUser);
      const user = requireAgent();

      expect(user).toEqual(testUser);
    });
  });

  describe('Demo Login', () => {
    it('should create demo agent user with default email', () => {
      const user = demoLogin();

      expect(user.role).toBe('agent');
      expect(user.email).toBe('agent@greentech.africa');
      expect(user.verified_agent).toBe(true);
      expect(user.location).toBe('Accra, Ghana');
    });

    it('should create demo agent user with custom email', () => {
      const customEmail = 'custom@test.com';
      const user = demoLogin(customEmail);

      expect(user.email).toBe(customEmail);
      expect(user.role).toBe('agent');
    });

    it('should store user and token', () => {
      demoLogin();

      expect(getUser()).not.toBeNull();
      expect(getToken()).not.toBeNull();
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('gta_agent_auth', 'invalid-json');

      const user = getUser();
      expect(user).toBeNull();
    });

    it('should handle missing role in user data', () => {
      const invalidUser = {
        id: 'test-001',
        email: 'test@test.com',
        name: 'Test User',
        // Missing role
      };
      localStorage.setItem('gta_agent_auth', JSON.stringify(invalidUser));

      const user = getUser();
      expect(user).toBeNull();
    });
  });

  describe('Ghana-Specific Fields', () => {
    it('should store Ghana location information', () => {
      const testUser: User = {
        id: 'test-001',
        email: 'agent@test.com',
        name: 'Test Agent',
        role: 'agent',
        location: 'Kumasi, Ghana',
        phone: '+233 24 123 4567',
      };

      setUser(testUser);
      const retrieved = getUser();

      expect(retrieved?.location).toBe('Kumasi, Ghana');
      expect(retrieved?.phone).toBe('+233 24 123 4567');
    });

    it('should handle verified agent status', () => {
      const testUser: User = {
        id: 'test-001',
        email: 'agent@test.com',
        name: 'Test Agent',
        role: 'agent',
        verified_agent: true,
      };

      setUser(testUser);
      const retrieved = getUser();

      expect(retrieved?.verified_agent).toBe(true);
    });
  });
});

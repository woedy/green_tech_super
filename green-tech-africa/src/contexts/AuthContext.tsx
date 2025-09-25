import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  AuthUser,
  Role,
  StoredAuthState,
  clearAuthState,
  loadAuthState,
  saveAuthState,
} from "@/lib/authStorage";

export type RegisterPayload = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userType?: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredAuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialise = async () => {
      const stored = loadAuthState();
      if (!stored?.accessToken) {
        setIsLoading(false);
        return;
      }

      setState(stored);
      try {
        const profile = await api.get<AuthUser>("/api/v1/accounts/profile/");
        const nextState: StoredAuthState = { ...stored, user: profile };
        saveAuthState(nextState);
        setState(nextState);
      } catch (error) {
        clearAuthState();
        setState(null);
      } finally {
        setIsLoading(false);
      }
    };

    initialise();
  }, []);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const response = await api.post<{
      access: string;
      refresh: string;
      user: AuthUser;
    }>("/api/v1/accounts/login/", { email, password });

    const nextState: StoredAuthState = {
      accessToken: response.access,
      refreshToken: response.refresh,
      user: response.user,
    };
    saveAuthState(nextState);
    setState(nextState);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await api.post("/api/v1/accounts/register/", {
      email: payload.email,
      password: payload.password,
      confirm_password: payload.confirmPassword,
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone_number: payload.phoneNumber,
      user_type: payload.userType ?? "CUSTOMER",
    });
  }, []);

  const logout = useCallback(() => {
    clearAuthState();
    setState(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: state?.user ?? null,
    isAuthenticated: Boolean(state?.accessToken && state?.user?.is_verified),
    isLoading,
    login,
    register,
    logout,
  }), [state, isLoading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export type { AuthUser, Role } from "@/lib/authStorage";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearUser, getUser, setUser, DemoUser } from "@/lib/demoAuth";

export type Role = "customer" | "agent" | "admin";

export type AuthUser = DemoUser & { role?: Role };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (payload: { email: string; password?: string; name?: string; role?: Role }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const u = getUser();
    return u ? { ...u, role: "customer" } : null; // default to customer in demo
  });

  // Sync with localStorage changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "gta_auth") {
        const u = getUser();
        setUserState(u ? { ...u, role: u?.name === "admin" ? "admin" : "customer" } : null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = async ({ email, name, role }: { email: string; password?: string; name?: string; role?: Role }) => {
    // Demo only: set local user. Replace with API call when backend is ready.
    const demo: AuthUser = { id: crypto.randomUUID(), email, name, role: role ?? "customer" };
    setUser(demo);
    setUserState(demo);
  };

  const logout = () => {
    clearUser();
    setUserState(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    login,
    logout,
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

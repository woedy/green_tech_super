export type StoredAuthState = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type AuthUser = {
  id: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  user_type: Role;
  is_verified: boolean;
};

export type Role = "CUSTOMER" | "AGENT" | "BUILDER" | "ADMIN";

const STORAGE_KEY = "gta_auth_state";

export function loadAuthState(): StoredAuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuthState;
  } catch (error) {
    console.warn("Failed to parse auth state", error);
    return null;
  }
}

export function saveAuthState(state: StoredAuthState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearAuthState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

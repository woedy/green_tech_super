export type DemoUser = {
  id: string;
  email: string;
  name?: string;
};

const KEY = "gta_auth";

export function getUser(): DemoUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function setUser(user: DemoUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEY);
}


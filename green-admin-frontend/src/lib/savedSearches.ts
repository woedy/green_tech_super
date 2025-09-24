export type SavedSearch = {
  id: string;
  name: string;
  createdAt: string;
  filters: Record<string, unknown>;
  alerts?: boolean;
};

const KEY = "gta_saved_searches";

export function getSavedSearches(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedSearch[]) : [];
  } catch {
    return [];
  }
}

export function saveSearch(name: string, filters: Record<string, unknown>): SavedSearch[] {
  const all = getSavedSearches();
  const item: SavedSearch = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    filters,
    alerts: false,
  };
  const next = [item, ...all];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function toggleAlerts(id: string): SavedSearch[] {
  const all = getSavedSearches().map((s) => (s.id === id ? { ...s, alerts: !s.alerts } : s));
  localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}

export function deleteSavedSearch(id: string): SavedSearch[] {
  const next = getSavedSearches().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}


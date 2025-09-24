const KEY = "gta_favorites";

export function getFavorites(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id: number) {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: number): number[] {
  const set = new Set(getFavorites());
  if (set.has(id)) set.delete(id); else set.add(id);
  const arr = Array.from(set);
  localStorage.setItem(KEY, JSON.stringify(arr));
  return arr;
}


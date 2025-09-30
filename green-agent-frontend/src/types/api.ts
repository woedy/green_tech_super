export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function asArray<T>(payload: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray((payload as PaginatedResponse<T>).results)) {
    return (payload as PaginatedResponse<T>).results;
  }
  return [];
}

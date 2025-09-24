import { getUser } from "@/lib/demoAuth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const user = getUser();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach bearer token when backend auth is ready (placeholder)
  if (user && (headers as any)["Authorization"] === undefined) {
    // example: headers["Authorization"] = `Bearer ${user.token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await res.json() : (await res.text());

  if (!res.ok) {
    const message = (isJson && (data as any)?.detail) || res.statusText || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  get: <T = any>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: "GET" }),
  post: <T = any>(path: string, body?: any, init?: RequestInit) => apiFetch<T>(path, { ...init, method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T = any>(path: string, body?: any, init?: RequestInit) => apiFetch<T>(path, { ...init, method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T = any>(path: string, body?: any, init?: RequestInit) => apiFetch<T>(path, { ...init, method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T = any>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: "DELETE" }),
};

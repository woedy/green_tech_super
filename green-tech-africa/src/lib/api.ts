import { clearAuthState, loadAuthState, saveAuthState } from "@/lib/authStorage";

type RefreshResponse = {
  access: string;
  refresh?: string;
};

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function refreshAccessToken(): Promise<string | null> {
  const state = loadAuthState();
  if (!state?.refreshToken) return null;

  const res = await fetch(`${BASE_URL}/api/v1/accounts/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: state.refreshToken }),
  });

  if (!res.ok) {
    clearAuthState();
    return null;
  }

  const data = (await res.json()) as RefreshResponse;
  const updated = {
    ...state,
    accessToken: data.access,
    refreshToken: data.refresh ?? state.refreshToken,
  };
  saveAuthState(updated);
  return updated.accessToken;
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const authState = loadAuthState();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  let headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (!isFormData && options.body !== undefined && !(headers as Record<string, string>)["Content-Type"]) {
    headers = {
      "Content-Type": "application/json",
      ...headers,
    };
  }

  if (authState?.accessToken && (headers as any)["Authorization"] === undefined) {
    headers = {
      ...headers,
      Authorization: `Bearer ${authState.accessToken}`,
    };
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await res.json() : (await res.text());

  if (res.status === 401 && retry && authState?.refreshToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
  }

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
  postForm: <T = any>(path: string, formData: FormData, init?: RequestInit) => apiFetch<T>(path, { ...init, method: "POST", body: formData }),
};

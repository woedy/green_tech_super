import { AgentAnalyticsPayload } from "@/types/analytics";
import { PaginatedResponse } from "@/types/api";
import {
  ProjectChatMessage,
  ProjectChatReadEvent,
  ProjectChatTypingEvent,
} from "@/types/chat";
import {
  ProjectDashboardPayload,
  ProjectSummary,
  ProjectTask,
  ProjectMilestoneItem,
} from "@/types/project";
import { Lead } from "@/types/lead";
import { QuoteSummary } from "@/types/quote";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

function withBase(url: string): string {
  if (url.startsWith("http")) {
    return url;
  }
  
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  console.log('API URL from env:', import.meta.env.VITE_API_URL);
  console.log('Using API URL:', apiUrl);
  
  if (url.startsWith("/")) {
    const fullUrl = `${apiUrl}${url}`;
    console.log('Full URL:', fullUrl);
    return fullUrl;
  }
  return `${apiUrl}/api/${url}`;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET") as HttpMethod;
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (method !== "GET" && method !== "HEAD" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Add JWT token if available
  const token = localStorage.getItem('gta_agent_token');
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(withBase(path), {
    credentials: "include",
    ...init,
    headers,
  });

  if (!response.ok) {
    const detail = await safeParseError(response);
    throw new Error(detail ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type");
  if (contentType && !contentType.includes("json")) {
    const text = await response.text();
    return text as unknown as T;
  }

  return (await response.json()) as T;
}

async function safeParseError(response: Response): Promise<string | null> {
  try {
    const data = await response.json();
    if (typeof data === "string") {
      return data;
    }
    if (data?.detail) {
      return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    }
    return JSON.stringify(data);
  } catch (err) {
    return response.statusText || (err instanceof Error ? err.message : null);
  }
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function toQuery(params: QueryParams = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function fetchAgentAnalytics(params: { startDate?: string; endDate?: string } = {}): Promise<AgentAnalyticsPayload> {
  const query = toQuery({ start_date: params.startDate, end_date: params.endDate });
  return apiFetch<AgentAnalyticsPayload>(`/api/construction/analytics/agent-dashboard/${query}`);
}

export async function downloadAgentAnalyticsCsv(params: { startDate?: string; endDate?: string } = {}): Promise<Blob> {
  const query = toQuery({ start_date: params.startDate, end_date: params.endDate, format: "csv" });
  const response = await fetch(withBase(`/api/construction/analytics/agent-dashboard/${query}`), {
    credentials: "include",
  });
  if (!response.ok) {
    const detail = await safeParseError(response);
    throw new Error(detail ?? `CSV download failed (${response.status})`);
  }
  return await response.blob();
}

export async function fetchProjects(params: { status?: string } = {}): Promise<PaginatedResponse<ProjectSummary>> {
  const query = toQuery({ status: params.status });
  return apiFetch<PaginatedResponse<ProjectSummary>>(`/api/construction/projects/${query}`);
}

export async function fetchProjectDashboard(projectId: string): Promise<ProjectDashboardPayload> {
  return apiFetch<ProjectDashboardPayload>(`/api/construction/projects/${projectId}/dashboard/`);
}

export async function fetchProjectTasks(projectId: string): Promise<PaginatedResponse<ProjectTask>> {
  return apiFetch<PaginatedResponse<ProjectTask>>(`/api/construction/projects/${projectId}/tasks/`);
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  payload: Partial<Pick<ProjectTask, "status">>,
): Promise<ProjectTask> {
  return apiFetch<ProjectTask>(`/api/construction/projects/${projectId}/tasks/${taskId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchProjectChatMessages(projectId: string): Promise<PaginatedResponse<ProjectChatMessage>> {
  return apiFetch<PaginatedResponse<ProjectChatMessage>>(`/api/construction/projects/${projectId}/chat-messages/`);
}

export async function postProjectChatMessage(
  projectId: string,
  payload: { body: string; quote?: string | null },
): Promise<ProjectChatMessage> {
  return apiFetch<ProjectChatMessage>(`/api/construction/projects/${projectId}/chat-messages/`, {
    method: "POST",
    body: JSON.stringify({
      body: payload.body,
      quote: payload.quote ?? null,
    }),
  });
}

export async function fetchRecentLeads(limit = 5): Promise<PaginatedResponse<Lead>> {
  const query = toQuery({ page_size: limit });
  return apiFetch<PaginatedResponse<Lead>>(`/api/leads/${query}`);
}

export async function fetchRecentQuotes(limit = 5): Promise<PaginatedResponse<QuoteSummary>> {
  const query = toQuery({ page_size: limit });
  return apiFetch<PaginatedResponse<QuoteSummary>>(`/api/quotes/${query}`);
}

export async function fetchQuotes(params: { status?: string; build_request?: string; customer_email?: string } = {}): Promise<PaginatedResponse<QuoteSummary>> {
  const query = toQuery(params);
  return apiFetch<PaginatedResponse<QuoteSummary>>(`/api/quotes/${query}`);
}

export async function fetchQuoteDetail(quoteId: string): Promise<import("@/types/quote").QuoteDetail> {
  return apiFetch<import("@/types/quote").QuoteDetail>(`/api/quotes/${quoteId}/`);
}

export async function createQuote(payload: {
  build_request: string;
  notes?: string;
  terms?: string;
  prepared_by_name?: string;
  prepared_by_email?: string;
  recipient_name?: string;
  recipient_email?: string;
  items: Array<{
    kind: string;
    label: string;
    quantity: number;
    unit_cost: number;
    apply_region_multiplier: boolean;
    position: number;
  }>;
}): Promise<import("@/types/quote").QuoteDetail> {
  return apiFetch<import("@/types/quote").QuoteDetail>(`/api/quotes/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuote(
  quoteId: string,
  payload: {
    notes?: string;
    terms?: string;
    prepared_by_name?: string;
    prepared_by_email?: string;
    recipient_name?: string;
    recipient_email?: string;
    items?: Array<{
      kind: string;
      label: string;
      quantity: number;
      unit_cost: number;
      apply_region_multiplier: boolean;
      position: number;
    }>;
  }
): Promise<import("@/types/quote").QuoteDetail> {
  return apiFetch<import("@/types/quote").QuoteDetail>(`/api/quotes/${quoteId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function sendQuote(quoteId: string): Promise<import("@/types/quote").QuoteDetail> {
  return apiFetch<import("@/types/quote").QuoteDetail>(`/api/quotes/${quoteId}/send/`, {
    method: "POST",
  });
}

export async function markQuoteViewed(quoteId: string): Promise<import("@/types/quote").QuoteDetail> {
  return apiFetch<import("@/types/quote").QuoteDetail>(`/api/quotes/${quoteId}/view/`, {
    method: "POST",
  });
}

export async function acceptQuote(quoteId: string, payload: { signature_name: string; signature_email?: string }): Promise<import("@/types/quote").QuoteDetail> {
  return apiFetch<import("@/types/quote").QuoteDetail>(`/api/quotes/${quoteId}/accept/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function declineQuote(quoteId: string): Promise<import("@/types/quote").QuoteDetail> {
  return apiFetch<import("@/types/quote").QuoteDetail>(`/api/quotes/${quoteId}/decline/`, {
    method: "POST",
  });
}

export type ProjectChatSocketEvent =
  | { type: "message"; payload: ProjectChatMessage }
  | { type: "typing"; payload: ProjectChatTypingEvent }
  | { type: "read"; payload: ProjectChatReadEvent };

export async function updateProjectMilestone(
  projectId: string,
  milestoneId: string,
  payload: {
    title?: string;
    status?: string;
    progress?: number;
    notes?: string;
    photos?: File[];
  }
): Promise<ProjectMilestoneItem> {
  const formData = new FormData();
  
  if (payload.title) formData.append('title', payload.title);
  if (payload.status) formData.append('status', payload.status);
  if (payload.progress !== undefined) formData.append('progress', payload.progress.toString());
  if (payload.notes) formData.append('notes', payload.notes);
  
  if (payload.photos) {
    payload.photos.forEach((photo, index) => {
      formData.append(`photos[${index}]`, photo);
    });
  }

  return apiFetch<ProjectMilestoneItem>(`/api/construction/projects/${projectId}/milestones/${milestoneId}/`, {
    method: "PATCH",
    body: formData,
    headers: {}, // Let browser set Content-Type for FormData
  });
}

export async function createChangeOrder(
  projectId: string,
  payload: {
    title: string;
    description: string;
    reason: string;
    items: Array<{
      description: string;
      type: "addition" | "removal" | "modification";
      quantity: number;
      unitCost: number;
      laborHours?: number;
      materialCost?: number;
    }>;
    estimatedDays?: number;
    totalCostImpact: number;
  }
): Promise<any> {
  return apiFetch<any>(`/api/construction/projects/${projectId}/change-orders/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchChangeOrders(projectId: string): Promise<any[]> {
  return apiFetch<any[]>(`/api/construction/projects/${projectId}/change-orders/`);
}

export function createProjectChatSocket(projectId: string): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  return new WebSocket(`${protocol}://${host}/ws/projects/${projectId}/chat/`);
}

// Authentication API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_type: 'ADMIN' | 'AGENT' | 'BUILDER' | 'CUSTOMER';
    is_verified: boolean;
    phone_number?: string;
  };
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'ADMIN' | 'AGENT' | 'BUILDER' | 'CUSTOMER';
  is_verified: boolean;
  phone_number?: string;
}

export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function getUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/auth/profile/');
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  user_type: 'AGENT' | 'BUILDER' | 'CUSTOMER';
}

export interface RegisterResponse {
  message: string;
}

export async function registerUser(userData: RegisterRequest): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}
export async function refreshAccessToken(refreshToken: string): Promise<{ access: string }> {
  return apiFetch<{ access: string }>('/api/auth/token/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
  });
}
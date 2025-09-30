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
} from "@/types/project";
import { Lead } from "@/types/lead";
import { QuoteSummary } from "@/types/quote";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

function withBase(url: string): string {
  if (url.startsWith("http")) {
    return url;
  }
  if (url.startsWith("/")) {
    return url;
  }
  return `/api/${url}`;
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

export type ProjectChatSocketEvent =
  | { type: "message"; payload: ProjectChatMessage }
  | { type: "typing"; payload: ProjectChatTypingEvent }
  | { type: "read"; payload: ProjectChatReadEvent };

export function createProjectChatSocket(projectId: string): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  return new WebSocket(`${protocol}://${host}/ws/projects/${projectId}/chat/`);
}

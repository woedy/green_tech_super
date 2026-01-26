import { clearAuthState, loadAuthState, saveAuthState } from "@/lib/authStorage";

type RefreshResponse = {
  access: string;
  refresh?: string;
};

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function refreshAccessToken(): Promise<string | null> {
  const state = loadAuthState();
  if (!state?.refreshToken) return null;

  const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
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

  const fullUrl = `${BASE_URL}${path}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  
  if (!isJson && !res.ok) {
    // Log non-JSON responses for debugging
    const textResponse = await res.text();
    console.error("Non-JSON API response:", {
      url: fullUrl,
      status: res.status,
      contentType,
      response: textResponse.substring(0, 200)
    });
    throw new Error(`API returned ${res.status}: ${res.statusText}`);
  }
  
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

// Dashboard API methods
export interface CustomerDashboardMetrics {
  overview: {
    total_leads: number;
    total_quotes: number;
    total_projects: number;
    active_projects: number;
  };
  leads: {
    total: number;
    status_breakdown: Record<string, number>;
    pending: number;
  };
  quotes: {
    total: number;
    status_breakdown: Record<string, number>;
    pending: number;
    accepted: number;
  };
  projects: {
    total: number;
    status_breakdown: Record<string, number>;
    active: number;
    completed: number;
  };
  recent_activities: Array<{
    id: string;
    type: 'lead_created' | 'quote_received' | 'project_update' | 'milestone_completed' | 'document_uploaded' | 'message_received' | 'payment_due';
    title: string;
    description: string;
    timestamp: string;
    project_id?: number;
    project_title?: string;
  }>;
}

export interface CustomerNotifications {
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    action_url?: string;
    action_label?: string;
  }>;
  preferences: {
    email: boolean;
    sms: boolean;
    in_app: boolean;
    project_updates: boolean;
    quote_notifications: boolean;
    payment_reminders: boolean;
    marketing_emails: boolean;
  };
  unread_count: number;
}

export const dashboardApi = {
  getCustomerDashboard: (): Promise<CustomerDashboardMetrics> => 
    api.get<CustomerDashboardMetrics>('/api/dashboard/customer/'),
  
  getCustomerNotifications: (): Promise<CustomerNotifications> => 
    api.get<CustomerNotifications>('/api/dashboard/notifications/'),
  
  updateNotificationPreferences: (preferences: CustomerNotifications['preferences']): Promise<{ preferences: CustomerNotifications['preferences']; message: string }> => 
    api.patch('/api/dashboard/notifications/', { preferences }),
  
  markNotificationAsRead: (notificationId: string): Promise<void> => 
    api.patch(`/api/dashboard/notifications/${notificationId}/read/`),
  
  markAllNotificationsAsRead: (): Promise<void> => 
    api.patch('/api/dashboard/notifications/mark-all-read/'),
};

export type BuildRequestAttachment = {
  id: number;
  storage_key: string;
  original_name: string;
  uploaded_at: string;
};

export type BuildRequest = {
  id: string;
  plan: string;
  region: string;
  plan_details: {
    name: string;
    slug: string;
    base_price: string;
    currency: string;
    options: Array<{ id: number; name: string; price_delta: string }>;
  };
  region_details: {
    name: string;
    slug: string;
    country: string;
    currency_code: string;
    cost_multiplier: string;
  };
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  budget_currency: string;
  budget_min: string | null;
  budget_max: string | null;
  timeline: string;
  customizations: string;
  options: string[];
  intake_data: Record<string, any>;
  attachments: BuildRequestAttachment[];
  submitted_at: string;
};

export interface PaginatedBuildRequestsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BuildRequest[];
}

export const buildRequestsApi = {
  list: (params?: { page?: number }): Promise<PaginatedBuildRequestsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    const queryString = searchParams.toString();
    const url = `/api/build-requests/${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedBuildRequestsResponse>(url);
  },

  get: (id: string): Promise<BuildRequest> => api.get<BuildRequest>(`/api/build-requests/${id}/`),
};

// Public API functions (no authentication required)
export interface PublicProject {
  id: number;
  title: string;
  description: string;
  status: string;
  status_display: string;
  category: 'residential' | 'commercial' | 'industrial';
  location: string;
  year: string;
  image: string;
  area: string;
  units: string;
  features: string[];
}

export interface ConstructionRequest {
  id: number;
  title: string;
  description: string;
  construction_type: string;
  construction_type_display: string;
  status: string;
  status_display: string;
  current_step: string;
  current_step_display: string;
  is_completed: boolean;
  customization_data: Record<string, any>;
  property: number | null;
  property_data: any;
  address: string;
  city: string;
  region: string;
  start_date: string | null;
  estimated_end_date: string | null;
  actual_end_date: string | null;
  budget: number | null;
  currency: string;
  estimated_cost: number | null;
  target_energy_rating: number | null;
  target_water_rating: number | null;
  target_sustainability_score: number | null;
  client: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  project_manager: any;
  contractors: any[];
  selected_eco_features: any[];
  milestones: any[];
  documents: any[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedConstructionRequestsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ConstructionRequest[];
}

export interface PaginatedProjectsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PublicProject[];
}

export interface ViewingAppointment {
  id: string;
  scheduled_for: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | string;
  notes: string;
  created_at: string;
  updated_at: string;
  property: number;
  property_title: string;
  property_slug: string;
  property_image: string | null;
  city: string;
  region: string;
  country: string;
}

export interface ViewingAppointmentDetail extends ViewingAppointment {
  inquiry: {
    id: string;
    property: number;
    name: string;
    email: string;
    phone: string;
    message: string;
    status: string;
    created_at: string;
  };
}

export interface PaginatedAppointmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ViewingAppointment[];
}

export interface ProjectStats {
  total_projects: number;
  completed_projects: number;
  ongoing_projects: number;
  countries_served: number;
  total_area_developed: string;
  client_satisfaction: number;
}

// Public API fetch function (no authentication)
async function publicApiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const fullUrl = `${BASE_URL}${path}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  
  if (!isJson && !res.ok) {
    const textResponse = await res.text();
    console.error("Non-JSON API response:", {
      url: fullUrl,
      status: res.status,
      contentType,
      response: textResponse.substring(0, 200)
    });
    throw new Error(`API returned ${res.status}: ${res.statusText}`);
  }
  
  const data = isJson ? await res.json() : (await res.text());

  if (!res.ok) {
    const message = (isJson && (data as any)?.detail) || res.statusText || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export const publicApi = {
  // Get all projects (with optional filtering)
  getProjects: (params?: { category?: string; status?: string; search?: string; page?: number }): Promise<PaginatedProjectsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    
    const queryString = searchParams.toString();
    const url = `/api/construction/public/projects/${queryString ? `?${queryString}` : ''}`;
    
    return publicApiFetch<PaginatedProjectsResponse>(url);
  },
  
  // Get featured projects for homepage
  getFeaturedProjects: (): Promise<PublicProject[]> => 
    publicApiFetch<PublicProject[]>('/api/construction/public/projects/featured/'),
  
  // Get project statistics
  getProjectStats: (): Promise<ProjectStats> => 
    publicApiFetch<ProjectStats>('/api/construction/public/projects/stats/'),
  
  // Get single project by ID
  getProject: (id: number): Promise<PublicProject> => 
    publicApiFetch<PublicProject>(`/api/construction/public/projects/${id}/`),
};

// Construction Requests API functions (authentication required)
export const constructionRequestsApi = {
  // Get all construction requests for the authenticated user
  getConstructionRequests: (params?: { status?: string; page?: number }): Promise<PaginatedConstructionRequestsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    
    const queryString = searchParams.toString();
    const url = `/api/construction/construction-requests/${queryString ? `?${queryString}` : ''}`;
    
    return api.get<PaginatedConstructionRequestsResponse>(url);
  },
  
  // Get single construction request by ID
  getConstructionRequest: (id: number): Promise<ConstructionRequest> => 
    api.get<ConstructionRequest>(`/api/construction/construction-requests/${id}/`),
  
  // Create a new construction request
  createConstructionRequest: (data: Partial<ConstructionRequest>): Promise<ConstructionRequest> => 
    api.post<ConstructionRequest>('/api/construction/construction-requests/', data),
  
  // Update a construction request
  updateConstructionRequest: (id: number, data: Partial<ConstructionRequest>): Promise<ConstructionRequest> => 
    api.patch<ConstructionRequest>(`/api/construction/construction-requests/${id}/`, data),
  
  // Delete a construction request
  deleteConstructionRequest: (id: number): Promise<void> => 
    api.delete<void>(`/api/construction/construction-requests/${id}/`),
};

// Appointments API (authenticated)
export const appointmentsApi = {
  list: (params?: { page?: number }): Promise<PaginatedAppointmentsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());

    const queryString = searchParams.toString();
    const url = `/api/appointments/${queryString ? `?${queryString}` : ''}`;

    return api.get<PaginatedAppointmentsResponse>(url);
  },
  get: (id: string): Promise<ViewingAppointmentDetail> => api.get<ViewingAppointmentDetail>(`/api/appointments/${id}/`),
};

export type QuoteChatAttachment = {
  id: string;
  file: string | null;
  uploaded_at: string;
};

export type QuoteChatReceipt = {
  user: {
    id: number | string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string | null;
    user_type: string;
    is_verified: boolean;
  };
  read_at: string;
};

export type QuoteChatMessage = {
  id: string;
  quote: string;
  sender: QuoteChatReceipt["user"] | null;
  body: string;
  attachments: QuoteChatAttachment[];
  metadata?: Record<string, unknown> | null;
  created_at: string;
  edited_at: string | null;
  receipts: QuoteChatReceipt[];
};

export type QuoteChatSocketEvent =
  | { type: "message"; payload: QuoteChatMessage }
  | { type: "typing"; payload: { user_id: number | string; is_typing: boolean } }
  | { type: "read"; payload: { message_id: string; user_id: number | string; read_at: string } };

function getWsBaseUrl() {
  try {
    const url = new URL(BASE_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString().replace(/\/$/, "");
  } catch {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    return `${protocol}://${host}`;
  }
}

export const quoteChatApi = {
  listMessages: (quoteId: string): Promise<QuoteChatMessage[]> =>
    api.get<QuoteChatMessage[]>(`/api/quotes/${quoteId}/messages/`),

  sendMessage: (quoteId: string, payload: { body: string }): Promise<QuoteChatMessage> =>
    api.post<QuoteChatMessage>(`/api/quotes/${quoteId}/messages/`, { body: payload.body }),

  createQuoteChatSocket: (quoteId: string): WebSocket => {
    const state = loadAuthState();
    const token = state?.accessToken ? `?token=${encodeURIComponent(state.accessToken)}` : "";
    return new WebSocket(`${getWsBaseUrl()}/ws/quotes/${quoteId}/chat/${token}`);
  },
};

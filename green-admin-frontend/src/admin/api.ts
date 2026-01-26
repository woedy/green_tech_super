import type { PlanPayload, PlanResponse, PropertyPayload, PropertyResponse, RegionPayload, RegionResponse, NotificationTemplatePayload, NotificationTemplateResponse, SiteDocumentPayload, SiteDocumentResponse, SiteDocumentVersionPayload, SiteDocumentVersionResponse, AdminDashboardMetrics } from './types/api';

const explicitBase = import.meta.env.VITE_API_BASE_URL
  ? (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, '')
  : null;
const apiDomain = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
const apiPath = (import.meta.env.VITE_API_BASE_PATH as string | undefined) ?? '/api';

const API_BASE =
  explicitBase ??
  (apiDomain
    ? `${apiDomain}${apiPath.startsWith('/') ? '' : '/'}${apiPath}`.replace(/\/$/, '')
    : apiPath);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('admin_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    let detail: string;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        detail = errorData.detail || errorData.message || `Request failed with status ${response.status}`;
      } else {
        detail = await response.text() || `Request failed with status ${response.status}`;
      }
    } catch {
      detail = `Request failed with status ${response.status}`;
    }
    const error = new Error(detail);
    (error as any).status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const adminApi = {
  listPlans(): Promise<PlanResponse[]> {
    return request<PlanResponse[]>('/admin/plans/');
  },
  getPlan(id: number): Promise<PlanResponse> {
    return request<PlanResponse>(`/admin/plans/${id}/`);
  },
  createPlan(payload: PlanPayload): Promise<PlanResponse> {
    return request<PlanResponse>('/admin/plans/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updatePlan(id: number, payload: PlanPayload): Promise<PlanResponse> {
    return request<PlanResponse>(`/admin/plans/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deletePlan(id: number): Promise<void> {
    return request<void>(`/admin/plans/${id}/`, { method: 'DELETE' });
  },
  publishPlan(id: number): Promise<PlanResponse> {
    return request<PlanResponse>(`/admin/plans/${id}/publish/`, { method: 'POST' });
  },
  unpublishPlan(id: number): Promise<PlanResponse> {
    return request<PlanResponse>(`/admin/plans/${id}/unpublish/`, { method: 'POST' });
  },

  listProperties(): Promise<PropertyResponse[]> {
    return request<PropertyResponse[]>('/admin/properties/');
  },
  getProperty(id: number): Promise<PropertyResponse> {
    return request<PropertyResponse>(`/admin/properties/${id}/`);
  },
  createProperty(payload: PropertyPayload): Promise<PropertyResponse> {
    return request<PropertyResponse>('/admin/properties/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateProperty(id: number, payload: PropertyPayload): Promise<PropertyResponse> {
    return request<PropertyResponse>(`/admin/properties/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteProperty(id: number): Promise<void> {
    return request<void>(`/admin/properties/${id}/`, { method: 'DELETE' });
  },

  listRegions(): Promise<RegionResponse[]> {
    return request<RegionResponse[]>('/admin/regions/');
  },
  getRegion(id: number): Promise<RegionResponse> {
    return request<RegionResponse>(`/admin/regions/${id}/`);
  },
  createRegion(payload: RegionPayload): Promise<RegionResponse> {
    return request<RegionResponse>('/admin/regions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateRegion(id: number, payload: RegionPayload): Promise<RegionResponse> {
    return request<RegionResponse>(`/admin/regions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteRegion(id: number): Promise<void> {
    return request<void>(`/admin/regions/${id}/`, { method: 'DELETE' });
  },

  listNotificationTemplates(): Promise<NotificationTemplateResponse[]> {
    return request<NotificationTemplateResponse[]>('/admin/notifications/templates/');
  },
  getNotificationTemplate(id: string): Promise<NotificationTemplateResponse> {
    return request<NotificationTemplateResponse>(`/admin/notifications/templates/${id}/`);
  },
  upsertNotificationTemplate(id: string | null, payload: NotificationTemplatePayload): Promise<NotificationTemplateResponse> {
    if (id) {
      return request<NotificationTemplateResponse>(`/admin/notifications/templates/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    return request<NotificationTemplateResponse>('/admin/notifications/templates/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  deleteNotificationTemplate(id: string): Promise<void> {
    return request<void>(`/admin/notifications/templates/${id}/`, { method: 'DELETE' });
  },

  listSiteDocuments(): Promise<SiteDocumentResponse[]> {
    return request<SiteDocumentResponse[]>('/admin/site-documents/');
  },
  getSiteDocument(id: number): Promise<SiteDocumentResponse> {
    return request<SiteDocumentResponse>(`/admin/site-documents/${id}/`);
  },
  createSiteDocument(payload: SiteDocumentPayload): Promise<SiteDocumentResponse> {
    return request<SiteDocumentResponse>('/admin/site-documents/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateSiteDocument(id: number, payload: SiteDocumentPayload): Promise<SiteDocumentResponse> {
    return request<SiteDocumentResponse>(`/admin/site-documents/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteSiteDocument(id: number): Promise<void> {
    return request<void>(`/admin/site-documents/${id}/`, { method: 'DELETE' });
  },
  createSiteDocumentVersion(payload: SiteDocumentVersionPayload): Promise<SiteDocumentVersionResponse> {
    return request<SiteDocumentVersionResponse>('/admin/site-document-versions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  publishSiteDocumentVersion(id: number): Promise<SiteDocumentVersionResponse> {
    return request<SiteDocumentVersionResponse>(`/admin/site-document-versions/${id}/publish/`, { method: 'POST' });
  },
  archiveSiteDocumentVersion(id: number): Promise<SiteDocumentVersionResponse> {
    return request<SiteDocumentVersionResponse>(`/admin/site-document-versions/${id}/archive/`, { method: 'POST' });
  },

  // Dashboard API
  getDashboardMetrics(params?: { start_date?: string; end_date?: string }): Promise<AdminDashboardMetrics> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<AdminDashboardMetrics>(`/dashboard/admin/${query}`);
  },
};

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
  };
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'ADMIN' | 'AGENT' | 'BUILDER' | 'CUSTOMER';
  is_verified: boolean;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function getProfile(): Promise<User> {
  return request<User>('/auth/profile/');
}

export async function refreshToken(refreshToken: string): Promise<{ access: string }> {
  return request<{ access: string }>('/auth/token/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
  });
}
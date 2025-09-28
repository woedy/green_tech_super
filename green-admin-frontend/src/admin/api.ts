import type { PlanPayload, PlanResponse, PropertyPayload, PropertyResponse, RegionPayload, RegionResponse, NotificationTemplatePayload, NotificationTemplateResponse, SiteDocumentPayload, SiteDocumentResponse, SiteDocumentVersionPayload, SiteDocumentVersionResponse } from './types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text();
    }
    const error = new Error(`Request failed with status ${response.status}`);
    (error as any).detail = detail;
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
};

import type { PlanPayload, PlanResponse, PropertyPayload, PropertyResponse, RegionPayload, RegionResponse, NotificationTemplatePayload, NotificationTemplateResponse, SiteDocumentPayload, SiteDocumentResponse, SiteDocumentVersionPayload, SiteDocumentVersionResponse, AdminDashboardMetrics, UserResponse, UserPayload, BulkUserUpdate, BulkUpdateResponse } from './types/api';

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
    
    // Handle permission errors specifically
    if (response.status === 403) {
      detail = 'Access denied. Admin privileges required. Please ensure your account has admin permissions.';
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

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const adminApi = {
  async listPlans(): Promise<PlanResponse[]> {
    const response = await request<PlanResponse[] | PaginatedResponse<PlanResponse>>('/admin/plans/');
    // Handle both paginated and non-paginated responses
    return Array.isArray(response) ? response : response.results;
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
  uploadPlanImage(file: File): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('admin_access_token');
    return fetch(`${API_BASE}/admin/plans/upload-image/`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Upload failed');
      }
      return response.json();
    });
  },

  uploadPropertyImage(file: File): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('admin_access_token');
    return fetch(`${API_BASE}/admin/properties/upload-image/`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Upload failed');
      }
      return response.json();
    });
  },


  async listProperties(): Promise<PropertyResponse[]> {
    const response = await request<PropertyResponse[] | PaginatedResponse<PropertyResponse>>('/admin/properties/');
    return Array.isArray(response) ? response : response.results;
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

  async listRegions(): Promise<RegionResponse[]> {
    const response = await request<RegionResponse[] | PaginatedResponse<RegionResponse>>('/admin/regions/');
    return Array.isArray(response) ? response : response.results;
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

  async listNotificationTemplates(): Promise<NotificationTemplateResponse[]> {
    const response = await request<NotificationTemplateResponse[] | PaginatedResponse<NotificationTemplateResponse>>('/admin/notifications/templates/');
    return Array.isArray(response) ? response : response.results;
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

  async listSiteDocuments(): Promise<SiteDocumentResponse[]> {
    const response = await request<SiteDocumentResponse[] | PaginatedResponse<SiteDocumentResponse>>('/admin/site-documents/');
    return Array.isArray(response) ? response : response.results;
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

  // User Management API
  async listUsers(params?: { user_type?: string; is_active?: boolean; is_verified?: boolean; search?: string }): Promise<UserResponse[]> {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await request<UserResponse[] | PaginatedResponse<UserResponse>>(`/auth/admin/users/${query}`);
    return Array.isArray(response) ? response : response.results;
  },
  getUser(id: number): Promise<UserResponse> {
    return request<UserResponse>(`/auth/admin/users/${id}/`);
  },
  createUser(payload: UserPayload): Promise<UserResponse> {
    return request<UserResponse>('/auth/admin/users/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateUser(id: number, payload: Partial<UserPayload>): Promise<UserResponse> {
    return request<UserResponse>(`/auth/admin/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deleteUser(id: number): Promise<void> {
    return request<void>(`/auth/admin/users/${id}/`, { method: 'DELETE' });
  },
  bulkUpdateUsers(updates: BulkUserUpdate[]): Promise<BulkUpdateResponse> {
    return request<BulkUpdateResponse>('/auth/admin/users/bulk_update/', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  },
  toggleUserActive(id: number): Promise<UserResponse> {
    return request<UserResponse>(`/auth/admin/users/${id}/toggle_active/`, { method: 'POST' });
  },
  toggleUserVerified(id: number): Promise<UserResponse> {
    return request<UserResponse>(`/auth/admin/users/${id}/toggle_verified/`, { method: 'POST' });
  },

  // Project Management API
  projects: {
    async list(params?: { status?: string; phase?: string; search?: string }): Promise<PaginatedResponse<any>> {
      // Filter out undefined values
      const cleanParams: Record<string, string> = {};
      if (params?.status && params.status !== 'all') cleanParams.status = params.status;
      if (params?.phase && params.phase !== 'all') cleanParams.phase = params.phase;
      if (params?.search) cleanParams.search = params.search;
      
      const query = Object.keys(cleanParams).length > 0 
        ? `?${new URLSearchParams(cleanParams).toString()}` 
        : '';
      return request<PaginatedResponse<any>>(`/construction/admin/projects/${query}`);
    },
    get(id: number): Promise<any> {
      return request<any>(`/construction/admin/projects/${id}/`);
    },
    create(payload: any): Promise<any> {
      return request<any>('/construction/admin/projects/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    update(id: number, payload: any): Promise<any> {
      return request<any>(`/construction/admin/projects/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    delete(id: number): Promise<void> {
      return request<void>(`/construction/admin/projects/${id}/`, { method: 'DELETE' });
    },
    stats(): Promise<any> {
      return request<any>('/construction/admin/projects/stats/');
    },
    updateStatus(id: number, status: string, notes?: string): Promise<any> {
      return request<any>(`/construction/admin/projects/${id}/update_status/`, {
        method: 'POST',
        body: JSON.stringify({ status, notes }),
      });
    },
    assignManager(id: number, managerId: number): Promise<any> {
      return request<any>(`/construction/admin/projects/${id}/assign_manager/`, {
        method: 'POST',
        body: JSON.stringify({ manager_id: managerId }),
      });
    },
    assignSupervisor(id: number, supervisorId: number): Promise<any> {
      return request<any>(`/construction/admin/projects/${id}/assign_supervisor/`, {
        method: 'POST',
        body: JSON.stringify({ supervisor_id: supervisorId }),
      });
    },
  },

  // Client Request Management API
  requests: {
    // Build Requests
    buildRequests: {
      async list(params?: { status?: string; search?: string }): Promise<PaginatedResponse<any>> {
        const cleanParams: Record<string, string> = {};
        if (params?.status && params.status !== 'all') cleanParams.status = params.status;
        if (params?.search) cleanParams.search = params.search;
        
        const query = Object.keys(cleanParams).length > 0 
          ? `?${new URLSearchParams(cleanParams).toString()}` 
          : '';
        return request<PaginatedResponse<any>>(`/admin/build-requests/${query}`);
      },
      get(id: string): Promise<any> {
        return request<any>(`/admin/build-requests/${id}/`);
      },
      update(id: string, payload: any): Promise<any> {
        return request<any>(`/admin/build-requests/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      },
      updateStatus(id: string, status: string, notes?: string): Promise<any> {
        return request<any>(`/admin/build-requests/${id}/update_status/`, {
          method: 'POST',
          body: JSON.stringify({ status, notes }),
        });
      },
      convertToConstructionRequest(id: string, data?: { title?: string; description?: string }): Promise<any> {
        return request<any>(`/admin/build-requests/${id}/convert_to_construction_request/`, {
          method: 'POST',
          body: JSON.stringify(data || {}),
        });
      },
      stats(): Promise<any> {
        return request<any>('/admin/build-requests/stats/');
      },
    },
    
    // Construction Requests
    constructionRequests: {
      async list(params?: { status?: string; construction_type?: string; search?: string }): Promise<PaginatedResponse<any>> {
        const cleanParams: Record<string, string> = {};
        if (params?.status && params.status !== 'all') cleanParams.status = params.status;
        if (params?.construction_type && params.construction_type !== 'all') cleanParams.construction_type = params.construction_type;
        if (params?.search) cleanParams.search = params.search;
        
        const query = Object.keys(cleanParams).length > 0 
          ? `?${new URLSearchParams(cleanParams).toString()}` 
          : '';
        return request<PaginatedResponse<any>>(`/construction/admin/construction-requests/${query}`);
      },
      get(id: number): Promise<any> {
        return request<any>(`/construction/admin/construction-requests/${id}/`);
      },
      update(id: number, payload: any): Promise<any> {
        return request<any>(`/construction/admin/construction-requests/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      },
      convertToProject(id: number, data: { project_manager_id: number; site_supervisor_id?: number; property_id?: number }): Promise<any> {
        return request<any>(`/construction/admin/construction-requests/${id}/convert_to_project/`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
    },
  },

  // Property Transaction Management API
  transactions: {
    async list(params?: { status?: string; transaction_type?: string; assigned_agent?: string; search?: string }): Promise<PaginatedResponse<any>> {
      const cleanParams: Record<string, string> = {};
      if (params?.status && params.status !== 'all') cleanParams.status = params.status;
      if (params?.transaction_type && params.transaction_type !== 'all') cleanParams.transaction_type = params.transaction_type;
      if (params?.assigned_agent) cleanParams.assigned_agent = params.assigned_agent;
      if (params?.search) cleanParams.search = params.search;
      
      const query = Object.keys(cleanParams).length > 0 
        ? `?${new URLSearchParams(cleanParams).toString()}` 
        : '';
      return request<PaginatedResponse<any>>(`/admin/transactions/${query}`);
    },
    get(id: string): Promise<any> {
      return request<any>(`/admin/transactions/${id}/`);
    },
    update(id: string, payload: any): Promise<any> {
      return request<any>(`/admin/transactions/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    assignAgent(id: string, agentId: number): Promise<any> {
      return request<any>(`/admin/transactions/${id}/assign-agent/`, {
        method: 'POST',
        body: JSON.stringify({ agent_id: agentId }),
      });
    },
    approve(id: string): Promise<any> {
      return request<any>(`/admin/transactions/${id}/approve/`, {
        method: 'POST',
      });
    },
    reject(id: string, reason: string): Promise<any> {
      return request<any>(`/admin/transactions/${id}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    markCompleted(id: string): Promise<any> {
      return request<any>(`/admin/transactions/${id}/mark-completed/`, {
        method: 'POST',
      });
    },
    addNote(id: string, content: string, isInternal: boolean = false): Promise<any> {
      return request<any>(`/admin/transactions/${id}/notes/`, {
        method: 'POST',
        body: JSON.stringify({ content, is_internal: isInternal }),
      });
    },
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

export async function register(data: any): Promise<any> {
  return request<any>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyEmail(email: string, otp_code: string): Promise<any> {
  return request<any>('/auth/verify-email/', {
    method: 'POST',
    body: JSON.stringify({ email, otp_code }),
  });
}

export async function refreshToken(refreshToken: string): Promise<{ access: string }> {
  return request<{ access: string }>('/auth/token/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
  });
}
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'closed';
export type LeadPriority = 'high' | 'medium' | 'low';

export interface Lead {
  id: string;
  title: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: LeadStatus;
  priority: LeadPriority;
  is_unread: boolean;
  source_type: 'build_request' | 'property_inquiry';
  source_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
}

export interface LeadNote {
  id: string;
  body: string;
  created_at: string;
  author: string;
}

export interface LeadActivity {
  id: string;
  kind: string;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
  author: string;
}

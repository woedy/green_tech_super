export interface PlanImage {
  id?: number;
  image_url: string;
  caption: string;
  is_primary: boolean;
  order: number;
}

export interface PlanFeature {
  id?: number;
  name: string;
  description: string;
  category: string;
  is_sustainable: boolean;
  price_delta: string | number;
}

export interface PlanOption {
  id?: number;
  name: string;
  description: string;
  price_delta: string | number;
}

export interface PlanPricing {
  id?: number;
  region: string;
  cost_multiplier: string | number;
  currency_code: string;
}

export interface PlanResponse {
  id: number;
  slug: string;
  name: string;
  summary: string;
  description: string;
  style: string;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  area_sq_m: string;
  base_price: string;
  base_currency: string;
  has_garage: boolean;
  energy_rating: number;
  water_rating: number;
  sustainability_score: number;
  hero_image_url: string;
  specs: Record<string, unknown>;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images: PlanImage[];
  features: PlanFeature[];
  options: PlanOption[];
  pricing: PlanPricing[];
}

export type PlanPayload = Omit<PlanResponse, 'id' | 'created_at' | 'updated_at' | 'published_at'>;

export interface PropertyImage {
  id?: number;
  image_url: string;
  caption: string;
  is_primary: boolean;
  order: number;
}

export interface PropertyResponse {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  property_type: string;
  listing_type: string;
  status: string;
  price: string;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area_sq_m: string;
  plot_sq_m: string | null;
  year_built: number | null;
  hero_image_url: string;
  sustainability_score: number;
  energy_rating: number;
  water_rating: number;
  eco_features: string[];
  amenities: string[];
  highlights: string[];
  city: string;
  country: string;
  region: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  featured: boolean;
  listed_by: number | null;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
}

export type PropertyPayload = Omit<PropertyResponse, 'id' | 'created_at' | 'updated_at'>;

export interface RegionResponse {
  id: number;
  slug: string;
  name: string;
  country: string;
  currency_code: string;
  cost_multiplier: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RegionPayload = Omit<RegionResponse, 'id' | 'created_at' | 'updated_at'>;

export interface NotificationTemplateResponse {
  id: string;
  name: string;
  subject: string;
  template: string;
  notification_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationTemplatePayload = Omit<NotificationTemplateResponse, 'id' | 'created_at' | 'updated_at'>;

export interface SiteDocumentVersionResponse {
  id: number;
  version: number;
  status: string;
  title: string;
  summary: string;
  body: string;
  preview_url: string;
  created_at: string;
  created_by: number | null;
  created_by_name: string;
  notes: string;
}

export interface SiteDocumentResponse {
  id: number;
  slug: string;
  title: string;
  category: string;
  description: string;
  current_version: SiteDocumentVersionResponse | null;
  created_at: string;
  updated_at: string;
  versions: SiteDocumentVersionResponse[];
}

export type SiteDocumentPayload = Omit<SiteDocumentResponse, 'id' | 'created_at' | 'updated_at' | 'current_version' | 'versions'>;

export interface SiteDocumentVersionPayload {
  document: number;
  status: string;
  title: string;
  summary: string;
  body: string;
  preview_url?: string;
  notes?: string;
}
// Dashboard types
export interface AdminDashboardMetrics {
  period: {
    start_date: string;
    end_date: string;
  };
  overview: {
    total_leads: number;
    total_quotes: number;
    total_projects: number;
    total_users: number;
    active_users: number;
    new_users: number;
  };
  leads: {
    total: number;
    recent: number;
    status_breakdown: Record<string, number>;
    trend: number;
  };
  quotes: {
    total: number;
    recent: number;
    status_breakdown: Record<string, number>;
    total_value: string;
    accepted: number;
    trend: number;
  };
  projects: {
    total: number;
    recent: number;
    active: number;
    status_breakdown: Record<string, number>;
    trend: number;
  };
  properties: {
    total: number;
    active: number;
    by_region: Record<string, number>;
  };
  plans: {
    total: number;
    active: number;
    by_category: Record<string, number>;
  };
  regional_performance: Array<{
    name: string;
    leads: number;
    projects: number;
    properties: number;
    total_activity: number;
  }>;
  sustainability: {
    eco_plans: number;
    solar_properties: number;
    water_harvesting_properties: number;
    green_score: number;
  };
  conversion_rates: {
    lead_to_quote: number;
    quote_to_project: number;
    quote_acceptance: number;
  };
}
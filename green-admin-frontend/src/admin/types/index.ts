export type ID = number | string;

export interface Plan {
  id: number;
  name: string;
  style: string;
  beds: number;
  basePrice: number;
  status: 'Draft' | 'Published';
  description?: string;
}

export interface Property {
  id: number;
  title: string;
  price: number;
  status: 'Draft' | 'Live' | 'Sold' | 'Rented';
  location?: string;
  type?: string;
  region?: string;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sq_m?: number;
  sustainability_score?: number;
  eco_features?: string[];
  images?: PropertyImage[];
  created_at?: string;
  updated_at?: string;
}

export interface PropertyImage {
  id?: number;
  url: string;
  caption: string;
  is_primary: boolean;
  order: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'builder' | 'customer';
  active: boolean;
  phone?: string;
  location?: string;
  verified?: boolean;
  created_at?: string;
  last_login?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  bio?: string;
  avatar_url?: string;
  company?: string;
  license_number?: string;
  specializations?: string[];
  ghana_regions?: string[];
}

export interface Region {
  code: string;
  name: string;
  currency: string;
  multiplier: number;
  major_cities?: string[];
  is_active?: boolean;
}

export interface EcoFeature {
  id: number;
  name: string;
  category: 'energy' | 'water' | 'materials' | 'waste' | 'smart_tech' | 'air_quality';
  description: string;
  base_cost: number;
  sustainability_points: number;
  available_in_ghana: boolean;
  regional_availability?: Record<string, boolean>;
  regional_pricing?: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationTemplate {
  id: string; // slug/key
  channel: 'email' | 'sms';
  name: string;
  updatedAt: string;
  body?: string;
}

export interface BulkUploadResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// Analytics and Reporting Types
export interface PlatformMetrics {
  total_revenue: number;
  active_properties: number;
  total_users: number;
  avg_sustainability_score: number;
  conversion_rate: number;
  monthly_growth: number;
}

export interface UserActivityMetrics {
  role: 'customer' | 'agent' | 'builder' | 'admin';
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  avg_session_duration: number;
  top_actions: Array<{
    action: string;
    count: number;
  }>;
}

export interface FinancialMetrics {
  total_revenue: number;
  monthly_revenue: number;
  revenue_by_region: Array<{
    region: string;
    revenue: number;
    percentage: number;
  }>;
  revenue_by_property_type: Array<{
    type: string;
    revenue: number;
    count: number;
  }>;
  average_property_value: number;
  currency: string;
}

export interface SustainabilityMetrics {
  avg_green_score: number;
  eco_feature_adoption: Array<{
    feature: string;
    adoption_rate: number;
    total_installations: number;
  }>;
  sustainability_trends: Array<{
    month: string;
    solar: number;
    water: number;
    materials: number;
    smart_tech: number;
  }>;
  carbon_savings_estimate: number;
}

export interface SystemHealthMetrics {
  api_response_time: number;
  uptime_percentage: number;
  error_rate: number;
  active_sessions: number;
  database_performance: {
    query_time: number;
    connection_pool: number;
  };
  storage_usage: {
    used_gb: number;
    total_gb: number;
    percentage: number;
  };
}

export interface RegionalPerformance {
  region: string;
  region_code: string;
  properties_count: number;
  revenue: number;
  avg_property_value: number;
  sustainability_score: number;
  growth_rate: number;
  color: string;
}

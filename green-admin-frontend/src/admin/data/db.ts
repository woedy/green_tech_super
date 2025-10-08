import type { Plan, Property, User, Region, NotificationTemplate, EcoFeature } from '../types';

const KEY = 'gta_admin_db_v2';

interface DB {
  counters: { plan: number; property: number; user: number; eco_feature: number };
  plans: Plan[];
  properties: Property[];
  users: User[];
  regions: Region[];
  templates: NotificationTemplate[];
  eco_features: EcoFeature[];
}

function seed(): DB {
  return {
    counters: { plan: 2, property: 2, user: 3, eco_feature: 10 },
    plans: [
      { id: 1, name: 'Eco Bungalow', style: 'Modern', beds: 3, basePrice: 25000, status: 'Published', description: 'Compact modern eco home.' },
      { id: 2, name: 'Solar Villa', style: 'Contemporary', beds: 4, basePrice: 56000, status: 'Draft', description: 'Spacious villa with solar roof.' },
    ],
    properties: [
      { 
        id: 101, 
        title: 'Accra 2BR Apartment', 
        price: 120000, 
        status: 'Live', 
        location: 'Accra, GH', 
        type: 'Apartment',
        region: 'GH-GA',
        currency: 'GHS',
        bedrooms: 2,
        bathrooms: 2,
        area_sq_m: 85,
        sustainability_score: 7.5,
        eco_features: ['solar_panels', 'rainwater_harvesting', 'led_lighting'],
        created_at: '2024-12-01T10:00:00Z',
        updated_at: '2024-12-15T14:30:00Z'
      },
      { 
        id: 102, 
        title: 'Kumasi Eco Loft', 
        price: 95000, 
        status: 'Draft', 
        location: 'Kumasi, GH', 
        type: 'Loft',
        region: 'GH-AS',
        currency: 'GHS',
        bedrooms: 1,
        bathrooms: 1,
        area_sq_m: 65,
        sustainability_score: 8.5,
        eco_features: ['solar_panels', 'smart_thermostat', 'recycled_materials'],
        created_at: '2024-11-20T09:15:00Z',
        updated_at: '2024-12-10T16:45:00Z'
      },
    ],
    users: [
      { 
        id: 1, 
        name: 'Admin One', 
        email: 'admin1@example.com', 
        role: 'admin', 
        active: true,
        phone: '+233244123456',
        location: 'Accra, Ghana',
        verified: true,
        created_at: '2024-01-15T08:00:00Z',
        last_login: '2025-01-06T10:30:00Z'
      },
      { 
        id: 2, 
        name: 'Agent Jane', 
        email: 'jane@example.com', 
        role: 'agent', 
        active: true,
        phone: '+233201987654',
        location: 'Kumasi, Ghana',
        verified: true,
        created_at: '2024-03-10T12:00:00Z',
        last_login: '2025-01-05T15:20:00Z',
        profile: {
          company: 'Ghana Green Realty',
          license_number: 'GRE-2024-001',
          specializations: ['Eco-friendly homes', 'Commercial properties'],
          ghana_regions: ['GH-AS', 'GH-BA']
        }
      },
      { 
        id: 3, 
        name: 'Builder Bob', 
        email: 'bob@example.com', 
        role: 'builder', 
        active: false,
        phone: '+233555111222',
        location: 'Tamale, Ghana',
        verified: false,
        created_at: '2024-06-05T14:30:00Z',
        last_login: '2024-12-20T09:45:00Z',
        profile: {
          company: 'Sustainable Constructions Ltd',
          license_number: 'BLD-2024-045',
          specializations: ['Green building', 'Solar installations'],
          ghana_regions: ['GH-NR', 'GH-UE']
        }
      },
    ],
    regions: [
      { 
        code: 'GH-GA', 
        name: 'Greater Accra', 
        currency: 'GHS', 
        multiplier: 1.14,
        major_cities: ['Accra', 'Tema', 'Kasoa'],
        is_active: true
      },
      { 
        code: 'GH-AS', 
        name: 'Ashanti', 
        currency: 'GHS', 
        multiplier: 1.25,
        major_cities: ['Kumasi', 'Obuasi', 'Ejisu'],
        is_active: true
      },
      { 
        code: 'GH-NR', 
        name: 'Northern', 
        currency: 'GHS', 
        multiplier: 0.85,
        major_cities: ['Tamale', 'Yendi', 'Savelugu'],
        is_active: true
      },
      { 
        code: 'GH-CR', 
        name: 'Central', 
        currency: 'GHS', 
        multiplier: 1.05,
        major_cities: ['Cape Coast', 'Elmina', 'Winneba'],
        is_active: true
      },
    ],
    templates: [
      { id: 'welcome', channel: 'email', name: 'Welcome Email', updatedAt: '2025-01-05', body: 'Welcome to Green Tech Africa!' },
      { id: 'quote-sent', channel: 'email', name: 'Quote Sent', updatedAt: '2025-01-10', body: 'Your quote is ready.' },
      { id: 'appointment-reminder', channel: 'sms', name: 'Appointment Reminder', updatedAt: '2025-01-12', body: 'Reminder: appointment tomorrow.' },
    ],
    eco_features: [
      {
        id: 1,
        name: 'Solar Panels',
        category: 'energy',
        description: 'Photovoltaic panels for renewable energy generation',
        base_cost: 15000,
        sustainability_points: 25,
        available_in_ghana: true,
        regional_availability: { 'GH-GA': true, 'GH-AS': true, 'GH-NR': true, 'GH-CR': true },
        regional_pricing: { 'GH-GA': 1.1, 'GH-AS': 1.0, 'GH-NR': 0.9, 'GH-CR': 1.05 },
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Rainwater Harvesting',
        category: 'water',
        description: 'System to collect and store rainwater for household use',
        base_cost: 8000,
        sustainability_points: 20,
        available_in_ghana: true,
        regional_availability: { 'GH-GA': true, 'GH-AS': true, 'GH-NR': false, 'GH-CR': true },
        regional_pricing: { 'GH-GA': 1.0, 'GH-AS': 0.95, 'GH-CR': 1.1 },
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: 'LED Lighting',
        category: 'energy',
        description: 'Energy-efficient LED lighting throughout the property',
        base_cost: 2500,
        sustainability_points: 10,
        available_in_ghana: true,
        regional_availability: { 'GH-GA': true, 'GH-AS': true, 'GH-NR': true, 'GH-CR': true },
        regional_pricing: { 'GH-GA': 1.0, 'GH-AS': 1.0, 'GH-NR': 1.0, 'GH-CR': 1.0 },
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 4,
        name: 'Smart Thermostat',
        category: 'smart_tech',
        description: 'Intelligent climate control system for energy optimization',
        base_cost: 1200,
        sustainability_points: 8,
        available_in_ghana: true,
        regional_availability: { 'GH-GA': true, 'GH-AS': true, 'GH-NR': false, 'GH-CR': true },
        regional_pricing: { 'GH-GA': 1.2, 'GH-AS': 1.1, 'GH-CR': 1.15 },
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 5,
        name: 'Recycled Materials',
        category: 'materials',
        description: 'Construction using recycled and sustainable building materials',
        base_cost: 5000,
        sustainability_points: 15,
        available_in_ghana: true,
        regional_availability: { 'GH-GA': true, 'GH-AS': true, 'GH-NR': true, 'GH-CR': true },
        regional_pricing: { 'GH-GA': 1.0, 'GH-AS': 0.9, 'GH-NR': 0.8, 'GH-CR': 0.95 },
        created_at: '2024-01-01T00:00:00Z'
      }
    ],
  };
}

function load(): DB {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;
  if (!raw) {
    const db = seed();
    save(db);
    return db;
  }
  try {
    return JSON.parse(raw) as DB;
  } catch {
    const db = seed();
    save(db);
    return db;
  }
}

function save(db: DB) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(db));
  }
}

export const db = {
  reset() {
    const s = seed();
    save(s);
    return s;
  },

  // Plans
  listPlans(): Plan[] { return load().plans; },
  getPlan(id: number): Plan | undefined { return load().plans.find(p => p.id === id); },
  createPlan(input: Omit<Plan, 'id'>): Plan {
    const state = load();
    const id = ++state.counters.plan;
    const plan: Plan = { id, ...input };
    state.plans.push(plan);
    save(state);
    return plan;
  },
  updatePlan(id: number, patch: Partial<Omit<Plan, 'id'>>): Plan | undefined {
    const state = load();
    const idx = state.plans.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    state.plans[idx] = { ...state.plans[idx], ...patch };
    save(state);
    return state.plans[idx];
  },
  deletePlan(id: number) {
    const state = load();
    state.plans = state.plans.filter(p => p.id !== id);
    save(state);
  },

  // Properties
  listProperties(): Property[] { return load().properties; },
  getProperty(id: number): Property | undefined { return load().properties.find(p => p.id === id); },
  createProperty(input: Omit<Property, 'id'>): Property {
    const state = load();
    const id = ++state.counters.property;
    const property: Property = { id, ...input } as Property;
    state.properties.push(property);
    save(state);
    return property;
  },
  updateProperty(id: number, patch: Partial<Omit<Property, 'id'>>): Property | undefined {
    const state = load();
    const idx = state.properties.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    state.properties[idx] = { ...state.properties[idx], ...patch };
    save(state);
    return state.properties[idx];
  },
  deleteProperty(id: number) {
    const state = load();
    state.properties = state.properties.filter(p => p.id !== id);
    save(state);
  },

  // Users
  listUsers(): User[] { return load().users; },
  getUser(id: number): User | undefined { return load().users.find(u => u.id === id); },
  createUser(input: Omit<User, 'id'>): User {
    const state = load();
    const id = ++state.counters.user;
    const user: User = { id, ...input };
    state.users.push(user);
    save(state);
    return user;
  },
  updateUser(id: number, patch: Partial<Omit<User, 'id'>>): User | undefined {
    const state = load();
    const idx = state.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    state.users[idx] = { ...state.users[idx], ...patch };
    save(state);
    return state.users[idx];
  },
  deleteUser(id: number) {
    const state = load();
    state.users = state.users.filter(u => u.id !== id);
    save(state);
  },

  // Regions
  listRegions(): Region[] { return load().regions; },
  getRegion(code: string): Region | undefined { return load().regions.find(r => r.code === code); },
  upsertRegion(region: Region): Region {
    const state = load();
    const idx = state.regions.findIndex(r => r.code === region.code);
    if (idx === -1) state.regions.push(region); else state.regions[idx] = region;
    save(state);
    return region;
  },
  deleteRegion(code: string) {
    const state = load();
    state.regions = state.regions.filter(r => r.code !== code);
    save(state);
  },

  // Templates
  listTemplates(): NotificationTemplate[] { return load().templates; },
  getTemplate(id: string): NotificationTemplate | undefined { return load().templates.find(t => t.id === id); },
  upsertTemplate(t: NotificationTemplate): NotificationTemplate {
    const state = load();
    const idx = state.templates.findIndex(x => x.id === t.id);
    if (idx === -1) state.templates.push(t); else state.templates[idx] = t;
    save(state);
    return t;
  },
  deleteTemplate(id: string) {
    const state = load();
    state.templates = state.templates.filter(t => t.id !== id);
    save(state);
  },

  // Eco Features
  listEcoFeatures(): EcoFeature[] { return load().eco_features; },
  getEcoFeature(id: number): EcoFeature | undefined { return load().eco_features.find(f => f.id === id); },
  createEcoFeature(input: Omit<EcoFeature, 'id' | 'created_at' | 'updated_at'>): EcoFeature {
    const state = load();
    const id = ++state.counters.eco_feature;
    const now = new Date().toISOString();
    const feature: EcoFeature = { id, ...input, created_at: now, updated_at: now };
    state.eco_features.push(feature);
    save(state);
    return feature;
  },
  updateEcoFeature(id: number, patch: Partial<Omit<EcoFeature, 'id' | 'created_at'>>): EcoFeature | undefined {
    const state = load();
    const idx = state.eco_features.findIndex(f => f.id === id);
    if (idx === -1) return undefined;
    const now = new Date().toISOString();
    state.eco_features[idx] = { ...state.eco_features[idx], ...patch, updated_at: now };
    save(state);
    return state.eco_features[idx];
  },
  deleteEcoFeature(id: number) {
    const state = load();
    state.eco_features = state.eco_features.filter(f => f.id !== id);
    save(state);
  },

  // Bulk operations
  bulkCreateProperties(properties: Omit<Property, 'id'>[]): { success: Property[]; errors: Array<{ index: number; error: string }> } {
    const state = load();
    const success: Property[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    properties.forEach((propertyData, index) => {
      try {
        // Basic validation
        if (!propertyData.title || !propertyData.price) {
          errors.push({ index, error: 'Title and price are required' });
          return;
        }

        const id = ++state.counters.property;
        const now = new Date().toISOString();
        const property: Property = { 
          id, 
          ...propertyData, 
          created_at: now, 
          updated_at: now 
        };
        state.properties.push(property);
        success.push(property);
      } catch (error) {
        errors.push({ index, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    save(state);
    return { success, errors };
  },

  bulkUpdateUsers(updates: Array<{ id: number; patch: Partial<Omit<User, 'id'>> }>): { success: User[]; errors: Array<{ id: number; error: string }> } {
    const state = load();
    const success: User[] = [];
    const errors: Array<{ id: number; error: string }> = [];

    updates.forEach(({ id, patch }) => {
      try {
        const idx = state.users.findIndex(u => u.id === id);
        if (idx === -1) {
          errors.push({ id, error: 'User not found' });
          return;
        }

        state.users[idx] = { ...state.users[idx], ...patch };
        success.push(state.users[idx]);
      } catch (error) {
        errors.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    save(state);
    return { success, errors };
  },
};


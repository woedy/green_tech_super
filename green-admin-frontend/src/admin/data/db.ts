import type { Plan, Property, User, Region, NotificationTemplate } from '../types';

const KEY = 'gta_admin_db_v1';

interface DB {
  counters: { plan: number; property: number; user: number };
  plans: Plan[];
  properties: Property[];
  users: User[];
  regions: Region[];
  templates: NotificationTemplate[];
}

function seed(): DB {
  return {
    counters: { plan: 2, property: 2, user: 3 },
    plans: [
      { id: 1, name: 'Eco Bungalow', style: 'Modern', beds: 3, basePrice: 25000, status: 'Published', description: 'Compact modern eco home.' },
      { id: 2, name: 'Solar Villa', style: 'Contemporary', beds: 4, basePrice: 56000, status: 'Draft', description: 'Spacious villa with solar roof.' },
    ],
    properties: [
      { id: 101, title: 'Accra 2BR Apartment', price: 120000, status: 'Live', location: 'Accra, GH', type: 'Apartment' },
      { id: 102, title: 'Kumasi Eco Loft', price: 95000, status: 'Draft', location: 'Kumasi, GH', type: 'Loft' },
    ],
    users: [
      { id: 1, name: 'Admin One', email: 'admin1@example.com', role: 'admin', active: true },
      { id: 2, name: 'Agent Jane', email: 'jane@example.com', role: 'agent', active: true },
      { id: 3, name: 'Builder Bob', email: 'bob@example.com', role: 'builder', active: false },
    ],
    regions: [
      { code: 'GH-GA', name: 'Greater Accra', currency: 'GHS', multiplier: 1.14 },
      { code: 'GH-AS', name: 'Ashanti', currency: 'GHS', multiplier: 1.25 },
    ],
    templates: [
      { id: 'welcome', channel: 'email', name: 'Welcome Email', updatedAt: '2025-01-05', body: 'Welcome to Green Tech Africa!' },
      { id: 'quote-sent', channel: 'email', name: 'Quote Sent', updatedAt: '2025-01-10', body: 'Your quote is ready.' },
      { id: 'appointment-reminder', channel: 'sms', name: 'Appointment Reminder', updatedAt: '2025-01-12', body: 'Reminder: appointment tomorrow.' },
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
};


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
  status: 'Draft' | 'Live';
  location?: string;
  type?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'builder' | 'customer';
  active: boolean;
}

export interface Region {
  code: string;
  name: string;
  currency: string;
  multiplier: number;
}

export interface NotificationTemplate {
  id: string; // slug/key
  channel: 'email' | 'sms';
  name: string;
  updatedAt: string;
  body?: string;
}

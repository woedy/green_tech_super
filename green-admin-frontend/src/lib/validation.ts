import { z } from 'zod';

// Common validation patterns
export const phoneRegex = /^\+?[1-9]\d{1,14}$/;
export const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Custom error messages for better UX
export const ValidationMessages = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address (e.g., admin@greentechafrica.com)',
  phone: 'Please enter a valid phone number (e.g., +233 XX XXX XXXX)',
  password: {
    min: 'Password must be at least 8 characters long',
    strong: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    match: 'Passwords do not match'
  },
  name: {
    min: 'Name must be at least 2 characters long',
    max: 'Name cannot exceed 50 characters',
    format: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  },
  admin: {
    role: 'Please select a valid admin role',
    permissions: 'Please select at least one permission'
  },
  plan: {
    title: 'Plan title must be between 3 and 100 characters',
    description: 'Plan description must be between 10 and 1000 characters',
    price: 'Base price must be a positive number',
    category: 'Please select a valid plan category'
  },
  property: {
    title: 'Property title must be between 5 and 100 characters',
    price: 'Price must be a positive number',
    area: 'Area must be a positive number in square meters',
    bedrooms: 'Number of bedrooms must be between 1 and 20',
    bathrooms: 'Number of bathrooms must be between 1 and 10',
    status: 'Please select a valid property status'
  },
  ecoFeature: {
    name: 'Feature name must be between 3 and 100 characters',
    description: 'Feature description must be between 10 and 500 characters',
    category: 'Please select a valid eco feature category',
    cost: 'Base cost must be a positive number',
    points: 'Sustainability points must be between 1 and 100'
  },
  region: {
    name: 'Region name must be between 2 and 100 characters',
    code: 'Region code must be 2-10 characters (e.g., GH-GA for Greater Accra)',
    multiplier: 'Cost multiplier must be between 0.1 and 5.0'
  },
  bulk: {
    file: 'Please select a CSV file to upload',
    format: 'File must be in CSV format',
    size: 'File size cannot exceed 10MB'
  }
};

// Base schemas
export const emailSchema = z
  .string()
  .min(1, ValidationMessages.required('Email'))
  .email(ValidationMessages.email);

export const phoneSchema = z
  .string()
  .regex(phoneRegex, ValidationMessages.phone)
  .optional()
  .or(z.literal(''));

export const passwordSchema = z
  .string()
  .min(8, ValidationMessages.password.min)
  .regex(strongPasswordRegex, ValidationMessages.password.strong);

export const nameSchema = z
  .string()
  .min(2, ValidationMessages.name.min)
  .max(50, ValidationMessages.name.max)
  .regex(/^[a-zA-Z\s\-']+$/, ValidationMessages.name.format);

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, ValidationMessages.required('Password'))
});

export const adminRegisterSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], {
    errorMap: () => ({ message: ValidationMessages.admin.role })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: ValidationMessages.password.match,
  path: ['confirmPassword']
});

// Plan management schemas
export const planSchema = z.object({
  title: z
    .string()
    .min(3, ValidationMessages.plan.title)
    .max(100, ValidationMessages.plan.title),
  description: z
    .string()
    .min(10, ValidationMessages.plan.description)
    .max(1000, ValidationMessages.plan.description),
  category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE'], {
    errorMap: () => ({ message: ValidationMessages.plan.category })
  }),
  base_price: z
    .number()
    .positive(ValidationMessages.plan.price)
    .max(10000000, 'Base price seems unrealistic. Please verify the amount'),
  bedrooms: z
    .number()
    .int('Number of bedrooms must be a whole number')
    .min(1, ValidationMessages.property.bedrooms)
    .max(20, ValidationMessages.property.bedrooms)
    .optional(),
  bathrooms: z
    .number()
    .int('Number of bathrooms must be a whole number')
    .min(1, ValidationMessages.property.bathrooms)
    .max(10, ValidationMessages.property.bathrooms)
    .optional(),
  area_sq_m: z
    .number()
    .positive('Area must be greater than 0')
    .max(10000, 'Area seems unrealistic. Please verify the measurement'),
  sustainability_score: z
    .number()
    .int('Sustainability score must be a whole number')
    .min(0, 'Sustainability score cannot be negative')
    .max(100, 'Sustainability score cannot exceed 100'),
  is_active: z.boolean().default(true)
});

// Property management schemas
export const propertySchema = z.object({
  title: z
    .string()
    .min(5, ValidationMessages.property.title)
    .max(100, ValidationMessages.property.title),
  price: z
    .number()
    .positive(ValidationMessages.property.price)
    .max(100000000, 'Price seems unrealistic. Please verify the amount'),
  location: z.string().min(1, ValidationMessages.required('Location')),
  type: z.string().min(1, ValidationMessages.required('Property type')),
  status: z.enum(['DRAFT', 'LIVE', 'SOLD', 'RENTED', 'ARCHIVED'], {
    errorMap: () => ({ message: ValidationMessages.property.status })
  }),
  region: z.string().min(1, ValidationMessages.required('Region')),
  bedrooms: z
    .number()
    .int('Number of bedrooms must be a whole number')
    .min(1, ValidationMessages.property.bedrooms)
    .max(20, ValidationMessages.property.bedrooms)
    .optional(),
  bathrooms: z
    .number()
    .int('Number of bathrooms must be a whole number')
    .min(1, ValidationMessages.property.bathrooms)
    .max(10, ValidationMessages.property.bathrooms)
    .optional(),
  area_sq_m: z
    .number()
    .positive('Area must be greater than 0')
    .max(10000, 'Area seems unrealistic. Please verify the measurement')
    .optional(),
  sustainability_score: z
    .number()
    .int('Sustainability score must be a whole number')
    .min(0, 'Sustainability score cannot be negative')
    .max(100, 'Sustainability score cannot exceed 100')
    .optional(),
  eco_features: z.array(z.string()).optional()
});

// Eco feature management schemas
export const ecoFeatureSchema = z.object({
  name: z
    .string()
    .min(3, ValidationMessages.ecoFeature.name)
    .max(100, ValidationMessages.ecoFeature.name),
  description: z
    .string()
    .min(10, ValidationMessages.ecoFeature.description)
    .max(500, ValidationMessages.ecoFeature.description),
  category: z.enum(['ENERGY', 'WATER', 'MATERIALS', 'WASTE', 'SMART_TECH', 'AIR_QUALITY'], {
    errorMap: () => ({ message: ValidationMessages.ecoFeature.category })
  }),
  base_cost: z
    .number()
    .positive(ValidationMessages.ecoFeature.cost)
    .max(1000000, 'Base cost seems unrealistic. Please verify the amount'),
  sustainability_points: z
    .number()
    .int('Sustainability points must be a whole number')
    .min(1, ValidationMessages.ecoFeature.points)
    .max(100, ValidationMessages.ecoFeature.points),
  is_available_in_ghana: z.boolean().default(true)
});

// Region management schemas
export const regionSchema = z.object({
  name: z
    .string()
    .min(2, ValidationMessages.region.name)
    .max(100, ValidationMessages.region.name),
  code: z
    .string()
    .min(2, ValidationMessages.region.code)
    .max(10, ValidationMessages.region.code)
    .regex(/^[A-Z]{2}-[A-Z]{2,3}$/, 'Region code must follow format: GH-GA (Country-Region)'),
  cost_multiplier: z
    .number()
    .min(0.1, ValidationMessages.region.multiplier)
    .max(5.0, ValidationMessages.region.multiplier),
  is_active: z.boolean().default(true)
});

// Bulk upload schemas
export const bulkUploadSchema = z.object({
  file: z
    .instanceof(File, { message: ValidationMessages.bulk.file })
    .refine((file) => file.type === 'text/csv' || file.name.endsWith('.csv'), {
      message: ValidationMessages.bulk.format
    })
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: ValidationMessages.bulk.size
    })
});

// CSV row validation for bulk uploads
export const csvPropertyRowSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Price must be a positive number'
  }),
  status: z.enum(['DRAFT', 'LIVE', 'SOLD', 'RENTED'], {
    errorMap: () => ({ message: 'Status must be one of: DRAFT, LIVE, SOLD, RENTED' })
  }),
  location: z.string().min(1, 'Location is required'),
  type: z.string().min(1, 'Property type is required'),
  region: z.string().min(1, 'Region code is required'),
  bedrooms: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = Number(val);
    return !isNaN(num) && num >= 1 && num <= 20;
  }, 'Bedrooms must be between 1 and 20'),
  bathrooms: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = Number(val);
    return !isNaN(num) && num >= 1 && num <= 10;
  }, 'Bathrooms must be between 1 and 10'),
  area_sq_m: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, 'Area must be a positive number'),
  sustainability_score: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = Number(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, 'Sustainability score must be between 0 and 100'),
  eco_features: z.string().optional()
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type AdminRegisterFormData = z.infer<typeof adminRegisterSchema>;
export type PlanFormData = z.infer<typeof planSchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export type EcoFeatureFormData = z.infer<typeof ecoFeatureSchema>;
export type RegionFormData = z.infer<typeof regionSchema>;
export type BulkUploadFormData = z.infer<typeof bulkUploadSchema>;
export type CsvPropertyRowData = z.infer<typeof csvPropertyRowSchema>;
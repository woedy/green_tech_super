import { z } from 'zod';

// Common validation patterns
export const phoneRegex = /^\+?[1-9]\d{1,14}$/;
export const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Custom error messages for better UX
export const ValidationMessages = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address (e.g., john@example.com)',
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
  project: {
    title: 'Project title must be between 3 and 100 characters',
    budget: 'Please select a valid budget range',
    timeline: 'Please select a realistic project timeline'
  },
  property: {
    price: 'Price must be a positive number',
    area: 'Area must be a positive number in square meters',
    bedrooms: 'Number of bedrooms must be between 1 and 20',
    bathrooms: 'Number of bathrooms must be between 1 and 10'
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

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: ValidationMessages.password.match,
  path: ['confirmPassword']
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: ValidationMessages.password.match,
  path: ['confirmPassword']
});

// Construction wizard schemas
export const basicInfoSchema = z.object({
  customerName: nameSchema,
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  projectTitle: z
    .string()
    .min(3, 'Project title must be at least 3 characters')
    .max(100, 'Project title cannot exceed 100 characters')
});

export const locationBudgetSchema = z.object({
  location: z.string().min(1, ValidationMessages.required('Location')),
  region: z.string().min(1, ValidationMessages.required('Region')),
  budgetRange: z.string().min(1, ValidationMessages.project.budget),
  timeline: z.string().min(1, ValidationMessages.project.timeline)
});

export const ecoFeaturesSchema = z.object({
  selectedFeatures: z
    .array(z.string())
    .min(1, 'Please select at least one eco-friendly feature for your sustainable building project')
});

export const customizationSchema = z.object({
  specialRequirements: z.string().optional(),
  additionalNotes: z.string().optional()
});

// Property inquiry schema
export const propertyInquirySchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  message: z
    .string()
    .min(10, 'Please provide more details about your inquiry (at least 10 characters)')
    .max(1000, 'Message cannot exceed 1000 characters'),
  viewing: z.string().optional().refine((date) => {
    if (!date) return true;
    const selectedDate = new Date(date);
    const now = new Date();
    return selectedDate > now;
  }, 'Please select a future date and time for the viewing')
});

// Property management schemas
export const propertySchema = z.object({
  title: z
    .string()
    .min(5, 'Property title must be at least 5 characters')
    .max(100, 'Property title cannot exceed 100 characters'),
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(100000000, 'Price seems unrealistic. Please verify the amount'),
  location: z.string().min(1, ValidationMessages.required('Location')),
  type: z.string().min(1, ValidationMessages.required('Property type')),
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
    .optional()
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type LocationBudgetFormData = z.infer<typeof locationBudgetSchema>;
export type EcoFeaturesFormData = z.infer<typeof ecoFeaturesSchema>;
export type CustomizationFormData = z.infer<typeof customizationSchema>;
export type PropertyInquiryFormData = z.infer<typeof propertyInquirySchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
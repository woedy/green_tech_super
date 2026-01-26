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
  agent: {
    userType: 'Please select whether you are registering as an Agent or Builder',
    experience: 'Please specify your years of experience in the field',
    specialization: 'Please select your area of specialization'
  },
  lead: {
    status: 'Please select a valid lead status',
    priority: 'Please select a priority level for this lead',
    budget: 'Budget must be a positive number',
    followUp: 'Follow-up date must be in the future'
  },
  quote: {
    amount: 'Quote amount must be a positive number',
    validUntil: 'Quote validity date must be in the future',
    items: 'Please add at least one item to the quote'
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
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  phone_number: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  user_type: z.enum(['AGENT', 'BUILDER'], {
    errorMap: () => ({ message: ValidationMessages.agent.userType })
  })
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

// Lead management schemas
export const leadSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  project_type: z.string().min(1, ValidationMessages.required('Project type')),
  budget_range: z.string().min(1, ValidationMessages.required('Budget range')),
  location: z.string().min(1, ValidationMessages.required('Location')),
  timeline: z.string().min(1, ValidationMessages.required('Timeline')),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'], {
    errorMap: () => ({ message: ValidationMessages.lead.status })
  }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    errorMap: () => ({ message: ValidationMessages.lead.priority })
  }),
  notes: z.string().optional(),
  follow_up_date: z.string().optional().refine((date) => {
    if (!date) return true;
    const selectedDate = new Date(date);
    const now = new Date();
    return selectedDate > now;
  }, ValidationMessages.lead.followUp)
});

// Quote schemas
export const quoteItemSchema = z.object({
  description: z
    .string()
    .min(3, 'Item description must be at least 3 characters')
    .max(200, 'Item description cannot exceed 200 characters'),
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .max(10000, 'Quantity seems unrealistic'),
  unit_price: z
    .number()
    .positive('Unit price must be greater than 0')
    .max(1000000, 'Unit price seems unrealistic'),
  unit: z.string().min(1, ValidationMessages.required('Unit'))
});

export const quoteSchema = z.object({
  lead_id: z.string().min(1, ValidationMessages.required('Lead')),
  title: z
    .string()
    .min(5, 'Quote title must be at least 5 characters')
    .max(100, 'Quote title cannot exceed 100 characters'),
  description: z.string().optional(),
  items: z
    .array(quoteItemSchema)
    .min(1, ValidationMessages.quote.items),
  valid_until: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const now = new Date();
    return selectedDate > now;
  }, ValidationMessages.quote.validUntil),
  notes: z.string().optional()
});

// Profile update schema
export const profileUpdateSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  phone_number: phoneSchema,
  bio: z
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional(),
  specialization: z.string().optional(),
  years_experience: z
    .number()
    .int('Years of experience must be a whole number')
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience seems unrealistic')
    .optional()
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type LeadFormData = z.infer<typeof leadSchema>;
export type QuoteFormData = z.infer<typeof quoteSchema>;
export type QuoteItemFormData = z.infer<typeof quoteItemSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
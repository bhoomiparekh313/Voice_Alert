import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address').max(255, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long').optional(),
});

export const contactSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('email'),
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().trim().min(1, 'Email is required').email('Invalid email address').max(255, 'Email too long'),
    phone: z.string().optional().default(''),
    relationship: z.string().trim().max(50, 'Relationship too long').optional().or(z.literal('')),
  }),
  z.object({
    method: z.literal('sms'),
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
    phone: z.string().trim().min(1, 'Phone is required').max(20, 'Phone number too long')
      .regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number format'),
    email: z.string().optional().default(''),
    relationship: z.string().trim().max(50, 'Relationship too long').optional().or(z.literal('')),
  }),
  z.object({
    method: z.literal('call'),
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
    phone: z.string().trim().min(1, 'Phone is required').max(20, 'Phone number too long')
      .regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number format'),
    email: z.string().optional().default(''),
    relationship: z.string().trim().max(50, 'Relationship too long').optional().or(z.literal('')),
  }),
  z.object({
    method: z.literal('whatsapp'),
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
    phone: z.string().trim().min(1, 'Phone is required').max(20, 'Phone number too long')
      .regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number format'),
    email: z.string().optional().default(''),
    relationship: z.string().trim().max(50, 'Relationship too long').optional().or(z.literal('')),
  }),
]);

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email').max(255, 'Email too long'),
  phone: z.string().trim().max(20, 'Phone too long')
    .regex(/^(\+?[\d\s\-()]{7,20})?$/, 'Invalid phone format').optional().or(z.literal('')),
  emergencyMode: z.enum(['personal', 'medical', 'disaster']),
  language: z.string().min(1),
  voiceMonitoring: z.boolean(),
});

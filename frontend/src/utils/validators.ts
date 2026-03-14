/**
 * Zod validation schemas for all forms.
 * Used with react-hook-form via @hookform/resolvers/zod.
 */
import { z } from 'zod';

// ─── Auth Schemas ──────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(320, 'Email is too long'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .max(320, 'Email is too long'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const forgotPasswordEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(320, 'Email is too long'),
});

export type ForgotPasswordEmailData = z.infer<typeof forgotPasswordEmailSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
});

export type OtpFormData = z.infer<typeof otpSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Journal Schema ────────────────────────────────────

export const journalEntrySchema = z.object({
  subject: z
    .string()
    .min(2, 'Subject must be at least 2 characters')
    .max(200, 'Subject is too long'),
  text: z
    .string()
    .min(10, 'Entry must be at least 10 characters')
    .max(10000, 'Entry is too long'),
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

export type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

// ─── Prop Account Schemas ──────────────────────────────

export const propAccountSetupSchema = z.object({
  firmName: z.string().min(1, 'Firm name is required'),
  accountType: z.enum(['1_STEP', '2_STEP', 'INSTANT'], {
    message: 'Please select an account type',
  }),
  accountSize: z
    .number({ message: 'Account size must be a number' })
    .positive('Account size must be positive')
    .max(10000000, 'Account size is too large'),
  status: z.string().min(1, 'Status is required'),
});

export type PropAccountSetupFormData = z.infer<typeof propAccountSetupSchema>;

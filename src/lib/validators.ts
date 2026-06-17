import { z } from 'zod'

/**
 * Israeli phone number validation.
 * Accepts formats: 05X-XXXXXXX, 05XXXXXXXX, +9725XXXXXXXX
 */
export const phoneSchema = z
  .string()
  .min(1, 'מספר טלפון נדרש')
  .regex(
    /^(\+972|0)(5[0-9])([-\s]?\d{7})$|^(\+972|0)(5[0-9])\d{7}$/,
    'מספר טלפון לא תקין. נא להזין מספר ישראלי (לדוגמה: 050-1234567)'
  )
  .transform((val) => val.replace(/[-\s]/g, ''))

/**
 * OTP code — exactly 6 digits.
 */
export const otpSchema = z
  .string()
  .length(6, 'קוד אימות חייב להיות 6 ספרות')
  .regex(/^\d{6}$/, 'קוד אימות חייב להכיל ספרות בלבד')

/**
 * Booking form schema.
 */
export const bookingSchema = z.object({
  serviceIds: z
    .array(z.string().min(1))
    .min(1, 'יש לבחור לפחות שירות אחד'),
  staffId: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך לא תקין')
    .refine((val) => {
      const d = new Date(val)
      return !isNaN(d.getTime())
    }, 'תאריך לא תקין'),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'שעה לא תקינה'),
  customerPhone: phoneSchema,
  customerName: z
    .string()
    .min(2, 'שם חייב להכיל לפחות 2 תווים')
    .max(100, 'שם ארוך מדי'),
  customerEmail: z.string().email('כתובת אימייל לא תקינה').optional().or(z.literal('')),
  clientNotes: z.string().max(500, 'הערות ארוכות מדי').optional(),
  holdToken: z.string().optional(),
})

export type BookingFormValues = z.infer<typeof bookingSchema>

/**
 * Create / edit service schema.
 */
export const createServiceSchema = z.object({
  categoryId: z.string().min(1, 'יש לבחור קטגוריה'),
  name: z.string().min(1, 'שם שירות נדרש').max(100),
  description: z.string().max(500).optional(),
  durationMinutes: z
    .number()
    .int()
    .min(5, 'משך זמן מינימלי הוא 5 דקות')
    .max(480, 'משך זמן מקסימלי הוא 8 שעות'),
  bufferBeforeMinutes: z.number().int().min(0).default(0),
  bufferAfterMinutes: z.number().int().min(0).default(10),
  price: z
    .number()
    .min(0, 'מחיר לא יכול להיות שלילי'),
  depositAmount: z.number().min(0).optional().nullable(),
  requiresDeposit: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  imageUrl: z.string().url('כתובת תמונה לא תקינה').optional().or(z.literal('')).nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export type CreateServiceValues = z.infer<typeof createServiceSchema>

/**
 * Create / edit staff member schema.
 */
export const createStaffSchema = z.object({
  name: z.string().min(1, 'שם נדרש').max(100),
  phone: z
    .string()
    .regex(/^(\+972|0)(5[0-9])([-\s]?\d{7})$|^(\+972|0)(5[0-9])\d{7}$/, 'מספר טלפון לא תקין')
    .optional()
    .or(z.literal(''))
    .nullable(),
  email: z.string().email('כתובת אימייל לא תקינה').optional().or(z.literal('')).nullable(),
  bio: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url('כתובת תמונה לא תקינה').optional().or(z.literal('')).nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'צבע לא תקין')
    .default('#E8B4B8'),
  isActive: z.boolean().default(true),
  maxAppointmentsPerDay: z.number().int().min(1).optional().nullable(),
  serviceIds: z.array(z.string()).default([]),
})

export type CreateStaffValues = z.infer<typeof createStaffSchema>

/**
 * Admin login schema.
 */
export const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(1, 'סיסמה נדרשת'),
})

export type LoginValues = z.infer<typeof loginSchema>

/**
 * Service category schema.
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, 'שם קטגוריה נדרש').max(100),
  description: z.string().max(300).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export type CreateCategoryValues = z.infer<typeof createCategorySchema>

/**
 * Business settings schema.
 */
export const businessSettingsSchema = z.object({
  businessName: z.string().min(1).max(100),
  address: z.string().max(200).optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  wazeUrl: z.string().url().optional().or(z.literal('')).nullable(),
  googleMapsUrl: z.string().url().optional().or(z.literal('')).nullable(),
  cancellationPolicy: z.string().max(1000).optional().nullable(),
  minBookingNoticeMinutes: z.number().int().min(0).default(180),
  allowClientCancel: z.boolean().default(true),
  allowClientReschedule: z.boolean().default(true),
  cancelLimitHours: z.number().int().min(0).default(24),
  rescheduleLimitHours: z.number().int().min(0).default(24),
  defaultBufferMinutes: z.number().int().min(0).default(10),
  adminNotifyPhone: z.string().optional().nullable(),
  adminNotifyEmail: z.string().email().optional().or(z.literal('')).nullable(),
  footerText: z.string().max(300).optional().nullable(),
})

export type BusinessSettingsValues = z.infer<typeof businessSettingsSchema>

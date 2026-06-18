/**
 * Interpolate a template string by replacing {{varName}} placeholders
 * with the corresponding values from the vars object.
 */
export function interpolateTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return vars[key] ?? `{{${key}}}`
  })
}

// ---------------------------------------------------------------------------
// Hebrew message templates (verbatim per business requirements)
// ---------------------------------------------------------------------------

export const TEMPLATE_OTP = `קוד האימות שלך לשני קוסמטיקס: {{code}}
הקוד תקף ל-10 דקות.`

export const TEMPLATE_APPOINTMENT_CONFIRMATION = `היי {{customerName}},
התור שלך ב"שני קוסמטיקס" נקבע בהצלחה 💛

שירות: {{serviceName}}
מטפלת: {{staffName}}
תאריך: {{date}}
שעה: {{time}}
משך טיפול: {{duration}} דקות
כתובת: {{address}}

לשינוי או ביטול התור:
{{manageLink}}

נשמח לראותך,
שני קוסמטיקס`

export const TEMPLATE_APPOINTMENT_REMINDER = `היי {{customerName}},
תזכורת לתור שלך ב"שני קוסמטיקס" 💛

שירות: {{serviceName}}
תאריך: {{date}}
שעה: {{time}}
כתובת: {{address}}

לניהול התור:
{{manageLink}}`

export const TEMPLATE_APPOINTMENT_CANCELLATION = `היי {{customerName}},
התור שלך ב"שני קוסמטיקס" בוטל.

שירות: {{serviceName}}
תאריך: {{date}}
שעה: {{time}}

לקביעת תור חדש:
{{bookingLink}}`

export const TEMPLATE_APPOINTMENT_RESCHEDULE = `היי {{customerName}},
התור שלך ב"שני קוסמטיקס" עודכן 💛

שירות: {{serviceName}}
מטפלת: {{staffName}}
תאריך חדש: {{date}}
שעה חדשה: {{time}}

לניהול התור:
{{manageLink}}`

export const TEMPLATE_ADMIN_NEW_APPOINTMENT = `נקבע תור חדש ב"שני קוסמטיקס" ✅

לקוחה: {{customerName}}
טלפון: {{customerPhone}}
שירות: {{serviceName}}
מטפלת: {{staffName}}
תאריך: {{date}}
שעה: {{time}}
מחיר: {{price}}`

export const TEMPLATE_ADMIN_CANCELLATION = `בוטל תור ב"שני קוסמטיקס" 🔴

לקוחה: {{customerName}}
טלפון: {{customerPhone}}
שירות: {{serviceName}}
תאריך: {{date}}
שעה: {{time}}`

export const TEMPLATE_WAITLIST_SLOT_AVAILABLE = `היי {{customerName}} 🌟
יש פתח בתור ב"שני קוסמטיקס"!

שירות: {{serviceName}}
תאריך: {{date}}
שעה: {{time}}

לחצי מהר לקביעת התור:
{{bookingLink}}

ההצעה תקפה ל-{{expiresMinutes}} דקות בלבד.`

export const TEMPLATE_REVIEW_REQUEST = `היי {{customerName}} ✨
תודה שביקרת ב"שני קוסמטיקס"!

נשמח מאוד אם תשאירי לנו חוות דעת קצרה:
{{reviewUrl}}

תודה רבה 💛`

// ---------------------------------------------------------------------------
// Template key registry
// ---------------------------------------------------------------------------

export const TEMPLATE_KEYS = {
  OTP: 'otp',
  APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_REMINDER_24H: 'appointment_reminder_24h',
  APPOINTMENT_REMINDER_3H: 'appointment_reminder_3h',
  APPOINTMENT_CANCELLATION: 'appointment_cancellation',
  APPOINTMENT_RESCHEDULE: 'appointment_reschedule',
  ADMIN_NEW_APPOINTMENT: 'admin_new_appointment',
  ADMIN_CANCELLATION: 'admin_cancellation',
  WAITLIST_SLOT_AVAILABLE: 'waitlist_slot_available',
  REVIEW_REQUEST: 'review_request',
} as const

export type TemplateKey = (typeof TEMPLATE_KEYS)[keyof typeof TEMPLATE_KEYS]

export const DEFAULT_TEMPLATES: Record<TemplateKey, string> = {
  [TEMPLATE_KEYS.OTP]: TEMPLATE_OTP,
  [TEMPLATE_KEYS.APPOINTMENT_CONFIRMATION]: TEMPLATE_APPOINTMENT_CONFIRMATION,
  [TEMPLATE_KEYS.APPOINTMENT_REMINDER]: TEMPLATE_APPOINTMENT_REMINDER,
  [TEMPLATE_KEYS.APPOINTMENT_REMINDER_24H]: TEMPLATE_APPOINTMENT_REMINDER,
  [TEMPLATE_KEYS.APPOINTMENT_REMINDER_3H]: TEMPLATE_APPOINTMENT_REMINDER,
  [TEMPLATE_KEYS.APPOINTMENT_CANCELLATION]: TEMPLATE_APPOINTMENT_CANCELLATION,
  [TEMPLATE_KEYS.APPOINTMENT_RESCHEDULE]: TEMPLATE_APPOINTMENT_RESCHEDULE,
  [TEMPLATE_KEYS.ADMIN_NEW_APPOINTMENT]: TEMPLATE_ADMIN_NEW_APPOINTMENT,
  [TEMPLATE_KEYS.ADMIN_CANCELLATION]: TEMPLATE_ADMIN_CANCELLATION,
  [TEMPLATE_KEYS.WAITLIST_SLOT_AVAILABLE]: TEMPLATE_WAITLIST_SLOT_AVAILABLE,
  [TEMPLATE_KEYS.REVIEW_REQUEST]: TEMPLATE_REVIEW_REQUEST,
}

/**
 * Render a template by key, substituting vars.
 * Uses overrideBody (from DB) when provided; falls back to DEFAULT_TEMPLATES.
 */
export function renderTemplate(
  key: TemplateKey,
  vars: Record<string, string>,
  overrideBody?: string
): string {
  const body = overrideBody ?? DEFAULT_TEMPLATES[key] ?? ''
  return interpolateTemplate(body, vars)
}

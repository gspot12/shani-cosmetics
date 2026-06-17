/**
 * Interpolate a template string by replacing {{varName}} placeholders
 * with the corresponding values from the vars object.
 *
 * Example:
 *   interpolateTemplate("שלום {{name}}!", { name: "שני" }) => "שלום שני!"
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
// Message template constants (Hebrew)
// ---------------------------------------------------------------------------

/** OTP verification code */
export const TEMPLATE_OTP = `קוד האימות שלך ל{{businessName}}: {{code}}
הקוד תקף ל-{{expiresMinutes}} דקות.`

/** Appointment confirmation sent to client */
export const TEMPLATE_APPOINTMENT_CONFIRMATION = `שלום {{customerName}} 😊
תורך אושר ב{{businessName}}!

📅 תאריך: {{date}}
⏰ שעה: {{time}}
💆 שירות: {{services}}
👩 מטפלת: {{staffName}}
💰 מחיר: {{price}}

לניהול התור:
{{manageUrl}}

נתראה! 💖`

/** Appointment reminder (sent ~24h before) */
export const TEMPLATE_APPOINTMENT_REMINDER = `שלום {{customerName}} 👋
תזכורת: יש לך תור מחר ב{{businessName}}!

📅 {{date}} בשעה {{time}}
💆 {{services}}
👩 {{staffName}}

לניהול / ביטול התור:
{{manageUrl}}`

/** Appointment cancellation (sent to client) */
export const TEMPLATE_APPOINTMENT_CANCELLATION = `שלום {{customerName}},
התור שלך ל{{date}} בשעה {{time}} בוטל.

{{cancellationReason}}

לקביעת תור חדש:
{{bookingUrl}}

{{businessName}}`

/** Appointment reschedule (sent to client) */
export const TEMPLATE_APPOINTMENT_RESCHEDULE = `שלום {{customerName}} 😊
התור שלך שונה ב{{businessName}}.

📅 תאריך חדש: {{date}}
⏰ שעה חדשה: {{time}}
💆 שירות: {{services}}
👩 {{staffName}}

לניהול התור:
{{manageUrl}}`

/** Admin notification — new appointment */
export const TEMPLATE_ADMIN_NEW_APPOINTMENT = `תור חדש נקבע! 🎉

לקוחה: {{customerName}}
טלפון: {{customerPhone}}
שירות: {{services}}
תאריך: {{date}} בשעה {{time}}
מטפלת: {{staffName}}
מחיר: {{price}}`

/** Admin notification — appointment cancelled by client */
export const TEMPLATE_ADMIN_CANCELLATION = `ביטול תור 🔴

לקוחה: {{customerName}}
טלפון: {{customerPhone}}
שירות: {{services}}
תאריך: {{date}} בשעה {{time}}
סיבה: {{cancellationReason}}`

/** Waitlist notification — slot opened */
export const TEMPLATE_WAITLIST_SLOT_AVAILABLE = `שלום {{customerName}} 🌟
יש פתח בתור ב{{businessName}}!

📅 {{date}} בשעה {{time}}
💆 {{services}}

לחצי מהר לקביעת התור:
{{bookingUrl}}

ההצעה תקפה ל-{{expiresMinutes}} דקות בלבד.`

/** Review request — sent after appointment completion */
export const TEMPLATE_REVIEW_REQUEST = `שלום {{customerName}} ✨
תודה שביקרת ב{{businessName}}!

נשמח מאוד אם תשאירי לנו חוות דעת קצרה:
{{reviewUrl}}

תודה רבה 💖`

// ---------------------------------------------------------------------------
// Template key registry
// ---------------------------------------------------------------------------

export const TEMPLATE_KEYS = {
  OTP: 'otp',
  APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_CANCELLATION: 'appointment_cancellation',
  APPOINTMENT_RESCHEDULE: 'appointment_reschedule',
  ADMIN_NEW_APPOINTMENT: 'admin_new_appointment',
  ADMIN_CANCELLATION: 'admin_cancellation',
  WAITLIST_SLOT_AVAILABLE: 'waitlist_slot_available',
  REVIEW_REQUEST: 'review_request',
} as const

export type TemplateKey = (typeof TEMPLATE_KEYS)[keyof typeof TEMPLATE_KEYS]

/** Map of template keys to their default body strings */
export const DEFAULT_TEMPLATES: Record<TemplateKey, string> = {
  [TEMPLATE_KEYS.OTP]: TEMPLATE_OTP,
  [TEMPLATE_KEYS.APPOINTMENT_CONFIRMATION]: TEMPLATE_APPOINTMENT_CONFIRMATION,
  [TEMPLATE_KEYS.APPOINTMENT_REMINDER]: TEMPLATE_APPOINTMENT_REMINDER,
  [TEMPLATE_KEYS.APPOINTMENT_CANCELLATION]: TEMPLATE_APPOINTMENT_CANCELLATION,
  [TEMPLATE_KEYS.APPOINTMENT_RESCHEDULE]: TEMPLATE_APPOINTMENT_RESCHEDULE,
  [TEMPLATE_KEYS.ADMIN_NEW_APPOINTMENT]: TEMPLATE_ADMIN_NEW_APPOINTMENT,
  [TEMPLATE_KEYS.ADMIN_CANCELLATION]: TEMPLATE_ADMIN_CANCELLATION,
  [TEMPLATE_KEYS.WAITLIST_SLOT_AVAILABLE]: TEMPLATE_WAITLIST_SLOT_AVAILABLE,
  [TEMPLATE_KEYS.REVIEW_REQUEST]: TEMPLATE_REVIEW_REQUEST,
}

/**
 * Render a template by key using the provided variables.
 * Falls back to the default template if the key is not overridden in the DB.
 */
export function renderTemplate(
  key: TemplateKey,
  vars: Record<string, string>,
  overrideBody?: string
): string {
  const body = overrideBody ?? DEFAULT_TEMPLATES[key] ?? ''
  return interpolateTemplate(body, vars)
}

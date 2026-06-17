import { prisma } from './db'
import { getMessagingProvider } from './messaging/provider'
import {
  renderTemplate,
  TEMPLATE_KEYS,
} from './messaging/templates'
import { formatDate, formatTime, formatCurrency } from './utils'

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

// ---------------------------------------------------------------------------
// Helper: log a message to the MessageLog table
// ---------------------------------------------------------------------------

async function logMessage(params: {
  toPhone?: string
  toEmail?: string
  channel: string
  templateKey?: string
  body: string
  appointmentId?: string
  status?: string
  error?: string
}): Promise<void> {
  try {
    await prisma.messageLog.create({
      data: {
        toPhone: params.toPhone,
        toEmail: params.toEmail,
        channel: params.channel,
        templateKey: params.templateKey,
        body: params.body,
        appointmentId: params.appointmentId,
        status: params.status ?? 'SENT',
        error: params.error,
      },
    })
  } catch (err) {
    console.error('[notifications] Failed to write MessageLog', err)
  }
}

// ---------------------------------------------------------------------------
// Helper: fetch a DB template body override if one exists
// ---------------------------------------------------------------------------

async function getTemplateBody(key: string): Promise<string | undefined> {
  const tpl = await prisma.messageTemplate.findUnique({ where: { key } })
  return tpl?.isActive ? tpl.body : undefined
}

// ---------------------------------------------------------------------------
// Helper: fetch business name for templates
// ---------------------------------------------------------------------------

async function getBusinessName(): Promise<string> {
  const settings = await prisma.businessSettings.findFirst()
  return settings?.businessName ?? 'שני קוסמטיקס'
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an appointment confirmation message to the customer via WhatsApp / SMS.
 */
export async function sendAppointmentConfirmation(
  appointmentId: string
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      customer: true,
      staff: true,
      appointmentServices: true,
    },
  })
  if (!appointment) return

  const businessName = await getBusinessName()
  const serviceNames = appointment.appointmentServices
    .map((s) => s.serviceNameSnapshot)
    .join(', ')
  const manageUrl = `${BASE_URL}/my-appointment/${appointment.clientManageToken}`
  const overrideBody = await getTemplateBody(TEMPLATE_KEYS.APPOINTMENT_CONFIRMATION)

  const body = renderTemplate(
    TEMPLATE_KEYS.APPOINTMENT_CONFIRMATION,
    {
      customerName: appointment.customer.fullName,
      businessName,
      date: formatDate(appointment.startDateTime),
      time: formatTime(appointment.startDateTime),
      services: serviceNames,
      staffName: appointment.staff.name,
      price: formatCurrency(appointment.totalPrice),
      manageUrl,
    },
    overrideBody
  )

  const provider = getMessagingProvider()
  let status = 'SENT'
  let error: string | undefined

  try {
    await provider.sendWhatsApp(appointment.customer.phone, body)
  } catch (err) {
    status = 'FAILED'
    error = err instanceof Error ? err.message : String(err)
    console.error('[notifications] sendAppointmentConfirmation failed', err)
  }

  await logMessage({
    toPhone: appointment.customer.phone,
    channel: 'WHATSAPP',
    templateKey: TEMPLATE_KEYS.APPOINTMENT_CONFIRMATION,
    body,
    appointmentId,
    status,
    error,
  })
}

/**
 * Send an appointment update / reschedule message to the customer.
 */
export async function sendAppointmentUpdate(
  appointmentId: string
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      customer: true,
      staff: true,
      appointmentServices: true,
    },
  })
  if (!appointment) return

  const businessName = await getBusinessName()
  const serviceNames = appointment.appointmentServices
    .map((s) => s.serviceNameSnapshot)
    .join(', ')
  const manageUrl = `${BASE_URL}/my-appointment/${appointment.clientManageToken}`
  const overrideBody = await getTemplateBody(TEMPLATE_KEYS.APPOINTMENT_RESCHEDULE)

  const body = renderTemplate(
    TEMPLATE_KEYS.APPOINTMENT_RESCHEDULE,
    {
      customerName: appointment.customer.fullName,
      businessName,
      date: formatDate(appointment.startDateTime),
      time: formatTime(appointment.startDateTime),
      services: serviceNames,
      staffName: appointment.staff.name,
      manageUrl,
    },
    overrideBody
  )

  const provider = getMessagingProvider()
  let status = 'SENT'
  let error: string | undefined

  try {
    await provider.sendWhatsApp(appointment.customer.phone, body)
  } catch (err) {
    status = 'FAILED'
    error = err instanceof Error ? err.message : String(err)
    console.error('[notifications] sendAppointmentUpdate failed', err)
  }

  await logMessage({
    toPhone: appointment.customer.phone,
    channel: 'WHATSAPP',
    templateKey: TEMPLATE_KEYS.APPOINTMENT_RESCHEDULE,
    body,
    appointmentId,
    status,
    error,
  })
}

/**
 * Send an appointment cancellation message to the customer.
 */
export async function sendAppointmentCancellation(
  appointmentId: string,
  cancellationReason?: string
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      customer: true,
      staff: true,
    },
  })
  if (!appointment) return

  const businessName = await getBusinessName()
  const bookingUrl = `${BASE_URL}/book`
  const overrideBody = await getTemplateBody(TEMPLATE_KEYS.APPOINTMENT_CANCELLATION)

  const body = renderTemplate(
    TEMPLATE_KEYS.APPOINTMENT_CANCELLATION,
    {
      customerName: appointment.customer.fullName,
      businessName,
      date: formatDate(appointment.startDateTime),
      time: formatTime(appointment.startDateTime),
      cancellationReason: cancellationReason ?? appointment.cancellationReason ?? '',
      bookingUrl,
    },
    overrideBody
  )

  const provider = getMessagingProvider()
  let status = 'SENT'
  let error: string | undefined

  try {
    await provider.sendWhatsApp(appointment.customer.phone, body)
  } catch (err) {
    status = 'FAILED'
    error = err instanceof Error ? err.message : String(err)
    console.error('[notifications] sendAppointmentCancellation failed', err)
  }

  await logMessage({
    toPhone: appointment.customer.phone,
    channel: 'WHATSAPP',
    templateKey: TEMPLATE_KEYS.APPOINTMENT_CANCELLATION,
    body,
    appointmentId,
    status,
    error,
  })
}

/**
 * Send a notification to the admin about a new or cancelled appointment.
 */
export async function sendAdminNotification(
  appointmentId: string,
  type: 'new' | 'cancelled'
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      customer: true,
      staff: true,
      appointmentServices: true,
    },
  })
  if (!appointment) return

  const settings = await prisma.businessSettings.findFirst()
  const adminPhone = settings?.adminNotifyPhone
  const adminEmail = settings?.adminNotifyEmail
  const businessName = settings?.businessName ?? 'שני קוסמטיקס'

  if (!adminPhone && !adminEmail) return

  const serviceNames = appointment.appointmentServices
    .map((s) => s.serviceNameSnapshot)
    .join(', ')

  const templateKey =
    type === 'new'
      ? TEMPLATE_KEYS.ADMIN_NEW_APPOINTMENT
      : TEMPLATE_KEYS.ADMIN_CANCELLATION

  const overrideBody = await getTemplateBody(templateKey)

  const body = renderTemplate(
    templateKey,
    {
      customerName: appointment.customer.fullName,
      customerPhone: appointment.customer.phone,
      services: serviceNames,
      date: formatDate(appointment.startDateTime),
      time: formatTime(appointment.startDateTime),
      staffName: appointment.staff.name,
      price: formatCurrency(appointment.totalPrice),
      cancellationReason: appointment.cancellationReason ?? '',
      businessName,
    },
    overrideBody
  )

  const provider = getMessagingProvider()

  if (adminPhone) {
    let status = 'SENT'
    let error: string | undefined
    try {
      await provider.sendWhatsApp(adminPhone, body)
    } catch (err) {
      status = 'FAILED'
      error = err instanceof Error ? err.message : String(err)
      console.error('[notifications] sendAdminNotification WhatsApp failed', err)
    }
    await logMessage({
      toPhone: adminPhone,
      channel: 'WHATSAPP',
      templateKey,
      body,
      appointmentId,
      status,
      error,
    })
  }

  if (adminEmail) {
    const subject =
      type === 'new'
        ? `תור חדש — ${appointment.customer.fullName}`
        : `ביטול תור — ${appointment.customer.fullName}`
    let status = 'SENT'
    let error: string | undefined
    try {
      await provider.sendEmail(adminEmail, subject, body)
    } catch (err) {
      status = 'FAILED'
      error = err instanceof Error ? err.message : String(err)
      console.error('[notifications] sendAdminNotification Email failed', err)
    }
    await logMessage({
      toEmail: adminEmail,
      channel: 'EMAIL',
      templateKey,
      body,
      appointmentId,
      status,
      error,
    })
  }
}

/**
 * Send an appointment reminder to the customer (typically called by a cron job).
 */
export async function sendAppointmentReminder(
  appointmentId: string
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      customer: true,
      staff: true,
      appointmentServices: true,
    },
  })
  if (!appointment) return

  const businessName = await getBusinessName()
  const serviceNames = appointment.appointmentServices
    .map((s) => s.serviceNameSnapshot)
    .join(', ')
  const manageUrl = `${BASE_URL}/my-appointment/${appointment.clientManageToken}`
  const overrideBody = await getTemplateBody(TEMPLATE_KEYS.APPOINTMENT_REMINDER)

  const body = renderTemplate(
    TEMPLATE_KEYS.APPOINTMENT_REMINDER,
    {
      customerName: appointment.customer.fullName,
      businessName,
      date: formatDate(appointment.startDateTime),
      time: formatTime(appointment.startDateTime),
      services: serviceNames,
      staffName: appointment.staff.name,
      manageUrl,
    },
    overrideBody
  )

  const provider = getMessagingProvider()
  let status = 'SENT'
  let error: string | undefined

  try {
    await provider.sendWhatsApp(appointment.customer.phone, body)
  } catch (err) {
    status = 'FAILED'
    error = err instanceof Error ? err.message : String(err)
    console.error('[notifications] sendAppointmentReminder failed', err)
  }

  await logMessage({
    toPhone: appointment.customer.phone,
    channel: 'WHATSAPP',
    templateKey: TEMPLATE_KEYS.APPOINTMENT_REMINDER,
    body,
    appointmentId,
    status,
    error,
  })
}

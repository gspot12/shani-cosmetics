import { prisma } from './db'
import { getMessagingProvider } from './messaging/provider'
import { renderTemplate, TEMPLATE_KEYS } from './messaging/templates'
import { formatDate, formatTime, formatCurrency } from './utils'

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

// ---------------------------------------------------------------------------
// Helpers
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

async function getTemplateBody(key: string): Promise<string | undefined> {
  const tpl = await prisma.messageTemplate.findUnique({ where: { key } })
  return tpl?.isActive ? tpl.body : undefined
}

async function getSettings() {
  return prisma.businessSettings.findFirst()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendAppointmentConfirmation(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true, staff: true, appointmentServices: true },
  })
  if (!appointment) return

  const settings = await getSettings()
  const serviceName = appointment.appointmentServices
    .map((s) => s.serviceNameSnapshot)
    .join(', ')
  const manageLink = `${BASE_URL}/my-appointment/${appointment.clientManageToken}`
  const overrideBody = await getTemplateBody(TEMPLATE_KEYS.APPOINTMENT_CONFIRMATION)

  const body = renderTemplate(
    TEMPLATE_KEYS.APPOINTMENT_CONFIRMATION,
    {
      customerName: appointment.customer.fullName,
      serviceName,
      staffName: appointment.staff.name,
      date: formatDate(appointment.startDateTime),
      time: formatTime(appointment.startDateTime),
      duration: String(appointment.totalDurationMinutes),
      address: settings?.address ?? '',
      manageLink,
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
    console.error('[notifications] sendAppointmentConfirmation failed:', error)
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

export async function sendAppointmentUpdate(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true, staff: true, appointmentServices: true },
  })
  if (!appointment) return

  const serviceName = appointment.appointmentServices
    .map((s) => s.serviceNameSnapshot)
    .join(', ')
  const manageLink = `${BASE_URL}/my-appointment/${appointment.clientManageToken}`
  const overrideBody = await getTemplateBody(TEMPLATE_KEYS.APPOINTMENT_RESCHEDULE)

  const body = renderTemplate(
    TEMPLATE_KEYS.APPOINTMENT_RESCHEDULE,
    {
      customerName: appointment.customer.fullName,
      serviceName,
      staffName: appointment.staff.name,
      date: formatDate(appointment.startDateTime),
      time: formatTime(appointment.startDateTime),
      manageLink,
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
    console.error('[notifications] sendAppointmentUpdate failed:', error)
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

export async function sendAppointmentCancellation(
  appointmentId: string,
  _cancellationReason?: string
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true, appointmentServices: true },
  })
  if (!appointment) return

  const serviceName = appointment.appointmentServices
    .map((s) => s.serviceNameSnapshot)
    .join(', ')
  const bookingLink = `${BASE_URL}/book`
  const overrideBody = await getTemplateBody(TEMPLATE_KEYS.APPOINTMENT_CANCELLATION)

  const body = renderTemplate(
    TEMPLATE_KEYS.APPOINTMENT_CANCELLATION,
    {
      customerName: appointment.customer.fullName,
      serviceName,
      date: formatDate(appointment.startDateTime),
      time: formatTime(appointment.startDateTime),
      bookingLink,
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
    console.error('[notifications] sendAppointmentCancellation failed:', error)
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

export async function sendAdminNotification(
  appointmentId: string,
  type: 'new' | 'cancelled'
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true, staff: true, appointmentServices: true },
  })
  if (!appointment) return

  const settings = await getSettings()
  const adminPhone = settings?.adminNotifyPhone ?? process.env.ADMIN_NOTIFY_PHONE
  const adminEmail = settings?.adminNotifyEmail
  if (!adminPhone && !adminEmail) return

  const serviceName = appointment.appointmentServices
    .map((s) => s.serviceNameSnapshot)
    .join(', ')

  const templateKey =
    type === 'new' ? TEMPLATE_KEYS.ADMIN_NEW_APPOINTMENT : TEMPLATE_KEYS.ADMIN_CANCELLATION

  const overrideBody = await getTemplateBody(templateKey)

  const body = renderTemplate(
    templateKey,
    {
      customerName: appointment.customer.fullName,
      customerPhone: appointment.customer.phone,
      serviceName,
      staffName: appointment.staff.name,
      date: formatDate(appointment.startDateTime),
      time: formatTime(appointment.startDateTime),
      price: formatCurrency(appointment.totalPrice),
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
      console.error('[notifications] sendAdminNotification WhatsApp failed:', error)
    }
    await logMessage({ toPhone: adminPhone, channel: 'WHATSAPP', templateKey, body, appointmentId, status, error })
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
      console.error('[notifications] sendAdminNotification Email failed:', error)
    }
    await logMessage({ toEmail: adminEmail, channel: 'EMAIL', templateKey, body, appointmentId, status, error })
  }
}

export async function sendAppointmentReminder(
  appointmentId: string,
  templateKey:
    | typeof TEMPLATE_KEYS.APPOINTMENT_REMINDER_24H
    | typeof TEMPLATE_KEYS.APPOINTMENT_REMINDER_3H = TEMPLATE_KEYS.APPOINTMENT_REMINDER_24H
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true, staff: true, appointmentServices: true },
  })
  if (!appointment) return

  const settings = await getSettings()
  const serviceName = appointment.appointmentServices
    .map((s) => s.serviceNameSnapshot)
    .join(', ')
  const manageLink = `${BASE_URL}/my-appointment/${appointment.clientManageToken}`
  const overrideBody = await getTemplateBody(templateKey)

  const body = renderTemplate(
    templateKey,
    {
      customerName: appointment.customer.fullName,
      serviceName,
      date: formatDate(appointment.startDateTime),
      time: formatTime(appointment.startDateTime),
      address: settings?.address ?? '',
      manageLink,
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
    console.error('[notifications] sendAppointmentReminder failed:', error)
  }

  await logMessage({
    toPhone: appointment.customer.phone,
    channel: 'WHATSAPP',
    templateKey,
    body,
    appointmentId,
    status,
    error,
  })
}

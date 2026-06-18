'use server'

import { prisma } from '@/lib/db'
import {
  generateOtpCode,
  hashOtp,
  verifyOtpCode,
  createSessionToken,
  verifySessionToken,
} from '@/lib/auth'
import { getAvailableSlots as libGetAvailableSlots, getAvailableDates as libGetAvailableDates } from '@/lib/availability'
import {
  sendAppointmentConfirmation,
  sendAdminNotification,
  sendAppointmentCancellation,
  sendAppointmentUpdate,
} from '@/lib/notifications'
import { getMessagingProvider } from '@/lib/messaging/provider'
import { renderTemplate, TEMPLATE_KEYS } from '@/lib/messaging/templates'
import { formatDate, formatTime, formatCurrency, normalizeIsraeliPhone } from '@/lib/utils'
import type {
  ServiceWithCategory,
  AvailableSlot,
  DateAvailability,
  AppointmentStatus,
} from '@/types'
import type {
  ServiceCategory,
  Staff,
  Appointment,
  AppointmentService,
  Customer,
  Review,
  WaitlistEntry,
} from '@prisma/client'

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

// ---------------------------------------------------------------------------
// 1. getServices
// ---------------------------------------------------------------------------

export async function getServices(): Promise<ServiceWithCategory[]> {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [
      { category: { sortOrder: 'asc' } },
      { sortOrder: 'asc' },
    ],
  })

  return services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    bufferBeforeMinutes: s.bufferBeforeMinutes,
    bufferAfterMinutes: s.bufferAfterMinutes,
    price: s.price,
    depositAmount: s.depositAmount,
    requiresDeposit: s.requiresDeposit,
    requiresApproval: s.requiresApproval,
    imageUrl: s.imageUrl,
    isActive: s.isActive,
    sortOrder: s.sortOrder,
    categoryId: s.categoryId,
    categoryName: s.category.name,
  }))
}

// ---------------------------------------------------------------------------
// 2. getServiceCategories
// ---------------------------------------------------------------------------

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  return prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

// ---------------------------------------------------------------------------
// 3. getStaffForServices
// ---------------------------------------------------------------------------

export async function getStaffForServices(serviceIds: string[]): Promise<Staff[]> {
  if (!serviceIds.length) return []

  // Staff must be able to perform ALL specified services
  const staff = await prisma.staff.findMany({
    where: {
      isActive: true,
      staffServices: {
        some: { serviceId: { in: serviceIds } },
      },
    },
    include: {
      staffServices: { select: { serviceId: true } },
    },
  })

  // Filter to staff who can perform every requested service
  return staff.filter((s) => {
    const staffServiceIds = new Set(s.staffServices.map((ss) => ss.serviceId))
    return serviceIds.every((id) => staffServiceIds.has(id))
  })
}

// ---------------------------------------------------------------------------
// 4. getAvailableDates
// ---------------------------------------------------------------------------

export async function getAvailableDates(params: {
  serviceIds: string[]
  staffId?: string
  year: number
  month: number
}): Promise<DateAvailability[]> {
  const { serviceIds, staffId, year, month } = params
  return libGetAvailableDates(serviceIds, month, year, staffId)
}

// ---------------------------------------------------------------------------
// 5. getAvailableSlots
// ---------------------------------------------------------------------------

export async function getAvailableSlots(params: {
  serviceIds: string[]
  staffId?: string
  date: string
}): Promise<AvailableSlot[]> {
  const { serviceIds, staffId, date } = params
  const dateObj = new Date(date + 'T00:00:00')
  return libGetAvailableSlots({ serviceIds, staffId, date: dateObj })
}

// ---------------------------------------------------------------------------
// 6. createBookingHold
// ---------------------------------------------------------------------------

export async function createBookingHold(params: {
  staffId: string
  startDateTime: string
  endDateTime: string
  customerPhone?: string
}): Promise<{ token: string }> {
  const { staffId, startDateTime, endDateTime, customerPhone } = params

  // Clean up expired holds first
  await prisma.bookingHold.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  const hold = await prisma.bookingHold.create({
    data: {
      staffId,
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      expiresAt,
      customerPhone,
    },
  })

  return { token: hold.token }
}

// ---------------------------------------------------------------------------
// 7. releaseBookingHold
// ---------------------------------------------------------------------------

export async function releaseBookingHold(token: string): Promise<void> {
  await prisma.bookingHold.deleteMany({ where: { token } })
}

// ---------------------------------------------------------------------------
// 8. startOtp
// ---------------------------------------------------------------------------

export async function startOtp(params: {
  phone: string
}): Promise<{ exists: boolean }> {
  let phone: string
  try {
    phone = normalizeIsraeliPhone(params.phone)
  } catch {
    throw new Error('מספר הטלפון לא תקין')
  }

  // Rate limit: max 5 OTPs per phone per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentCount = await prisma.otpCode.count({
    where: { phone, createdAt: { gte: oneHourAgo } },
  })
  if (recentCount >= 5) {
    throw new Error('יותר מדי ניסיונות. נסי שוב בעוד שעה.')
  }

  const provider = getMessagingProvider()

  if (provider.startVerification) {
    // Twilio Verify flow — no local code; Twilio sends the OTP via WhatsApp
    try {
      await provider.startVerification(phone)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[startOtp] Twilio Verify start failed:', msg)
      throw new Error('לא הצלחנו לשלוח קוד אימות כרגע. נסי שוב בעוד רגע.')
    }
    // Store a placeholder OtpCode for rate-limiting purposes only
    await prisma.otpCode.create({
      data: {
        phone,
        codeHash: 'TWILIO_VERIFY',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        channel: 'WHATSAPP',
      },
    })
  } else {
    // Dev / fallback flow — generate local code and log it
    const code = generateOtpCode()
    const codeHash = hashOtp(code)
    await prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        channel: 'SMS',
      },
    })
    try {
      await provider.sendOtp(phone, code)
    } catch (err) {
      console.error('[startOtp] Failed to send OTP', err instanceof Error ? err.message : err)
    }
  }

  const exists = (await prisma.customer.count({ where: { phone } })) > 0
  return { exists }
}

// ---------------------------------------------------------------------------
// 9. verifyOtp
// ---------------------------------------------------------------------------

export async function verifyOtp(params: {
  phone: string
  code: string
}): Promise<{ valid: boolean; sessionToken?: string }> {
  let phone: string
  try {
    phone = normalizeIsraeliPhone(params.phone)
  } catch {
    return { valid: false }
  }
  const { code } = params

  // Find the most recent unconsumed OtpCode (used for rate limiting in all modes)
  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!otp) return { valid: false }

  // Increment attempt count
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  })
  if (otp.attempts >= 5) return { valid: false }

  const provider = getMessagingProvider()

  let isValid: boolean

  if (provider.checkVerification) {
    // Twilio Verify flow — check with Twilio
    isValid = await provider.checkVerification(phone, code)
  } else {
    // Dev / fallback flow — compare hash
    isValid = verifyOtpCode(code, otp.codeHash)
  }

  if (!isValid) return { valid: false }

  // Mark as consumed
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  })

  const sessionToken = await createSessionToken({ phone, type: 'customer' }, '24h')
  return { valid: true, sessionToken }
}

// ---------------------------------------------------------------------------
// 10. createAppointment
// ---------------------------------------------------------------------------

export async function createAppointment(params: {
  serviceIds: string[]
  staffId: string
  startDateTime: string
  holdToken: string
  customerData: {
    phone: string
    fullName: string
    email?: string
    marketingConsent?: boolean
  }
  clientNotes?: string
  sessionToken: string
}): Promise<{ appointmentId: string; manageToken: string }> {
  const {
    serviceIds,
    staffId,
    startDateTime,
    holdToken,
    customerData,
    clientNotes,
    sessionToken,
  } = params

  // Normalize phone for consistent storage and session comparison
  let normalizedPhone: string
  try {
    normalizedPhone = normalizeIsraeliPhone(customerData.phone)
  } catch {
    throw new Error('מספר הטלפון לא תקין')
  }

  // Verify session token
  let sessionPayload: Record<string, unknown>
  try {
    sessionPayload = await verifySessionToken(sessionToken)
  } catch {
    throw new Error('פגישה לא תקפה. נא להתחבר מחדש.')
  }

  if (
    sessionPayload.type !== 'customer' ||
    sessionPayload.phone !== normalizedPhone
  ) {
    throw new Error('אין הרשאה.')
  }

  // Verify hold token still valid
  const hold = await prisma.bookingHold.findUnique({
    where: { token: holdToken },
  })

  if (!hold || hold.expiresAt < new Date()) {
    throw new Error('ההזמנה הזמנית פגה. נא לבחור שוב.')
  }

  // Fetch services
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
  })

  if (services.length !== serviceIds.length) {
    throw new Error('שירות לא נמצא.')
  }

  // Calculate total duration and price
  const totalDurationMinutes = services.reduce(
    (sum, s) =>
      sum +
      s.durationMinutes +
      Math.max(...services.map((sv) => sv.bufferBeforeMinutes)) +
      Math.max(...services.map((sv) => sv.bufferAfterMinutes)),
    0
  )

  // Actually compute correctly: max buffer before + sum of durations + max buffer after
  const maxBufferBefore = Math.max(...services.map((s) => s.bufferBeforeMinutes))
  const maxBufferAfter = Math.max(...services.map((s) => s.bufferAfterMinutes))
  const totalServiceMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0)
  const totalDuration = maxBufferBefore + totalServiceMinutes + maxBufferAfter

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0)

  const startDt = new Date(startDateTime)
  const endDt = new Date(startDt.getTime() + totalDuration * 60 * 1000)

  // Determine status
  const requiresApproval = services.some((s) => s.requiresApproval)
  const status: AppointmentStatus = requiresApproval
    ? 'PENDING_APPROVAL'
    : 'CONFIRMED'

  // Use a transaction to prevent double-booking
  const result = await prisma.$transaction(async (tx) => {
    // Check for conflicting appointments
    const conflict = await tx.appointment.findFirst({
      where: {
        staffId,
        status: { notIn: ['CANCELLED_BY_CLIENT', 'CANCELLED_BY_ADMIN', 'NO_SHOW'] },
        OR: [
          {
            startDateTime: { lt: endDt },
            endDateTime: { gt: startDt },
          },
        ],
      },
    })

    if (conflict) {
      throw new Error('התור כבר תפוס. נא לבחור שעה אחרת.')
    }

    // Create or find customer (use normalized phone for consistent lookups)
    const customer = await tx.customer.upsert({
      where: { phone: normalizedPhone },
      create: {
        phone: normalizedPhone,
        fullName: customerData.fullName,
        email: customerData.email,
        marketingConsent: customerData.marketingConsent ?? false,
      },
      update: {
        fullName: customerData.fullName,
        ...(customerData.email ? { email: customerData.email } : {}),
        ...(customerData.marketingConsent !== undefined
          ? { marketingConsent: customerData.marketingConsent }
          : {}),
      },
    })

    // Create appointment
    const appointment = await tx.appointment.create({
      data: {
        customerId: customer.id,
        staffId,
        status,
        startDateTime: startDt,
        endDateTime: endDt,
        totalDurationMinutes: totalDuration,
        totalPrice,
        clientNotes,
        appointmentServices: {
          create: services.map((s) => ({
            serviceId: s.id,
            serviceNameSnapshot: s.name,
            priceSnapshot: s.price,
            durationSnapshot: s.durationMinutes,
          })),
        },
      },
    })

    // Delete the hold
    await tx.bookingHold.deleteMany({ where: { token: holdToken } })

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'APPOINTMENT_CREATED',
        entityType: 'Appointment',
        entityId: appointment.id,
        metadata: JSON.stringify({ status, customerPhone: customerData.phone }),
      },
    })

    // Create admin notification record
    await tx.notification.create({
      data: {
        type: 'NEW_APPOINTMENT',
        title: 'תור חדש',
        body: `תור חדש נקבע עבור ${customerData.fullName}`,
        appointmentId: appointment.id,
      },
    })

    return { appointmentId: appointment.id, manageToken: appointment.clientManageToken }
  })

  // Send messages after transaction (non-blocking)
  sendAppointmentConfirmation(result.appointmentId).catch((err) =>
    console.error('[createAppointment] sendConfirmation failed', err)
  )
  sendAdminNotification(result.appointmentId, 'new').catch((err) =>
    console.error('[createAppointment] sendAdminNotification failed', err)
  )

  return result
}

// ---------------------------------------------------------------------------
// 11. getAppointmentByManageToken
// ---------------------------------------------------------------------------

export async function getAppointmentByManageToken(
  token: string
): Promise<
  | (Appointment & {
      customer: Customer
      staff: Staff
      appointmentServices: AppointmentService[]
      reviews: Review[]
    })
  | null
> {
  return prisma.appointment.findUnique({
    where: { clientManageToken: token },
    include: {
      customer: true,
      staff: true,
      appointmentServices: true,
      reviews: true,
    },
  })
}

// ---------------------------------------------------------------------------
// 12. cancelAppointmentByToken
// ---------------------------------------------------------------------------

export async function cancelAppointmentByToken(params: {
  token: string
  reason?: string
}): Promise<void> {
  const { token, reason } = params

  const appointment = await prisma.appointment.findUnique({
    where: { clientManageToken: token },
    include: { customer: true },
  })

  if (!appointment) {
    throw new Error('תור לא נמצא.')
  }

  const cancelledStatuses = [
    'CANCELLED_BY_CLIENT',
    'CANCELLED_BY_ADMIN',
    'COMPLETED',
    'NO_SHOW',
  ]
  if (cancelledStatuses.includes(appointment.status)) {
    throw new Error('לא ניתן לבטל תור זה.')
  }

  // Check cancellation policy
  const settings = await prisma.businessSettings.findFirst()
  if (!settings?.allowClientCancel) {
    throw new Error('ביטול עצמאי אינו מאופשר. נא ליצור קשר.')
  }

  const cancelLimitMs = (settings.cancelLimitHours ?? 24) * 60 * 60 * 1000
  const timeUntilAppointment =
    appointment.startDateTime.getTime() - Date.now()

  if (timeUntilAppointment < cancelLimitMs) {
    throw new Error(
      `ביטול אפשרי עד ${settings.cancelLimitHours} שעות לפני התור.`
    )
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED_BY_CLIENT',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'APPOINTMENT_CANCELLED_BY_CLIENT',
        entityType: 'Appointment',
        entityId: appointment.id,
        metadata: JSON.stringify({ reason }),
      },
    })

    await tx.notification.create({
      data: {
        type: 'APPOINTMENT_CANCELLED',
        title: 'ביטול תור',
        body: `התור של ${appointment.customer.fullName} בוטל על ידי הלקוח`,
        appointmentId: appointment.id,
      },
    })
  })

  sendAppointmentCancellation(appointment.id, reason).catch((err) =>
    console.error('[cancelAppointmentByToken] sendCancellation failed', err)
  )
  sendAdminNotification(appointment.id, 'cancelled').catch((err) =>
    console.error('[cancelAppointmentByToken] sendAdminNotification failed', err)
  )
}

// ---------------------------------------------------------------------------
// 13. rescheduleAppointmentByToken
// ---------------------------------------------------------------------------

export async function rescheduleAppointmentByToken(params: {
  token: string
  newStartDateTime: string
  staffId: string
}): Promise<void> {
  const { token, newStartDateTime, staffId } = params

  const appointment = await prisma.appointment.findUnique({
    where: { clientManageToken: token },
    include: {
      appointmentServices: { include: { service: true } },
      customer: true,
    },
  })

  if (!appointment) {
    throw new Error('תור לא נמצא.')
  }

  const activeStatuses = ['CONFIRMED', 'PENDING_APPROVAL', 'RESCHEDULED']
  if (!activeStatuses.includes(appointment.status)) {
    throw new Error('לא ניתן לשנות תור זה.')
  }

  // Check reschedule policy
  const settings = await prisma.businessSettings.findFirst()
  if (!settings?.allowClientReschedule) {
    throw new Error('שינוי תור עצמאי אינו מאופשר. נא ליצור קשר.')
  }

  const rescheduleLimitMs = (settings.rescheduleLimitHours ?? 24) * 60 * 60 * 1000
  const timeUntilAppointment = appointment.startDateTime.getTime() - Date.now()

  if (timeUntilAppointment < rescheduleLimitMs) {
    throw new Error(
      `שינוי אפשרי עד ${settings.rescheduleLimitHours} שעות לפני התור.`
    )
  }

  const newStart = new Date(newStartDateTime)
  const newEnd = new Date(
    newStart.getTime() + appointment.totalDurationMinutes * 60 * 1000
  )

  await prisma.$transaction(async (tx) => {
    // Check for conflicts
    const conflict = await tx.appointment.findFirst({
      where: {
        id: { not: appointment.id },
        staffId,
        status: { notIn: ['CANCELLED_BY_CLIENT', 'CANCELLED_BY_ADMIN', 'NO_SHOW'] },
        OR: [{ startDateTime: { lt: newEnd }, endDateTime: { gt: newStart } }],
      },
    })

    if (conflict) {
      throw new Error('התור כבר תפוס. נא לבחור שעה אחרת.')
    }

    await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        staffId,
        startDateTime: newStart,
        endDateTime: newEnd,
        status: 'RESCHEDULED',
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'APPOINTMENT_RESCHEDULED_BY_CLIENT',
        entityType: 'Appointment',
        entityId: appointment.id,
        metadata: JSON.stringify({ newStartDateTime, staffId }),
      },
    })
  })

  sendAppointmentUpdate(appointment.id).catch((err) =>
    console.error('[rescheduleAppointmentByToken] sendUpdate failed', err)
  )
}

// ---------------------------------------------------------------------------
// 14. createWaitlistEntry
// ---------------------------------------------------------------------------

export async function createWaitlistEntry(params: {
  customerPhone: string
  serviceId: string
  staffId?: string
  preferredFrom?: string
  preferredTo?: string
  notes?: string
}): Promise<void> {
  const { customerPhone, serviceId, staffId, preferredFrom, preferredTo, notes } =
    params

  // Find or create customer (minimal record)
  let customer = await prisma.customer.findUnique({
    where: { phone: customerPhone },
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        phone: customerPhone,
        fullName: customerPhone, // Placeholder; updated later
      },
    })
  }

  await prisma.waitlistEntry.create({
    data: {
      customerId: customer.id,
      serviceId,
      staffId,
      preferredFrom: preferredFrom ? new Date(preferredFrom) : undefined,
      preferredTo: preferredTo ? new Date(preferredTo) : undefined,
      notes,
      status: 'WAITING',
    },
  })
}

// ---------------------------------------------------------------------------
// 15. createReview
// ---------------------------------------------------------------------------

export async function createReview(params: {
  manageToken: string
  rating: number
  text?: string
}): Promise<void> {
  const { manageToken, rating, text } = params

  const appointment = await prisma.appointment.findUnique({
    where: { clientManageToken: manageToken },
  })

  if (!appointment) {
    throw new Error('תור לא נמצא.')
  }

  if (appointment.status !== 'COMPLETED') {
    throw new Error('ניתן לדרג רק תורים שהושלמו.')
  }

  // Check if review already exists
  const existingReview = await prisma.review.findFirst({
    where: { appointmentId: appointment.id },
  })

  if (existingReview) {
    throw new Error('כבר השארת חוות דעת לתור זה.')
  }

  if (rating < 1 || rating > 5) {
    throw new Error('דירוג חייב להיות בין 1 ל-5.')
  }

  await prisma.review.create({
    data: {
      customerId: appointment.customerId,
      appointmentId: appointment.id,
      rating,
      text,
      isPublished: false,
    },
  })
}

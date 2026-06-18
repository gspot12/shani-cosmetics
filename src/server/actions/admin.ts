'use server'

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import {
  sendAppointmentConfirmation,
  sendAdminNotification,
  sendAppointmentCancellation,
  sendAppointmentUpdate,
} from '@/lib/notifications'
import { getMessagingProvider, isDevMessagingMode } from '@/lib/messaging/provider'
import { normalizeIsraeliPhone, formatDate, formatTime } from '@/lib/utils'
import type {
  ServiceWithCategory,
  StaffWithServices,
  AppointmentStatus,
  PaymentStatus,
} from '@/types'
import type {
  Customer,
  Staff,
  Service,
  WorkingHour,
  AvailabilityBlock,
  Notification,
  MessageTemplate,
  BusinessSettings,
  WaitlistEntry,
  Review,
  AuditLog,
  Appointment,
  AppointmentService,
} from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  todayAppointments: number
  tomorrowAppointments: number
  thisWeekAppointments: number
  estimatedRevenueThisWeek: number
  newCustomersThisWeek: number
  cancellationsThisWeek: number
  pendingApprovalCount: number
  waitlistCount: number
  unreadNotificationsCount: number
}

export interface AppointmentWithDetails extends Appointment {
  customer: Customer
  staff: Staff
  appointmentServices: AppointmentService[]
}

export interface WorkingHourInput {
  id?: string
  staffId?: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export interface ServiceCreateInput {
  categoryId: string
  name: string
  description?: string
  durationMinutes: number
  bufferBeforeMinutes?: number
  bufferAfterMinutes?: number
  price: number
  depositAmount?: number | null
  requiresDeposit?: boolean
  requiresApproval?: boolean
  imageUrl?: string | null
  isActive?: boolean
  sortOrder?: number
}

export interface StaffCreateInput {
  name: string
  phone?: string | null
  email?: string | null
  bio?: string | null
  imageUrl?: string | null
  color?: string
  isActive?: boolean
  maxAppointmentsPerDay?: number | null
  serviceIds?: string[]
}

// ---------------------------------------------------------------------------
// 1. getDashboardStats
// ---------------------------------------------------------------------------

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const tomorrowEnd = new Date(todayEnd)
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)

  // Start of current week (Sunday)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const activeStatuses = ['CONFIRMED', 'PENDING_APPROVAL', 'RESCHEDULED', 'COMPLETED']
  const cancelledStatuses = ['CANCELLED_BY_CLIENT', 'CANCELLED_BY_ADMIN']

  const [
    todayAppointments,
    tomorrowAppointments,
    weekAppointments,
    cancellationsThisWeek,
    newCustomersThisWeek,
    pendingApprovalCount,
    waitlistCount,
    unreadNotificationsCount,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        startDateTime: { gte: todayStart, lte: todayEnd },
        status: { in: activeStatuses },
      },
    }),
    prisma.appointment.count({
      where: {
        startDateTime: { gte: tomorrowStart, lte: tomorrowEnd },
        status: { in: activeStatuses },
      },
    }),
    prisma.appointment.findMany({
      where: {
        startDateTime: { gte: weekStart, lt: weekEnd },
        status: { in: activeStatuses },
      },
      select: { totalPrice: true },
    }),
    prisma.appointment.count({
      where: {
        startDateTime: { gte: weekStart, lt: weekEnd },
        status: { in: cancelledStatuses },
      },
    }),
    prisma.customer.count({
      where: { createdAt: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.appointment.count({
      where: { status: 'PENDING_APPROVAL' },
    }),
    prisma.waitlistEntry.count({
      where: { status: 'WAITING' },
    }),
    prisma.notification.count({
      where: { isRead: false },
    }),
  ])

  const estimatedRevenueThisWeek = weekAppointments.reduce(
    (sum, a) => sum + a.totalPrice,
    0
  )

  return {
    todayAppointments,
    tomorrowAppointments,
    thisWeekAppointments: weekAppointments.length,
    estimatedRevenueThisWeek,
    newCustomersThisWeek,
    cancellationsThisWeek,
    pendingApprovalCount,
    waitlistCount,
    unreadNotificationsCount,
  }
}

// ---------------------------------------------------------------------------
// 2. listAppointments
// ---------------------------------------------------------------------------

export async function listAppointments(params: {
  date?: string
  staffId?: string
  status?: string
  page?: number
}): Promise<{ appointments: AppointmentWithDetails[]; total: number }> {
  const { date, staffId, status, page = 1 } = params
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where: Prisma.AppointmentWhereInput = {}

  if (date) {
    const dayStart = new Date(date + 'T00:00:00')
    const dayEnd = new Date(date + 'T23:59:59')
    where.startDateTime = { gte: dayStart, lte: dayEnd }
  }

  if (staffId) {
    where.staffId = staffId
  }

  if (status) {
    where.status = status
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        customer: true,
        staff: true,
        appointmentServices: true,
      },
      orderBy: { startDateTime: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.appointment.count({ where }),
  ])

  return { appointments, total }
}

// ---------------------------------------------------------------------------
// 3. createManualAppointment
// ---------------------------------------------------------------------------

export async function createManualAppointment(params: {
  serviceIds: string[]
  staffId: string
  startDateTime: string
  customerData: {
    phone: string
    fullName: string
    email?: string
    marketingConsent?: boolean
  }
  clientNotes?: string
  internalNotes?: string
  status?: AppointmentStatus
  createdById?: string
}): Promise<{ appointmentId: string }> {
  const {
    serviceIds,
    staffId,
    startDateTime,
    customerData,
    clientNotes,
    internalNotes,
    status = 'CONFIRMED',
    createdById,
  } = params

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  })

  if (!services.length) {
    throw new Error('שירותים לא נמצאו.')
  }

  const maxBufferBefore = Math.max(...services.map((s) => s.bufferBeforeMinutes))
  const maxBufferAfter = Math.max(...services.map((s) => s.bufferAfterMinutes))
  const totalServiceMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0)
  const totalDuration = maxBufferBefore + totalServiceMinutes + maxBufferAfter
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0)

  const startDt = new Date(startDateTime)
  const endDt = new Date(startDt.getTime() + totalDuration * 60 * 1000)

  const result = await prisma.$transaction(async (tx) => {
    // Check for conflicts
    const conflict = await tx.appointment.findFirst({
      where: {
        staffId,
        status: { notIn: ['CANCELLED_BY_CLIENT', 'CANCELLED_BY_ADMIN', 'NO_SHOW'] },
        OR: [{ startDateTime: { lt: endDt }, endDateTime: { gt: startDt } }],
      },
    })

    if (conflict) {
      throw new Error('התור כבר תפוס.')
    }

    const customer = await tx.customer.upsert({
      where: { phone: customerData.phone },
      create: {
        phone: customerData.phone,
        fullName: customerData.fullName,
        email: customerData.email,
        marketingConsent: customerData.marketingConsent ?? false,
      },
      update: {
        fullName: customerData.fullName,
        ...(customerData.email ? { email: customerData.email } : {}),
      },
    })

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
        internalNotes,
        createdById,
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

    await tx.auditLog.create({
      data: {
        actorUserId: createdById,
        action: 'APPOINTMENT_CREATED_MANUALLY',
        entityType: 'Appointment',
        entityId: appointment.id,
        metadata: JSON.stringify({ customerPhone: customerData.phone }),
      },
    })

    return { appointmentId: appointment.id }
  })

  sendAppointmentConfirmation(result.appointmentId).catch(console.error)
  sendAdminNotification(result.appointmentId, 'new').catch(console.error)

  return result
}

// ---------------------------------------------------------------------------
// 4. updateAppointmentStatus
// ---------------------------------------------------------------------------

export async function updateAppointmentStatus(params: {
  appointmentId: string
  status: AppointmentStatus
  sendNotification?: boolean
  internalNotes?: string
}): Promise<void> {
  const { appointmentId, status, sendNotification = true, internalNotes } = params

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status,
      ...(internalNotes ? { internalNotes } : {}),
      ...(status === 'CANCELLED_BY_ADMIN' ? { cancelledAt: new Date() } : {}),
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'APPOINTMENT_STATUS_UPDATED',
      entityType: 'Appointment',
      entityId: appointmentId,
      metadata: JSON.stringify({ status }),
    },
  })

  if (!sendNotification) return

  if (status === 'CANCELLED_BY_ADMIN') {
    sendAppointmentCancellation(appointmentId).catch(console.error)
  } else if (status === 'CONFIRMED' || status === 'RESCHEDULED') {
    sendAppointmentUpdate(appointmentId).catch(console.error)
  }
}

// ---------------------------------------------------------------------------
// 5. updateAppointmentPayment
// ---------------------------------------------------------------------------

export async function updateAppointmentPayment(params: {
  appointmentId: string
  paymentStatus: PaymentStatus
}): Promise<void> {
  const { appointmentId, paymentStatus } = params

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentStatus },
  })

  await prisma.auditLog.create({
    data: {
      action: 'APPOINTMENT_PAYMENT_UPDATED',
      entityType: 'Appointment',
      entityId: appointmentId,
      metadata: JSON.stringify({ paymentStatus }),
    },
  })
}

// ---------------------------------------------------------------------------
// 6. listCustomers
// ---------------------------------------------------------------------------

export async function listCustomers(params: {
  search?: string
  page?: number
}): Promise<{ customers: Customer[]; total: number }> {
  const { search, page = 1 } = params
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where: Prisma.CustomerWhereInput = {}

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ]
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ])

  return { customers, total }
}

// ---------------------------------------------------------------------------
// 7. updateCustomer
// ---------------------------------------------------------------------------

export async function updateCustomer(params: {
  customerId: string
  data: Partial<Customer>
}): Promise<void> {
  const { customerId, data } = params

  // Strip immutable fields
  const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = data as Record<string, unknown>

  await prisma.customer.update({
    where: { id: customerId },
    data: updateData,
  })
}

// ---------------------------------------------------------------------------
// 8. listServices
// ---------------------------------------------------------------------------

export async function listServices(): Promise<ServiceWithCategory[]> {
  const services = await prisma.service.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
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
// 9. createService
// ---------------------------------------------------------------------------

export async function createService(params: ServiceCreateInput): Promise<Service> {
  return prisma.service.create({
    data: {
      categoryId: params.categoryId,
      name: params.name,
      description: params.description,
      durationMinutes: params.durationMinutes,
      bufferBeforeMinutes: params.bufferBeforeMinutes ?? 0,
      bufferAfterMinutes: params.bufferAfterMinutes ?? 10,
      price: params.price,
      depositAmount: params.depositAmount,
      requiresDeposit: params.requiresDeposit ?? false,
      requiresApproval: params.requiresApproval ?? false,
      imageUrl: params.imageUrl,
      isActive: params.isActive ?? true,
      sortOrder: params.sortOrder ?? 0,
    },
  })
}

// ---------------------------------------------------------------------------
// 10. updateService
// ---------------------------------------------------------------------------

export async function updateService(params: {
  serviceId: string
  data: Partial<Service>
}): Promise<Service> {
  const { serviceId, data } = params
  const { id: _id, ...updateData } = data as Record<string, unknown>

  return prisma.service.update({
    where: { id: serviceId },
    data: updateData,
  })
}

// ---------------------------------------------------------------------------
// 11. softDeleteService
// ---------------------------------------------------------------------------

export async function softDeleteService(serviceId: string): Promise<void> {
  await prisma.service.update({
    where: { id: serviceId },
    data: { isActive: false },
  })
}

// ---------------------------------------------------------------------------
// 12. listStaff
// ---------------------------------------------------------------------------

export async function listStaff(): Promise<StaffWithServices[]> {
  const staffList = await prisma.staff.findMany({
    include: {
      staffServices: {
        include: {
          service: {
            select: { id: true, name: true, durationMinutes: true, price: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return staffList.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    bio: s.bio,
    imageUrl: s.imageUrl,
    color: s.color,
    isActive: s.isActive,
    maxAppointmentsPerDay: s.maxAppointmentsPerDay,
    services: s.staffServices.map((ss) => ({
      id: ss.service.id,
      name: ss.service.name,
      durationMinutes: ss.service.durationMinutes,
      price: ss.service.price,
    })),
  }))
}

// ---------------------------------------------------------------------------
// 13. createStaff
// ---------------------------------------------------------------------------

export async function createStaff(params: StaffCreateInput): Promise<Staff> {
  const { serviceIds = [], ...staffData } = params

  return prisma.staff.create({
    data: {
      ...staffData,
      staffServices: {
        create: serviceIds.map((serviceId) => ({ serviceId })),
      },
    },
  })
}

// ---------------------------------------------------------------------------
// 14. updateStaff
// ---------------------------------------------------------------------------

export async function updateStaff(params: {
  staffId: string
  data: Partial<Staff> & { serviceIds?: string[] }
}): Promise<Staff> {
  const { staffId, data } = params
  const { serviceIds, id: _id, createdAt: _ca, updatedAt: _ua, userId: _uid, ...updateData } =
    data as Record<string, unknown> & { serviceIds?: string[] }

  const staff = await prisma.staff.update({
    where: { id: staffId },
    data: updateData,
  })

  // Update staff services if provided
  if (Array.isArray(serviceIds)) {
    await prisma.staffService.deleteMany({ where: { staffId } })
    if (serviceIds.length > 0) {
      for (const serviceId of serviceIds as string[]) {
        await prisma.staffService.upsert({
          where: { staffId_serviceId: { staffId, serviceId } },
          create: { staffId, serviceId },
          update: {},
        })
      }
    }
  }

  return staff
}

// ---------------------------------------------------------------------------
// 15. getWorkingHours
// ---------------------------------------------------------------------------

export async function getWorkingHours(staffId?: string): Promise<WorkingHour[]> {
  return prisma.workingHour.findMany({
    where: staffId ? { staffId } : {},
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
}

// ---------------------------------------------------------------------------
// 16. updateWorkingHours
// ---------------------------------------------------------------------------

export async function updateWorkingHours(hours: WorkingHourInput[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const hour of hours) {
      if (hour.id) {
        await tx.workingHour.update({
          where: { id: hour.id },
          data: {
            dayOfWeek: hour.dayOfWeek,
            startTime: hour.startTime,
            endTime: hour.endTime,
            isActive: hour.isActive,
            staffId: hour.staffId,
          },
        })
      } else {
        await tx.workingHour.create({
          data: {
            dayOfWeek: hour.dayOfWeek,
            startTime: hour.startTime,
            endTime: hour.endTime,
            isActive: hour.isActive,
            staffId: hour.staffId,
          },
        })
      }
    }
  })
}

// ---------------------------------------------------------------------------
// 17. createAvailabilityBlock
// ---------------------------------------------------------------------------

export async function createAvailabilityBlock(params: {
  staffId?: string
  startDateTime: string
  endDateTime: string
  reason?: string
  isFullDay?: boolean
  createdById?: string
}): Promise<AvailabilityBlock> {
  return prisma.availabilityBlock.create({
    data: {
      staffId: params.staffId,
      startDateTime: new Date(params.startDateTime),
      endDateTime: new Date(params.endDateTime),
      reason: params.reason,
      isFullDay: params.isFullDay ?? false,
      createdById: params.createdById,
    },
  })
}

// ---------------------------------------------------------------------------
// 18. deleteAvailabilityBlock
// ---------------------------------------------------------------------------

export async function deleteAvailabilityBlock(id: string): Promise<void> {
  await prisma.availabilityBlock.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// 19. listNotifications
// ---------------------------------------------------------------------------

export async function listNotifications(userId: string): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: {
      OR: [{ userId }, { userId: null }],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

// ---------------------------------------------------------------------------
// 20. markNotificationRead
// ---------------------------------------------------------------------------

export async function markNotificationRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
}

// ---------------------------------------------------------------------------
// 21. markAllNotificationsRead
// ---------------------------------------------------------------------------

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      OR: [{ userId }, { userId: null }],
      isRead: false,
    },
    data: { isRead: true },
  })
}

// ---------------------------------------------------------------------------
// 22. listMessageTemplates
// ---------------------------------------------------------------------------

export async function listMessageTemplates(): Promise<MessageTemplate[]> {
  return prisma.messageTemplate.findMany({
    orderBy: { key: 'asc' },
  })
}

// ---------------------------------------------------------------------------
// 23. updateMessageTemplate
// ---------------------------------------------------------------------------

export async function updateMessageTemplate(params: {
  id: string
  body: string
  isActive: boolean
}): Promise<void> {
  await prisma.messageTemplate.update({
    where: { id: params.id },
    data: {
      body: params.body,
      isActive: params.isActive,
    },
  })
}

// ---------------------------------------------------------------------------
// 24. getBusinessSettings
// ---------------------------------------------------------------------------

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const settings = await prisma.businessSettings.findFirst()

  if (!settings) {
    // Create default settings if none exist
    return prisma.businessSettings.create({ data: {} })
  }

  return settings
}

// ---------------------------------------------------------------------------
// 25. updateBusinessSettings
// ---------------------------------------------------------------------------

export async function updateBusinessSettings(
  data: Partial<BusinessSettings>
): Promise<BusinessSettings> {
  const existing = await prisma.businessSettings.findFirst()

  if (!existing) {
    const { id: _id, ...createData } = data as Record<string, unknown>
    return prisma.businessSettings.create({ data: createData })
  }

  const { id: _id, ...updateData } = data as Record<string, unknown>

  return prisma.businessSettings.update({
    where: { id: existing.id },
    data: updateData,
  })
}

// ---------------------------------------------------------------------------
// 26. listWaitlistEntries
// ---------------------------------------------------------------------------

export async function listWaitlistEntries(): Promise<
  (WaitlistEntry & { customer: Customer; service: Service; staff: Staff | null })[]
> {
  return prisma.waitlistEntry.findMany({
    include: {
      customer: true,
      service: true,
      staff: true,
    },
    orderBy: { createdAt: 'asc' },
  })
}

// ---------------------------------------------------------------------------
// 27. listReviews
// ---------------------------------------------------------------------------

export async function listReviews(): Promise<
  (Review & { customer: Customer; appointment: Appointment })[]
> {
  return prisma.review.findMany({
    include: {
      customer: true,
      appointment: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ---------------------------------------------------------------------------
// 28. approveReview
// ---------------------------------------------------------------------------

export async function approveReview(reviewId: string): Promise<void> {
  await prisma.review.update({
    where: { id: reviewId },
    data: { isPublished: true },
  })
}

// ---------------------------------------------------------------------------
// 29. getAuditLog
// ---------------------------------------------------------------------------

export async function getAuditLog(params: { page?: number }): Promise<{
  logs: (AuditLog & { actor: { id: string; name: string; email: string } | null })[]
  total: number
}> {
  const { page = 1 } = params
  const pageSize = 50
  const skip = (page - 1) * pageSize

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ])

  return { logs, total }
}

// ---------------------------------------------------------------------------
// 30. sendTestWhatsApp
// ---------------------------------------------------------------------------

export async function sendTestWhatsApp(params: {
  phone: string
  type: 'otp' | 'confirmation' | 'admin'
}): Promise<{ success: boolean; error?: string; note?: string }> {
  const { type } = params

  let phone: string
  try {
    phone = normalizeIsraeliPhone(params.phone)
  } catch {
    return { success: false, error: 'מספר הטלפון לא תקין' }
  }

  const provider = getMessagingProvider()
  const devMode = isDevMessagingMode()
  const note = devMode ? 'מצב פיתוח: ההודעה הוצגה בקונסול בלבד' : undefined
  const now = new Date()

  try {
    if (type === 'otp') {
      if (provider.startVerification) {
        await provider.startVerification(phone)
      } else {
        await provider.sendOtp(phone, '123456')
      }
    } else if (type === 'confirmation') {
      const body = `היי שרה לוי,\nהתור שלך ב"שני קוסמטיקס" נקבע בהצלחה 💛\n\nשירות: טיפול פנים\nמטפלת: שני\nתאריך: ${formatDate(now)}\nשעה: ${formatTime(now)}\nמשך טיפול: 60 דקות\n\nהודעת בדיקה — שני קוסמטיקס`
      await provider.sendWhatsApp(phone, body)
    } else {
      const body = `נקבע תור חדש ב"שני קוסמטיקס" ✅\n\nלקוחה: שרה לוי\nטלפון: ${phone}\nשירות: טיפול פנים\nמטפלת: שני\nתאריך: ${formatDate(now)}\nשעה: ${formatTime(now)}\nמחיר: ₪200\n\n[הודעת בדיקה]`
      await provider.sendWhatsApp(phone, body)
    }
    return { success: true, note }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { success: false, error, note }
  }
}

import { prisma } from './db'
import { timeToMinutes, minutesToTime, addMinutes, rangesOverlap } from './utils'
import type { AvailableSlot, DateAvailability } from '@/types'

const SLOT_INTERVAL_MINUTES = 15

interface GetAvailableSlotsParams {
  serviceIds: string[]
  staffId?: string
  date: Date
}

/**
 * Calculate total appointment duration (service durations + buffers).
 */
async function getTotalDuration(serviceIds: string[]): Promise<number> {
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
    select: {
      durationMinutes: true,
      bufferBeforeMinutes: true,
      bufferAfterMinutes: true,
    },
  })

  if (services.length === 0) return 0

  // Sum all durations; buffers are treated as padding around the block
  const totalService = services.reduce((sum, s) => sum + s.durationMinutes, 0)
  const maxBufferBefore = Math.max(...services.map((s) => s.bufferBeforeMinutes))
  const maxBufferAfter = Math.max(...services.map((s) => s.bufferAfterMinutes))

  return maxBufferBefore + totalService + maxBufferAfter
}

/**
 * Return available time slots for a given date and set of services.
 * Optionally filter to a specific staff member.
 */
export async function getAvailableSlots({
  serviceIds,
  staffId,
  date,
}: GetAvailableSlotsParams): Promise<AvailableSlot[]> {
  if (!serviceIds.length) return []

  const totalDuration = await getTotalDuration(serviceIds)
  if (totalDuration === 0) return []

  // Get business settings for minimum notice
  const settings = await prisma.businessSettings.findFirst()
  const minNoticeMinutes = settings?.minBookingNoticeMinutes ?? 180
  const nowPlusNotice = new Date(Date.now() + minNoticeMinutes * 60 * 1000)

  // Normalise date to midnight local time
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const dayOfWeek = dayStart.getDay() // 0 = Sunday

  // Fetch all eligible staff members
  const staffWhere: NonNullable<Parameters<typeof prisma.staff.findMany>[0]>['where'] = {
    isActive: true,
    staffServices: { some: { serviceId: { in: serviceIds } } },
  }
  if (staffId) {
    staffWhere!.id = staffId
  }

  const staffList = await prisma.staff.findMany({
    where: staffWhere,
    include: {
      workingHours: {
        where: { dayOfWeek, isActive: true },
      },
    },
  })

  // Fetch existing appointments for all relevant staff on this day
  const appointmentStaffIds = staffList.map((s) => s.id)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      staffId: { in: appointmentStaffIds },
      startDateTime: { gte: dayStart },
      endDateTime: { lte: dayEnd },
      status: {
        notIn: ['CANCELLED_BY_CLIENT', 'CANCELLED_BY_ADMIN', 'NO_SHOW'],
      },
    },
    select: { staffId: true, startDateTime: true, endDateTime: true },
  })

  // Fetch availability blocks for all relevant staff on this day
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      staffId: { in: appointmentStaffIds },
      startDateTime: { lt: dayEnd },
      endDateTime: { gt: dayStart },
    },
    select: { staffId: true, startDateTime: true, endDateTime: true },
  })

  // Fetch active booking holds on this day
  const holds = await prisma.bookingHold.findMany({
    where: {
      staffId: { in: appointmentStaffIds },
      startDateTime: { lt: dayEnd },
      endDateTime: { gt: dayStart },
      expiresAt: { gt: new Date() },
    },
    select: { staffId: true, startDateTime: true, endDateTime: true },
  })

  const slots: AvailableSlot[] = []

  for (const staff of staffList) {
    for (const workingHour of staff.workingHours) {
      const startMinutes = timeToMinutes(workingHour.startTime)
      const endMinutes = timeToMinutes(workingHour.endTime)

      // Generate candidate slots every SLOT_INTERVAL_MINUTES
      for (
        let slotStart = startMinutes;
        slotStart + totalDuration <= endMinutes;
        slotStart += SLOT_INTERVAL_MINUTES
      ) {
        const slotStartDate = new Date(dayStart)
        slotStartDate.setHours(0, slotStart, 0, 0)
        const slotEndDate = addMinutes(slotStartDate, totalDuration)

        // Enforce minimum booking notice
        if (slotStartDate <= nowPlusNotice) continue

        // Check against existing appointments
        const appointmentConflict = existingAppointments.some(
          (a) =>
            a.staffId === staff.id &&
            rangesOverlap(
              slotStartDate,
              slotEndDate,
              a.startDateTime,
              a.endDateTime
            )
        )
        if (appointmentConflict) continue

        // Check against availability blocks
        const blockConflict = blocks.some(
          (b) =>
            b.staffId === staff.id &&
            rangesOverlap(
              slotStartDate,
              slotEndDate,
              b.startDateTime,
              b.endDateTime
            )
        )
        if (blockConflict) continue

        // Check against booking holds
        const holdConflict = holds.some(
          (h) =>
            h.staffId === staff.id &&
            rangesOverlap(
              slotStartDate,
              slotEndDate,
              h.startDateTime,
              h.endDateTime
            )
        )
        if (holdConflict) continue

        // Check maxAppointmentsPerDay
        if (staff.maxAppointmentsPerDay !== null && staff.maxAppointmentsPerDay !== undefined) {
          const dayAppointments = existingAppointments.filter(
            (a) => a.staffId === staff.id
          ).length
          if (dayAppointments >= staff.maxAppointmentsPerDay) continue
        }

        slots.push({
          time: minutesToTime(slotStart),
          staffId: staff.id,
          staffName: staff.name,
        })
      }
    }
  }

  // Sort by time, then by staff name
  slots.sort((a, b) => {
    const timeDiff = timeToMinutes(a.time) - timeToMinutes(b.time)
    if (timeDiff !== 0) return timeDiff
    return a.staffName.localeCompare(b.staffName)
  })

  // Deduplicate: keep unique (time, staffId) pairs
  const seen = new Set<string>()
  return slots.filter((s) => {
    const key = `${s.time}-${s.staffId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Return the availability status for each day in a given month.
 */
export async function getAvailableDates(
  serviceIds: string[],
  month: number, // 1-12
  year: number,
  staffId?: string
): Promise<DateAvailability[]> {
  const results: DateAvailability[] = []
  const daysInMonth = new Date(year, month, 0).getDate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)

    // Past dates are always closed
    if (date < today) {
      results.push({ date: formatDateKey(date), status: 'closed' })
      continue
    }

    const slots = await getAvailableSlots({ serviceIds, staffId, date })

    if (slots.length === 0) {
      // Determine if it is a working day at all
      const dayOfWeek = date.getDay()
      const hasWorkingHours = await prisma.workingHour.findFirst({
        where: {
          dayOfWeek,
          isActive: true,
          ...(staffId ? { staffId } : {}),
        },
      })
      results.push({
        date: formatDateKey(date),
        status: hasWorkingHours ? 'full' : 'closed',
      })
    } else {
      results.push({ date: formatDateKey(date), status: 'available' })
    }
  }

  return results
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

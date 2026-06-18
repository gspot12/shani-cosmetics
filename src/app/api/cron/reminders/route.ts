import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendAppointmentReminder } from '@/lib/notifications'
import { getMessagingProvider } from '@/lib/messaging/provider'
import { renderTemplate, TEMPLATE_KEYS } from '@/lib/messaging/templates'

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let processed = 0

  // ---------------------------------------------------------------------------
  // 1. 24h reminders — appointments between 3h and 24h from now
  // ---------------------------------------------------------------------------
  const reminder24hFrom = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const reminder24hTo   = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const appointments24h = await prisma.appointment.findMany({
    where: {
      startDateTime: { gte: reminder24hFrom, lte: reminder24hTo },
      status: { in: ['CONFIRMED', 'RESCHEDULED'] },
    },
    select: { id: true, messageLogs: { select: { templateKey: true } } },
  })

  for (const appt of appointments24h) {
    const alreadySent = appt.messageLogs.some(
      (log) => log.templateKey === TEMPLATE_KEYS.APPOINTMENT_REMINDER_24H
    )
    if (!alreadySent) {
      try {
        await sendAppointmentReminder(appt.id, TEMPLATE_KEYS.APPOINTMENT_REMINDER_24H)
        processed++
      } catch (err) {
        console.error(`[cron/reminders] 24h reminder failed for ${appt.id}`, err)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2. 3h reminders — appointments between 30 min and 3h from now
  // ---------------------------------------------------------------------------
  const reminder3hFrom = new Date(now.getTime() + 30 * 60 * 1000)
  const reminder3hTo   = new Date(now.getTime() + 3 * 60 * 60 * 1000)

  const appointments3h = await prisma.appointment.findMany({
    where: {
      startDateTime: { gte: reminder3hFrom, lte: reminder3hTo },
      status: { in: ['CONFIRMED', 'RESCHEDULED'] },
    },
    select: { id: true, messageLogs: { select: { templateKey: true } } },
  })

  for (const appt of appointments3h) {
    const alreadySent = appt.messageLogs.some(
      (log) => log.templateKey === TEMPLATE_KEYS.APPOINTMENT_REMINDER_3H
    )
    if (!alreadySent) {
      try {
        await sendAppointmentReminder(appt.id, TEMPLATE_KEYS.APPOINTMENT_REMINDER_3H)
        processed++
      } catch (err) {
        console.error(`[cron/reminders] 3h reminder failed for ${appt.id}`, err)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Review requests — completed appointments from 2-3h ago
  // ---------------------------------------------------------------------------
  const reviewFrom = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const reviewTo   = new Date(now.getTime() - 2 * 60 * 60 * 1000)

  const completedAppointments = await prisma.appointment.findMany({
    where: {
      endDateTime: { gte: reviewFrom, lte: reviewTo },
      status: 'COMPLETED',
    },
    include: {
      customer: true,
      messageLogs: { select: { templateKey: true } },
      reviews: { select: { id: true } },
    },
  })

  const provider = getMessagingProvider()

  for (const appt of completedAppointments) {
    const alreadySent = appt.messageLogs.some(
      (log) => log.templateKey === TEMPLATE_KEYS.REVIEW_REQUEST
    )
    if (alreadySent || appt.reviews.length > 0) continue

    const reviewUrl = `${BASE_URL}/my-appointment/${appt.clientManageToken}#review`
    const overrideTemplate = await prisma.messageTemplate.findUnique({
      where: { key: TEMPLATE_KEYS.REVIEW_REQUEST },
    })
    const overrideBody = overrideTemplate?.isActive ? overrideTemplate.body : undefined

    const body = renderTemplate(
      TEMPLATE_KEYS.REVIEW_REQUEST,
      { customerName: appt.customer.fullName, reviewUrl },
      overrideBody
    )

    let status = 'SENT'
    let error: string | undefined

    try {
      await provider.sendWhatsApp(appt.customer.phone, body)
      processed++
    } catch (err) {
      status = 'FAILED'
      error = err instanceof Error ? err.message : String(err)
      console.error(`[cron/reminders] Review request failed for ${appt.id}`, err)
    }

    await prisma.messageLog.create({
      data: {
        toPhone: appt.customer.phone,
        channel: 'WHATSAPP',
        templateKey: TEMPLATE_KEYS.REVIEW_REQUEST,
        body,
        appointmentId: appt.id,
        status,
        error,
      },
    })
  }

  return NextResponse.json({ processed })
}

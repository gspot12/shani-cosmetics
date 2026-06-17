import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { hashSync } from 'bcryptjs'

const url = process.env.DATABASE_URL || 'file:./dev.db'
const libsqlUrl = url.startsWith('file:') ? url : `file:${url}`
const adapter = new PrismaLibSql({ url: libsqlUrl })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('Starting seed...')

  // ── BusinessSettings ──────────────────────────────────────────────────────
  const businessSettings = await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessName: 'שני קוסמטיקס',
      address: 'רחוב הרצל 12, תל אביב',
      phone: '052-1234567',
      whatsapp: '972521234567',
      cancellationPolicy:
        'ביטול עד 24 שעות לפני - ללא חיוב. ביטול פחות מ-24 שעות - חיוב מלא.',
      minBookingNoticeMinutes: 180,
      allowClientCancel: true,
      allowClientReschedule: true,
      cancelLimitHours: 24,
      rescheduleLimitHours: 24,
      defaultBufferMinutes: 10,
    },
  })
  console.log('Created businessSettings:', businessSettings.id)

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@shani.local' },
    update: {},
    create: {
      email: 'admin@shani.local',
      name: 'אדמין',
      role: 'SUPER_ADMIN',
      passwordHash: hashSync('Admin123456!', 10),
      isActive: true,
    },
  })
  console.log('Created admin user:', adminUser.email)

  // ── Staff ──────────────────────────────────────────────────────────────────
  const staffShani = await prisma.staff.upsert({
    where: { id: 'staff-shani' },
    update: {},
    create: {
      id: 'staff-shani',
      name: 'שני',
      color: '#E8B4B8',
      isActive: true,
    },
  })

  const staffMaya = await prisma.staff.upsert({
    where: { id: 'staff-maya' },
    update: {},
    create: {
      id: 'staff-maya',
      name: 'מאיה',
      color: '#B4C8E8',
      isActive: true,
    },
  })

  const staffLinoy = await prisma.staff.upsert({
    where: { id: 'staff-linoy' },
    update: {},
    create: {
      id: 'staff-linoy',
      name: 'לינוי',
      color: '#B4E8C8',
      isActive: true,
    },
  })

  const allStaff = [staffShani, staffMaya, staffLinoy]
  console.log('Created staff:', allStaff.map((s) => s.name).join(', '))

  // ── Working hours (business-wide: staffId = null) ──────────────────────────
  // Sunday–Thursday (0–4): 09:00–19:00
  // Friday (5): 09:00–14:00
  // Saturday (6): closed (no record)

  // Delete existing business-wide working hours to avoid duplicates
  await prisma.workingHour.deleteMany({ where: { staffId: null } })

  const businessDays = [
    { dayOfWeek: 0, startTime: '09:00', endTime: '19:00' }, // Sunday
    { dayOfWeek: 1, startTime: '09:00', endTime: '19:00' }, // Monday
    { dayOfWeek: 2, startTime: '09:00', endTime: '19:00' }, // Tuesday
    { dayOfWeek: 3, startTime: '09:00', endTime: '19:00' }, // Wednesday
    { dayOfWeek: 4, startTime: '09:00', endTime: '19:00' }, // Thursday
    { dayOfWeek: 5, startTime: '09:00', endTime: '14:00' }, // Friday
  ]

  for (const day of businessDays) {
    await prisma.workingHour.create({
      data: {
        staffId: null,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        isActive: true,
      },
    })
  }

  // Staff working hours (same schedule for each staff member)
  for (const staff of allStaff) {
    // Delete existing working hours for this staff
    await prisma.workingHour.deleteMany({ where: { staffId: staff.id } })

    for (const day of businessDays) {
      await prisma.workingHour.create({
        data: {
          staffId: staff.id,
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          isActive: true,
        },
      })
    }
  }
  console.log('Created working hours for business and all staff')

  // ── Service categories ─────────────────────────────────────────────────────
  const catNails = await prisma.serviceCategory.upsert({
    where: { id: 'cat-nails' },
    update: {},
    create: {
      id: 'cat-nails',
      name: 'ציפורניים',
      sortOrder: 1,
      isActive: true,
    },
  })

  const catEyebrows = await prisma.serviceCategory.upsert({
    where: { id: 'cat-eyebrows' },
    update: {},
    create: {
      id: 'cat-eyebrows',
      name: 'גבות',
      sortOrder: 2,
      isActive: true,
    },
  })

  const catFacial = await prisma.serviceCategory.upsert({
    where: { id: 'cat-facial' },
    update: {},
    create: {
      id: 'cat-facial',
      name: 'טיפולי פנים',
      sortOrder: 3,
      isActive: true,
    },
  })

  console.log('Created service categories')

  // ── Services ───────────────────────────────────────────────────────────────
  const services = [
    // ציפורניים
    {
      id: 'svc-gel-full',
      categoryId: catNails.id,
      name: 'ג\'ל ידיים מלא',
      description: 'טיפול ג\'ל מלא לידיים כולל הכנה וצבע',
      durationMinutes: 60,
      price: 180,
      sortOrder: 1,
    },
    {
      id: 'svc-gel-fill',
      categoryId: catNails.id,
      name: 'השלמת ג\'ל',
      description: 'השלמת ג\'ל לידיים',
      durationMinutes: 45,
      price: 140,
      sortOrder: 2,
    },
    {
      id: 'svc-gel-remove',
      categoryId: catNails.id,
      name: 'הסרת ג\'ל',
      description: 'הסרת ג\'ל מהידיים',
      durationMinutes: 30,
      price: 80,
      sortOrder: 3,
    },
    {
      id: 'svc-acrylic-full',
      categoryId: catNails.id,
      name: 'אקריל ידיים מלא',
      description: 'בניית אקריל מלא לידיים',
      durationMinutes: 90,
      price: 220,
      sortOrder: 4,
    },
    {
      id: 'svc-acrylic-fill',
      categoryId: catNails.id,
      name: 'השלמת אקריל',
      description: 'השלמת אקריל לידיים',
      durationMinutes: 60,
      price: 160,
      sortOrder: 5,
    },
    {
      id: 'svc-pedicure',
      categoryId: catNails.id,
      name: 'פדיקור ג\'ל',
      description: 'טיפול פדיקור עם ג\'ל לרגליים',
      durationMinutes: 75,
      price: 200,
      sortOrder: 6,
    },
    {
      id: 'svc-nail-art',
      categoryId: catNails.id,
      name: 'ציור ציפורניים',
      description: 'עיצוב ואמנות על הציפורניים',
      durationMinutes: 30,
      price: 60,
      sortOrder: 7,
    },
    // גבות
    {
      id: 'svc-eyebrow-thread',
      categoryId: catEyebrows.id,
      name: 'עיצוב גבות בחוט',
      description: 'עיצוב גבות מקצועי בטכניקת חוט',
      durationMinutes: 20,
      price: 60,
      sortOrder: 1,
    },
    {
      id: 'svc-eyebrow-wax',
      categoryId: catEyebrows.id,
      name: 'עיצוב גבות בשעווה',
      description: 'עיצוב גבות בשעווה חמה',
      durationMinutes: 20,
      price: 55,
      sortOrder: 2,
    },
    {
      id: 'svc-eyebrow-tint',
      categoryId: catEyebrows.id,
      name: 'צביעת גבות',
      description: 'צביעת גבות לחיזוק הצבע הטבעי',
      durationMinutes: 30,
      price: 80,
      sortOrder: 3,
    },
    {
      id: 'svc-eyebrow-laminate',
      categoryId: catEyebrows.id,
      name: 'למינציה לגבות',
      description: 'טיפול למינציה לגבות מלאות וסדורות',
      durationMinutes: 60,
      price: 180,
      sortOrder: 4,
    },
    {
      id: 'svc-lash-lift',
      categoryId: catEyebrows.id,
      name: 'ריפוף ריסים',
      description: 'טיפול ריפוף ריסים לעיניים פתוחות',
      durationMinutes: 60,
      price: 200,
      sortOrder: 5,
    },
    // טיפולי פנים
    {
      id: 'svc-facial-basic',
      categoryId: catFacial.id,
      name: 'טיפול פנים בסיסי',
      description: 'ניקוי, טיפוח וכרית פנים',
      durationMinutes: 60,
      price: 250,
      sortOrder: 1,
    },
    {
      id: 'svc-facial-deep',
      categoryId: catFacial.id,
      name: 'טיפול פנים עמוק',
      description: 'טיפול פנים מעמיק עם ניקוי נקבוביות',
      durationMinutes: 90,
      price: 350,
      sortOrder: 2,
    },
    {
      id: 'svc-facial-anti-age',
      categoryId: catFacial.id,
      name: 'טיפול אנטי-אייג\'ינג',
      description: 'טיפול מנגנוני להפחתת קמטים',
      durationMinutes: 75,
      price: 400,
      sortOrder: 3,
    },
    {
      id: 'svc-facial-hydra',
      categoryId: catFacial.id,
      name: 'הידרה פייסיאל',
      description: 'טיפול לחות מתקדם לעור זוהר',
      durationMinutes: 60,
      price: 320,
      sortOrder: 4,
    },
    {
      id: 'svc-micro-needling',
      categoryId: catFacial.id,
      name: 'מיקרו ניידלינג',
      description: 'טיפול מיקרו ניידלינג לחידוש העור',
      durationMinutes: 60,
      price: 450,
      requiresDeposit: true,
      depositAmount: 100,
      sortOrder: 5,
    },
  ]

  const createdServices: Array<{ id: string }> = []
  for (const svc of services) {
    const created = await prisma.service.upsert({
      where: { id: svc.id },
      update: {},
      create: {
        id: svc.id,
        categoryId: svc.categoryId,
        name: svc.name,
        description: svc.description,
        durationMinutes: svc.durationMinutes,
        price: svc.price,
        bufferAfterMinutes: 10,
        requiresDeposit: svc.requiresDeposit ?? false,
        depositAmount: svc.depositAmount ?? null,
        isActive: true,
        sortOrder: svc.sortOrder,
      },
    })
    createdServices.push(created)
  }
  console.log(`Created ${createdServices.length} services`)

  // ── Assign ALL services to ALL staff ─────────────────────────────────────
  for (const staff of allStaff) {
    for (const svc of createdServices) {
      await prisma.staffService.upsert({
        where: { staffId_serviceId: { staffId: staff.id, serviceId: svc.id } },
        update: {},
        create: { staffId: staff.id, serviceId: svc.id },
      })
    }
  }
  console.log('Assigned all services to all staff')

  // ── MessageTemplates ──────────────────────────────────────────────────────
  const templates = [
    {
      key: 'BOOKING_CONFIRMATION',
      title: 'אישור הזמנה',
      body: `שלום {{customerName}} 😊
תאריך הטיפול שלך אושר!

📅 תאריך: {{date}}
🕐 שעה: {{time}}
✂️ טיפול: {{serviceName}}
💅 מטפלת: {{staffName}}

לניהול התור: {{manageUrl}}

שני קוסמטיקס ❤️`,
    },
    {
      key: 'BOOKING_REMINDER',
      title: 'תזכורת תור',
      body: `היי {{customerName}}! 👋
תזכורת - מחר יש לך תור אצלנו 😊

📅 תאריך: {{date}}
🕐 שעה: {{time}}
✂️ טיפול: {{serviceName}}
💅 מטפלת: {{staffName}}

לביטול או שינוי: {{manageUrl}}

מחכות לראותך! ✨
שני קוסמטיקס`,
    },
    {
      key: 'BOOKING_CANCELLATION',
      title: 'ביטול תור',
      body: `שלום {{customerName}},
תורך ל-{{date}} בשעה {{time}} בוטל.

{{#if cancellationReason}}סיבה: {{cancellationReason}}{{/if}}

לקביעת תור חדש: {{bookingUrl}}

שני קוסמטיקס`,
    },
    {
      key: 'BOOKING_RESCHEDULE',
      title: 'שינוי מועד תור',
      body: `שלום {{customerName}} 😊
מועד התור שלך שונה!

📅 תאריך חדש: {{newDate}}
🕐 שעה חדשה: {{newTime}}
✂️ טיפול: {{serviceName}}
💅 מטפלת: {{staffName}}

לניהול התור: {{manageUrl}}

שני קוסמטיקס ❤️`,
    },
    {
      key: 'OTP_VERIFICATION',
      title: 'קוד אימות',
      body: `קוד האימות שלך לשני קוסמטיקס: {{otpCode}}

הקוד תקף ל-5 דקות.
אל תשתף את הקוד עם אף אחד.`,
    },
    {
      key: 'WAITLIST_AVAILABLE',
      title: 'מקום פנוי - רשימת המתנה',
      body: `היי {{customerName}}! 🎉
יש מקום פנוי לטיפול שרצית!

✂️ טיפול: {{serviceName}}
📅 תאריך: {{date}}
🕐 שעה: {{time}}

להזמנה: {{bookingUrl}}

המקום מוחזק ל-2 שעות בלבד ⏰
שני קוסמטיקס`,
    },
    {
      key: 'REVIEW_REQUEST',
      title: 'בקשת חוות דעת',
      body: `שלום {{customerName}} 😊
תודה שביקרת אצלנו! איך היה הטיפול?

נשמח לקבל את חוות דעתך:
{{reviewUrl}}

זה עוזר לנו להשתפר ❤️
שני קוסמטיקס`,
    },
  ]

  for (const template of templates) {
    await prisma.messageTemplate.upsert({
      where: { key: template.key },
      update: {},
      create: {
        key: template.key,
        title: template.title,
        body: template.body,
        channel: 'WHATSAPP',
        isActive: true,
      },
    })
  }
  console.log(`Created ${templates.length} message templates`)

  console.log('Seed completed successfully! ✅')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Returns the latest unconsumed OTP for a phone number.
// Protected by CRON_SECRET — only for QA/testing purposes.
// Remove this endpoint before going live to real customers.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const phone = req.nextUrl.searchParams.get('phone')
  if (!phone) {
    return NextResponse.json({ error: 'phone param required' }, { status: 400 })
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { codeHash: false, phone: true, expiresAt: true, attempts: true, createdAt: true },
  })

  if (!otp) {
    return NextResponse.json({ error: 'No active OTP found for this phone' }, { status: 404 })
  }

  // Return OTP record (without the hash — can't reverse it)
  // To get the actual code: generate it, it's stored only as a hash.
  // Use Vercel logs: look for "[DEV OTP] <phone> <code>"
  return NextResponse.json({
    message: 'OTP exists in DB. Check Vercel function logs for "[DEV OTP] <phone> <code>"',
    phone: otp.phone,
    expiresAt: otp.expiresAt,
    attempts: otp.attempts,
    createdAt: otp.createdAt,
  })
}

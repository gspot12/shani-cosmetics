import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    let payload: Record<string, unknown>
    try {
      payload = await verifySessionToken(token)
    } catch {
      return NextResponse.json({ authenticated: false, user: null })
    }

    if (payload.type === 'admin' && typeof payload.userId === 'string') {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          imageUrl: true,
          isActive: true,
        },
      })

      if (!user || !user.isActive) {
        return NextResponse.json({ authenticated: false, user: null })
      }

      return NextResponse.json({
        authenticated: true,
        type: 'admin',
        user,
      })
    }

    if (payload.type === 'customer' && typeof payload.phone === 'string') {
      const customer = await prisma.customer.findUnique({
        where: { phone: payload.phone },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          isBlocked: true,
        },
      })

      if (!customer || customer.isBlocked) {
        return NextResponse.json({ authenticated: false, user: null })
      }

      return NextResponse.json({
        authenticated: true,
        type: 'customer',
        user: customer,
      })
    }

    return NextResponse.json({ authenticated: false, user: null })
  } catch (err) {
    console.error('[api/auth/session] Unexpected error', err)
    return NextResponse.json(
      { authenticated: false, user: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

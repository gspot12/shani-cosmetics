'use server'

import { prisma } from '@/lib/db'
import {
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  COOKIE_NAME,
} from '@/lib/auth'
import type { User } from '@prisma/client'
import { cookies } from 'next/headers'

// ---------------------------------------------------------------------------
// 1. adminLogin
// ---------------------------------------------------------------------------

export async function adminLogin(params: {
  email: string
  password: string
}): Promise<{ success: boolean; token?: string; error?: string }> {
  const { email, password } = params

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !user.isActive) {
    return { success: false, error: 'אימייל או סיסמה שגויים.' }
  }

  if (!user.passwordHash) {
    return { success: false, error: 'לא הוגדרה סיסמה לחשבון זה.' }
  }

  const passwordValid = await verifyPassword(password, user.passwordHash)
  if (!passwordValid) {
    return { success: false, error: 'אימייל או סיסמה שגויים.' }
  }

  const token = await createSessionToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'admin',
    },
    '7d'
  )

  return { success: true, token }
}

// ---------------------------------------------------------------------------
// 2. getAdminSession
// ---------------------------------------------------------------------------

export async function getAdminSession(cookieValue: string): Promise<User | null> {
  try {
    const payload = await verifySessionToken(cookieValue)

    if (payload.type !== 'admin' || typeof payload.userId !== 'string') {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || !user.isActive) return null

    return user
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// 3. adminLogout
// ---------------------------------------------------------------------------

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

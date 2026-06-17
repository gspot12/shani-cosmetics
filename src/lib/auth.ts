import bcrypt from 'bcryptjs'
import { createHash, randomInt } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_NAME = 'shani_session'

const BCRYPT_ROUNDS = 12

/**
 * Hash a plain-text password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * Verify a plain-text password against a bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Hash an OTP code with SHA-256 for safe storage.
 */
export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

/**
 * Generate a 6-digit OTP code as a zero-padded string.
 */
export function generateOtpCode(): string {
  const code = randomInt(0, 1_000_000)
  return String(code).padStart(6, '0')
}

/**
 * Verify an OTP code by comparing its SHA-256 hash.
 */
export function verifyOtpCode(code: string, hash: string): boolean {
  const codeHash = hashOtp(code)
  return codeHash === hash
}

/**
 * Get the JWT secret as a Uint8Array for use with jose.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Create a signed JWT session token.
 * Expires in 7 days by default.
 */
export async function createSessionToken(
  payload: Record<string, unknown>,
  expiresIn: string = '7d'
): Promise<string> {
  const secret = getJwtSecret()
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)
}

/**
 * Verify and decode a JWT session token.
 * Throws if token is invalid or expired.
 */
export async function verifySessionToken(
  token: string
): Promise<Record<string, unknown>> {
  const secret = getJwtSecret()
  const { payload } = await jwtVerify(token, secret)
  return payload as Record<string, unknown>
}

/**
 * Extract the session token from a cookie header string.
 */
export function extractTokenFromCookieHeader(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(';').map((c) => c.trim())
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split('=')
    if (key?.trim() === COOKIE_NAME) {
      return rest.join('=').trim()
    }
  }
  return null
}

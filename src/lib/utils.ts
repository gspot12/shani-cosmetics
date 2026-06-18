import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes safely using clsx + tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Israeli Shekel currency.
 * Example: formatCurrency(120) => "₪120"
 */
export function formatCurrency(amount: number): string {
  return `₪${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/**
 * Format a duration in minutes as a short Hebrew string.
 * Example: formatDuration(60) => "60 דק׳"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} דק׳`
  }
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (remaining === 0) {
    return `${hours} שע׳`
  }
  return `${hours} שע׳ ${remaining} דק׳`
}

/**
 * Format a Date as DD/MM/YYYY.
 * Example: formatDate(new Date('2024-01-15')) => "15/01/2024"
 */
export function formatDate(date: Date): string {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format a Date as HH:MM (24-hour).
 * Example: formatTime(new Date()) => "14:30"
 */
export function formatTime(date: Date): string {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Format a Date as "DD/MM/YYYY HH:MM".
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

/**
 * Generate a cryptographically random UUID token.
 */
export function generateToken(): string {
  return crypto.randomUUID()
}

/**
 * Parse a time string "HH:MM" into total minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert total minutes since midnight back to "HH:MM" string.
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Get Hebrew day name from a 0-indexed day (0 = Sunday).
 */
export function getDayNameHebrew(dayOfWeek: number): string {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  return days[dayOfWeek] ?? ''
}

/**
 * Add minutes to a Date object and return a new Date.
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

/**
 * Check if two date ranges overlap.
 */
export function rangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2
}

/**
 * Normalize an Israeli phone number to E.164 format: +972XXXXXXXXX
 *
 * Accepts:
 *   0507411494      → +972507411494
 *   972507411494    → +972507411494
 *   +972507411494   → +972507411494
 *   05 074 114 94   → +972507411494
 *   050-741-1494    → +972507411494
 *
 * Throws "מספר הטלפון לא תקין" for anything that doesn't match.
 */
export function normalizeIsraeliPhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, '')

  if (/^\+972\d{8,9}$/.test(cleaned)) return cleaned
  if (/^972\d{8,9}$/.test(cleaned))   return '+' + cleaned
  if (/^0\d{8,9}$/.test(cleaned))     return '+972' + cleaned.slice(1)

  throw new Error('מספר הטלפון לא תקין')
}

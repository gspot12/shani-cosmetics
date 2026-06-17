'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BookingLayout from '@/components/layout/BookingLayout'
import { startOtp, verifyOtp } from '@/server/actions/booking'

const GOLD = '#B8973A'
const GOLD_LIGHT = '#FBF5E6'
const OTP_DURATION = 10 * 60 // 10 minutes in seconds

type OtpState = 'PHONE' | 'SENDING' | 'OTP_SENT' | 'VERIFYING' | 'VERIFIED'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('972')) return '+' + digits
  if (digits.startsWith('0')) return '+972' + digits.slice(1)
  return '+972' + digits
}

function isValidIsraeliPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return /^05\d{8}$/.test(digits) || /^9725\d{8}$/.test(digits)
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Booking summary bar (collapsible)
function BookingSummaryBar() {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState({ services: '', date: '', time: '', staffName: '' })

  useEffect(() => {
    const serviceNames = (() => {
      try { return localStorage.getItem('booking_serviceNames') ?? '' } catch { return '' }
    })()
    const date = localStorage.getItem('booking_date') ?? ''
    const time = localStorage.getItem('booking_time') ?? ''
    const staffName = localStorage.getItem('booking_staffName') ?? ''
    setInfo({ services: serviceNames, date, time, staffName })
  }, [])

  const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  const HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

  const dateObj = info.date ? new Date(info.date + 'T00:00:00') : null
  const dateDisplay = dateObj
    ? `יום ${HE_DAYS[dateObj.getDay()]}, ${dateObj.getDate()} ב${HE_MONTHS[dateObj.getMonth()]}`
    : ''

  if (!info.date && !info.time) return null

  return (
    <div style={{
      marginBottom: 20, borderRadius: 12,
      border: '1px solid #E8D5C4', background: GOLD_LIGHT, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#7A5E22' }}>
            {dateDisplay} {info.time && `| ${info.time}`}
          </span>
        </div>
        <span style={{ fontSize: 16, color: GOLD, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #E8D5C4' }}>
          {info.staffName && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10, fontSize: 13, color: '#5A4A42' }}>
              <span>👤</span>
              <span>{info.staffName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// OTP 6-box input
function OtpBoxInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function handleInput(idx: number, ch: string) {
    const digit = ch.replace(/\D/g, '').slice(-1)
    const arr = value.split('').concat(Array(6).fill('')).slice(0, 6)
    arr[idx] = digit
    const newVal = arr.join('')
    onChange(newVal)
    if (digit && idx < 5) refs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      const arr = value.split('').concat(Array(6).fill('')).slice(0, 6)
      if (arr[idx]) {
        arr[idx] = ''
        onChange(arr.join(''))
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus()
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted.padEnd(6, '').slice(0, 6))
      refs.current[Math.min(pasted.length, 5)]?.focus()
      e.preventDefault()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, direction: 'ltr', justifyContent: 'center' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700,
            border: `2px solid ${value[i] ? GOLD : '#E0D0C0'}`,
            borderRadius: 10, background: value[i] ? GOLD_LIGHT : 'white',
            color: '#2C2C2C', outline: 'none', fontFamily: 'monospace',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        />
      ))}
    </div>
  )
}

export default function DetailsPage() {
  const router = useRouter()
  const [state, setState] = useState<OtpState>('PHONE')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [marketing, setMarketing] = useState(false)
  const [isExisting, setIsExisting] = useState(false)
  const [timer, setTimer] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('booking_serviceIds') ?? '[]')
    const date = localStorage.getItem('booking_date')
    const time = localStorage.getItem('booking_time')
    if (!ids.length || !date || !time) router.replace('/book/service')
  }, [router])

  function startTimer() {
    setTimer(OTP_DURATION)
    setCanResend(false)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setCanResend(true)
          return 0
        }
        // Allow resend after 60s
        if (t === OTP_DURATION - 60) setCanResend(true)
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  async function handleSendOtp() {
    if (!isValidIsraeliPhone(phone)) {
      setError('נא להזין מספר טלפון ישראלי תקין (05X-XXXXXXX)')
      return
    }
    setState('SENDING')
    setError(null)
    try {
      const formatted = formatPhone(phone)
      const { exists } = await startOtp({ phone: formatted })
      setIsExisting(exists)
      setOtp('')
      setState('OTP_SENT')
      startTimer()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת הקוד. נסי שוב.')
      setState('PHONE')
    }
  }

  async function handleVerifyOtp() {
    if (otp.replace(/\D/g, '').length < 6) {
      setError('נא להזין את 6 ספרות קוד האימות')
      return
    }
    setState('VERIFYING')
    setError(null)
    try {
      const formatted = formatPhone(phone)
      const { valid, sessionToken } = await verifyOtp({ phone: formatted, code: otp })
      if (!valid || !sessionToken) {
        setError('קוד לא תקין או פג תוקף. נסי שוב.')
        setState('OTP_SENT')
        return
      }
      localStorage.setItem('booking_sessionToken', sessionToken)
      localStorage.setItem('booking_phone', formatted)
      setState('VERIFIED')

      if (isExisting) {
        router.push('/book/confirm')
      }
      // else — show profile form below
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה. נסי שוב.')
      setState('OTP_SENT')
    }
  }

  function handleProfileContinue() {
    if (!fullName.trim()) {
      setError('נא להזין שם מלא')
      return
    }
    localStorage.setItem('booking_fullName', fullName.trim())
    if (email.trim()) localStorage.setItem('booking_email', email.trim())
    localStorage.setItem('booking_marketing', String(marketing))
    router.push('/book/confirm')
  }

  const phoneValid = isValidIsraeliPhone(phone)
  const loading = state === 'SENDING' || state === 'VERIFYING'

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', fontSize: 15,
    border: '2px solid #E0D0C0', borderRadius: 12, outline: 'none',
    color: '#2C2C2C', background: 'white', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  }

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 700,
    background: disabled ? '#E8D5C4' : GOLD,
    color: disabled ? '#A09088' : 'white',
    border: 'none', borderRadius: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 0.15s',
  })

  return (
    <BookingLayout>
      <div style={{ direction: 'rtl' }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
            פרטי קשר
          </h1>
          <p style={{ fontSize: 14, color: '#8A7A72', marginTop: 4 }}>
            נאמת את זהותך באמצעות מספר הטלפון
          </p>
        </div>

        <BookingSummaryBar />

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 16, background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#B91C1C',
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
            {error}
          </div>
        )}

        {/* ── STEP 1: Phone ── */}
        {(state === 'PHONE' || state === 'SENDING') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#5A4A42', marginBottom: 6 }}>
                מספר טלפון
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 18, pointerEvents: 'none',
                }}>🇮🇱</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(null) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  placeholder="050-000-0000"
                  dir="ltr"
                  style={{ ...inputStyle, paddingRight: 42, textAlign: 'left' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E0D0C0')}
                />
              </div>
              <p style={{ fontSize: 12, color: '#8A7A72', marginTop: 6 }}>
                נשלח אליך קוד אימות ב-SMS
              </p>
            </div>

            <button
              onClick={handleSendOtp}
              disabled={!phone || state === 'SENDING'}
              style={btnStyle(!phone || state === 'SENDING')}
            >
              {state === 'SENDING' ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  שולחת קוד...
                </>
              ) : 'שלחי קוד אימות'}
            </button>
          </div>
        )}

        {/* ── STEP 2: OTP ── */}
        {(state === 'OTP_SENT' || state === 'VERIFYING') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Info bar */}
            <div style={{
              background: GOLD_LIGHT, border: '1px solid #E8D5C4',
              borderRadius: 12, padding: '12px 16px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#7A5E22', marginBottom: 2 }}>
                קוד נשלח ל-{phone}
              </div>
              <div style={{ fontSize: 12, color: '#9A8060' }}>
                {timer > 0 ? `הקוד תקף עוד ${formatTimer(timer)}` : 'הקוד פג תוקף'}
              </div>
            </div>

            {/* 6-box OTP */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#5A4A42', marginBottom: 10, textAlign: 'center' }}>
                קוד אימות
              </label>
              <OtpBoxInput value={otp} onChange={(v) => { setOtp(v); setError(null) }} />
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={otp.replace(/\D/g, '').length < 6 || state === 'VERIFYING' || timer === 0}
              style={btnStyle(otp.replace(/\D/g, '').length < 6 || state === 'VERIFYING' || timer === 0)}
            >
              {state === 'VERIFYING' ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  מאמתת...
                </>
              ) : 'אמתי'}
            </button>

            {/* Resend / change */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              <button
                onClick={() => { setState('PHONE'); setOtp(''); setError(null) }}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#8A7A72', cursor: 'pointer' }}
              >
                שינוי מספר טלפון
              </button>
              {canResend && (
                <button
                  onClick={handleSendOtp}
                  style={{ background: 'none', border: 'none', fontSize: 13, color: GOLD, fontWeight: 600, cursor: 'pointer' }}
                >
                  שלחי שוב
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: New customer profile ── */}
        {state === 'VERIFIED' && !isExisting && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Success notice */}
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', gap: 8, alignItems: 'center',
              fontSize: 14, color: '#166534',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <path d="M5 13l4 4L19 7" />
              </svg>
              הטלפון אומת בהצלחה! כמה פרטים נוספים:
            </div>

            {/* Full name */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#5A4A42', marginBottom: 6 }}>
                שם מלא <span style={{ color: '#E07070' }}>*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(null) }}
                placeholder="שם פרטי ושם משפחה"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E0D0C0')}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#5A4A42', marginBottom: 6 }}>
                אימייל{' '}
                <span style={{ fontSize: 12, color: '#8A7A72', fontWeight: 400 }}>(אופציונלי)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                dir="ltr"
                style={{ ...inputStyle, textAlign: 'left' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E0D0C0')}
              />
            </div>

            {/* Marketing consent */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <div
                onClick={() => setMarketing((m) => !m)}
                style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${marketing ? GOLD : '#C8B8A8'}`,
                  background: marketing ? GOLD : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}
              >
                {marketing && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 13, color: '#5A4A42', lineHeight: 1.5 }}>
                אני מסכימה לקבל עדכונים, מבצעים וחדשות מ-שני קוסמטיקס בהודעות SMS / וואטסאפ
              </span>
            </label>

            <button
              onClick={handleProfileContinue}
              disabled={!fullName.trim()}
              style={btnStyle(!fullName.trim())}
            >
              המשך לאישור ←
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </BookingLayout>
  )
}

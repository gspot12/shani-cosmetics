'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BookingLayout from '@/components/layout/BookingLayout'
import { createAppointment, createBookingHold, getServices } from '@/server/actions/booking'
import type { ServiceWithCategory } from '@/types'

const GOLD = '#B8973A'
const GOLD_LIGHT = '#FBF5E6'

const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} דק'`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} שע'` : `${h}:${String(m).padStart(2, '0')} שע'`
}

function formatDateHebrew(date: Date): string {
  return `יום ${HE_DAYS[date.getDay()]}, ${date.getDate()} ב${HE_MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

interface SuccessState {
  manageToken: string
  staffName: string
  date: Date
  time: string
  services: ServiceWithCategory[]
  totalPrice: number
  totalDuration: number
}

function SuccessView({ data }: { data: SuccessState }) {
  const whatsappText = encodeURIComponent(
    `קבעתי תור ב-שני קוסמטיקס!\n📅 ${formatDateHebrew(data.date)}\n🕐 ${data.time}\n💄 ${data.services.map(s => s.name).join(', ')}`
  )

  return (
    <BookingLayout>
      <div style={{ direction: 'rtl', textAlign: 'center', padding: '24px 0 80px' }}>
        {/* Big checkmark */}
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2C2C2C', margin: '0 0 8px' }}>
          התור נקבע בהצלחה!
        </h1>
        <p style={{ fontSize: 14, color: '#8A7A72', marginBottom: 28 }}>
          שלחנו לך הודעת אישור עם כל הפרטים
        </p>

        {/* Summary card */}
        <div style={{
          background: 'white', borderRadius: 16,
          border: '1px solid #E8D5C4',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '20px 20px', marginBottom: 24, textAlign: 'right',
        }}>
          {/* Date + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid #F5EDE0' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: GOLD_LIGHT,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2C' }}>
                {formatDateHebrew(data.date)}
              </div>
              <div style={{ fontSize: 13, color: '#8A7A72' }}>בשעה {data.time}</div>
            </div>
          </div>

          {/* Services */}
          <div style={{ paddingTop: 14, paddingBottom: 14, borderBottom: '1px solid #F5EDE0' }}>
            {data.services.map((svc) => (
              <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                <span style={{ fontSize: 14, color: '#2C2C2C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{svc.name}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#5A4A42', flexShrink: 0 }}>₪{svc.price}</span>
              </div>
            ))}
          </div>

          {/* Staff */}
          {data.staffName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, paddingBottom: 14, borderBottom: '1px solid #F5EDE0' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A7A72" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <span style={{ fontSize: 13, color: '#5A4A42' }}>{data.staffName}</span>
            </div>
          )}

          {/* Duration + total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 }}>
            <span style={{ fontSize: 13, color: '#8A7A72' }}>
              משך: {formatDuration(data.totalDuration)}
            </span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: '#8A7A72' }}>סה&quot;כ לתשלום</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>₪{data.totalPrice}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto' }}>
          <Link
            href={`/appointment/${data.manageToken}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: GOLD, color: 'white', textDecoration: 'none',
              borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            ניהול התור
          </Link>

          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#25D366', color: 'white', textDecoration: 'none',
              borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 600,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            שתפי בוואטסאפ
          </a>

          <Link
            href="/"
            style={{
              display: 'block', textAlign: 'center', textDecoration: 'none',
              fontSize: 14, color: '#8A7A72', padding: '10px 0',
            }}
          >
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </BookingLayout>
  )
}

export default function ConfirmPage() {
  const router = useRouter()
  const [selectedServices, setSelectedServices] = useState<ServiceWithCategory[]>([])
  const [staffName, setStaffName] = useState<string>('כל מטפלת פנויה')
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [clientNotes, setClientNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessState | null>(null)

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('booking_serviceIds') ?? '[]')
    const dateStr = localStorage.getItem('booking_date')
    const timeStr = localStorage.getItem('booking_time')
    const sessionToken = localStorage.getItem('booking_sessionToken')
    const phone = localStorage.getItem('booking_phone')

    if (!ids.length || !dateStr || !timeStr || !sessionToken || !phone) {
      router.replace('/book/service')
      return
    }

    setStaffName(localStorage.getItem('booking_staffName') ?? 'כל מטפלת פנויה')
    setDate(new Date(dateStr + 'T00:00:00'))
    setTime(timeStr)

    getServices()
      .then((all) => {
        setSelectedServices(all.filter((s) => ids.includes(s.id)))
      })
      .catch(console.error)
  }, [router])

  async function handleConfirm() {
    const ids: string[] = JSON.parse(localStorage.getItem('booking_serviceIds') ?? '[]')
    const dateStr = localStorage.getItem('booking_date')
    const timeStr = localStorage.getItem('booking_time')
    const staffId = localStorage.getItem('booking_staffId') ?? ''
    const sessionToken = localStorage.getItem('booking_sessionToken')
    const phone = localStorage.getItem('booking_phone')
    const fullName = localStorage.getItem('booking_fullName') ?? ''
    const emailStr = localStorage.getItem('booking_email') ?? ''
    const marketingStr = localStorage.getItem('booking_marketing') ?? ''
    let holdToken = localStorage.getItem('booking_holdToken') ?? ''

    if (!ids.length || !dateStr || !timeStr || !sessionToken || !phone) {
      setError('חסרים פרטים. נא לחזור להתחלה.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const startDateTime = `${dateStr}T${timeStr}:00`

      // Create hold if not already held
      if (!holdToken && staffId) {
        const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)
        const startDate = new Date(startDateTime)
        const endDate = new Date(startDate.getTime() + totalDuration * 60 * 1000)
        const hold = await createBookingHold({
          staffId,
          startDateTime,
          endDateTime: endDate.toISOString(),
          customerPhone: phone,
        })
        holdToken = hold.token
        localStorage.setItem('booking_holdToken', holdToken)
      }

      const result = await createAppointment({
        serviceIds: ids,
        staffId: staffId || ids[0],
        startDateTime,
        holdToken,
        customerData: {
          phone,
          fullName: fullName || phone,
          email: emailStr || undefined,
          marketingConsent: marketingStr === 'true',
        },
        clientNotes: clientNotes.trim() || undefined,
        sessionToken,
      })

      // Clear booking state
      const KEYS = [
        'booking_serviceIds', 'booking_staffId', 'booking_staffName',
        'booking_date', 'booking_time', 'booking_holdToken',
        'booking_sessionToken', 'booking_phone', 'booking_fullName',
        'booking_email', 'booking_marketing', 'booking_serviceNames',
      ]
      KEYS.forEach((k) => localStorage.removeItem(k))

      setSuccess({
        manageToken: result.manageToken,
        staffName,
        date: date!,
        time: timeStr,
        services: selectedServices,
        totalPrice: selectedServices.reduce((s, sv) => s + sv.price, 0),
        totalDuration: selectedServices.reduce((s, sv) => s + sv.durationMinutes, 0),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת התור. נסי שוב.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return <SuccessView data={success} />

  const totalPrice = selectedServices.reduce((s, sv) => s + sv.price, 0)
  const totalDuration = selectedServices.reduce((s, sv) => s + sv.durationMinutes, 0)
  const requiresDeposit = selectedServices.some((s) => s.requiresDeposit)
  const depositAmount = selectedServices.reduce((s, sv) => s + (sv.depositAmount ?? 0), 0)

  return (
    <BookingLayout>
      <div style={{ direction: 'rtl', paddingBottom: 110 }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
            אישור תור
          </h1>
          <p style={{ fontSize: 14, color: '#8A7A72', marginTop: 4 }}>
            בדקי את הפרטים ואשרי את התור
          </p>
        </div>

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

        {/* Summary card */}
        <div style={{
          background: 'white', borderRadius: 16,
          border: '1px solid #E8D5C4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden', marginBottom: 16,
        }}>
          {/* Gold top accent */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${GOLD}, #D4AF60)` }} />

          <div style={{ padding: '18px 20px' }}>
            {/* Date row */}
            {date && time && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingBottom: 14, borderBottom: '1px solid #F5EDE0', marginBottom: 14,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, background: GOLD_LIGHT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2C' }}>
                    {formatDateHebrew(date)}
                  </div>
                  <div style={{ fontSize: 13, color: '#8A7A72' }}>בשעה {time}</div>
                </div>
              </div>
            )}

            {/* Services */}
            {selectedServices.map((svc) => (
              <div key={svc.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 10,
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#2C2C2C' }}>{svc.name}</div>
                  <div style={{ fontSize: 12, color: '#8A7A72' }}>{formatDuration(svc.durationMinutes)}</div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#5A4A42' }}>₪{svc.price}</span>
              </div>
            ))}

            {/* Staff */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              paddingTop: 12, borderTop: '1px solid #F5EDE0', marginTop: 4,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A7A72" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <span style={{ fontSize: 13, color: '#5A4A42' }}>{staffName}</span>

              <span style={{ marginRight: 'auto', marginLeft: 0, fontSize: 12, color: '#8A7A72' }}>
                {formatDuration(totalDuration)}
              </span>
            </div>

            {/* Total price */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 14, marginTop: 14, borderTop: '2px solid #F5EDE0',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#5A4A42' }}>סה&quot;כ</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: GOLD }}>₪{totalPrice}</span>
            </div>

            {/* Deposit notice */}
            {requiresDeposit && depositAmount > 0 && (
              <div style={{
                marginTop: 10, background: '#FEF3C7', border: '1px solid #FDE68A',
                borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#92400E',
              }}>
                נדרש מקדמה של ₪{depositAmount} לאישור התור
              </div>
            )}
          </div>
        </div>

        {/* Notes textarea */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#5A4A42', marginBottom: 6 }}>
            הערות לטיפול{' '}
            <span style={{ fontSize: 12, color: '#8A7A72', fontWeight: 400 }}>(אופציונלי)</span>
          </label>
          <textarea
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="למשל: אלרגיה למוצר מסוים, בקשה מיוחדת..."
            rows={3}
            style={{
              width: '100%', padding: '12px 14px', fontSize: 14,
              border: '2px solid #E0D0C0', borderRadius: 12, outline: 'none',
              color: '#2C2C2C', resize: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E0D0C0')}
          />
        </div>

        {/* Policy note */}
        <div style={{
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: 10, padding: '10px 14px', fontSize: 12,
          color: '#1D4ED8', lineHeight: 1.6,
        }}>
          ניתן לבטל או לשנות תור עד 24 שעות לפני המועד. בלחיצה על &quot;אשרי ואשלחי&quot; את מאשרת את תנאי השימוש.
        </div>
      </div>

      {/* Sticky bottom */}
      <div style={{
        position: 'fixed', bottom: 0, right: 0, left: 0, zIndex: 20,
        background: 'white', borderTop: '1px solid #F0E8E0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        direction: 'rtl',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 16px 18px' }}>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#E8D5C4' : GOLD,
              color: loading ? '#A09088' : 'white',
              border: 'none', borderRadius: 12,
              padding: '14px 0', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                שומרת תור...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                אשרי ואשלחי
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </BookingLayout>
  )
}

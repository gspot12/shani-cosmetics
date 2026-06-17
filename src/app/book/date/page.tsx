'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BookingLayout from '@/components/layout/BookingLayout'
import { getAvailableDates } from '@/server/actions/booking'
import type { DateAvailability } from '@/types'

const GOLD = '#B8973A'
const GOLD_LIGHT = '#FBF5E6'

const HE_DAY_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function DateSelectionPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availability, setAvailability] = useState<DateAvailability[]>([])
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()) // 0-indexed
  const [loading, setLoading] = useState(false)
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [staffId, setStaffId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('booking_serviceIds') ?? '[]')
    if (!ids.length) {
      router.replace('/book/service')
      return
    }
    setServiceIds(ids)
    const sid = localStorage.getItem('booking_staffId') ?? ''
    setStaffId(sid || undefined)

    const saved = localStorage.getItem('booking_date')
    if (saved) setSelectedDate(new Date(saved + 'T00:00:00'))
  }, [router])

  const loadAvailability = useCallback(async (year: number, month: number) => {
    if (!serviceIds.length) return
    setLoading(true)
    try {
      const result = await getAvailableDates({
        serviceIds,
        staffId,
        year,
        month: month + 1, // convert 0-indexed to 1-indexed
      })
      setAvailability(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [serviceIds, staffId])

  useEffect(() => {
    if (serviceIds.length) {
      loadAvailability(viewYear, viewMonth)
    }
  }, [serviceIds, viewYear, viewMonth, loadAvailability])

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  // In Hebrew calendar, Sunday = first column (index 0)
  const startDow = firstDay.getDay() // 0=Sun
  const daysInMonth = lastDay.getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const availMap = new Map<string, 'available' | 'full' | 'closed'>()
  availability.forEach((d) => availMap.set(d.date, d.status))

  function getDayStatus(date: Date): 'past' | 'available' | 'full' | 'closed' | 'selected' {
    if (selectedDate && sameDay(date, selectedDate)) return 'selected'
    if (date < today) return 'past'
    const iso = toISO(date)
    const status = availMap.get(iso)
    if (status === 'full') return 'full'
    if (status === 'closed') return 'closed'
    return 'available'
  }

  function handleDayClick(date: Date) {
    const status = getDayStatus(date)
    if (status === 'past' || status === 'full' || status === 'closed') return
    setSelectedDate(date)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function handleContinue() {
    if (!selectedDate) return
    localStorage.setItem('booking_date', toISO(selectedDate))
    localStorage.removeItem('booking_time')
    localStorage.removeItem('booking_holdToken')
    router.push('/book/time')
  }

  // Build grid cells: empty + day cells
  const cells: Array<{ day: number; date: Date } | null> = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(viewYear, viewMonth, d) })
  }
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  return (
    <BookingLayout>
      <div style={{ direction: 'rtl', paddingBottom: 100 }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
            בחרי תאריך
          </h1>
          <p style={{ fontSize: 14, color: '#8A7A72', marginTop: 4 }}>
            בחרי את התאריך המועדף לטיפול
          </p>
        </div>

        {/* Calendar card */}
        <div style={{
          background: 'white', borderRadius: 16,
          border: '1px solid #E8D5C4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Loading overlay */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255,255,255,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 5,
            }}>
              <div style={{
                width: 28, height: 28, border: `3px solid ${GOLD}`,
                borderTopColor: 'transparent', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          )}

          {/* Month navigation */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid #F0E8E0',
          }}>
            <button
              onClick={nextMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#5A4A42', fontSize: 18 }}
            >
              &#8250;
            </button>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#2C2C2C' }}>
              {HE_MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={prevMonth}
              disabled={isPrevDisabled}
              style={{
                background: 'none', border: 'none', cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
                padding: 6, color: isPrevDisabled ? '#C8B8A8' : '#5A4A42', fontSize: 18,
              }}
            >
              &#8249;
            </button>
          </div>

          {/* Day names header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 12px 6px' }}>
            {HE_DAY_SHORT.map((d, i) => (
              <div key={i} style={{
                textAlign: 'center', fontSize: 12, fontWeight: 600,
                color: i === 6 ? '#E8987A' : '#8A7A72',
                paddingBottom: 4,
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, padding: '0 12px 16px' }}>
            {cells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} />

              const status = getDayStatus(cell.date)
              const isSat = cell.date.getDay() === 6

              let bg = 'transparent'
              let textColor = '#2C2C2C'
              let border = '1px solid transparent'
              let cursor = 'pointer'
              let fontWeight = 400

              if (status === 'selected') {
                bg = GOLD; textColor = 'white'; border = `1px solid ${GOLD}`; fontWeight = 700
              } else if (status === 'past') {
                textColor = '#C8B8A8'; cursor = 'not-allowed'
              } else if (status === 'full') {
                bg = '#F5F0EA'; textColor = '#C8B8A8'; cursor = 'not-allowed'
              } else if (status === 'closed') {
                textColor = '#C8B8A8'; cursor = 'not-allowed'
              } else {
                // available
                if (isSat) textColor = '#C8987A'
              }

              return (
                <div
                  key={cell.day}
                  onClick={() => handleDayClick(cell.date)}
                  style={{
                    aspectRatio: '1', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: 8, background: bg, border, cursor,
                    transition: 'all 0.12s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (status === 'available') {
                      (e.currentTarget as HTMLElement).style.border = `1px solid ${GOLD}`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (status === 'available') {
                      (e.currentTarget as HTMLElement).style.border = '1px solid transparent'
                    }
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight, color: textColor, lineHeight: 1 }}>
                    {cell.day}
                  </span>
                  {status === 'full' && (
                    <span style={{ fontSize: 9, color: '#A09088', marginTop: 1 }}>מלא</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 16, justifyContent: 'center',
            padding: '10px 16px 14px', borderTop: '1px solid #F0E8E0',
            flexWrap: 'wrap',
          }}>
            {[
              { color: GOLD, label: 'נבחר' },
              { color: '#F5F0EA', label: 'מלא', textColor: '#A09088' },
              { color: '#E8D5C4', label: 'לא זמין' },
            ].map(({ color, label, textColor }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                <span style={{ fontSize: 11, color: textColor ?? '#8A7A72' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected date display */}
        {selectedDate && (
          <div style={{
            marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
            background: GOLD_LIGHT, border: '1px solid #E8D5C4',
            borderRadius: 12, padding: '12px 16px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#7A5E22' }}>
              יום {HE_DAYS[selectedDate.getDay()]}, {selectedDate.getDate()} ב{HE_MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </span>
          </div>
        )}
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
            onClick={handleContinue}
            disabled={!selectedDate}
            style={{
              width: '100%',
              background: selectedDate ? GOLD : '#E8D5C4',
              color: selectedDate ? 'white' : '#A09088',
              border: 'none', borderRadius: 12,
              padding: '14px 0', fontSize: 16, fontWeight: 700,
              cursor: selectedDate ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {selectedDate ? 'המשך לבחירת שעה ←' : 'בחרי תאריך להמשך'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </BookingLayout>
  )
}

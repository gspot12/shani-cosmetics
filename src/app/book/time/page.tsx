'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BookingLayout from '@/components/layout/BookingLayout'
import { getAvailableSlots } from '@/server/actions/booking'
import type { AvailableSlot } from '@/types'

const GOLD = '#B8973A'

const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function parseHour(time: string): number {
  return parseInt(time.split(':')[0], 10)
}

interface SlotGroup {
  label: string
  emoji: string
  slots: AvailableSlot[]
}

function dedupeByTime(slots: AvailableSlot[]): AvailableSlot[] {
  const seen = new Set<string>()
  return slots.filter((s) => {
    if (seen.has(s.time)) return false
    seen.add(s.time)
    return true
  })
}

function groupSlots(slots: AvailableSlot[]): SlotGroup[] {
  const unique = dedupeByTime(slots)
  const morning = unique.filter((s) => parseHour(s.time) < 12)
  const afternoon = unique.filter((s) => { const h = parseHour(s.time); return h >= 12 && h < 17 })
  const evening = unique.filter((s) => parseHour(s.time) >= 17)

  const groups: SlotGroup[] = []
  if (morning.length) groups.push({ label: 'בוקר', emoji: '☀️', slots: morning })
  if (afternoon.length) groups.push({ label: 'צהריים', emoji: '🌤️', slots: afternoon })
  if (evening.length) groups.push({ label: 'ערב', emoji: '🌙', slots: evening })
  return groups
}

function SkeletonSlots() {
  return (
    <div>
      {[1, 2].map((g) => (
        <div key={g} style={{ marginBottom: 24 }}>
          <div style={{ height: 14, width: 60, background: '#F0E8E0', borderRadius: 6, marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 44, background: '#F0E8E0', borderRadius: 22, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TimeSelectionPage() {
  const router = useRouter()
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateStr, setDateStr] = useState('')
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [staffId, setStaffId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('booking_serviceIds') ?? '[]')
    const date = localStorage.getItem('booking_date')
    if (!ids.length || !date) {
      router.replace('/book/service')
      return
    }
    setServiceIds(ids)
    setDateStr(date)
    const sid = localStorage.getItem('booking_staffId') ?? ''
    setStaffId(sid || undefined)

    const savedTime = localStorage.getItem('booking_time')
    if (savedTime) setSelectedTime(savedTime)
  }, [router])

  const loadSlots = useCallback(async () => {
    if (!serviceIds.length || !dateStr) return
    setLoading(true)
    setError(null)
    try {
      const result = await getAvailableSlots({ serviceIds, staffId, date: dateStr })
      setSlots(result)
    } catch (err) {
      setError('שגיאה בטעינת השעות. נסי שוב.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [serviceIds, staffId, dateStr])

  useEffect(() => {
    if (serviceIds.length && dateStr) loadSlots()
  }, [serviceIds, dateStr, loadSlots])

  async function handleContinue() {
    if (!selectedTime) return
    const slot = slots.find((s) => s.time === selectedTime)
    if (!slot) return

    setSubmitting(true)
    setError(null)
    try {
      localStorage.setItem('booking_time', selectedTime)
      localStorage.setItem('booking_staffId', slot.staffId)
      localStorage.setItem('booking_staffName', slot.staffName)
      localStorage.removeItem('booking_holdToken')
      router.push('/book/details')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה. נסי שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  const parsedDate = dateStr ? new Date(dateStr + 'T00:00:00') : null
  const dateDisplay = parsedDate
    ? `יום ${HE_DAYS[parsedDate.getDay()]}, ${parsedDate.getDate()} ב${HE_MONTHS[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`
    : ''

  const groups = groupSlots(slots)

  return (
    <BookingLayout>
      <div style={{ direction: 'rtl', paddingBottom: 100 }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
            בחרי שעה
          </h1>
          {dateDisplay && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#7A5E22' }}>{dateDisplay}</span>
            </div>
          )}
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

        {loading ? (
          <SkeletonSlots />
        ) : slots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#F5F0EA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 28,
            }}>🕐</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#5A4A42', marginBottom: 8 }}>
              אין שעות פנויות ביום זה
            </div>
            <div style={{ fontSize: 14, color: '#8A7A72', marginBottom: 24 }}>
              נסי לבחור תאריך אחר
            </div>
            <button
              onClick={() => router.push('/book/date')}
              style={{
                background: GOLD, color: 'white', border: 'none',
                borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              חזרה לבחירת תאריך
            </button>
          </div>
        ) : (
          <div>
            {groups.map((group) => (
              <div key={group.label} style={{ marginBottom: 28 }}>
                {/* Group header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>{group.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#5A4A42' }}>{group.label}</span>
                  <div style={{ flex: 1, height: 1, background: '#F0E8E0' }} />
                  <span style={{ fontSize: 12, color: '#8A7A72' }}>{group.slots.length} שעות</span>
                </div>

                {/* Time pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                  {group.slots.map((slot) => {
                    const selected = selectedTime === slot.time
                    return (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        style={{
                          padding: '10px 0',
                          borderRadius: 22,
                          border: `2px solid ${selected ? GOLD : '#E0D0C0'}`,
                          background: selected ? GOLD : 'white',
                          color: selected ? 'white' : GOLD,
                          fontSize: 15,
                          fontWeight: selected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.12s',
                          fontFamily: 'monospace',
                          letterSpacing: '0.02em',
                        }}
                        onMouseEnter={(e) => {
                          if (!selected) (e.currentTarget as HTMLElement).style.borderColor = GOLD
                        }}
                        onMouseLeave={(e) => {
                          if (!selected) (e.currentTarget as HTMLElement).style.borderColor = '#E0D0C0'
                        }}
                      >
                        {slot.time}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
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
            disabled={!selectedTime || submitting}
            style={{
              width: '100%',
              background: selectedTime && !submitting ? GOLD : '#E8D5C4',
              color: selectedTime && !submitting ? 'white' : '#A09088',
              border: 'none', borderRadius: 12,
              padding: '14px 0', fontSize: 16, fontWeight: 700,
              cursor: selectedTime && !submitting ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {submitting ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                שומרת...
              </>
            ) : selectedTime ? (
              `המשך — ${selectedTime} ←`
            ) : (
              'בחרי שעה להמשך'
            )}
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

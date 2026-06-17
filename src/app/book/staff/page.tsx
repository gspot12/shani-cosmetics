'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BookingLayout from '@/components/layout/BookingLayout'
import { getStaffForServices } from '@/server/actions/booking'
import type { Staff } from '@prisma/client'

const GOLD = '#B8973A'
const GOLD_LIGHT = '#FBF5E6'

const ANY_STAFF_ID = '__any__'

function StarRow() {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={GOLD} stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

interface StaffCardProps {
  staff: Staff
  selected: boolean
  onSelect: (id: string) => void
}

function StaffMemberCard({ staff, selected, onSelect }: StaffCardProps) {
  const initial = staff.name.charAt(0)
  return (
    <div
      onClick={() => onSelect(staff.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 18px',
        borderRadius: 14,
        border: `2px solid ${selected ? GOLD : '#E8D5C4'}`,
        background: selected ? GOLD_LIGHT : 'white',
        cursor: 'pointer',
        marginBottom: 10,
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Avatar circle */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: staff.color || GOLD,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: 26, fontWeight: 700, color: 'white',
        boxShadow: `0 2px 8px ${staff.color || GOLD}60`,
      }}>
        {initial}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#2C2C2C', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {staff.name}
        </div>
        <div style={{ fontSize: 12, color: '#8A7A72', marginBottom: 5 }}>
          מטפלת מקצועית
        </div>
        <StarRow />
      </div>

      {/* Select button */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(staff.id) }}
        style={{
          background: selected ? GOLD : 'transparent',
          color: selected ? 'white' : GOLD,
          border: `2px solid ${GOLD}`,
          borderRadius: 20,
          padding: '6px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {selected ? 'נבחרה ✓' : 'בחרי'}
      </button>
    </div>
  )
}

function AnyStaffCard({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 18px',
        borderRadius: 14,
        border: `2px solid ${selected ? GOLD : GOLD}`,
        background: selected ? GOLD : GOLD_LIGHT,
        cursor: 'pointer',
        marginBottom: 10,
        transition: 'all 0.15s',
        boxShadow: selected ? `0 4px 14px ${GOLD}40` : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: selected ? 'rgba(255,255,255,0.25)' : GOLD,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: 26,
      }}>
        ✨
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: selected ? 'white' : '#2C2C2C', marginBottom: 2 }}>
          כל מטפלת פנויה
        </div>
        <div style={{ fontSize: 12, color: selected ? 'rgba(255,255,255,0.8)' : '#8A7A72' }}>
          מאפשרת הכי הרבה שעות פנויות
        </div>
      </div>

      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: `2px solid ${selected ? 'white' : GOLD}`,
        background: selected ? 'white' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {selected && (
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: GOLD }} />
        )}
      </div>
    </div>
  )
}

export default function StaffSelectionPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('booking_serviceIds') ?? '[]')
    if (!ids.length) {
      router.replace('/book/service')
      return
    }

    const saved = localStorage.getItem('booking_staffId')
    if (saved === '') {
      setSelectedId(ANY_STAFF_ID)
    } else if (saved) {
      setSelectedId(saved)
    }

    getStaffForServices(ids)
      .then(setStaff)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  function handleSelect(id: string) {
    setSelectedId(id)
  }

  function handleContinue() {
    if (!selectedId) return
    if (selectedId === ANY_STAFF_ID) {
      localStorage.setItem('booking_staffId', '')
      localStorage.setItem('booking_staffName', 'כל מטפלת פנויה')
    } else {
      const found = staff.find((s) => s.id === selectedId)
      localStorage.setItem('booking_staffId', selectedId)
      localStorage.setItem('booking_staffName', found?.name ?? '')
    }
    localStorage.removeItem('booking_date')
    localStorage.removeItem('booking_time')
    localStorage.removeItem('booking_holdToken')
    router.push('/book/date')
  }

  return (
    <BookingLayout>
      <div style={{ direction: 'rtl', paddingBottom: 100 }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
            בחרי מטפלת
          </h1>
          <p style={{ fontSize: 14, color: '#8A7A72', marginTop: 4 }}>
            בחרי מטפלת מועדפת או השאירי לנו לבחור
          </p>
        </div>

        {loading ? (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: 96, borderRadius: 14, background: '#F0E8E0',
                marginBottom: 10, animation: 'pulse 1.5s infinite',
              }} />
            ))}
          </div>
        ) : (
          <div>
            <AnyStaffCard
              selected={selectedId === ANY_STAFF_ID}
              onSelect={() => handleSelect(ANY_STAFF_ID)}
            />

            {staff.map((s) => (
              <StaffMemberCard
                key={s.id}
                staff={s}
                selected={selectedId === s.id}
                onSelect={handleSelect}
              />
            ))}

            {staff.length === 0 && (
              <p style={{ textAlign: 'center', color: '#8A7A72', fontSize: 14, padding: '32px 0' }}>
                לא נמצאו מטפלות זמינות לשירותים אלה
              </p>
            )}
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
            disabled={!selectedId}
            style={{
              width: '100%',
              background: selectedId ? GOLD : '#E8D5C4',
              color: selectedId ? 'white' : '#A09088',
              border: 'none', borderRadius: 12,
              padding: '14px 0', fontSize: 16, fontWeight: 700,
              cursor: selectedId ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {selectedId ? 'המשך ←' : 'בחרי מטפלת להמשך'}
          </button>
        </div>
      </div>
    </BookingLayout>
  )
}

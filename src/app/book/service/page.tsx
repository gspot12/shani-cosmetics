'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BookingLayout from '@/components/layout/BookingLayout'
import { getServices } from '@/server/actions/booking'
import type { ServiceWithCategory } from '@/types'

const GOLD = '#B8973A'
const GOLD_LIGHT = '#FBF5E6'

const CATEGORY_COLORS: Record<string, string> = {
  default: '#B8973A',
  פנים: '#E8A598',
  גוף: '#8FB8A8',
  שיער: '#A89DC8',
  ציפורניים: '#C8A8B8',
  עיניים: '#98B8C8',
}

function getCategoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? CATEGORY_COLORS.default
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} דק'`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h} שע'`
  return `${h}:${String(m).padStart(2, '0')} שע'`
}

interface GroupedCategory {
  name: string
  color: string
  items: ServiceWithCategory[]
}

export default function ServiceSelectionPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<GroupedCategory[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [allServices, setAllServices] = useState<ServiceWithCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Restore persisted selection
  useEffect(() => {
    try {
      const saved = localStorage.getItem('booking_serviceIds')
      if (saved) setSelectedIds(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  // Fetch services and group by category
  useEffect(() => {
    getServices()
      .then((svcs) => {
        setAllServices(svcs)
        // Group preserving server sort order
        const map = new Map<string, GroupedCategory>()
        svcs.forEach((s) => {
          if (!map.has(s.categoryName)) {
            map.set(s.categoryName, {
              name: s.categoryName,
              color: getCategoryColor(s.categoryName),
              items: [],
            })
          }
          map.get(s.categoryName)!.items.push(s)
        })
        setGroups(Array.from(map.values()))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggleService = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const selectedServices = allServices.filter((s) => selectedIds.includes(s.id))
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const count = selectedIds.length

  function handleContinue() {
    if (!count) return
    localStorage.setItem('booking_serviceIds', JSON.stringify(selectedIds))
    localStorage.removeItem('booking_staffId')
    localStorage.removeItem('booking_staffName')
    localStorage.removeItem('booking_date')
    localStorage.removeItem('booking_time')
    localStorage.removeItem('booking_holdToken')
    router.push('/book/staff')
  }

  return (
    <BookingLayout>
      <div style={{ direction: 'rtl', paddingBottom: 100 }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
            בחרי שירות
          </h1>
          <p style={{ fontSize: 14, color: '#8A7A72', marginTop: 4 }}>
            ניתן לבחור יותר מטיפול אחד
          </p>
        </div>

        {loading ? (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <div style={{ height: 16, width: 100, background: '#F0E8E0', borderRadius: 8, marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
                {[1, 2].map((j) => (
                  <div key={j} style={{ height: 80, background: '#F0E8E0', borderRadius: 12, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#8A7A72' }}>
            אין שירותים זמינים כרגע
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.name} style={{ marginBottom: 32 }}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 16, borderRadius: 2, background: group.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#5A4A42', letterSpacing: '0.05em' }}>
                  {group.name}
                </span>
                <div style={{ flex: 1, height: 1, background: '#F0E8E0' }} />
              </div>

              {/* Service cards */}
              {group.items.map((svc) => {
                const selected = selectedIds.includes(svc.id)
                return (
                  <div
                    key={svc.id}
                    onClick={() => toggleService(svc.id)}
                    style={{
                      marginBottom: 10,
                      borderRadius: 14,
                      border: `2px solid ${selected ? GOLD : '#E8D5C4'}`,
                      background: selected ? GOLD_LIGHT : 'white',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'border-color 0.15s, background 0.15s',
                      boxShadow: selected ? `0 0 0 0px ${GOLD}40` : '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* Colored top bar */}
                    <div style={{ height: 4, background: group.color }} />

                    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                      {/* Text info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#2C2C2C', marginBottom: 6 }}>
                          {svc.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* Duration pill */}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            background: '#F5F0EA', borderRadius: 20, padding: '2px 8px',
                            fontSize: 12, color: '#7A6A62', fontWeight: 500,
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                            </svg>
                            {formatDuration(svc.durationMinutes)}
                          </span>
                          {svc.description && (
                            <span style={{ fontSize: 12, color: '#A09088', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                              {svc.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price + checkbox */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>
                          ₪{svc.price}
                        </span>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6,
                          border: `2px solid ${selected ? GOLD : '#C8B8A8'}`,
                          background: selected ? GOLD : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                          flexShrink: 0,
                        }}>
                          {selected && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Sticky bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, right: 0, left: 0, zIndex: 20,
        background: 'white', borderTop: '1px solid #F0E8E0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        direction: 'rtl',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 16px 16px' }}>
          {count > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: GOLD_LIGHT, borderRadius: 10, padding: '8px 14px',
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 14, color: '#5A4A42' }}>
                <strong style={{ color: GOLD }}>{count}</strong> {count === 1 ? 'שירות נבחר' : 'שירותים נבחרו'}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: GOLD }}>
                סה&quot;כ ₪{totalPrice}
              </span>
            </div>
          )}
          <button
            onClick={handleContinue}
            disabled={count === 0}
            style={{
              width: '100%',
              background: count === 0 ? '#E8D5C4' : GOLD,
              color: count === 0 ? '#A09088' : 'white',
              border: 'none',
              borderRadius: 12,
              padding: '14px 0',
              fontSize: 16,
              fontWeight: 700,
              cursor: count === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.15s',
            }}
          >
            {count === 0 ? 'בחרי שירות להמשך' : `המשך ←`}
          </button>
        </div>
      </div>
    </BookingLayout>
  )
}

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BrandLogo from '@/components/brand/BrandLogo'

const STEPS = [
  { path: '/book/service', label: 'שירות', num: 1 },
  { path: '/book/staff',   label: 'מטפלת', num: 2 },
  { path: '/book/date',    label: 'תאריך', num: 3 },
  { path: '/book/time',    label: 'שעה',   num: 4 },
  { path: '/book/details', label: 'פרטים', num: 5 },
  { path: '/book/confirm', label: 'אישור', num: 6 },
]

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentStep = STEPS.findIndex(s => s.path === pathname) + 1 || 1

  return (
    <div style={{minHeight:'100vh', background:'#FAF7F4', direction:'rtl'}} dir="rtl">
      {/* Header */}
      <header style={{background:'white', borderBottom:'1px solid #E8D5C4', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <Link href="/" style={{textDecoration:'none'}}>
          <BrandLogo size="sm" variant="dark" />
        </Link>
        <span style={{fontSize:13, color:'#8A7A72', fontWeight:500}}>קביעת תור</span>
      </header>

      {/* Step indicator */}
      <div style={{background:'white', borderBottom:'1px solid #F0E8E0', padding:'12px 0'}}>
        <div style={{maxWidth:640, margin:'0 auto', padding:'0 16px'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:0}}>
            {STEPS.map((step, i) => {
              const done    = step.num < currentStep
              const active  = step.num === currentStep
              return (
                <div key={step.path} style={{display:'flex', alignItems:'center'}}>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
                    <div className="step-circle" style={{
                      width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, fontWeight:600,
                      background: done ? '#B8973A' : active ? '#2C2C2C' : '#E8D5C4',
                      color: done || active ? 'white' : '#8A7A72',
                      transition:'all 0.2s', flexShrink:0,
                    }}>
                      {done ? '✓' : step.num}
                    </div>
                    <span className="step-label" style={{fontSize:10, color: active ? '#2C2C2C' : '#8A7A72', fontWeight: active ? 600 : 400, whiteSpace:'nowrap'}}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="step-connector" style={{height:1, background: done ? '#B8973A' : '#E8D5C4', margin:'0 4px', marginBottom:16, transition:'background 0.2s'}} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:720, margin:'0 auto', padding:'24px 16px 48px'}}>
        {children}
      </div>

      <style>{`
        .step-connector { width: 28px; }
        @media (max-width: 400px) {
          .step-connector { width: 18px; }
          .step-circle    { width: 24px !important; height: 24px !important; font-size: 10px !important; }
          .step-label     { font-size: 9px !important; }
        }
      `}</style>
    </div>
  )
}

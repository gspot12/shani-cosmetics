'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'דשבורד', icon: '🏠' },
  { href: '/admin/calendar', label: 'יומן', icon: '📅' },
  { href: '/admin/appointments', label: 'תורים', icon: '🕐' },
  { href: '/admin/customers', label: 'לקוחות', icon: '👥' },
  { href: '/admin/services', label: 'שירותים', icon: '✨' },
  { href: '/admin/staff', label: 'מטפלות', icon: '⭐' },
  { href: '/admin/availability', label: 'זמינות', icon: '⚙️' },
  { href: '/admin/waitlist', label: 'רשימת המתנה', icon: '📋' },
  { href: '/admin/reviews', label: 'ביקורות', icon: '💬' },
  { href: '/admin/messages', label: 'הודעות', icon: '📧' },
  { href: '/admin/settings', label: 'הגדרות', icon: '🔧' },
  { href: '/admin/audit-log', label: 'לוג ביקורת', icon: '🛡️' },
]

export default function AdminLayout({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sidebar = (
    <div style={{width:220, background:'#1C1C1C', minHeight:'100vh', display:'flex', flexDirection:'column', flexShrink:0}}>
      {/* Logo */}
      <div style={{padding:'24px 20px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{fontSize:18, fontWeight:700, color:'#D4AF5A', fontFamily:'serif'}}>שני</div>
        <div style={{fontSize:10, color:'#7A6A62', letterSpacing:'0.15em', textTransform:'uppercase', marginTop:2}}>קוסמטיקס · ניהול</div>
      </div>
      {/* Nav */}
      <nav style={{flex:1, padding:'12px 0', overflowY:'auto'}}>
        {NAV.map(({href, label, icon}) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 20px', textDecoration:'none', fontSize:13,
              color: active ? '#D4AF5A' : '#9A8A82',
              background: active ? 'rgba(212,175,90,0.08)' : 'transparent',
              borderRight: active ? '3px solid #D4AF5A' : '3px solid transparent',
              fontWeight: active ? 600 : 400,
              transition:'all 0.15s',
            }}>
              <span style={{fontSize:15}}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
      {/* User */}
      <div style={{padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{fontSize:12, color:'#9A8A82', marginBottom:4}}>{adminName}</div>
        <a href="/api/auth/logout" style={{fontSize:12, color:'#C9A8A8', textDecoration:'none'}}>התנתקות</a>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'#F5F3F0', direction:'rtl'}} dir="rtl">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex" style={{flexShrink:0}}>
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{position:'fixed', inset:0, zIndex:50, display:'flex'}}>
          <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.5)'}} onClick={()=>setSidebarOpen(false)} />
          <div style={{position:'relative', zIndex:1}}>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        {/* Top bar */}
        <div style={{background:'white', borderBottom:'1px solid #E8D5C4', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:40}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <button className="lg:hidden" onClick={()=>setSidebarOpen(true)} style={{background:'none', border:'none', cursor:'pointer', padding:4}}>
              <svg width="20" height="20" fill="none" stroke="#2C2C2C" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <span style={{fontSize:15, fontWeight:600, color:'#2C2C2C'}}>מערכת ניהול</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:16}}>
            <span style={{fontSize:13, color:'#8A7A72'}}>שלום, {adminName}</span>
            <Link href="/" target="_blank" style={{fontSize:12, color:'#B8973A', textDecoration:'none'}}>← לאתר</Link>
          </div>
        </div>
        {/* Content */}
        <div style={{flex:1, padding:24, overflowY:'auto'}}>
          {children}
        </div>
      </div>
    </div>
  )
}

'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import BrandLogo from '@/components/brand/BrandLogo'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const s = useSettings()

  const name     = s.businessName || 'שני קוסמטיקס'
  const phone    = s.phone        || '050-123-4567'
  const whatsapp = s.whatsapp     || '972521234567'
  const address  = s.address      || 'רחוב הרצל 12, תל אביב'
  const footer   = s.footerText   || 'יופי, טיפוח ואלגנטיות\nבטיפול אישי'

  const waLink  = `https://wa.me/${whatsapp.replace(/\D/g, '')}`
  const telLink = `tel:${phone.replace(/\s/g, '')}`

  return (
    <div className="min-h-screen flex flex-col" style={{background:'#FAF7F4'}}>
      {/* HEADER */}
      <header style={{background:'white', borderBottom:'1px solid #EDE0D4', position:'sticky', top:0, zIndex:50, boxShadow:'0 1px 12px rgba(0,0,0,0.04)'}}>
        <div style={{maxWidth:1280, margin:'0 auto', padding:'0 16px', height:72, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
          {/* Logo */}
          <Link href="/" style={{textDecoration:'none'}}>
            <BrandLogo size="sm" variant="dark" />
          </Link>

          {/* Desktop Nav */}
          <nav style={{display:'flex', gap:28, alignItems:'center'}} className="hidden md:flex">
            {[['שירותים','/#services'],['אודות','/#about'],['ביקורות','/#reviews'],['צרי קשר','/#contact']].map(([label,href])=>(
              <Link key={label} href={href} style={{color:'#4A4A4A', textDecoration:'none', fontSize:14, fontWeight:500}}
                className="hover:text-[#B8973A] transition-colors">{label}</Link>
            ))}
          </nav>

          {/* Actions */}
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              style={{display:'flex', alignItems:'center', gap:6, background:'#25D366', color:'white', borderRadius:50, padding:'8px 16px', fontSize:13, fontWeight:600, textDecoration:'none'}}
              className="hidden sm:flex">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a href={telLink} style={{color:'#2C2C2C', textDecoration:'none', fontSize:14, fontWeight:500}} className="hidden sm:block">{phone}</a>
            <Link href="/book" style={{background:'linear-gradient(135deg,#C9A84C,#B8913D)', color:'white', borderRadius:50, padding:'10px 22px', fontSize:14, fontWeight:600, textDecoration:'none', boxShadow:'0 3px 12px rgba(184,151,58,0.35)', letterSpacing:'0.01em'}}>
              קבעי תור
            </Link>
            {/* Mobile hamburger */}
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:'none',border:'none',cursor:'pointer',padding:4}} className="md:hidden">
              <svg width="22" height="22" fill="none" stroke="#2C2C2C" strokeWidth="2" viewBox="0 0 24 24">
                {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div style={{background:'white', borderTop:'1px solid #E8D5C4', padding:'16px 24px'}}>
            {[['שירותים','/#services'],['אודות','/#about'],['ביקורות','/#reviews'],['צרי קשר','/#contact']].map(([label,href])=>(
              <Link key={label} href={href} onClick={()=>setMenuOpen(false)}
                style={{display:'block', padding:'10px 0', color:'#2C2C2C', textDecoration:'none', fontSize:15, borderBottom:'1px solid #F5EEE8'}}>
                {label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* MAIN */}
      <main style={{flex:1}}>{children}</main>

      {/* FOOTER */}
      <footer style={{background:'#2C2C2C', color:'white', paddingTop:48, paddingBottom:32, marginTop:'auto'}}>
        <div style={{maxWidth:1200, margin:'0 auto', padding:'0 24px'}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:32, marginBottom:32}}>
            <div style={{marginBottom:4}}>
              <BrandLogo size="sm" variant="light" />
              <p style={{color:'#8A7A72', fontSize:13, lineHeight:1.7, whiteSpace:'pre-line', marginTop:10}}>{footer}</p>
            </div>
            <div>
              <div style={{fontSize:13, fontWeight:600, color:'#D4AF5A', marginBottom:12, letterSpacing:'0.1em', textTransform:'uppercase'}}>שעות פעילות</div>
              <div style={{fontSize:13, color:'#B0A098', lineHeight:2}}>
                <div>ראשון–חמישי: 09:00–19:00</div>
                <div>שישי: 09:00–14:00</div>
                <div>שבת: סגור</div>
              </div>
            </div>
            <div>
              <div style={{fontSize:13, fontWeight:600, color:'#D4AF5A', marginBottom:12, letterSpacing:'0.1em', textTransform:'uppercase'}}>צרי קשר</div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                <a href={telLink} style={{color:'#B0A098', textDecoration:'none', fontSize:13}}>📞 {phone}</a>
                <a href={waLink} target="_blank" rel="noopener noreferrer" style={{color:'#B0A098', textDecoration:'none', fontSize:13}}>💬 WhatsApp</a>
                <span style={{color:'#B0A098', fontSize:13, overflowWrap:'break-word', wordBreak:'break-word'}}>📍 {address}</span>
              </div>
            </div>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:20, textAlign:'center', color:'#6B5A52', fontSize:12}}>
            © 2024 {name} · כל הזכויות שמורות
          </div>
        </div>
      </footer>
    </div>
  )
}

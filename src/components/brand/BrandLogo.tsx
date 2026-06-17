export type LogoSize    = 'sm' | 'md' | 'lg'
export type LogoVariant = 'dark' | 'light' | 'gold'

interface BrandLogoProps {
  size?:         LogoSize
  variant?:      LogoVariant
  showOrnament?: boolean
}

const CFG: Record<LogoSize, { name: number; sub: number; lineW: number; gap: number; sparkle: number }> = {
  sm: { name: 17, sub: 8,  lineW: 18, gap: 3,  sparkle: 7  },
  md: { name: 22, sub: 10, lineW: 26, gap: 4,  sparkle: 9  },
  lg: { name: 40, sub: 13, lineW: 44, gap: 7,  sparkle: 12 },
}

export default function BrandLogo({
  size         = 'md',
  variant      = 'dark',
  showOrnament = false,
}: BrandLogoProps) {
  const c = CFG[size]
  const nameColor = variant === 'light' ? '#F5EDE4' : '#2C2220'
  const subColor  = variant === 'light' ? '#D4AF5A' : '#B8973A'
  const lineColor = '#B8973A'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>

      {showOrnament && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: c.gap }}>
          <div style={{ width: c.lineW, height: 1, background: lineColor, opacity: 0.55 }} />
          {/* 4-pointed sparkle */}
          <svg width={c.sparkle} height={c.sparkle} viewBox="0 0 12 12" fill={lineColor} style={{ opacity: 0.85 }}>
            <path d="M6 0 L7.2 4.8 L12 6 L7.2 7.2 L6 12 L4.8 7.2 L0 6 L4.8 4.8 Z" />
          </svg>
          <div style={{ width: c.lineW, height: 1, background: lineColor, opacity: 0.55 }} />
        </div>
      )}

      {/* SHANI */}
      <span style={{
        fontFamily: 'var(--font-playfair, "Playfair Display", Georgia, serif)',
        fontSize:   c.name,
        fontWeight: 500,
        color:      nameColor,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
      }}>
        SHANI
      </span>

      {/* thin rule */}
      <div style={{
        width: c.lineW * 1.4,
        height: 1,
        background: `linear-gradient(to right, transparent, ${lineColor}60, transparent)`,
        margin: `${c.gap - 1}px 0`,
      }} />

      {/* COSMETICS */}
      <span style={{
        fontFamily: 'var(--font-heebo, Arial, sans-serif)',
        fontSize:   c.sub,
        fontWeight: 400,
        color:      subColor,
        letterSpacing: '0.38em',
        textTransform: 'uppercase',
      }}>
        COSMETICS
      </span>

    </div>
  )
}

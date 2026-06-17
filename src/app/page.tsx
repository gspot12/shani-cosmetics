import Link from "next/link";
import Image from "next/image";
import CustomerLayout from "@/components/layout/CustomerLayout";
import BrandLogo from "@/components/brand/BrandLogo";
import { getBusinessSettings } from "@/server/actions/admin";

/* ─── Service data ─────────────────────────────────────────── */
const SERVICES = [
  {
    slug: "nails",
    name: "ציפורניים",
    desc: "מניקור, פדיקור וציפורניים מעוצבות בסגנון שלך",
    duration: "45 – 90 דק׳",
    priceRange: "₪80 – ₪250",
    badge: "הכי פופולרי",
    badgeBg: "rgba(255,255,255,0.75)",
    badgeColor: "#8A6A18",
    img: "/brand/1.png",
  },
  {
    slug: "brows",
    name: "גבות",
    desc: "עיצוב, הסרת שיער ובניית גבות מושלמות",
    duration: "30 – 60 דק׳",
    priceRange: "₪60 – ₪180",
    badge: "טרנד חם",
    badgeBg: "rgba(255,255,255,0.75)",
    badgeColor: "#5A4F7A",
    img: "/brand/2.png",
  },
  {
    slug: "facial",
    name: "טיפולי פנים",
    desc: "טיפולים מתקדמים לעור בריא ומזין",
    duration: "60 – 90 דק׳",
    priceRange: "₪150 – ₪400",
    badge: "מומלץ",
    badgeBg: "rgba(255,255,255,0.75)",
    badgeColor: "#2A5A6A",
    img: "/brand/3.png",
  },
  {
    slug: "hair-removal",
    name: "הסרת שיער",
    desc: "הסרת שיער בשיטות המתקדמות ביותר",
    duration: "20 – 60 דק׳",
    priceRange: "₪70 – ₪220",
    badge: "מבצע",
    badgeBg: "rgba(255,255,255,0.75)",
    badgeColor: "#2A5A2A",
    img: "/brand/4.png",
  },
];

/* ─── Reviews ───────────────────────────────────────────────── */
const REVIEWS = [
  {
    name: "מיכל כהן",
    stars: 5,
    text: "שני היא פשוט קסומה! הגבות שלי נראות מדהים וכבר חצי שנה אני לקוחה קבועה. השירות תמיד מקצועי, חם ואישי.",
    date: "לפני שבוע",
  },
  {
    name: "רונית לוי",
    stars: 5,
    text: "הציפורניים הכי יפות שעשיתי אי פעם! המקום נקי, האווירה נעימה והתוצאה מושלמת. ממליצה בחום לכולן!",
    date: "לפני שבועיים",
  },
  {
    name: "דנה אברהם",
    stars: 5,
    text: "טיפול הפנים שינה לי את עור הפנים לחלוטין. מקצועית, קשובה ומסבירה הכל. המקום האהוב עליי בעיר!",
    date: "לפני חודש",
  },
];

/* ─── Inline SVG icons per service ─────────────────────────── */
function ServiceIcon({ type }: { type: string }) {
  const base = {
    width: 36, height: 36,
    stroke: "rgba(255,255,255,0.92)",
    fill: "none",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (type === "nails") return (
    <svg viewBox="0 0 24 24" {...base}>
      {/* sparkle / gem */}
      <path d="M12 2 L15 9 L22 12 L15 15 L12 22 L9 15 L2 12 L9 9 Z" />
      <circle cx="12" cy="12" r="2.5" strokeWidth={1} />
    </svg>
  );
  if (type === "brows") return (
    <svg viewBox="0 0 24 24" {...base}>
      {/* two arches – eyebrows */}
      <path d="M3 9 C 7 5, 12 5.5, 17 8" />
      <path d="M7 9 C 8 7, 12 6.5, 17 8" />
      <path d="M3 16 C 7 12, 12 12.5, 17 15" />
      <path d="M7 16 C 8 14, 12 13.5, 17 15" />
    </svg>
  );
  if (type === "facial") return (
    <svg viewBox="0 0 24 24" {...base}>
      {/* simplified lotus */}
      <path d="M12 21 C 8 17, 4 13, 5 8 C 8 5, 12 7, 12 7 C 12 7, 16 5, 19 8 C 20 13, 16 17, 12 21 Z" />
      <path d="M12 7 C 12 7, 10 3, 12 2 C 14 3, 12 7, 12 7" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" {...base}>
      {/* feather */}
      <path d="M20.24 12.24 a6 6 0 0 0-8.49-8.49 L5 10.5 V19 h8.5 z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

/* ─── Trust bar SVG icons ───────────────────────────────────── */
function TrustIcon({ type }: { type: string }) {
  const p = { width: 20, height: 20, fill: "none", stroke: "#B8973A", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "award") return (
    <svg viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="8" r="6" />
      <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
    </svg>
  );
  if (type === "hygiene") return (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M12 2a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
  if (type === "consult") return (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* ─── Star SVG ───────────────────────────────────────────────── */
function StarFilled({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="#B8973A">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default async function HomePage() {
  const s = await getBusinessSettings();

  const phone    = s.phone        || "050-123-4567";
  const whatsapp = s.whatsapp     || "972521234567";
  const address  = s.address      || "רחוב הרצל 12, תל אביב";
  const wazeUrl  = s.wazeUrl      || `https://waze.com/ul?q=${encodeURIComponent(address)}`;
  const mapsUrl  = s.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  const waLink   = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
  const telLink  = `tel:${phone.replace(/\s/g, "")}`;

  return (
    <CustomerLayout>

      {/* ════════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <style>{`
          .h-hero          { min-height: 660px; }
          .h-hero-img      { object-position: 72% center; }
          .h-hero-overlay  { background: linear-gradient(to right,
              rgba(255,250,245,0.97) 0%,
              rgba(255,248,243,0.90) 28%,
              rgba(255,246,241,0.68) 46%,
              rgba(255,245,240,0.28) 62%,
              transparent 76%); }
          .h-hero-text     { max-width: 560px; padding: 88px 32px 88px 48px; }
          @media (max-width: 1024px) {
            .h-hero         { min-height: 580px; }
            .h-hero-text    { padding: 72px 24px 72px 36px; }
          }
          @media (max-width: 768px) {
            .h-hero          { min-height: 560px; }
            .h-hero-img      { object-position: 70% center; }
            .h-hero-overlay  { background: linear-gradient(to bottom,
                rgba(255,250,245,0.94) 0%,
                rgba(255,248,243,0.88) 55%,
                rgba(255,246,241,0.55) 100%); }
            .h-hero-text     { max-width: 100%; padding: 52px 20px 52px 20px; }
          }
        `}</style>

        {/* Background image */}
        <Image
          src="/brand/hero-beauty-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="h-hero-img"
          style={{ objectFit: "cover" }}
        />

        {/* Gradient overlay */}
        <div className="h-hero-overlay" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

        {/* Content — LTR outer keeps text on the physical left */}
        <div className="h-hero" style={{ position: "relative", zIndex: 1, direction: "ltr", maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center" }}>
          <div dir="rtl" className="h-hero-text">

            {/* Brand logo above headline */}
            <div style={{ marginBottom: 20 }}>
              <BrandLogo size="md" variant="dark" showOrnament />
            </div>

            {/* Pill badge */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.80)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(184,151,58,0.30)",
              color: "#8A6E22", fontSize: 12, fontWeight: 600,
              padding: "5px 16px", borderRadius: 999, marginBottom: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#B8973A", display: "inline-block", animation: "pulse 2s infinite" }} />
              קביעת תור אונליין 24/7
            </span>

            {/* H1 */}
            <h1 style={{
              fontFamily: 'var(--font-playfair, "Playfair Display", Georgia, serif)',
              fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)",
              fontWeight: 600, color: "#2b2421",
              lineHeight: 1.2, marginBottom: 14, letterSpacing: "-0.01em",
            }}>
              יופי, טיפוח&nbsp;&amp;&nbsp;אלגנטיות
            </h1>

            <p style={{
              fontFamily: 'var(--font-heebo, Arial, sans-serif)',
              fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
              color: "#6e625c", lineHeight: 1.7, marginBottom: 28, maxWidth: 420,
            }}>
              טיפולי ציפורניים, גבות, פנים והסרת שיער — בסטנדרט הגבוה ביותר
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 36 }}>
              <a href="/book" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "linear-gradient(135deg,#C9A84C,#B8913D)",
                color: "#fff", fontWeight: 700, fontSize: 15,
                padding: "13px 28px", borderRadius: 999, textDecoration: "none",
                boxShadow: "0 6px 20px rgba(184,151,58,0.38)", letterSpacing: "0.01em",
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                קבעי תור עכשיו
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(184,151,58,0.30)",
                color: "#5A4818", fontWeight: 600, fontSize: 15,
                padding: "13px 24px", borderRadius: 999, textDecoration: "none",
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
              }}>
                <svg width="16" height="16" fill="#25D366" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {[
                { v: "+500", l: "לקוחות מרוצות" },
                { v: "5★",  l: "דירוג ממוצע" },
                { v: "+5",  l: "שנות ניסיון" },
              ].map(({ v, l }) => (
                <div key={l}>
                  <div style={{
                    fontFamily: 'var(--font-playfair, Georgia, serif)',
                    fontSize: 26, fontWeight: 700, color: "#B8913D", lineHeight: 1,
                  }}>{v}</div>
                  <div style={{ fontSize: 11, color: "#8A7A72", marginTop: 3, fontWeight: 500 }}>{l}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          2. TRUST BAR
      ════════════════════════════════════════════ */}
      <section dir="rtl" style={{ background: "#fff", borderTop: "1px solid #EDE0D4", borderBottom: "1px solid #EDE0D4" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }} className="trust-grid">
            <style>{`
              @media (max-width: 640px) {
                .trust-grid { grid-template-columns: repeat(2,1fr) !important; }
                .trust-item-border { border-left: none !important; border-bottom: 1px solid #EDE0D4; }
                .trust-item-border:nth-child(odd) { border-left: 1px solid #EDE0D4 !important; }
              }
            `}</style>
            {[
              { icon: "award",   text: "מוצרים מקצועיים" },
              { icon: "hygiene", text: "היגיינה ברמה גבוהה" },
              { icon: "consult", text: "ייעוץ אישי" },
              { icon: "clients", text: "500+ לקוחות מרוצות" },
            ].map((item, idx, arr) => (
              <div key={item.text} className="trust-item-border" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "22px 16px",
                borderLeft: idx < arr.length - 1 ? "1px solid #EDE0D4" : "none",
              }}>
                <TrustIcon type={item.icon} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5A4A42", whiteSpace: "nowrap" }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          3. SERVICES
      ════════════════════════════════════════════ */}
      <section dir="rtl" style={{ background: "#FAF7F4", padding: "64px 0 72px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px" }}>

          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span style={{
              display: "inline-block", background: "rgba(184,151,58,0.10)",
              color: "#8A6E22", fontSize: 11, fontWeight: 700,
              padding: "4px 16px", borderRadius: 999, marginBottom: 10, letterSpacing: "0.12em",
            }}>
              מה אנחנו מציעות
            </span>
            <h2 style={{
              fontFamily: 'var(--font-playfair,"Playfair Display",Georgia,serif)',
              fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 600,
              color: "#2C2220", lineHeight: 1.2, marginBottom: 8,
            }}>
              השירותים שלנו
            </h2>
            <p style={{ color: "#9A8078", fontSize: 14, maxWidth: 440, margin: "0 auto" }}>
              מגוון טיפולים מקצועיים שיגרמו לך להרגיש הכי טוב שאפשר
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }} className="svc-grid">
            <style>{`
              @media (max-width: 900px) { .svc-grid { grid-template-columns: repeat(2,1fr) !important; } }
              @media (max-width: 480px) { .svc-grid { grid-template-columns: 1fr !important; } }
              .svc-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.10) !important; }
            `}</style>
            {SERVICES.map((svc) => (
              <div key={svc.slug} className="svc-card" style={{
                background: "#fff",
                border: "1px solid #EDE0D4",
                borderRadius: 18,
                overflow: "hidden",
                display: "flex", flexDirection: "column",
                transition: "transform 0.22s ease, box-shadow 0.22s ease",
                boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
              }}>

                {/* Visual area */}
                <div style={{
                  height: 200, position: "relative", overflow: "hidden",
                }}>
                  <Image
                    src={svc.img}
                    alt={svc.name}
                    fill
                    sizes="(max-width:900px) 50vw, 25vw"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                  {/* subtle dark gradient at bottom for readability */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.28) 100%)",
                  }} />

                  {/* Top-right badge */}
                  <span style={{
                    position: "absolute", top: 10, right: 10,
                    background: svc.badgeBg, backdropFilter: "blur(8px)",
                    color: svc.badgeColor, fontSize: 10, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 999, letterSpacing: "0.06em",
                    border: `1px solid ${svc.badgeColor}40`,
                  }}>
                    {svc.badge}
                  </span>

                  {/* Duration chip bottom-left */}
                  <span style={{
                    position: "absolute", bottom: 10, left: 10,
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
                    color: "rgba(255,255,255,0.95)", fontSize: 10, fontWeight: 500,
                    padding: "3px 10px", borderRadius: 999,
                  }}>
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {svc.duration}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: "16px 16px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3 style={{
                    fontFamily: 'var(--font-playfair,"Playfair Display",Georgia,serif)',
                    fontSize: 16, fontWeight: 600, color: "#2C2220", marginBottom: 5,
                  }}>
                    {svc.name}
                  </h3>
                  <p style={{ fontSize: 12, color: "#9A8078", marginBottom: 10, flex: 1, lineHeight: 1.55 }}>
                    {svc.desc}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#B8913D", marginBottom: 12 }}>
                    {svc.priceRange}
                  </p>
                  <Link href="/book" style={{
                    display: "block", textAlign: "center",
                    background: "linear-gradient(135deg,#C9A84C,#B8913D)",
                    color: "#fff", fontWeight: 600, fontSize: 13,
                    padding: "9px 0", borderRadius: 10, textDecoration: "none",
                    boxShadow: "0 3px 10px rgba(184,151,58,0.28)",
                    letterSpacing: "0.01em",
                  }}>
                    קבעי תור
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          4. WHY US
      ════════════════════════════════════════════ */}
      <section dir="rtl" style={{ background: "#fff", padding: "64px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px" }}>

          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{
              display: "inline-block", background: "rgba(184,151,58,0.10)",
              color: "#8A6E22", fontSize: 11, fontWeight: 700,
              padding: "4px 16px", borderRadius: 999, marginBottom: 10, letterSpacing: "0.12em",
            }}>
              היתרון שלנו
            </span>
            <h2 style={{
              fontFamily: 'var(--font-playfair,"Playfair Display",Georgia,serif)',
              fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 600,
              color: "#2C2220", lineHeight: 1.2,
            }}>
              למה לבחור בנו?
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="why-grid">
            <style>{`
              @media (max-width:768px){.why-grid{grid-template-columns:1fr!important}}
              .why-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.10)!important}
            `}</style>
            {[
              { img: "/brand/33.png", title: "מטפלות מוסמכות",  desc: "ניסיון של שנים בתחום הקוסמטיקה עם הכשרה מקצועית מהגבוהות בישראל" },
              { img: "/brand/22.png", title: "סביבה נקייה",      desc: "עומדים בסטנדרטים הגבוהים ביותר של ניקיון והיגיינה בכל טיפול" },
              { img: "/brand/11.png", title: "קביעת תור קלה",    desc: "מערכת הזמנות אונליין 24/7 – קבעי תור ממש עכשיו בלחיצה אחת" },
            ].map((f) => (
              <div key={f.title} className="why-card" style={{
                background: "#fff",
                border: "1px solid #EDE0D4",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                transition: "transform 0.22s, box-shadow 0.22s",
                display: "flex", flexDirection: "column",
              }}>
                {/* Image */}
                <div style={{ position: "relative", height: 200, flexShrink: 0 }}>
                  <Image
                    src={f.img}
                    alt={f.title}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                  {/* subtle bottom fade */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.18) 100%)",
                  }} />
                </div>
                {/* Text */}
                <div style={{ padding: "22px 20px 24px", textAlign: "center" }}>
                  <h3 style={{
                    fontFamily: 'var(--font-playfair,"Playfair Display",Georgia,serif)',
                    fontSize: 18, fontWeight: 600, color: "#2C2220", marginBottom: 8,
                  }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "#8A7A72", lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          5. REVIEWS
      ════════════════════════════════════════════ */}
      <section dir="rtl" style={{ position: "relative", overflow: "hidden" }}>
        <style>{`
          .rev-section-pad { padding: 96px 0; }
          @media (max-width:768px) { .rev-section-pad { padding: 64px 0; } }
          @media (max-width:768px) { .rev-grid { grid-template-columns: 1fr !important; } }
          .rev-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.13) !important; transform: translateY(-3px); }
        `}</style>

        {/* Background image */}
        <Image
          src="/brand/44.png"
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />

        {/* Cream overlay — keeps text readable, preserves luxury feel */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(255,250,245,0.91) 0%, rgba(255,246,238,0.87) 50%, rgba(250,242,234,0.91) 100%)",
        }} />

        {/* Content — above overlay */}
        <div className="rev-section-pad" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px" }}>

            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.70)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(184,151,58,0.25)",
                color: "#8A6E22", fontSize: 11, fontWeight: 700,
                padding: "4px 18px", borderRadius: 999, marginBottom: 12, letterSpacing: "0.12em",
              }}>
                ביקורות
              </span>
              <h2 style={{
                fontFamily: 'var(--font-playfair,"Playfair Display",Georgia,serif)',
                fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 600,
                color: "#2C2220", marginBottom: 12, lineHeight: 1.2,
              }}>
                מה אומרות הלקוחות שלנו
              </h2>
              <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 8 }}>
                {[1,2,3,4,5].map(i => <StarFilled key={i} size={22} />)}
              </div>
              <p style={{ color: "#7A6A62", fontSize: 13, fontWeight: 500 }}>5.0 מתוך 5 – מבוסס על 120+ ביקורות</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="rev-grid">
              {REVIEWS.map((r) => (
                <div key={r.name} className="rev-card" style={{
                  background: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(237,224,212,0.80)",
                  borderRadius: 20, padding: "26px",
                  display: "flex", flexDirection: "column",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                  transition: "box-shadow 0.22s, transform 0.22s",
                }}>
                  <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                    {Array.from({ length: r.stars }).map((_, i) => <StarFilled key={i} />)}
                  </div>
                  <p style={{ fontSize: 42, color: "#D4AF5A", lineHeight: 0.6, marginBottom: 10, fontFamily: "Georgia,serif" }}>&#8220;</p>
                  <p style={{ fontSize: 14, color: "#4A3A32", lineHeight: 1.8, flex: 1, marginBottom: 20 }}>{r.text}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(237,224,212,0.70)", paddingTop: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: "linear-gradient(135deg,#C9A84C,#B8913D)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: 15,
                        boxShadow: "0 2px 8px rgba(184,151,58,0.30)",
                      }}>
                        {r.name[0]}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#2C2220" }}>{r.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#A09088" }}>{r.date}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          6. CONTACT / HOURS
      ════════════════════════════════════════════ */}
      <section dir="rtl" style={{ background: "#2A2220", padding: "64px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px" }}>

          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{
              display: "inline-block", background: "rgba(184,151,58,0.18)",
              color: "#C9A84C", fontSize: 11, fontWeight: 700,
              padding: "4px 16px", borderRadius: 999, marginBottom: 10, letterSpacing: "0.12em",
            }}>
              צרי קשר
            </span>
            <h2 style={{
              fontFamily: 'var(--font-playfair,"Playfair Display",Georgia,serif)',
              fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 600,
              color: "#F5EDE4", lineHeight: 1.2,
            }}>
              מצאי אותנו
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="contact-grid">
            <style>{`@media (max-width:768px){.contact-grid{grid-template-columns:1fr!important}}`}</style>

            {/* Left col */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Address */}
              <div style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: "22px 24px" }}>
                <h3 style={{ color: "#F5EDE4", fontSize: 15, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                  <svg width="18" height="18" fill="none" stroke="#C9A84C" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  כתובת
                </h3>
                <p style={{ color: "#C0AEA6", fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>{address}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a href={wazeUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,202,255,0.12)", color: "#5DD8F5", border: "1px solid rgba(0,202,255,0.25)", padding: "7px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>נווט ב-Waze</a>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(52,211,153,0.12)", color: "#6EE7B7", border: "1px solid rgba(52,211,153,0.25)", padding: "7px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Google Maps</a>
                </div>
              </div>

              {/* Contact */}
              <div style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: "22px 24px" }}>
                <h3 style={{ color: "#F5EDE4", fontSize: 15, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                  <svg width="18" height="18" fill="none" stroke="#C9A84C" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  צרי קשר
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a href={telLink} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(184,151,58,0.12)", border: "1px solid rgba(184,151,58,0.22)", color: "#C9A84C", padding: "11px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    {phone}
                  </a>
                  <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(37,211,102,0.10)", border: "1px solid rgba(37,211,102,0.22)", color: "#4ADE80", padding: "11px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    שלחי הודעה בוואטסאפ
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: "22px 24px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ color: "#F5EDE4", fontSize: 15, fontWeight: 600, marginBottom: 18, display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="18" height="18" fill="none" stroke="#C9A84C" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                שעות פעילות
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", flex: 1 }}>
                <tbody>
                  {[
                    { day: "ראשון",  hours: "09:00 – 19:00", open: true  },
                    { day: "שני",    hours: "09:00 – 19:00", open: true  },
                    { day: "שלישי", hours: "09:00 – 19:00", open: true  },
                    { day: "רביעי", hours: "09:00 – 19:00", open: true  },
                    { day: "חמישי", hours: "09:00 – 19:00", open: true  },
                    { day: "שישי",  hours: "09:00 – 14:00", open: true  },
                    { day: "שבת",   hours: "סגור",          open: false },
                  ].map((row, idx, arr) => (
                    <tr key={row.day} style={{ borderBottom: idx < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                      <td style={{ padding: "11px 0", fontSize: 13, color: "#D4C4B8", fontWeight: 500 }}>{row.day}</td>
                      <td style={{ padding: "11px 0", fontSize: 13, color: row.open ? "#E8D5C4" : "#6B5A52" }}>{row.hours}</td>
                      <td style={{ padding: "11px 0", textAlign: "left" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center",
                          padding: "2px 8px", borderRadius: 999,
                          fontSize: 10, fontWeight: 700,
                          background: row.open ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
                          color: row.open ? "#4ADE80" : "#6B5A52",
                          border: `1px solid ${row.open ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.07)"}`,
                        }}>
                          {row.open ? "פתוח" : "סגור"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <Link href="/book" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "linear-gradient(135deg,#C9A84C,#B8913D)",
                  color: "#fff", fontWeight: 700, fontSize: 15,
                  padding: "14px 0", borderRadius: 12, textDecoration: "none",
                  boxShadow: "0 6px 20px rgba(184,151,58,0.38)",
                }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  קבעי תור עכשיו
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </CustomerLayout>
  );
}

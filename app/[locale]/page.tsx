'use client'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'

type Family = {
  id: number; name: string; name_en?: string
  description?: string; origin_country?: string; image_url?: string
}

const FALLBACK: Record<string, string> = {
  'home.title':       'ארכיון המשפחות',
  'home.subtitle':    'שומרים על הזיכרון לדורות הבאים',
  'home.selectFamily':'בחר משפחה',
  'nav.login':        'כניסה',
  'common.loading':   'טוען...',
}

/* ── Animated counter ── */
function Counter({ target, delay = 0 }: { target: number; delay?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let raf: number
    const start = performance.now() + delay
    const duration = 1300
    const tick = (now: number) => {
      if (now < start) { raf = requestAnimationFrame(tick); return }
      const p = Math.min((now - start) / duration, 1)
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, delay])

  return <span ref={ref}>{count}</span>
}

/* ── Floating gold particles ── */
function Particles() {
  const items = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 7.3 + 2) % 100}%`,
    bottom: `${(i * 11 + 5) % 30}%`,
    size: 1.5 + (i % 3) * 0.8,
    duration: 5 + (i % 4) * 2,
    dly: (i * 0.6) % 7,
    px: (((i * 37) % 80) - 40),
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {items.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: '#c9a227',
          left: p.left, bottom: p.bottom,
          ['--px' as any]: `${p.px}px`,
          animation: `particleDrift ${p.duration}s ${p.dly}s linear infinite`,
          opacity: 0.7,
        }} />
      ))}
    </div>
  )
}

/* ── SVG Tree ornament ── */
function TreeOrnament() {
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none"
      style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', opacity: 0.06, pointerEvents: 'none' }}>
      <path d="M90 160 L90 80" stroke="#c9a227" strokeWidth="3" strokeLinecap="round"/>
      <path d="M90 120 L60 90 M90 120 L120 90" stroke="#c9a227" strokeWidth="2" strokeLinecap="round"/>
      <path d="M90 100 L50 60 M90 100 L130 60" stroke="#c9a227" strokeWidth="2" strokeLinecap="round"/>
      <path d="M90 80 L40 40 M90 80 L140 40" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="90" cy="30" r="12" fill="#c9a227"/>
      <circle cx="40" cy="38" r="8" fill="#c9a227"/>
      <circle cx="140" cy="38" r="8" fill="#c9a227"/>
      <circle cx="50" cy="58" r="6" fill="#c9a227"/>
      <circle cx="130" cy="58" r="6" fill="#c9a227"/>
      <circle cx="60" cy="88" r="5" fill="#c9a227"/>
      <circle cx="120" cy="88" r="5" fill="#c9a227"/>
    </svg>
  )
}

/* ── Family card ── */
function FamilyCard({ family, locale, router, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, delay: index * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
      viewport={{ once: true, margin: '-40px' }}
    >
      <div
        className="cfamily-card"
        onClick={() => router.push(`/${locale}/families/${family.id}`)}
      >
        {family.image_url ? (
          <img src={family.image_url} alt={family.name} className="cfamily-card-bg" />
        ) : (
          <div className="cfamily-card-bg" style={{
            background: `linear-gradient(135deg, hsl(${(family.id * 47) % 360},18%,8%), hsl(${(family.id * 47 + 40) % 360},12%,12%))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '4rem', flexShrink: 0,
          }}>🏛️</div>
        )}
        <div className="cfamily-card-overlay" />
        <div className="cfamily-card-body">
          <div className="cfamily-card-name">משפחת {family.name}</div>
          {family.name_en && <div className="cfamily-card-sub">{family.name_en} Family</div>}
          {family.origin_country && <div className="cfamily-card-sub">🌍 {family.origin_country}</div>}
          {family.description && (
            <div style={{ fontSize: '0.72rem', color: 'rgba(245,230,200,0.4)', marginTop: '0.2rem', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {family.description}
            </div>
          )}
          <div className="cfamily-card-cta">כניסה לארכיון ←</div>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Main page ── */
export default function Home() {
  const { locale } = useParams() as { locale: string }
  const rawT = useTranslations()
  const t = (key: string) => { try { return rawT(key) } catch { return FALLBACK[key] || key } }
  const router = useRouter()
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const familiesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: rd } = await supabase.from('user_roles').select('family_id,role').eq('user_id', user.id).maybeSingle()
            if (rd?.family_id && rd.role !== 'admin') {
              router.push(`/${locale}/families/${rd.family_id}`); return
            }
          }
        } catch {}
        const { data, error: err } = await supabase.from('families').select('*').order('name')
        if (err) throw err
        setFamilies(data || [])
      } catch (e: any) {
        setError(e?.message || 'שגיאה')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'var(--c-ink)', color: 'var(--c-text)', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>

      {/* ── TRANSPARENT HEADER (home-only, no Navbar component) ── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem 2rem', flexWrap: 'wrap', gap: '1rem',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 24 L14 14" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M14 14 L9 9 M14 14 L19 9" stroke="#c9a227" strokeWidth="1" strokeLinecap="round" opacity=".75"/>
            <circle cx="14" cy="7"   r="3"   fill="#c9a227" opacity=".9"/>
            <circle cx="9"  cy="8.5" r="2"   fill="#c9a227" opacity=".6"/>
            <circle cx="19" cy="8.5" r="2"   fill="#c9a227" opacity=".6"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--c-gold)', letterSpacing: '0.1em' }}>
            ארכיון המשפחות
          </span>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <LanguageSwitcher />
          <a href={`/${locale}/join`} className="cbtn cbtn-secondary cbtn-sm">הצטרפות</a>
          <a href={`/${locale}/login`} className="cbtn cbtn-primary cbtn-sm">{t('nav.login')}</a>
        </div>
      </motion.header>

      {/* ── HERO ── */}
      <section className="chero" style={{ position: 'relative' }}>
        <video autoPlay muted loop playsInline className="chero-bg">
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="chero-overlay" />
        <Particles />
        <TreeOrnament />

        <div className="chero-content">
          {/* Ornamental line */}
          <motion.div
            className="chero-ornament"
            initial={{ opacity: 0, letterSpacing: '3rem' }}
            animate={{ opacity: 1, letterSpacing: '1.5rem' }}
            transition={{ duration: 1.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            ❧ ✦ ❧
          </motion.div>

          {/* Main title */}
          <h1 className="chero-title" style={{ animation: 'heroReveal 1.3s 0.7s cubic-bezier(0.16,1,0.3,1) both' }}>
            {t('home.title')}
          </h1>

          {/* Gold divider */}
          <div className="chero-divider" style={{ animation: 'lineGrow 0.9s 1.5s cubic-bezier(0.16,1,0.3,1) both' }} />

          {/* Subtitle */}
          <motion.p
            className="chero-sub"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {t('home.subtitle')}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 2.2, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2.2rem', flexWrap: 'wrap' }}
          >
            <a href={`/${locale}/join`} className="cbtn cbtn-primary" style={{ fontSize: '0.95rem', padding: '0.75rem 2rem' }}>
              🌳 הצטרפות למשפחה
            </a>
            <a href={`/${locale}/login`} className="cbtn cbtn-secondary" style={{ fontSize: '0.95rem', padding: '0.75rem 1.75rem' }}>
              {t('nav.login')}
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          onClick={() => familiesRef.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            position: 'absolute', bottom: '2rem', left: '50%',
            transform: 'translateX(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(201,162,39,0.6)', fontSize: '1.1rem', zIndex: 2,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
          }}
          aria-label="גלול למטה"
        >
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(201,162,39,0.4)', textTransform: 'uppercase' }}>גלול</span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >↓</motion.span>
        </motion.button>
      </section>

      {/* ── STATS ── */}
      <div className="cstats-strip">
        {[
          { icon: '👥', num: 47,  label: 'בני משפחה', delay: 0 },
          { icon: '🌳', num: 4,   label: 'דורות',     delay: 80 },
          { icon: '🖼️', num: 312, label: 'תמונות',    delay: 160 },
          { icon: '📄', num: 89,  label: 'מסמכים',    delay: 240 },
          { icon: '🌍', num: 12,  label: 'מדינות',    delay: 320 },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="cstat-item"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          >
            <span className="cstat-icon">{s.icon}</span>
            <span className="cstat-num"><Counter target={s.num} delay={s.delay} /></span>
            <span className="cstat-label">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* ── FAMILY SELECTION ── */}
      <div ref={familiesRef}>
        <div className="csection-hdr">
          <span className="csection-hdr-title">{t('home.selectFamily')}</span>
          <div className="csection-hdr-line" />
          {!loading && (
            <span style={{ fontSize: '0.65rem', color: 'rgba(201,162,39,0.25)', fontFamily: 'var(--font-display)' }}>
              {families.length}
            </span>
          )}
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="cgrid-families"
            >
              {[1,2,3].map(i => (
                <div key={i} className="cskeleton" style={{ height: 240, borderRadius: 16 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div style={{ margin: '0 2rem', background: 'rgba(80,10,10,0.5)', border: '1px solid rgba(200,50,50,0.3)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', color: '#ffb3b3' }}>
            <p>❌ {error}</p>
            <button onClick={() => window.location.reload()} className="cbtn cbtn-sm" style={{ marginTop: '0.75rem', background: 'rgba(200,50,50,0.3)', color: '#ffb3b3', border: '1px solid rgba(200,50,50,0.4)' }}>
              נסה שוב
            </button>
          </div>
        )}

        {!loading && !error && families.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            style={{ margin: '0 2rem', background: 'rgba(16,10,4,0.7)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', color: 'rgba(184,154,90,0.45)' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌳</div>
            <p>עדיין אין משפחות. הצטרף ראשון!</p>
          </motion.div>
        )}

        {!loading && !error && families.length > 0 && (
          <div className="cgrid-families">
            {families.map((family, i) => (
              <FamilyCard key={family.id} family={family} locale={locale} router={router} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(42,22,8,0.5)',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '2.5rem',
        flexWrap: 'wrap',
        background: 'rgba(4,2,1,0.7)',
      }}>
        {[
          { icon: '👨‍👩‍👧', label: 'משפחות', href: `/${locale}/families` },
          { icon: '👥',      label: 'אנשים',   href: `/${locale}/people`   },
          { icon: '🌍',      label: 'מסעות',   href: `/${locale}/map`      },
          { icon: '🔍',      label: 'חיפוש',   href: `/${locale}/search`   },
          { icon: '🔑',      label: 'כניסה',   href: `/${locale}/login`    },
        ].map(item => (
          <motion.a
            key={item.label}
            href={item.href}
            whileHover={{ y: -3, color: 'rgba(201,162,39,0.9)' }}
            style={{
              color: 'rgba(184,154,90,0.4)', textDecoration: 'none',
              fontSize: '0.78rem', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
            {item.label}
          </motion.a>
        ))}
      </footer>

      <div style={{ background: 'rgba(4,2,1,0.9)', padding: '0.75rem', textAlign: 'center', fontSize: '0.72rem', color: 'rgba(42,22,8,0.8)', borderTop: '1px solid rgba(16,8,2,0.5)' }}>
        ארכיון המשפחות · שומרים על הזיכרון לדורות הבאים
      </div>
    </main>
  )
}

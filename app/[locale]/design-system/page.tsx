'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Icon, { IconName } from '@/components/Icon'

// ─── All icon names grouped ─────────────────────────────────────────────────
const ICON_GROUPS: { label: string; icons: IconName[] }[] = [
  { label: 'ניווט', icons: ['home','families','people','person','tree','tree2','globe','map','timeline','gallery','stories','calendar','feed','ai','book','documents'] },
  { label: 'פעולות', icons: ['search','plus','edit','trash','download','upload','share','close','play','pause','scan','pdf','microphone','camera','colorize'] },
  { label: 'ניווט UI', icons: ['chevronRight','chevronLeft','chevronDown','arrowRight','menu','filter','sort','grid','list','externalLink'] },
  { label: 'אירועי חיים', icons: ['birth','death','marriage','immigration','holocaust','candle','star','heart','location','wikipedia','info'] },
  { label: 'מצב', icons: ['check','logout','person','offline'] },
]

const BUTTON_VARIANTS = [
  { label: 'Primary', cls: 'cbtn cbtn-primary' },
  { label: 'Ghost', cls: 'cbtn cbtn-ghost' },
  { label: 'Primary SM', cls: 'cbtn cbtn-primary cbtn-sm' },
  { label: 'Ghost SM', cls: 'cbtn cbtn-ghost cbtn-sm' },
]

const CARD_SAMPLES = [
  { title: 'כרטיס אדם', sub: 'יורם כהן • נולד 1945', tag: 'ירושלים', color: '#c9a227' },
  { title: 'אירוע', sub: 'עלייה לארץ ישראל • 1920', tag: 'הגירה', color: '#9a6ab0' },
  { title: 'מסמך', sub: 'תעודת לידה • 1903', tag: 'תעודה', color: '#4a9e6a' },
]

const COLORS = [
  { name: '--c-ink', hex: '#080606', label: 'רקע ראשי' },
  { name: '--c-surface', hex: 'rgba(15,9,4,0.92)', label: 'משטח' },
  { name: '--c-gold', hex: '#c9a227', label: 'זהב ראשי' },
  { name: '--c-gold-lt', hex: '#f5d98b', label: 'זהב בהיר' },
  { name: '--c-text', hex: '#f0e8d0', label: 'טקסט' },
  { name: '--c-muted', hex: '#b89a5a', label: 'משני' },
  { name: '--c-dim', hex: '#5a3a1a', label: 'עמום' },
  { name: 'birth', hex: '#4a9e6a', label: 'לידה' },
  { name: 'death', hex: '#c9a227', label: 'פטירה' },
  { name: 'marriage', hex: '#378ADD', label: 'נישואין' },
  { name: 'immigration', hex: '#9a6ab0', label: 'הגירה' },
]

const TYPOGRAPHY = [
  { label: 'Display — Playfair Display', style: { fontFamily: '"Playfair Display", serif', fontSize: '2.2rem', color: '#f5d98b' }, text: 'ארכיון המשפחות' },
  { label: 'H1 — Playfair', style: { fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', color: '#f0e8d0' }, text: 'משפחת כהן' },
  { label: 'H2 — Heebo 700', style: { fontFamily: '"Heebo", Arial', fontWeight: 700, fontSize: '1.1rem', color: '#f0e8d0' }, text: 'פרטי המשפחה' },
  { label: 'Body — Heebo 400', style: { fontFamily: '"Heebo", Arial', fontSize: '0.95rem', color: '#b89a5a', lineHeight: 1.7 }, text: 'שומרים על הזיכרון לדורות הבאים. כל תמונה, כל סיפור, כל שם — חלק מהמורשת.' },
  { label: 'Label — uppercase', style: { fontFamily: '"Heebo", Arial', fontSize: '0.65rem', letterSpacing: '0.15em', color: '#c9a227' }, text: 'מידע על האדם' },
  { label: 'Mono / date', style: { fontFamily: 'monospace', fontSize: '0.82rem', color: '#5a3a1a' }, text: '15/03/1948' },
]

export default function DesignSystem() {
  const [selectedIcon, setSelectedIcon] = useState<IconName | null>(null)
  const [iconSize, setIconSize] = useState(24)

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif', padding: '0 0 6rem' }}>

      {/* Header */}
      <div style={{ background: 'rgba(201,162,39,0.04)', borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '3rem 2rem 2.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: '0.65rem', color: '#c9a227', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>DESIGN SYSTEM</div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem', color: '#f5d98b', margin: 0 }}>ארכיון המשפחות</h1>
          <p style={{ color: '#5a3a1a', marginTop: '0.5rem', fontSize: '0.9rem' }}>תיעוד רכיבים, אייקונים, צבעים וטיפוגרפיה</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem' }}>

        {/* ── Colors ─────────────────────────────────── */}
        <Section title="צבעים" id="colors">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {COLORS.map(c => (
              <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 90 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: c.hex, border: '1px solid rgba(201,162,39,0.15)' }} />
                <div style={{ fontSize: '0.72rem', color: '#f0e8d0', fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: '0.65rem', color: '#3a2a10', fontFamily: 'monospace' }}>{c.hex}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Typography ─────────────────────────────── */}
        <Section title="טיפוגרפיה" id="typography">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {TYPOGRAPHY.map(t => (
              <div key={t.label} style={{ borderBottom: '1px solid rgba(201,162,39,0.06)', paddingBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#3a2a10', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{t.label}</div>
                <div style={t.style}>{t.text}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Icons ──────────────────────────────────── */}
        <Section title="אייקונים" id="icons">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#b89a5a' }}>גודל: {iconSize}px</label>
            <input type="range" min={12} max={48} value={iconSize} onChange={e => setIconSize(+e.target.value)}
              style={{ accentColor: '#c9a227', width: 140 }} />
            {selectedIcon && (
              <div style={{ fontSize: '0.8rem', color: '#c9a227', background: 'rgba(201,162,39,0.08)', padding: '0.2rem 0.7rem', borderRadius: 8, border: '1px solid rgba(201,162,39,0.2)' }}>
                <code>{selectedIcon}</code>
              </div>
            )}
          </div>
          {ICON_GROUPS.map(g => (
            <div key={g.label} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#c9a227', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>{g.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {g.icons.map(name => (
                  <motion.button key={name} onClick={() => setSelectedIcon(name)}
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                    title={name}
                    style={{
                      background: selectedIcon === name ? 'rgba(201,162,39,0.12)' : 'rgba(26,15,5,0.7)',
                      border: `1px solid ${selectedIcon === name ? 'rgba(201,162,39,0.4)' : 'rgba(201,162,39,0.08)'}`,
                      borderRadius: 10, padding: '0.6rem 0.8rem', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', minWidth: 60,
                    }}>
                    <Icon name={name} size={iconSize} color={selectedIcon === name ? '#f5d98b' : '#b89a5a'} />
                    <span style={{ fontSize: '0.6rem', color: '#3a2a10', fontFamily: 'monospace' }}>{name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
          {selectedIcon && (
            <div style={{ background: 'rgba(26,15,5,0.9)', border: '1px solid rgba(201,162,39,0.15)', borderRadius: 12, padding: '1rem 1.25rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#3a2a10', marginBottom: '0.4rem' }}>שימוש</div>
              <code style={{ fontSize: '0.82rem', color: '#c9a227' }}>{'<Icon name="'}{selectedIcon}{'" size={24} color="currentColor" />'}</code>
            </div>
          )}
        </Section>

        {/* ── Buttons ────────────────────────────────── */}
        <Section title="כפתורים" id="buttons">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            {BUTTON_VARIANTS.map(b => (
              <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <button className={b.cls} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icon name="check" size={14} />{b.label}
                </button>
                <code style={{ fontSize: '0.6rem', color: '#3a2a10' }}>.{b.cls.replace(' cbtn-sm','').split(' ')[1]}</code>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="cbtn cbtn-primary" disabled style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.5 }}>
              <Icon name="check" size={14} />מושבת
            </button>
            <button className="cbtn cbtn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="download" size={14} />הורדה
            </button>
            <button className="cbtn cbtn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="share" size={14} />שיתוף
            </button>
            <button className="cbtn cbtn-ghost cbtn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Icon name="edit" size={13} />עריכה
            </button>
            <button className="cbtn cbtn-ghost cbtn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Icon name="trash" size={13} />מחיקה
            </button>
          </div>
        </Section>

        {/* ── Cards ──────────────────────────────────── */}
        <Section title="כרטיסים" id="cards">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '1rem' }}>
            {CARD_SAMPLES.map((c, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} className="ccard" style={{ borderTop: `3px solid ${c.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${c.color}22`, border: `1px solid ${c.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="person" size={18} color={c.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f5d98b' }}>{c.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#5a3a1a' }}>{c.sub}</div>
                  </div>
                </div>
                <span className="c-pill" style={{ borderColor: `${c.color}44`, color: c.color }}>{c.tag}</span>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── Inputs ─────────────────────────────────── */}
        <Section title="שדות קלט" id="inputs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 380 }}>
            <div>
              <label className="c-label">שם מלא</label>
              <input className="c-input" placeholder="הכנס שם..." defaultValue="" />
            </div>
            <div>
              <label className="c-label">אימייל</label>
              <input className="c-input" type="email" placeholder="your@email.com" style={{ direction: 'ltr', textAlign: 'left' }} />
            </div>
            <div>
              <label className="c-label">חיפוש</label>
              <div style={{ position: 'relative' }}>
                <Icon name="search" size={15} color="#3a2a10" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input className="c-input" placeholder="חפש..." style={{ paddingRight: '2.25rem' }} />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Labels + Pills ─────────────────────────── */}
        <Section title="תגיות ופילס" id="labels">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="c-pill">כל הסטטוסים</span>
            <span className="c-pill" style={{ borderColor: '#4a9e6a55', color: '#4a9e6a' }}>פעיל</span>
            <span className="c-pill" style={{ borderColor: '#c9a22755', color: '#c9a227' }}>ממתין</span>
            <span className="c-pill" style={{ borderColor: '#378ADD55', color: '#378ADD' }}>נישואין</span>
            <span className="c-pill" style={{ borderColor: '#9a6ab055', color: '#9a6ab0' }}>הגירה</span>
            <div className="c-divider" style={{ width: 1, height: 24, margin: '0 0.25rem' }} />
            <div className="c-label">תאריך לידה</div>
            <div className="c-label" style={{ color: '#4a9e6a' }}>מאושר</div>
          </div>
        </Section>

      </div>
    </main>
  )
}

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ paddingTop: '3.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', color: '#f5d98b', margin: 0 }}>{title}</h2>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(201,162,39,0.2), transparent)' }} />
      </div>
      {children}
    </section>
  )
}

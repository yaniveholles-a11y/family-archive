'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Family = {
  id: number; name: string; name_en?: string; description?: string
  origin_country?: string; video_url?: string; image_url?: string
}
type Person = {
  id: number; first_name: string; last_name: string
  birth_date?: string; death_date?: string; birth_place?: string; photo_url?: string
}

/* ── Animated counter ── */
function Counter({ target }: { target: number }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let raf: number
    const t0 = performance.now()
    const dur = 900
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return <span ref={ref}>{v}</span>
}

/* ── Person card ── */
function PersonCard({ person, locale, index }: { person: Person; locale: string; index: number }) {
  return (
    <motion.a
      href={`/${locale}/people/${person.id}`}
      className={`cperson-card${person.death_date ? ' deceased' : ''}`}
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.05, 0.4), ease: [0.34, 1.56, 0.64, 1] }}
      viewport={{ once: true, margin: '-30px' }}
    >
      {person.photo_url ? (
        <img src={person.photo_url} alt={person.first_name} className="cavatar" style={{ objectFit: 'cover' }} />
      ) : (
        <div className="cavatar">
          {person.death_date ? '🕯️' : '👤'}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cperson-name">
          {[person.first_name, person.last_name].filter(Boolean).join(' ')}
        </div>
        <div className="cperson-dates">
          {person.birth_date?.substring(0, 4)}
          {person.death_date ? ` — ${person.death_date.substring(0, 4)}` : ''}
        </div>
        {person.birth_place && (
          <div className="cperson-place">📍 {person.birth_place}</div>
        )}
      </div>
      <span style={{ color: 'rgba(201,162,39,0.2)', fontSize: '0.8rem', transition: 'color 0.3s' }}>←</span>
    </motion.a>
  )
}

export default function FamilyPage() {
  const { id, locale } = useParams() as { id: string; locale: string }
  const router = useRouter()
  const [family, setFamily] = useState<Family | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [stats, setStats] = useState({ photos: 0, documents: 0, events: 0 })
  const [newForm, setNewForm] = useState({ name: '', description: '', origin_country: '' })
  const [saving, setSaving] = useState(false)
  const isNew = id === 'new'

  useEffect(() => {
    async function init() {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push(`/${locale}/login`); return }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).single()
      const role = roleData?.role || 'viewer'
      setCanEdit(role === 'admin' || role === 'editor')

      if (!isNew) {
        const { data: fam } = await supabase.from('families').select('*').eq('id', id).single()
        setFamily(fam)
        const { data: ppl } = await supabase.from('people').select('*').eq('family_id', id).order('last_name')
        setPeople(ppl || [])
        if (ppl && ppl.length > 0) {
          const ids = ppl.map((p: Person) => p.id)
          const [{ count: photos }, { count: documents }, { count: events }] = await Promise.all([
            supabase.from('photos').select('*', { count: 'exact', head: true }).in('person_id', ids),
            supabase.from('documents').select('*', { count: 'exact', head: true }).in('person_id', ids),
            supabase.from('timeline_events').select('*', { count: 'exact', head: true }).in('person_id', ids),
          ])
          setStats({ photos: photos || 0, documents: documents || 0, events: events || 0 })
        }
      }
      setLoading(false)
    }
    init()
  }, [id])

  async function handleSubmit() {
    if (!newForm.name) { alert('חובה להכניס שם משפחה'); return }
    setSaving(true)
    await supabase.from('families').insert([{
      name: newForm.name,
      description: newForm.description || null,
      origin_country: newForm.origin_country || null,
    }])
    router.push(`/${locale}/dashboard`)
  }

  if (loading) return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'var(--c-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(201,162,39,0.15)', borderTopColor: '#c9a227' }} />
      <p style={{ color: 'rgba(201,162,39,0.4)', fontSize: '0.8rem' }}>טוען...</p>
    </main>
  )

  /* ── NEW FAMILY FORM ── */
  if (isNew) return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'var(--c-ink)', color: 'var(--c-text)', fontFamily: 'var(--font-body)', padding: '2rem' }}>
      <a href={`/${locale}/dashboard`} style={{ color: 'var(--c-gold)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2rem' }}>
        → חזרה ללוח בקרה
      </a>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 520, margin: '0 auto' }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--c-gold)', marginBottom: '0.25rem' }}>הוספת משפחה חדשה</h1>
        <div style={{ width: 60, height: 1, background: 'var(--c-gold)', marginBottom: '2rem', opacity: 0.5 }} />
        <div className="ccard" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {([
            { label: 'שם המשפחה *', key: 'name', placeholder: 'לדוגמה: כהן' },
            { label: 'מדינת מוצא', key: 'origin_country', placeholder: 'לדוגמה: פולין' },
            { label: 'תיאור קצר', key: 'description', placeholder: 'כמה מילים על המשפחה...' },
          ] as const).map(field => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(201,162,39,0.5)', marginBottom: '0.4rem', letterSpacing: '0.08em' }}>
                {field.label}
              </label>
              <input
                value={(newForm as any)[field.key]}
                onChange={e => setNewForm({ ...newForm, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                style={{
                  width: '100%', background: 'rgba(8,6,6,0.8)',
                  border: '1px solid var(--c-border)', borderRadius: 9,
                  padding: '0.65rem 0.9rem', color: 'var(--c-text)',
                  fontSize: '0.95rem', fontFamily: 'var(--font-body)',
                  outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'var(--c-border)')}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button onClick={handleSubmit} disabled={saving} className="cbtn cbtn-primary">
              {saving ? 'שומר...' : 'שמור משפחה'}
            </button>
            <a href={`/${locale}/dashboard`} className="cbtn cbtn-secondary">ביטול</a>
          </div>
        </div>
      </motion.div>
    </main>
  )

  if (!family) return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'var(--c-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ color: 'rgba(184,154,90,0.5)' }}>משפחה לא נמצאה</p>
      <a href={`/${locale}`} className="cbtn cbtn-secondary cbtn-sm">חזרה הביתה</a>
    </main>
  )

  const sorted = [...people].sort((a, b) => {
    if (a.death_date && !b.death_date) return 1
    if (!a.death_date && b.death_date) return -1
    return (a.birth_date || '').localeCompare(b.birth_date || '')
  })
  const alive = people.filter(p => !p.death_date).length
  const generations = new Set(people.map(p => p.birth_date?.substring(0, 3))).size

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'var(--c-ink)', color: 'var(--c-text)', fontFamily: 'var(--font-body)' }}>

      {/* ── HERO ── */}
      <div className="chero-family">
        {family.video_url ? (
          <video autoPlay muted loop playsInline className="chero-family-bg">
            <source src={family.video_url} type="video/mp4" />
          </video>
        ) : family.image_url ? (
          <img src={family.image_url} alt={family.name} className="chero-family-bg" />
        ) : (
          <div className="chero-family-bg" style={{ background: 'linear-gradient(180deg, #0d0702 0%, #1a0f05 100%)' }} />
        )}
        <div className="chero-family-overlay" />

        {/* Top bar */}
        <motion.div
          className="chero-family-topbar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <a href={`/${locale}`} style={{ color: 'rgba(245,217,139,0.7)', textDecoration: 'none', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            → ארכיון המשפחות
          </a>
          {canEdit && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a href={`/${locale}/families/${id}/edit`} className="cbtn cbtn-primary cbtn-sm">✏️ עריכה</a>
              <a href={`/${locale}/families/${id}/tree`} className="cbtn cbtn-ghost cbtn-sm">🌳 עץ משפחה</a>
              <a href={`/${locale}/map`} className="cbtn cbtn-ghost cbtn-sm">🌍 מסעות</a>
            </div>
          )}
        </motion.div>

        {/* Title */}
        <motion.div
          className="chero-family-bottom"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ fontSize: '0.85rem', color: 'rgba(201,162,39,0.6)', letterSpacing: '6px', marginBottom: '0.5rem' }}>❧ ✦ ❧</div>
          <h1 className="chero-family-name">משפחת {family.name}</h1>
          {family.name_en && (
            <div style={{ fontSize: '1rem', color: 'rgba(245,217,139,0.7)', letterSpacing: '2px', marginTop: '0.2rem' }}>
              {family.name_en} Family
            </div>
          )}
          {family.origin_country && (
            <div style={{ fontSize: '0.88rem', color: 'rgba(245,217,139,0.55)', marginTop: '0.3rem' }}>
              🌍 {family.origin_country}
            </div>
          )}
          {family.description && (
            <p style={{ fontSize: '0.88rem', color: 'rgba(240,224,192,0.6)', maxWidth: '480px', margin: '0.6rem auto 0', lineHeight: 1.7, textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
              {family.description}
            </p>
          )}
        </motion.div>
      </div>

      {/* ── STATS ── */}
      <div className="cstats-strip">
        {[
          { icon: '👥', num: people.length,    label: 'בני משפחה' },
          { icon: '❤️', num: alive,             label: 'בחיים'     },
          { icon: '🌳', num: generations,       label: 'דורות'     },
          { icon: '🖼️', num: stats.photos,     label: 'תמונות'    },
          { icon: '📄', num: stats.documents,   label: 'מסמכים'    },
          { icon: '📅', num: stats.events,      label: 'אירועים'   },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="cstat-item"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="cstat-icon">{s.icon}</span>
            <span className="cstat-num"><Counter target={s.num} /></span>
            <span className="cstat-label">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* ── QUICK NAV ── */}
      <motion.div
        className="cquick-nav"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {[
          { icon: '🌳', label: 'עץ משפחה',  href: `/${locale}/families/${id}/tree` },
          { icon: '🌍', label: 'מפת נדידה', href: `/${locale}/map`                 },
          { icon: '📅', label: 'ציר זמן',   href: `/${locale}/timeline`            },
          { icon: '🖼️', label: 'גלריה',     href: `/${locale}/gallery`             },
          { icon: '📄', label: 'מסמכים',    href: `/${locale}/documents`           },
          { icon: '📝', label: 'סיפורים',   href: `/${locale}/stories`             },
          { icon: '📆', label: 'לוח שנה',   href: `/${locale}/calendar`            },
          { icon: '✡️', label: 'שואה',      href: `/${locale}/holocaust`           },
          { icon: '🔍', label: 'חיפוש',     href: `/${locale}/search`              },
        ].map((link, i) => (
          <motion.a
            key={link.label}
            href={link.href}
            className="cquick-link"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.04, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {link.icon} {link.label}
          </motion.a>
        ))}
      </motion.div>

      {/* ── PEOPLE GRID ── */}
      <div>
        <div className="csection-hdr" style={{ paddingTop: '2rem' }}>
          <span className="csection-hdr-title">בני המשפחה</span>
          <div className="csection-hdr-line" />
          {canEdit && (
            <a href={`/${locale}/people/new`} className="cbtn cbtn-primary cbtn-sm">+ הוסף</a>
          )}
        </div>

        {people.length === 0 ? (
          <div style={{ margin: '0 2rem 3rem', background: 'rgba(16,10,4,0.7)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'rgba(184,154,90,0.4)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
            <p>עדיין אין אנשים במשפחה זו</p>
          </div>
        ) : (
          <div className="cgrid-people">
            {sorted.map((person, i) => (
              <PersonCard key={person.id} person={person} locale={locale} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

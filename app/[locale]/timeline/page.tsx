'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import Icon, { IconName } from '@/components/Icon'
import { useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Event = {
  id: number; title: string; event_date: string; description?: string
  person_id?: number; person_name?: string; event_type?: string; location?: string
}

const HIST: Record<number, string> = {
  1933: 'עליית הנאצים לשלטון', 1939: 'פרוץ מלחמת העולם השנייה',
  1941: 'תחילת השואה', 1945: 'סיום המלחמה',
  1948: 'הקמת מדינת ישראל', 1967: 'מלחמת ששת הימים',
}

const TYPE_COLORS: Record<string, string> = {
  birth: '#4a9e6a', death: '#c9a227', marriage: '#378ADD',
  immigration: '#9a6ab0', event: '#f0e8d0',
}
const TYPE_ICONS: Record<string, IconName> = {
  birth: 'birth', death: 'candle', marriage: 'marriage',
  immigration: 'immigration', event: 'timeline',
}

function TimelineItem({ event, side, locale }: { event: Event; side: 'right' | 'left'; locale: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const year = event.event_date ? parseInt(event.event_date.substring(0, 4)) : null
  const color = TYPE_COLORS[event.event_type || 'event'] || '#f0e8d0'
  const icon: IconName = TYPE_ICONS[event.event_type || 'event'] || 'timeline'

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: side === 'right' ? 30 : -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ type: 'spring', damping: 18, stiffness: 100 }}
      style={{
        display: 'flex',
        flexDirection: side === 'right' ? 'row-reverse' : 'row',
        alignItems: 'flex-start', gap: '1.25rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{
          background: 'rgba(26,15,5,0.8)', border: `1px solid ${color}22`,
          borderRight: side === 'right' ? `3px solid ${color}` : undefined,
          borderLeft: side === 'left' ? `3px solid ${color}` : undefined,
          borderRadius: 12, padding: '1rem 1.1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} color={color} /></span>
            <span style={{ fontWeight: 600, color: '#f5d98b', fontSize: '0.95rem' }}>{event.title}</span>
          </div>
          {event.event_date && (
            <div style={{ fontSize: '0.75rem', color, marginBottom: '0.3rem' }}>
              {event.event_date.substring(0, 10).split('-').reverse().join('/')}
            </div>
          )}
          {event.person_name && (
            <a href={`/${locale}/people/${event.person_id}`}
              style={{ fontSize: '0.78rem', color: '#378ADD', textDecoration: 'none' }}>
              👤 {event.person_name}
            </a>
          )}
          {event.location && <div style={{ fontSize: '0.75rem', color: '#3a2a10', marginTop: '0.2rem' }}><Icon name="location" size={12} color="#3a2a10" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '3px' }} /> {event.location}</div>}
          {event.description && <p style={{ color: '#b89a5a', fontSize: '0.82rem', marginTop: '0.4rem', lineHeight: 1.6 }}>{event.description}</p>}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <motion.div
          initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}}
          transition={{ delay: 0.15, type: 'spring', damping: 15 }}
          style={{
            width: 14, height: 14, borderRadius: '50%',
            background: color, border: '2px solid rgba(8,6,6,1)',
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
      <div style={{ flex: 1 }} />
    </motion.div>
  )
}

type WikiContext = { year: number; summary: string; title: string; url: string }

async function fetchWikiContext(year: number): Promise<WikiContext | null> {
  const queries: Record<number, string> = {
    1933: 'Rise of the Nazi party Germany', 1939: 'World War II outbreak',
    1941: 'Holocaust Nazi Germany', 1945: 'End of World War II',
    1948: 'Israeli Declaration of Independence', 1967: 'Six-Day War',
  }
  const q = queries[year] || `${year} Jewish history`
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`)
    if (!res.ok) return null
    const data = await res.json()
    return { year, summary: data.extract?.substring(0, 280) + '...', title: data.title, url: data.content_urls?.desktop?.page || '' }
  } catch { return null }
}

export default function TimelinePage() {
  const { locale } = useParams() as { locale: string }
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [wikiCtx, setWikiCtx] = useState<WikiContext | null>(null)
  const [wikiLoading, setWikiLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('events')
      .select(`id, title, event_date, description, event_type, location,
               person_id, people(first_name, last_name)`)
      .order('event_date', { ascending: true })
    const mapped = (data || []).map((e: any) => ({
      ...e,
      person_name: e.people
        ? [e.people.first_name, e.people.last_name].filter(Boolean).join(' ')
        : null,
    }))
    setEvents(mapped)
    setLoading(false)
  }

  const filtered = events.filter(e => {
    if (typeFilter !== 'all' && e.event_type !== typeFilter) return false
    if (filter && !e.title.includes(filter) && !(e.description || '').includes(filter)) return false
    return true
  })

  const types = ['all', ...Array.from(new Set(events.map(e => e.event_type || 'event'))).sort()]
  const typeLabels: Record<string, string> = { all: 'הכל', birth: 'לידות', death: 'פטירות', marriage: 'נישואים', immigration: 'עלייה', event: 'אירועים' }

  // Group by decade
  const decades = Array.from(new Set(
    filtered.map(e => e.event_date ? Math.floor(parseInt(e.event_date.substring(0, 4)) / 10) * 10 : null).filter(Boolean)
  )).sort() as number[]

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'rgba(8,6,6,0.95)', borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '0 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 0 0.75rem', borderBottom: '1px solid rgba(201,162,39,0.06)' }}>
            <a href={`/${locale}`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← בית</a>
            <span style={{ color: '#1a0f05' }}>·</span>
            <span style={{ color: '#f5d98b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="timeline" size={14} color="#f5d98b" /> ציר זמן</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '2.5rem 2rem 1.5rem', textAlign: 'center' }}>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', color: '#f5d98b', marginBottom: '0.4rem' }}>
          ציר זמן משפחתי
        </motion.h1>
        <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, #c9a227, transparent)', margin: '0.5rem auto 0.75rem' }} />
        <p style={{ color: '#3a2a10', fontSize: '0.85rem' }}>{events.length} אירועים בארכיון</p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem 4rem' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#3a2a10', pointerEvents: 'none' }}><Icon name="search" size={15} color="#3a2a10" /></span>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="חפש אירוע..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.12)',
                borderRadius: 10, padding: '0.6rem 2rem 0.6rem 1rem',
                color: '#f0e8d0', fontSize: '0.88rem', fontFamily: '"Heebo", Arial, sans-serif',
                outline: 'none', direction: 'rtl',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.12)')}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                style={{
                  background: typeFilter === t ? 'rgba(201,162,39,0.12)' : 'transparent',
                  color: typeFilter === t ? '#f5d98b' : '#5a3a1a',
                  border: `1px solid ${typeFilter === t ? 'rgba(201,162,39,0.35)' : 'rgba(201,162,39,0.08)'}`,
                  borderRadius: 20, padding: '0.3rem 0.8rem', cursor: 'pointer',
                  fontSize: '0.78rem', fontFamily: '"Heebo", Arial, sans-serif', transition: 'all 0.2s',
                }}
              >{typeLabels[t] || t}</button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '2rem', color: '#c9a227' }}>✦</motion.div>
          </div>
        )}

        {!loading && (
          <div style={{ position: 'relative' }}>
            {/* Central vertical line */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: '50%', transform: 'translateX(-50%)',
              width: 2,
              background: 'linear-gradient(180deg, transparent, rgba(201,162,39,0.3) 10%, rgba(201,162,39,0.3) 90%, transparent)',
            }} />

            {decades.map(decade => {
              const decadeEvents = filtered.filter(e =>
                e.event_date && Math.floor(parseInt(e.event_date.substring(0, 4)) / 10) * 10 === decade
              )
              if (decadeEvents.length === 0) return null
              return (
                <div key={decade}>
                  {/* Decade marker */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ type: 'spring', damping: 15 }}
                    style={{
                      textAlign: 'center', margin: '2rem 0 1.5rem',
                      position: 'relative', zIndex: 2,
                    }}
                  >
                    <span style={{
                      background: 'linear-gradient(135deg, #c9a227, #a68520)',
                      color: '#0d0702', fontWeight: 700, fontSize: '0.82rem',
                      padding: '0.35rem 1.1rem', borderRadius: 20,
                      fontFamily: '"Playfair Display", serif',
                    }}>{decade}s</span>
                    {HIST[decade] && (
                      <div style={{ color: '#3a2a10', fontSize: '0.72rem', marginTop: '0.4rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        onClick={async () => {
                          setWikiLoading(true); setWikiCtx(null)
                          const ctx = await fetchWikiContext(decade)
                          setWikiCtx(ctx); setWikiLoading(false)
                        }}>
                        <Icon name="globe" size={13} color="#c9a227" style={{ flexShrink: 0 }} /> {HIST[decade]} <span style={{ color: '#c9a227', fontSize: '0.65rem' }}>↗</span>
                      </div>
                    )}
                  </motion.div>

                  {decadeEvents.map((event, i) => (
                    <TimelineItem key={event.id} event={event} side={i % 2 === 0 ? 'right' : 'left'} locale={locale} />
                  ))}
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#3a2a10' }}>
                <div style={{ marginBottom: '1rem' }}><Icon name="timeline" size={48} color="rgba(201,162,39,0.3)" /></div>
                <div>לא נמצאו אירועים</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wikipedia Context Panel */}
      <AnimatePresence>
        {(wikiCtx || wikiLoading) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 100, maxWidth: 480, width: 'calc(100vw - 2rem)', background: 'rgba(13,7,2,0.97)', border: '1px solid rgba(201,162,39,0.25)', borderRadius: 16, padding: '1.25rem 1.5rem', backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#c9a227', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="wikipedia" size={13} color="#c9a227" /> הקשר היסטורי — Wikipedia</div>
              <button onClick={() => setWikiCtx(null)} style={{ background: 'none', border: 'none', color: '#3a2a10', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
            </div>
            {wikiLoading ? (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', color: '#5a3a1a', fontSize: '0.82rem' }}>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>✦</motion.span>
                טוען מ-Wikipedia...
              </div>
            ) : wikiCtx && (
              <>
                <div style={{ fontWeight: 600, color: '#f5d98b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{wikiCtx.title}</div>
                <p style={{ color: '#b89a5a', fontSize: '0.8rem', lineHeight: 1.75, margin: 0 }}>{wikiCtx.summary}</p>
                {wikiCtx.url && (
                  <a href={wikiCtx.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.75rem', color: '#c9a227', fontSize: '0.72rem', textDecoration: 'none' }}>
                    ↗ קרא עוד ב-Wikipedia
                  </a>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingEditButton editPath="events-edit" />
    </main>
  )
}

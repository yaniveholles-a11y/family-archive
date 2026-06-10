'use client'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/Icon'
import { supabase } from '@/lib/supabase'

type MigrationEvent = {
  id: number; year: number; person_name: string
  from_lat?: number; from_lng?: number; from_place?: string
  to_lat?: number; to_lng?: number; to_place?: string
  event_type?: string; description?: string; photo_url?: string
}

// Fallback data if DB is empty
const DEMO_EVENTS: MigrationEvent[] = [
  { id: 1, year: 1905, person_name: 'סבא רבא', from_lat: 52.2, from_lng: 21.0, from_place: 'וורשה', to_lat: 51.5, to_lng: -0.1, to_place: 'לונדון', event_type: 'immigration', description: 'עזיבת פולין לפני הפוגרומים' },
  { id: 2, year: 1920, person_name: 'סבתא', from_lat: 48.8, from_lng: 2.3, from_place: 'פריז', to_lat: 32.0, to_lng: 34.8, to_place: 'תל אביב', event_type: 'immigration', description: 'עלייה לארץ ישראל' },
  { id: 3, year: 1948, person_name: 'המשפחה', from_lat: 32.0, from_lng: 34.8, from_place: 'תל אביב', to_lat: 31.7, to_lng: 35.2, to_place: 'ירושלים', event_type: 'migration', description: 'לאחר קום המדינה' },
  { id: 4, year: 1935, person_name: 'דוד', from_lat: 52.5, from_lng: 13.4, from_place: 'ברלין', to_lat: 32.0, to_lng: 34.8, to_place: 'תל אביב', event_type: 'immigration', description: 'בריחה מגרמניה הנאצית' },
]

export default function StoryMapPage() {
  const { locale } = useParams() as { locale: string }
  const globeRef = useRef<HTMLDivElement>(null)
  const globeInstanceRef = useRef<any>(null)
  const [events, setEvents] = useState<MigrationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<MigrationEvent | null>(null)
  const [activeYear, setActiveYear] = useState<number | null>(null)
  const [globeReady, setGlobeReady] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const { data } = await supabase
        .from('events')
        .select(`id, event_date, description, event_type, location,
                 people(first_name, last_name, photo_url)`)
        .not('location', 'is', null)
        .order('event_date')
      if (data && data.length > 0) {
        // Parse location strings like "lat,lng" or use geocoded data
        const mapped = data.map((e: any) => {
          const parts = (e.location || '').split(',').map(Number).filter(Boolean)
          return {
            id: e.id,
            year: parseInt(e.event_date?.substring(0, 4) || '0'),
            person_name: e.people ? [e.people.first_name, e.people.last_name].filter(Boolean).join(' ') : '',
            to_lat: parts[0] || 32.0,
            to_lng: parts[1] || 34.8,
            to_place: e.location,
            event_type: e.event_type,
            description: e.description,
          }
        })
        setEvents(mapped)
      } else {
        setEvents(DEMO_EVENTS)
      }
    } catch { setEvents(DEMO_EVENTS) }
    setLoading(false)
  }

  useEffect(() => {
    if (loading || !globeRef.current) return
    // Dynamically load globe.gl to avoid SSR issues
    import('globe.gl').then(({ default: Globe }) => {
      const el = globeRef.current
      if (!el) return

      const arcs = events.filter(e => e.from_lat && e.to_lat).map(e => ({
        startLat: e.from_lat, startLng: e.from_lng,
        endLat: e.to_lat, endLng: e.to_lng,
        color: e.event_type === 'immigration' ? '#c9a227' : '#378ADD',
        event: e,
      }))

      const points = events.map(e => ({
        lat: e.to_lat || 32, lng: e.to_lng || 34.8,
        size: 0.4, color: '#c9a227',
        label: `${e.year} · ${e.person_name}`,
        event: e,
      }))

      const globe = (Globe as any)()(el)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .width(el.offsetWidth || 500)
        .height(el.offsetHeight || 400)
        .arcsData(arcs)
        .arcColor('color')
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2000)
        .arcStroke(1.5)
        .pointsData(points)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor('color')
        .pointAltitude('size')
        .pointLabel('label')
        .onPointClick((pt: any) => {
          setSelectedEvent(pt.event)
          setActiveYear(pt.event.year)
        })
        .onArcClick((arc: any) => {
          setSelectedEvent(arc.event)
          setActiveYear(arc.event.year)
        })

      // Initial view — center on Israel
      globe.pointOfView({ lat: 32, lng: 34.8, altitude: 2.5 }, 1000)

      globeInstanceRef.current = globe
      setGlobeReady(true)
    }).catch(console.error)

    return () => {
      if (globeInstanceRef.current) {
        // cleanup
      }
    }
  }, [loading, events])

  function focusEvent(e: MigrationEvent) {
    setSelectedEvent(e)
    setActiveYear(e.year)
    if (globeInstanceRef.current && e.to_lat) {
      globeInstanceRef.current.pointOfView({ lat: e.to_lat, lng: e.to_lng, altitude: 1.5 }, 1200)
    }
  }

  const sortedYears = [...new Set(events.map(e => e.year))].sort()

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'rgba(8,6,6,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 0 0.75rem', borderBottom: '1px solid rgba(201,162,39,0.06)' }}>
            <a href={`/${locale}`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← בית</a>
            <span style={{ color: '#1a0f05' }}>·</span>
            <span style={{ color: '#f5d98b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="map" size={14} color="#f5d98b" /> מסע המשפחה</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

        {/* Timeline sidebar */}
        <div style={{
          width: 280, flexShrink: 0,
          background: 'rgba(13,7,2,0.95)', borderLeft: '1px solid rgba(201,162,39,0.1)',
          overflowY: 'auto', padding: '1.5rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.4rem',
        }}>
          <div style={{ fontSize: '0.65rem', color: '#c9a227', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>✦ ציר נדידות</div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '1.5rem', color: '#c9a227' }}>✦</motion.div>
            </div>
          ) : events.map((e, i) => (
            <motion.div key={e.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => focusEvent(e)}
              style={{
                background: activeYear === e.year ? 'rgba(201,162,39,0.1)' : 'rgba(26,15,5,0.5)',
                border: `1px solid ${activeYear === e.year ? 'rgba(201,162,39,0.35)' : 'rgba(201,162,39,0.06)'}`,
                borderRadius: 10, padding: '0.75rem 0.9rem', cursor: 'pointer',
              }}
              onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(201,162,39,0.07)')}
              onMouseLeave={ev => (ev.currentTarget.style.background = activeYear === e.year ? 'rgba(201,162,39,0.1)' : 'rgba(26,15,5,0.5)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f5d98b' }}>{e.person_name}</div>
                <span style={{ fontSize: '0.7rem', color: '#c9a227', background: 'rgba(201,162,39,0.1)', borderRadius: 6, padding: '0.1rem 0.4rem' }}>{e.year}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#5a3a1a', marginTop: '0.2rem' }}>
                {e.from_place && `${e.from_place} → `}{e.to_place}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Globe */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={globeRef} style={{ width: '100%', height: '100%' }} />

          {!globeReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}><Icon name="globe" size={48} color="#c9a227" /></motion.div>
              <div style={{ color: '#3a2a10', fontSize: '0.85rem' }}>טוען גלובוס...</div>
            </div>
          )}

          {/* Event popup */}
          <AnimatePresence>
            {selectedEvent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                style={{
                  position: 'absolute', bottom: 24, right: 24,
                  background: 'rgba(13,7,2,0.95)', border: '1px solid rgba(201,162,39,0.25)',
                  borderRadius: 14, padding: '1.25rem', maxWidth: 300,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <button onClick={() => setSelectedEvent(null)}
                  style={{ position: 'absolute', top: 8, left: 8, background: 'none', border: 'none', color: '#3a2a10', cursor: 'pointer', fontSize: '1rem' }}><Icon name="close" size={14} /></button>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: '#f5d98b', marginBottom: '0.5rem' }}>
                  {selectedEvent.person_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#c9a227', marginBottom: '0.4rem' }}>{selectedEvent.year}</div>
                {selectedEvent.from_place && (
                  <div style={{ fontSize: '0.78rem', color: '#b89a5a' }}>
                    <Icon name="location" size={13} color="#b89a5a" /> {selectedEvent.from_place} → {selectedEvent.to_place}
                  </div>
                )}
                {selectedEvent.description && (
                  <p style={{ fontSize: '0.78rem', color: '#8a6a3a', lineHeight: 1.6, marginTop: '0.5rem' }}>
                    {selectedEvent.description}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Year slider */}
          {sortedYears.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(13,7,2,0.9)', border: '1px solid rgba(201,162,39,0.15)',
              borderRadius: 20, padding: '0.5rem 1.2rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <span style={{ color: '#3a2a10', fontSize: '0.75rem' }}>
                {sortedYears[0]}
              </span>
              <input type="range"
                min={sortedYears[0]} max={sortedYears[sortedYears.length - 1]}
                value={activeYear || sortedYears[0]}
                onChange={e => {
                  const y = parseInt(e.target.value)
                  setActiveYear(y)
                  const closest = events.reduce((prev, cur) => Math.abs(cur.year - y) < Math.abs(prev.year - y) ? cur : prev)
                  if (closest && globeInstanceRef.current && closest.to_lat) {
                    globeInstanceRef.current.pointOfView({ lat: closest.to_lat, lng: closest.to_lng, altitude: 1.5 }, 800)
                    setSelectedEvent(closest)
                  }
                }}
                style={{ width: 200, accentColor: '#c9a227' }}
              />
              <span style={{ color: '#c9a227', fontSize: '0.85rem', fontWeight: 600, minWidth: 36 }}>
                {activeYear || sortedYears[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

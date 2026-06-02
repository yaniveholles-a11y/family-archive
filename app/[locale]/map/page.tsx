'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { GeoPoint, GeoArc } from './GlobeView'

const GlobeView = dynamic(() => import('./GlobeView'), { ssr: false, loading: () => <Loader /> })
const CityView = dynamic(() => import('./CityView'), { ssr: false })
const StreetView = dynamic(() => import('./StreetView'), { ssr: false })

function Loader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: 40, color: '#c9a227' }}>✦</motion.div>
      <span style={{ color: '#8b6914', fontSize: 13, fontFamily: '"Heebo", sans-serif' }}>טוען גלוב...</span>
    </div>
  )
}

type GlobePerson = {
  id: string; name: string; color: string; symbol: string; visible: boolean
  tree_person_id?: number; stops?: GlobeStop[]
}
type GlobeStop = {
  id: string; globe_person_id: string; year?: number; is_bce: boolean
  country?: string; city?: string; address?: string
  lat?: number; lng?: number; stop_type: string; note?: string; photo_url?: string
}
type GlobeRoute = {
  id: string; globe_person_id: string; from_stop_id: string; to_stop_id: string
  travel_type: string; note?: string
}
type View = 'globe' | 'city' | 'street'
type CityInfo = { lat: number; lng: number; name: string; people: { id: string; name: string }[] }

const TRAVEL_COLORS: Record<string, string[]> = {
  default: ['#ffffffaa','#ffffffaa'], ship: ['#3498DB','#2980B9'],
  train: ['#888','#666'], exile: ['#E74C3C','#C0392B'],
  pilgrimage: ['#c9a227','#f5d98b'], captivity: ['#666','#444'],
  unknown: ['#ffffff22','#ffffff22'], walking: ['#2ECC71','#27AE60'],
}

export default function MapPage() {
  const { locale } = useParams() as { locale: string }
  const [globePeople, setGlobePeople] = useState<GlobePerson[]>([])
  const [stops, setStops] = useState<GlobeStop[]>([])
  const [routes, setRoutes] = useState<GlobeRoute[]>([])
  const [points, setPoints] = useState<GeoPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState<GlobePerson | null>(null)
  const [view, setView] = useState<View>('globe')
  const [cityInfo, setCityInfo] = useState<CityInfo | null>(null)
  const [streetCoords, setStreetCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [playing, setPlaying] = useState(false)
  const [playIndex, setPlayIndex] = useState(0)
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load data from new tables
  useEffect(() => {
    async function init() {
      const [{ data: ppl }, { data: stps }, { data: rts }] = await Promise.all([
        supabase.from('globe_people').select('*').eq('visible', true).order('sort_order'),
        supabase.from('globe_stops').select('*').eq('is_public', true).order('year'),
        supabase.from('globe_routes').select('*'),
      ])
      setGlobePeople(ppl || [])
      setStops(stps || [])
      setRoutes(rts || [])
      setLoading(false)
    }
    init()
  }, [])

  // Build points from stops (no geocoding needed — coordinates already in DB)
  useEffect(() => {
    if (loading) return
    const personMap = new Map(globePeople.map(p => [p.id, p]))
    const placeMap: Record<string, GeoPoint> = {}

    for (const s of stops) {
      if (!s.lat || !s.lng) continue
      const person = personMap.get(s.globe_person_id)
      if (!person) continue

      const key = `${s.lat.toFixed(3)},${s.lng.toFixed(3)}`
      if (!placeMap[key]) {
        placeMap[key] = {
          name: s.city || s.country || '',
          lat: s.lat, lng: s.lng,
          count: 0, people: [],
        }
      }
      placeMap[key].count++
      if (!placeMap[key].people.find(p => p.id === person.id as any)) {
        placeMap[key].people.push({ id: person.id as any, name: person.name })
      }
    }
    setPoints(Object.values(placeMap))
  }, [loading, stops, globePeople])

  // Build arcs
  const arcs: GeoArc[] = []
  if (selectedPerson) {
    const personStops = stops
      .filter(s => s.globe_person_id === selectedPerson.id && s.lat && s.lng)
      .sort((a, b) => (a.year || 0) - (b.year || 0))

    for (let i = 0; i < personStops.length - 1; i++) {
      const route = routes.find(r =>
        r.from_stop_id === personStops[i].id && r.to_stop_id === personStops[i + 1].id
      )
      const travelType = route?.travel_type || 'default'
      const colors = TRAVEL_COLORS[travelType] || TRAVEL_COLORS.default
      arcs.push({
        startLat: personStops[i].lat!, startLng: personStops[i].lng!,
        endLat: personStops[i + 1].lat!, endLng: personStops[i + 1].lng!,
        color: [selectedPerson.color + 'cc', colors[1]],
      })
    }
  }

  const focusCoords = selectedPerson
    ? (() => {
        const firstStop = stops.find(s => s.globe_person_id === selectedPerson.id && s.lat && s.lng)
        return firstStop ? { lat: firstStop.lat!, lng: firstStop.lng! } : null
      })()
    : null

  // Journey Playback
  const personStops = selectedPerson
    ? stops.filter(s => s.globe_person_id === selectedPerson.id).sort((a, b) => (a.year || 0) - (b.year || 0))
    : []

  useEffect(() => {
    if (!playing || personStops.length === 0) return
    playTimerRef.current = setTimeout(() => {
      const next = playIndex + 1
      if (next >= personStops.length) { setPlaying(false); setPlayIndex(0) }
      else setPlayIndex(next)
    }, 3000)
    return () => { if (playTimerRef.current) clearTimeout(playTimerRef.current) }
  }, [playing, playIndex, personStops.length])

  const handlePointClick = useCallback((point: GeoPoint) => {
    setCityInfo({ lat: point.lat, lng: point.lng, name: point.name, people: point.people as any })
    setView('city')
  }, [])

  const handleStreetView = useCallback((lat: number, lng: number) => {
    setStreetCoords({ lat, lng }); setView('street')
  }, [])

  // Search filter
  const filteredPeople = globePeople.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q)
  })

  const personStopCount = (personId: string) => stops.filter(s => s.globe_person_id === personId).length

  return (
    <main dir="rtl" style={{
      height: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #0a0d1a, #030508)',
      color: '#f5e6c8', fontFamily: '"Heebo", Arial, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* Top bar */}
      <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          background: 'linear-gradient(180deg, #0d0702ee, #0d0702cc)',
          backdropFilter: 'blur(12px)', borderBottom: '1px solid #c9a22722',
          padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexShrink: 0, zIndex: 20,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setView('globe')} style={{
            background: view === 'globe' ? '#c9a22715' : 'none',
            border: '1px solid transparent', borderRadius: 8,
            padding: '4px 10px', color: view === 'globe' ? '#f5d98b' : '#8b6914',
            cursor: 'pointer', fontSize: 13, fontWeight: view === 'globe' ? 600 : 400,
          }}>✦ גלוב</button>
          {(view === 'city' || view === 'street') && cityInfo && (
            <>
              <span style={{ color: '#3a2a10', fontSize: 11 }}>›</span>
              <button onClick={() => setView('city')} style={{
                background: view === 'city' ? '#c9a22715' : 'none',
                border: 'none', borderRadius: 8, padding: '4px 10px',
                color: view === 'city' ? '#f5d98b' : '#8b6914', cursor: 'pointer', fontSize: 13,
              }}>{cityInfo.name}</button>
            </>
          )}
          {view === 'street' && (
            <>
              <span style={{ color: '#3a2a10', fontSize: 11 }}>›</span>
              <span style={{ color: '#f5d98b', fontSize: 13, fontWeight: 600 }}>רחוב</span>
            </>
          )}
        </div>
        <span style={{ color: '#4ade80', fontSize: 11 }}>● {points.length} מקומות · {globePeople.length} אנשים</span>
      </motion.div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ x: 240, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: 240, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                width: 260, minWidth: 260,
                background: 'linear-gradient(180deg, #0d0702ee, #08050299)',
                backdropFilter: 'blur(16px)', borderLeft: '1px solid #c9a22715',
                overflowY: 'auto', flexShrink: 0, zIndex: 30,
              }}>
              <div style={{ padding: '1rem' }}>
                {/* Search */}
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="חיפוש..." style={{
                    width: '100%', boxSizing: 'border-box', background: '#1a0f0566',
                    border: '1px solid #c9a22722', borderRadius: 10, padding: '8px 12px',
                    color: '#f5e6c8', fontSize: 13, outline: 'none', marginBottom: 12,
                    fontFamily: '"Heebo", sans-serif',
                  }} />

                {/* All button */}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedPerson(null); setPlaying(false) }}
                  style={{
                    width: '100%', textAlign: 'right',
                    background: !selectedPerson ? '#c9a22718' : 'transparent',
                    color: !selectedPerson ? '#f5d98b' : '#8b6914',
                    border: `1px solid ${!selectedPerson ? '#c9a22744' : 'transparent'}`,
                    borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                    marginBottom: 6, fontSize: 13, fontFamily: '"Heebo", sans-serif',
                  }}>כולם ({globePeople.length})</motion.button>

                {loading && (
                  <div style={{ color: '#5a3a1a', fontSize: 12, textAlign: 'center', padding: '2rem 0' }}>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>✦</motion.span> טוען...
                  </div>
                )}

                {/* People list */}
                {filteredPeople.map((p, i) => (
                  <motion.button key={p.id}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => { setSelectedPerson(p); setPlaying(false); setPlayIndex(0) }}
                    style={{
                      width: '100%', textAlign: 'right',
                      background: selectedPerson?.id === p.id ? 'linear-gradient(135deg, #c9a22718, #c9a22708)' : 'transparent',
                      color: selectedPerson?.id === p.id ? '#f5d98b' : '#b89a5a',
                      border: `1px solid ${selectedPerson?.id === p.id ? '#c9a22744' : 'transparent'}`,
                      borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                      marginBottom: 3, fontSize: 13, display: 'flex', flexDirection: 'column',
                      alignItems: 'flex-start', fontFamily: '"Heebo", sans-serif', transition: 'all 0.15s',
                    }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                      {p.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#5a3a1a' }}>{personStopCount(p.id)} תחנות</span>
                  </motion.button>
                ))}

                {/* Stations for selected person */}
                {selectedPerson && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginTop: 12, borderTop: '1px solid #c9a22715', paddingTop: 12 }}>
                    <div style={{
                      fontSize: 11, color: '#c9a227', marginBottom: 8, fontWeight: 600,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span>✦ תחנות נדידה</span>
                      {personStops.length > 1 && (
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { setPlaying(!playing); if (!playing) setPlayIndex(0) }}
                          style={{
                            background: playing ? '#c9a22733' : 'transparent',
                            border: '1px solid #c9a22744', borderRadius: 6, padding: '3px 8px',
                            color: '#c9a227', cursor: 'pointer', fontSize: 11, fontFamily: '"Heebo", sans-serif',
                          }}>{playing ? '⏸ עצור' : '▶ נגן מסע'}</motion.button>
                      )}
                    </div>

                    {personStops.map((s, i) => {
                      const yearStr = s.year ? (s.is_bce ? `${Math.abs(s.year)} לפנה"ס` : `${s.year}`) : ''
                      return (
                        <motion.div key={s.id}
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0, scale: playing && playIndex === i ? 1.03 : 1 }}
                          transition={{ delay: i * 0.05 }}
                          style={{
                            background: playing && playIndex === i ? 'linear-gradient(135deg, #c9a22722, #c9a22708)' : '#0d070266',
                            border: `1px solid ${playing && playIndex === i ? '#c9a22766' : '#1a0f05'}`,
                            borderRadius: 10, padding: '10px 12px', marginBottom: 6, fontSize: 12, transition: 'all 0.3s',
                          }}>
                          <div style={{ color: '#f5e6c8', fontWeight: 600, fontSize: 13, fontFamily: '"Playfair Display", serif' }}>
                            {[s.city, s.country].filter(Boolean).join(', ')}
                          </div>
                          {yearStr && <div style={{ color: '#5a3a1a', fontSize: 11, marginTop: 2 }}>{yearStr}</div>}
                          {s.note && <div style={{ color: '#8b6914', marginTop: 3, fontSize: 11, lineHeight: 1.5 }}>{s.note}</div>}
                        </motion.div>
                      )
                    })}

                    {personStops.length === 0 && (
                      <div style={{ color: '#3a2a10', fontSize: 12 }}>אין תחנות.</div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle sidebar */}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            position: 'absolute', right: sidebarOpen ? 260 : 0, top: '50%', transform: 'translateY(-50%)',
            background: 'linear-gradient(180deg, #1e140aee, #0d0702ee)', backdropFilter: 'blur(8px)',
            border: '1px solid #c9a22733', borderRight: 'none', borderRadius: '8px 0 0 8px',
            color: '#c9a227', cursor: 'pointer', padding: '12px 6px', zIndex: 35,
            transition: 'right 0.3s', fontSize: 12, writingMode: 'vertical-rl',
          }}>{sidebarOpen ? '◀' : '▶'}</motion.button>

        {/* Map area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Globe */}
          <div style={{
            position: 'absolute', inset: 0, display: view === 'globe' ? 'block' : 'none', zIndex: 1,
          }}>
            <GlobeView points={points} arcs={arcs} onPointClick={handlePointClick} focusCoords={focusCoords} />
            {points.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}
                style={{
                  position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(180deg, #1e140aee, #0d0702ee)', backdropFilter: 'blur(12px)',
                  border: '1px solid #c9a22722', borderRadius: 14, padding: '8px 20px',
                  fontSize: 12, color: '#8b6914', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5,
                  fontFamily: '"Heebo", sans-serif', boxShadow: '0 4px 20px #0006',
                }}>לחץ על נקודה לפרטים · בחר אדם לראות מסלול</motion.div>
            )}
          </div>

          {/* City */}
          {view === 'city' && cityInfo && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <CityView lat={cityInfo.lat} lng={cityInfo.lng} placeName={cityInfo.name} onStreetView={handleStreetView}
                stops={stops.filter(s => s.lat && s.lng && Math.abs(s.lat! - cityInfo.lat) < 1 && Math.abs(s.lng! - cityInfo.lng) < 1).map(s => ({
                  lat: s.lat!, lng: s.lng!, city: s.city, country: s.country,
                  year: s.year, personName: globePeople.find(p => p.id === s.globe_person_id)?.name || '',
                  stop_type: s.stop_type, address: s.address,
                }))} />
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'linear-gradient(180deg, #1e140aee, #0d0702ee)',
                  backdropFilter: 'blur(16px)', border: '1px solid #c9a22744',
                  borderRadius: 16, padding: '16px 20px', minWidth: 200, maxHeight: '60vh',
                  overflowY: 'auto', zIndex: 10, boxShadow: '0 8px 32px #000a',
                }}>
                <div style={{ fontWeight: 700, color: '#f5e6c8', marginBottom: 6, fontFamily: '"Playfair Display", serif', fontSize: 16 }}>{cityInfo.name}</div>
                <div style={{ color: '#5a3a1a', fontSize: 11, marginBottom: 12 }}>לחץ במפה לזום לרחוב</div>
                {cityInfo.people.map(p => (
                  <a key={p.id} href={`/${locale}/people/${p.id}`} style={{
                    display: 'block', color: '#b89a5a', textDecoration: 'none', padding: '4px 0', fontSize: 13,
                    fontFamily: '"Heebo", sans-serif',
                  }}>✦ {p.name}</a>
                ))}
              </motion.div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setView('globe')}
                style={{
                  position: 'absolute', bottom: 24, right: 24,
                  background: '#1e140aee', border: '1px solid #c9a22744',
                  color: '#c9a227', padding: '10px 18px', borderRadius: 10,
                  cursor: 'pointer', fontSize: 13, zIndex: 10, fontFamily: '"Heebo", sans-serif', fontWeight: 600,
                }}>← גלוב</motion.button>
            </div>
          )}

          {/* Street */}
          {view === 'street' && streetCoords && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <StreetView lat={streetCoords.lat} lng={streetCoords.lng} />
              <div style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', gap: 8, zIndex: 1000 }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setView('city')}
                  style={{ background: '#1e140aee', border: '1px solid #c9a22744', color: '#c9a227', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: '"Heebo", sans-serif' }}>← עיר</motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setView('globe')}
                  style={{ background: '#1e140aee', border: '1px solid #8b691444', color: '#8b6914', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: '"Heebo", sans-serif' }}>← גלוב</motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    <FloatingEditButton editPath="migration-edit" />
    </main>
  )
}

'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { supabase } from '@/lib/supabase'

// Dynamic imports
const GlobePreview = dynamic(() => import('./components/GlobePreview'), { ssr: false })
import TabPeople from './components/TabPeople'
import TabStops from './components/TabStops'
import TabRoutes from './components/TabRoutes'
import TabTreeLinks from './components/TabTreeLinks'
import TabSettings from './components/TabSettings'
import TabTools from './components/TabTools'

// Types
export type GlobePerson = {
  id: string; name: string; color: string; symbol: string
  visible: boolean; sort_order: number; tree_person_id?: number
  stop_count?: number
}
export type GlobeStop = {
  id: string; globe_person_id: string; year?: number; is_bce: boolean
  month?: number; day?: number; year_hebrew?: string
  month_hebrew?: string; day_hebrew?: string
  country?: string; city?: string; address?: string
  lat?: number; lng?: number; stop_type: string
  note?: string; photo_url?: string; sources?: string[]
  is_public: boolean; priority: string; sort_order: number
  person_name?: string
}
export type GlobeRoute = {
  id: string; globe_person_id: string
  from_stop_id: string; to_stop_id: string
  travel_type: string; note?: string; duration?: string
}
export type GlobeSettings = {
  bg_color: string; show_stars: boolean; star_count: number
  star_size: number; show_atmosphere: boolean; atmosphere_intensity: number
  line_width: number; point_size: number; show_country_names: boolean
  show_stop_names: string; animation_speed: number; auto_rotate: boolean
  rotate_speed: number; auto_play: boolean; loop_animation: boolean
  show_timeline: boolean; year_format: string; show_milestones: boolean
  allow_street_zoom: boolean; map_style: string
}

const TABS = [
  { id: 'people', label: '👥 אנשים', icon: '👥' },
  { id: 'stops', label: '📍 תחנות', icon: '📍' },
  { id: 'routes', label: '🛤️ מסלולים', icon: '🛤️' },
  { id: 'tree', label: '🌳 קשרי עץ', icon: '🌳' },
  { id: 'settings', label: '⚙️ הגדרות', icon: '⚙️' },
  { id: 'tools', label: '🔧 כלים', icon: '🔧' },
]

export default function GlobeEditPage() {
  const { id: familyId, locale } = useParams() as { id: string; locale: string }
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('people')
  const [people, setPeople] = useState<GlobePerson[]>([])
  const [stops, setStops] = useState<GlobeStop[]>([])
  const [routes, setRoutes] = useState<GlobeRoute[]>([])
  const [settings, setSettings] = useState<GlobeSettings | null>(null)
  const [treePeople, setTreePeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [focusCoords, setFocusCoords] = useState<{lat:number;lng:number}|null>(null)
  const [highlightPersonId, setHighlightPersonId] = useState<string|null>(null)

  const headerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Load all data ──
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, sRes, rRes, settRes, treeRes] = await Promise.all([
        supabase.from('globe_people').select('*').eq('family_id', familyId).order('sort_order'),
        supabase.from('globe_stops').select('*').order('year').order('sort_order'),
        supabase.from('globe_routes').select('*'),
        supabase.from('globe_settings').select('*').eq('family_id', familyId).maybeSingle(),
        supabase.from('people').select('id,first_name,last_name,photo_url,birth_date,death_date,family_id').eq('family_id', familyId),
      ])

      if (pRes.error) console.error('globe_people error:', pRes.error)
      if (sRes.error) console.error('globe_stops error:', sRes.error)
      if (rRes.error) console.error('globe_routes error:', rRes.error)

      const ppl = (pRes.data || []) as GlobePerson[]
      const pplMap = new Map(ppl.map(p => [p.id, p.name]))
      const pplIds = ppl.map(p => p.id)

      // Enrich stops with person name and filter by family
      const allStops = (sRes.data || []).filter((s: any) => pplIds.includes(s.globe_person_id))
      const stopsWithNames = allStops.map((s: any) => ({
        ...s,
        person_name: pplMap.get(s.globe_person_id) || '',
      }))

      // Count stops per person
      const stopCounts: Record<string, number> = {}
      stopsWithNames.forEach((s: GlobeStop) => {
        stopCounts[s.globe_person_id] = (stopCounts[s.globe_person_id] || 0) + 1
      })
      const pplWithCounts = ppl.map(p => ({ ...p, stop_count: stopCounts[p.id] || 0 }))

      // Filter routes by family people
      const allRoutes = (rRes.data || []).filter((r: any) => pplIds.includes(r.globe_person_id))

      setPeople(pplWithCounts)
      setStops(stopsWithNames)
      setRoutes(allRoutes)
      setSettings(settRes.data || defaultSettings())
      setTreePeople(treeRes.data || [])
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [familyId])

  useEffect(() => { loadData() }, [loadData])

  // ── GSAP entrance ──
  useEffect(() => {
    if (!loading && headerRef.current && panelRef.current) {
      const tl = gsap.timeline()
      tl.fromTo(headerRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' })
      tl.fromTo(panelRef.current, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3')
    }
  }, [loading])

  // ── Log history ──
  const logHistory = useCallback(async (action: string, entityType: string, entityId?: string, details?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('globe_history').insert({
        family_id: parseInt(familyId),
        user_id: user?.id || null,
        action, entity_type: entityType, entity_id: entityId,
        details: details || {},
      })
    } catch (err) {
      console.warn('History log failed:', err)
    }
  }, [familyId])

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, #0a0d1a, #030508)',
      }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 48, color: '#c9a227' }}>✦</motion.div>
      </div>
    )
  }

  return (
    <main dir="rtl" style={{
      height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: '#030508', color: '#f5e6c8',
      fontFamily: '"Heebo", Arial, sans-serif',
    }}>

      {/* ── Header ── */}
      <div ref={headerRef} style={{
        background: 'linear-gradient(180deg, #0d0702ee, #0d0702cc)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #c9a22722',
        padding: '0.4rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{
            background: 'none', border: '1px solid #c9a22733', borderRadius: 8,
            padding: '5px 12px', color: '#c9a227', cursor: 'pointer', fontSize: 13,
          }}>→ חזרה</button>
          <span style={{ fontSize: 18, color: '#c9a227' }}>✦</span>
          <span style={{ fontWeight: 600, fontSize: 15, fontFamily: '"Playfair Display", serif' }}>
            עריכת גלובוס מסעות
          </span>
        </div>

        {/* Global search */}
        <div style={{ position: 'relative', width: 280 }}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש שם, מקום, שנה..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#1a0f0566', border: '1px solid #c9a22722',
              borderRadius: 10, padding: '6px 12px 6px 30px',
              color: '#f5e6c8', fontSize: 13, outline: 'none',
              fontFamily: '"Heebo", sans-serif',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#c9a22766'}
            onBlur={e => e.currentTarget.style.borderColor = '#c9a22722'}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#5a3a1a' }}>🔍</span>
        </div>

        <a href={`/${locale}/families/${familyId}/map`} target="_blank" style={{
          background: 'transparent', border: '1px solid #c9a22766',
          borderRadius: 8, padding: '5px 14px', color: '#c9a227',
          textDecoration: 'none', fontSize: 13,
        }}>תצוגה מקדימה ↗</a>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Globe preview (70%) ── */}
        <div style={{ flex: 7, position: 'relative', overflow: 'hidden' }}>
          <GlobePreview
            people={people}
            stops={stops}
            routes={routes}
            settings={settings}
            search={search}
            focusCoords={focusCoords}
            highlightPersonId={highlightPersonId}
          />
        </div>

        {/* ── Edit panel (30%) ── */}
        <div ref={panelRef} style={{
          flex: 3, minWidth: 360, maxWidth: 500,
          background: 'linear-gradient(180deg, #0d0702, #080502)',
          borderRight: '1px solid #c9a22715',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 2, padding: '6px 8px',
            borderBottom: '1px solid #c9a22715',
            overflowX: 'auto', flexShrink: 0,
            scrollbarWidth: 'none',
          }}>
            {TABS.map(tab => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? '#c9a22718' : 'transparent',
                  border: `1px solid ${activeTab === tab.id ? '#c9a22755' : 'transparent'}`,
                  borderRadius: 8, padding: '5px 10px',
                  color: activeTab === tab.id ? '#f5d98b' : '#5a3a1a',
                  cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
                  fontFamily: '"Heebo", sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
                {activeTab === 'people' && (
                  <TabPeople
                    people={people} treePeople={treePeople}
                    familyId={familyId} onRefresh={loadData}
                    onHighlight={setHighlightPersonId}
                    logHistory={logHistory}
                  />
                )}
                {activeTab === 'stops' && (
                  <TabStops
                    stops={stops} people={people}
                    familyId={familyId} onRefresh={loadData}
                    onFocus={setFocusCoords}
                    logHistory={logHistory}
                  />
                )}
                {activeTab === 'routes' && (
                  <TabRoutes
                    routes={routes} stops={stops} people={people}
                    familyId={familyId} onRefresh={loadData}
                    logHistory={logHistory}
                  />
                )}
                {activeTab === 'tree' && (
                  <TabTreeLinks
                    people={people} treePeople={treePeople}
                    familyId={familyId} onRefresh={loadData}
                    logHistory={logHistory}
                  />
                )}
                {activeTab === 'settings' && (
                  <TabSettings
                    settings={settings!}
                    familyId={familyId}
                    onRefresh={loadData}
                  />
                )}
                {activeTab === 'tools' && (
                  <TabTools
                    people={people} stops={stops} routes={routes}
                    familyId={familyId} onRefresh={loadData}
                    logHistory={logHistory}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}

function defaultSettings(): GlobeSettings {
  return {
    bg_color: '#030508', show_stars: true, star_count: 2000, star_size: 1,
    show_atmosphere: true, atmosphere_intensity: 0.2, line_width: 1.5,
    point_size: 1, show_country_names: false, show_stop_names: 'zoom',
    animation_speed: 1, auto_rotate: true, rotate_speed: 0.3,
    auto_play: false, loop_animation: true, show_timeline: true,
    year_format: 'both', show_milestones: true, allow_street_zoom: true,
    map_style: 'satellite',
  }
}

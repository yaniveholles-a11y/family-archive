'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { supabase } from '@/lib/supabase'

const TreePreview = dynamic(() => import('./components/TreePreview'), { ssr: false })
import TabPeople from './components/TabPeople'
import TabRelations from './components/TabRelations'
import TabViews from './components/TabViews'
import TabImport from './components/TabImport'
import TabTreeSettings from './components/TabTreeSettings'
import TabTreeTools from './components/TabTreeTools'

export type TreePerson = {
  id: number; first_name: string; last_name: string; nickname?: string
  maiden_name?: string; gender?: string
  birth_date?: string; birth_place?: string; birth_is_bce?: boolean; birth_is_approximate?: boolean
  birth_year_hebrew?: string
  death_date?: string; death_place?: string; death_is_bce?: boolean; death_is_approximate?: boolean
  death_year_hebrew?: string; is_alive?: boolean
  profession?: string; religion?: string; origin_country?: string; languages?: string
  bio?: string; notes_internal?: string
  photo_url?: string; photos_gallery?: string[]
  is_public?: boolean; globe_person_id?: string; family_id?: number
}

export type TreeRelation = {
  id: string; person_a_id: number; person_b_id: number
  relation_type: string; marriage_year?: number; marriage_is_bce?: boolean
  divorce_year?: number; divorce_is_bce?: boolean; note?: string
}

export type TreeSettings = {
  title?: string; date_language: string; bce_format: string
  show_approximate: boolean; visibility: string; allow_pdf: boolean
  primary_color: string; card_style: string; font_family: string
  popup_photo_size: string; popup_show_gallery: boolean; popup_show_globe: boolean
  blood_line_color: string; blood_line_width: number; blood_line_style: string
  spouse_line_color: string; spouse_line_width: number; spouse_line_style: string
  card_size: string; generation_gap: number; sibling_gap: number; tree_direction: string
}

const TABS = [
  { id: 'people', label: '👥 אנשים' },
  { id: 'relations', label: '🔗 קשרים' },
  { id: 'views', label: '👁️ תצוגות' },
  { id: 'import', label: '📥 ייבוא' },
  { id: 'settings', label: '⚙️ הגדרות' },
  { id: 'tools', label: '🔧 כלים' },
]

export default function TreeEditPage() {
  const { id: familyId, locale } = useParams() as { id: string; locale: string }
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('people')
  const [people, setPeople] = useState<TreePerson[]>([])
  const [relations, setRelations] = useState<TreeRelation[]>([])
  const [settings, setSettings] = useState<TreeSettings | null>(null)
  const [globePeople, setGlobePeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [centerId, setCenterId] = useState<number | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, rRes, sRes, gRes] = await Promise.all([
        supabase.from('people').select('*').eq('family_id', familyId),
        supabase.from('tree_relationships').select('*').eq('family_id', familyId),
        supabase.from('tree_settings').select('*').eq('family_id', familyId).maybeSingle(),
        supabase.from('globe_people').select('id,name').eq('family_id', familyId),
      ])
      setPeople(pRes.data || [])
      setRelations(rRes.data || [])
      setSettings(sRes.data || defaultTreeSettings())
      setGlobePeople(gRes.data || [])
    } catch (err) { console.error('Load error:', err) }
    finally { setLoading(false) }
  }, [familyId])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!loading && headerRef.current && panelRef.current) {
      const tl = gsap.timeline()
      tl.fromTo(headerRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' })
      tl.fromTo(panelRef.current, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3')
    }
  }, [loading])

  const logHistory = useCallback(async (action: string, entityType: string, entityId?: string, details?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('tree_history').insert({
        family_id: parseInt(familyId), user_id: user?.id || null,
        action, entity_type: entityType, entity_id: entityId, details: details || {},
      })
    } catch {}
  }, [familyId])

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 0%, #1a0f05, #0d0702)' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: 48, color: '#c9a227' }}>✦</motion.div>
    </div>
  )

  return (
    <main dir="rtl" style={{
      height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: '#0d0702', color: '#f5e6c8', fontFamily: '"Heebo", Arial, sans-serif',
    }}>
      {/* Header */}
      <div ref={headerRef} style={{
        background: 'linear-gradient(180deg, #0d0702ee, #0d0702cc)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #c9a22722', padding: '0.4rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{
            background: 'none', border: '1px solid #c9a22733', borderRadius: 8,
            padding: '5px 12px', color: '#c9a227', cursor: 'pointer', fontSize: 13,
          }}>→ חזרה</button>
          <span style={{ fontSize: 18, color: '#c9a227' }}>🌳</span>
          <span style={{ fontWeight: 600, fontSize: 15, fontFamily: '"Playfair Display", serif' }}>עריכת עץ משפחה</span>
        </div>
        <div style={{ position: 'relative', width: 280 }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש שם, מקום, שנה..."
            style={{
              width: '100%', boxSizing: 'border-box', background: '#1a0f0566',
              border: '1px solid #c9a22722', borderRadius: 10, padding: '6px 12px 6px 30px',
              color: '#f5e6c8', fontSize: 13, outline: 'none', fontFamily: '"Heebo", sans-serif',
            }} />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#5a3a1a' }}>🔍</span>
        </div>
        <a href={`/${locale}/families/${familyId}/tree`} target="_blank" style={{
          background: 'transparent', border: '1px solid #c9a22766', borderRadius: 8,
          padding: '5px 14px', color: '#c9a227', textDecoration: 'none', fontSize: 13,
        }}>תצוגה מקדימה ↗</a>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Tree preview (65%) */}
        <div style={{ flex: 65, position: 'relative', overflow: 'hidden' }}>
          <TreePreview
            people={people} relations={relations} settings={settings}
            search={search} centerId={centerId} locale={locale}
          />
        </div>

        {/* Edit panel (35%) */}
        <div ref={panelRef} style={{
          flex: 35, minWidth: 380, maxWidth: 520,
          background: 'linear-gradient(180deg, #0d0702, #080502)',
          borderRight: '1px solid #c9a22715',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', gap: 2, padding: '6px 8px',
            borderBottom: '1px solid #c9a22715', overflowX: 'auto', flexShrink: 0,
            scrollbarWidth: 'none',
          }}>
            {TABS.map(tab => (
              <motion.button key={tab.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? '#c9a22718' : 'transparent',
                  border: `1px solid ${activeTab === tab.id ? '#c9a22755' : 'transparent'}`,
                  borderRadius: 8, padding: '5px 10px', color: activeTab === tab.id ? '#f5d98b' : '#5a3a1a',
                  cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', fontFamily: '"Heebo", sans-serif',
                }}>{tab.label}</motion.button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
                {activeTab === 'people' && <TabPeople people={people} globePeople={globePeople} familyId={familyId} locale={locale} onRefresh={loadData} onCenter={setCenterId} logHistory={logHistory} />}
                {activeTab === 'relations' && <TabRelations people={people} relations={relations} familyId={familyId} onRefresh={loadData} logHistory={logHistory} />}
                {activeTab === 'views' && <TabViews settings={settings!} familyId={familyId} onRefresh={loadData} />}
                {activeTab === 'import' && <TabImport people={people} relations={relations} familyId={familyId} onRefresh={loadData} logHistory={logHistory} />}
                {activeTab === 'settings' && <TabTreeSettings settings={settings!} familyId={familyId} onRefresh={loadData} />}
                {activeTab === 'tools' && <TabTreeTools people={people} relations={relations} familyId={familyId} onRefresh={loadData} logHistory={logHistory} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}

function defaultTreeSettings(): TreeSettings {
  return {
    title: '', date_language: 'both', bce_format: 'hebrew', show_approximate: true,
    visibility: 'private', allow_pdf: false, primary_color: '#c9a227',
    card_style: 'dark', font_family: 'default', popup_photo_size: 'medium',
    popup_show_gallery: true, popup_show_globe: true,
    blood_line_color: '#c9a227', blood_line_width: 2, blood_line_style: 'curved',
    spouse_line_color: '#8b6914', spouse_line_width: 1.5, spouse_line_style: 'dashed',
    card_size: 'medium', generation_gap: 120, sibling_gap: 60, tree_direction: 'top-down',
  }
}

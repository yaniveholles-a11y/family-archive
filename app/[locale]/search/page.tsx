'use client'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Result = {
  id: number; title: string; subtitle: string; type: 'person' | 'document' | 'event'
  url: string; score: number
}

const TYPE_COLORS = { person: '#378ADD', document: '#4a9e6a', event: '#9a6ab0' }
const TYPE_LABELS = { person: 'אדם', document: 'מסמך', event: 'אירוע' }
const TYPE_ICONS = { person: '👤', document: '📄', event: '📅' }

function SearchInner() {
  const { locale } = useParams() as { locale: string }
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'person' | 'document' | 'event'>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (initialQ) run(initialQ) }, [])
  useEffect(() => { inputRef.current?.focus() }, [])

  async function run(q: string) {
    if (!q.trim()) return
    setLoading(true); setSearched(false)
    const q2 = q.trim().toLowerCase()
    const all: Result[] = []

    const [{ data: people }, { data: events }, { data: docs }] = await Promise.all([
      supabase.from('people').select('id, first_name, last_name, birth_date, birth_place').limit(50),
      supabase.from('events').select('id, title, event_date, description').limit(50),
      supabase.from('documents').select('id, title, doc_type, doc_date').limit(50),
    ])

    for (const p of people || []) {
      const name = (p.first_name + ' ' + p.last_name).toLowerCase()
      if (name.includes(q2) || (p.birth_place || '').toLowerCase().includes(q2)) {
        all.push({
          id: p.id, type: 'person',
          title: [p.first_name, p.last_name].filter(Boolean).join(' '),
          subtitle: [p.birth_date?.substring(0, 4), p.birth_place].filter(Boolean).join(' · ') || '',
          url: `/${locale}/people/${p.id}`,
          score: name.startsWith(q2) ? 2 : 1,
        })
      }
    }
    for (const e of events || []) {
      if ((e.title || '').toLowerCase().includes(q2) || (e.description || '').toLowerCase().includes(q2)) {
        all.push({
          id: e.id, type: 'event',
          title: e.title || '',
          subtitle: e.event_date?.substring(0, 4) || '',
          url: `/${locale}/timeline`,
          score: (e.title || '').toLowerCase().startsWith(q2) ? 2 : 1,
        })
      }
    }
    for (const d of docs || []) {
      if ((d.title || '').toLowerCase().includes(q2) || (d.doc_type || '').toLowerCase().includes(q2)) {
        all.push({
          id: d.id, type: 'document',
          title: d.title || '',
          subtitle: [d.doc_type, d.doc_date?.substring(0, 4)].filter(Boolean).join(' · '),
          url: `/${locale}/documents`,
          score: (d.title || '').toLowerCase().startsWith(q2) ? 2 : 1,
        })
      }
    }

    all.sort((a, b) => b.score - a.score)
    setResults(all)
    setLoading(false)
    setSearched(true)
  }

  const filtered = activeTab === 'all' ? results : results.filter(r => r.type === activeTab)
  const tabs: Array<'all' | 'person' | 'document' | 'event'> = ['all', 'person', 'document', 'event']
  const tabLabels: Record<string, string> = { all: 'הכל', person: 'אנשים', document: 'מסמכים', event: 'אירועים' }
  const counts: Record<string, number> = {
    all: results.length,
    person: results.filter(r => r.type === 'person').length,
    document: results.filter(r => r.type === 'document').length,
    event: results.filter(r => r.type === 'event').length,
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>

      {/* Search hero */}
      <div style={{ background: 'rgba(26,15,5,0.6)', borderBottom: '1px solid rgba(201,162,39,0.1)', padding: '2.5rem 2rem 2rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <motion.h1
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', color: '#f5d98b', marginBottom: '1.25rem', textAlign: 'center' }}
          >חיפוש בארכיון</motion.h1>
          <form onSubmit={e => { e.preventDefault(); run(query) }} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#3a2a10', pointerEvents: 'none', fontSize: '1.1rem' }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="חפש אנשים, מסמכים, אירועים..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(13,7,2,0.85)', border: '1px solid rgba(201,162,39,0.25)',
                borderRadius: '14px', padding: '0.9rem 2.8rem 0.9rem 1rem',
                color: '#f0e8d0', fontSize: '1rem', fontFamily: '"Heebo", Arial, sans-serif',
                outline: 'none', direction: 'rtl',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.55)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.25)')}
            />
            <motion.button type="submit"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              style={{
                position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                background: 'linear-gradient(135deg, #c9a227, #a68520)',
                color: '#0d0702', border: 'none', borderRadius: '10px',
                padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
                fontFamily: '"Heebo", Arial, sans-serif',
              }}
            >חפש</motion.button>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 2rem' }}>
        {/* Tabs */}
        {searched && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{
                  background: activeTab === t ? 'rgba(201,162,39,0.12)' : 'transparent',
                  color: activeTab === t ? '#f5d98b' : '#5a3a1a',
                  border: `1px solid ${activeTab === t ? 'rgba(201,162,39,0.35)' : 'rgba(201,162,39,0.08)'}`,
                  borderRadius: '20px', padding: '0.35rem 1rem',
                  cursor: 'pointer', fontSize: '0.82rem',
                  fontFamily: '"Heebo", Arial, sans-serif', transition: 'all 0.2s',
                }}
              >{tabLabels[t]} {counts[t] > 0 && <span style={{ opacity: 0.6 }}>({counts[t]})</span>}</button>
            ))}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '2rem', color: '#c9a227' }}>✦</motion.div>
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {searched && !loading && (
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#3a2a10' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  <div>לא נמצאו תוצאות עבור "{query}"</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {filtered.map((r, i) => (
                    <motion.a
                      key={`${r.type}-${r.id}`}
                      href={r.url}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ x: -4 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.08)',
                        borderRight: `3px solid ${TYPE_COLORS[r.type]}`,
                        borderRadius: '10px', padding: '0.85rem 1.1rem',
                        textDecoration: 'none', color: 'inherit', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(26,15,5,0.95)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(26,15,5,0.7)')}
                    >
                      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{TYPE_ICONS[r.type]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#f5d98b', fontSize: '0.95rem' }}>{r.title}</div>
                        {r.subtitle && <div style={{ fontSize: '0.78rem', color: '#3a2a10', marginTop: '0.2rem' }}>{r.subtitle}</div>}
                      </div>
                      <span style={{
                        fontSize: '0.7rem', color: TYPE_COLORS[r.type],
                        background: TYPE_COLORS[r.type] + '15',
                        border: `1px solid ${TYPE_COLORS[r.type]}30`,
                        borderRadius: '6px', padding: '0.2rem 0.5rem', flexShrink: 0,
                      }}>{TYPE_LABELS[r.type]}</span>
                    </motion.a>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!searched && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }}
            style={{ textAlign: 'center', padding: '5rem 2rem', color: '#3a2a10' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
            <div style={{ fontSize: '0.9rem' }}>הקלד שם אדם, שנה, מקום או מילת מפתח</div>
          </motion.div>
        )}
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080606' }} />}>
      <SearchInner />
    </Suspense>
  )
}

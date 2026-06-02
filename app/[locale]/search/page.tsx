'use client'
import { useParams } from "next/navigation"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Result = { type: string; id: number; person_id?: number; title: string; sub?: string; href: string; icon: string }
type PersonRaw = { id: number; first_name: string; last_name: string; birth_place?: string; bio?: string }

export default function SearchPage() {
  const { locale } = useParams() as { locale: string }
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [allPeople, setAllPeople] = useState<PersonRaw[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'documents' | 'events'>('all')
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      // טען את כל האנשים לחיפוש חכם
      const { data } = await supabase.from('people').select('id, first_name, last_name, birth_place, bio')
      setAllPeople(data || [])
      setAuthChecked(true)
    }
    check()

    // Ctrl+K / Cmd+K
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function fuzyMatch(text: string, q: string): boolean {
    const t = text.toLowerCase()
    const words = q.toLowerCase().split(' ').filter(Boolean)
    return words.every(w => t.includes(w))
  }

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    // חיפוש חכם עם fuzzy matching על אנשים
    const matchedPeople = allPeople.filter(p => {
      const fullName = p.first_name + ' ' + p.last_name
      return fuzyMatch(fullName, query) ||
        fuzyMatch(p.first_name, query) ||
        fuzyMatch(p.last_name, query) ||
        (p.birth_place && fuzyMatch(p.birth_place, query)) ||
        (p.bio && fuzyMatch(p.bio, query))
    })

    const [{ data: documents }, { data: events }] = await Promise.all([
      supabase.from('documents').select('*, person:person_id(first_name, last_name)').ilike('title', `%${query}%`),
      supabase.from('timeline_events').select('*, person:person_id(first_name, last_name)').or(`title.ilike.%${query}%,description.ilike.%${query}%`),
    ])

    const all: Result[] = []
    for (const p of matchedPeople) {
      all.push({ type: 'person', id: p.id, title: p.first_name + ' ' + p.last_name, sub: p.birth_place, href: '/people/' + p.id, icon: '👤' })
    }
    for (const d of documents || []) {
      all.push({ type: 'document', id: d.id, person_id: d.person_id, title: d.title, sub: d.person ? d.person.first_name + ' ' + d.person.last_name : '', href: '/people/' + d.person_id + '/documents', icon: '📄' })
    }
    for (const e of events || []) {
      all.push({ type: 'event', id: e.id, person_id: e.person_id, title: e.title, sub: e.person ? e.person.first_name + ' ' + e.person.last_name : '', href: '/people/' + e.person_id + '/timeline', icon: '📅' })
    }

    setResults(all)
    setLoading(false)
  }

  if (!authChecked) return (
    <main style={{ minHeight: '100vh', background: '#1c1008', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#b89a5a' }}>טוען...</p>
    </main>
  )

  const filtered = activeTab === 'all' ? results : results.filter(r => {
    if (activeTab === 'people') return r.type === 'person'
    if (activeTab === 'documents') return r.type === 'document'
    if (activeTab === 'events') return r.type === 'event'
    return true
  })

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={`/${locale}/dashboard`} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ לוח בקרה</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>חיפוש</span>
        <span style={{ fontSize: '0.75rem', color: '#5a3a18', background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '6px', padding: '0.2rem 0.5rem' }}>Ctrl+K</span>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#f5d98b', marginBottom: '0.5rem' }}>חיפוש חכם</h1>
        <div style={{ width: '80px', height: '1px', background: '#c9a227', marginBottom: '1.5rem' }} />

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input
            id="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="חפש שם, מקום, מסמך... (Enter לחיפוש)"
            style={{ flex: 1, background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f5e6c8', fontSize: '0.95rem' }}
            autoFocus
          />
          <button
            onClick={search}
            style={{ background: '#c9a227', color: '#1a0f05', border: 'none', borderRadius: '8px', padding: '0.7rem 1.25rem', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'Arial' }}
          >
            חפש
          </button>
        </div>

        {searched && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {(['all', 'people', 'documents', 'events'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: activeTab === tab ? '#c9a227' : '#2a1a08',
                color: activeTab === tab ? '#1a0f05' : '#b89a5a',
                border: '1px solid #3a2a10', borderRadius: '20px',
                padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Arial'
              }}>
                {tab === 'all' ? `הכל (${results.length})` : tab === 'people' ? `אנשים (${results.filter(r => r.type === 'person').length})` : tab === 'documents' ? `מסמכים (${results.filter(r => r.type === 'document').length})` : `אירועים (${results.filter(r => r.type === 'event').length})`}
              </button>
            ))}
          </div>
        )}

        {loading && <p style={{ color: '#b89a5a', textAlign: 'center', padding: '2rem' }}>מחפש...</p>}
        {searched && !loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#b89a5a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <p>לא נמצאו תוצאות עבור "{query}"</p>
            <p style={{ fontSize: '0.85rem', color: '#5a3a18', marginTop: '0.5rem' }}>נסה מילה אחרת או חלק מהשם</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((r, i) => (
            <a
              key={i}
              href={r.href}
              style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '10px', padding: '1rem 1.25rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#3a2a10')}
            >
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#f5d98b' }}>{r.title}</div>
                {r.sub && <div style={{ fontSize: '0.82rem', color: '#b89a5a', marginTop: '2px' }}>{r.sub}</div>}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#5a3a18', background: '#1a0f05', borderRadius: '4px', padding: '0.15rem 0.4rem' }}>
                {r.type === 'person' ? 'אדם' : r.type === 'document' ? 'מסמך' : 'אירוע'}
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
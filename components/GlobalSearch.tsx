'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type SearchResult = { id: number | string; type: string; title: string; subtitle?: string; href: string; icon: string }

export default function GlobalSearch() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(true) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const q = query.trim()
      const items: SearchResult[] = []

      // Search people
      const { data: people } = await supabase.from('people')
        .select('id, first_name, last_name, birth_place')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,birth_place.ilike.%${q}%`)
        .limit(5)
      people?.forEach(p => items.push({
        id: p.id, type: 'person', icon: '👤',
        title: [p.first_name, p.last_name].filter(Boolean).join(' '),
        subtitle: p.birth_place || undefined,
        href: `/${locale}/people/${p.id}`,
      }))

      // Search families
      const { data: families } = await supabase.from('families')
        .select('id, name, name_en')
        .or(`name.ilike.%${q}%,name_en.ilike.%${q}%`)
        .limit(3)
      families?.forEach(f => items.push({
        id: f.id, type: 'family', icon: '🏛️',
        title: f.name, subtitle: f.name_en || undefined,
        href: `/${locale}/families/${f.id}`,
      }))

      // Search stories
      const { data: stories } = await supabase.from('stories')
        .select('id, title, author')
        .ilike('title', `%${q}%`)
        .limit(3)
      stories?.forEach(s => items.push({
        id: s.id, type: 'story', icon: '📝',
        title: s.title, subtitle: s.author || undefined,
        href: `/${locale}/stories`,
      }))

      // Search documents
      const { data: docs } = await supabase.from('documents')
        .select('id, title, doc_type')
        .ilike('title', `%${q}%`)
        .limit(3)
      docs?.forEach(d => items.push({
        id: d.id, type: 'document', icon: '📄',
        title: d.title, subtitle: d.doc_type || undefined,
        href: `/${locale}/documents`,
      }))

      setResults(items)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, locale])

  const go = (href: string) => { setOpen(false); setQuery(''); router.push(href) }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, background: '#000c', backdropFilter: 'blur(12px)', zIndex: 9000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}>
            <motion.div initial={{ scale: 0.95, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -20 }}
              onClick={e => e.stopPropagation()} dir="rtl"
              style={{ background: 'linear-gradient(180deg, #1e140a, #0d0702)', border: '1px solid #c9a22744', borderRadius: 20, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 20px 60px #000c' }}>
              
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #c9a22722', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, color: '#c9a227' }}>🔍</span>
                <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="חיפוש אנשים, משפחות, סיפורים, מסמכים..."
                  style={{ flex: 1, background: 'none', border: 'none', color: '#f5e6c8', fontSize: 15, outline: 'none', fontFamily: '"Heebo", sans-serif' }} />
                <kbd style={{ fontSize: 10, color: '#5a3a1a', background: '#1a0f05', padding: '2px 6px', borderRadius: 4, border: '1px solid #2a1a08' }}>ESC</kbd>
              </div>

              {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#c9a227', fontSize: 13 }}>מחפש...</div>}

              {results.length > 0 && (
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {results.map((r, i) => (
                    <motion.div key={`${r.type}-${r.id}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      onClick={() => go(r.href)}
                      style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: '1px solid #1a0f05', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#c9a22711'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontSize: 20 }}>{r.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, color: '#f5e6c8', fontWeight: 600 }}>{r.title}</div>
                        {r.subtitle && <div style={{ fontSize: 11, color: '#5a3a1a' }}>{r.subtitle}</div>}
                      </div>
                      <span style={{ marginRight: 'auto', fontSize: 10, color: '#3a2a10' }}>
                        {r.type === 'person' ? 'אדם' : r.type === 'family' ? 'משפחה' : r.type === 'story' ? 'סיפור' : 'מסמך'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {!loading && query.length >= 2 && results.length === 0 && (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: '#5a3a1a', fontSize: 13 }}>
                  לא נמצאו תוצאות ל-"{query}"
                </div>
              )}

              {!query && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#3a2a10', fontSize: 12 }}>
                  הקלד לפחות 2 תווים לחיפוש
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: '#1a0f0544', border: '1px solid #c9a22722', borderRadius: 10,
      padding: '6px 14px', color: '#5a3a1a', cursor: 'pointer', fontSize: 12,
      display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"Heebo", sans-serif',
    }}>
      🔍 חיפוש <kbd style={{ fontSize: 9, color: '#3a2a10', background: '#1a0f05', padding: '1px 4px', borderRadius: 3 }}>Ctrl+K</kbd>
    </button>
  )
}

'use client'
import { useParams } from 'next/navigation'
import { useState as useSearchState } from 'react'
import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase, getSession } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard',  icon: '🏠', label: 'לוח בקרה' },
  { href: '/people',     icon: '👥', label: 'אנשים'    },
  { href: '/tree',       icon: '🌳', label: 'עץ משפחה' },
  { href: '/gallery',    icon: '🖼️', label: 'גלריה'    },
  { href: '/map',        icon: '🌍', label: 'מפה'       },
  { href: '/timeline',   icon: '📅', label: 'ציר זמן'  },
  { href: '/book',       icon: '📖', label: 'ספר'       },
  { href: '/stories',    icon: '📝', label: 'סיפורים'   },
  { href: '/calendar',   icon: '📆', label: 'לוח שנה'  },
  { href: '/holocaust',  icon: '✡️', label: 'שואה'      },
]

// עמודים שבהם הנאבבר לא מופיע (יש להם header משלהם)
const HIDE_ON = ['/', '/he', '/en', '/nl', '/de', '/login', '/join']

export default function Navbar() {
  const { locale } = (useParams() || {}) as { locale?: string }
  const pathname  = usePathname()
  const router    = useRouter()
  const [user, setUser]           = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [results, setResults]     = useState<{ id: number; name: string; type: string; href: string }[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    getSession().then(s => setUser(s?.user?.email?.split('@')[0] || null))
  }, [])

  // הסתר בעמוד הבית ועמודי login/join
  const shouldHide = HIDE_ON.includes(pathname || '') ||
    pathname === null ||
    /^\/(he|en|nl|de)\/?$/.test(pathname || '') ||
    pathname?.includes('/login') ||
    pathname?.includes('/join')

  // Ctrl+K
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o) }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    const term = `%${q}%`
    const [{ data: ppl }, { data: fams }] = await Promise.all([
      supabase.from('people').select('id,first_name,last_name').or(`first_name.ilike.${term},last_name.ilike.${term}`).limit(7),
      supabase.from('families').select('id,name').ilike('name', term).limit(3),
    ])
    const r: typeof results = []
    for (const p of ppl || []) r.push({ id: p.id, name: `${[p.first_name, p.last_name].filter(Boolean).join(' ')}`, type: 'אדם', href: `/people/${p.id}` })
    for (const f of fams || []) r.push({ id: f.id, name: f.name, type: 'משפחה', href: `/families/${f.id}` })
    setResults(r)
    setSearching(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 250)
    return () => clearTimeout(t)
  }, [search, doSearch])

  if (shouldHide) return null

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <nav dir="rtl" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#0d0702f0',
        borderBottom: '1px solid #2a1a08',
        backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center',
        padding: '0 0.75rem', height: 48, gap: '0.2rem',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 2px 16px #00000066',
      }}>

        {/* Logo */}
        <a href={`/${locale}`} style={{
          color: '#c9a227', textDecoration: 'none',
          fontWeight: 'bold', fontSize: '1rem',
          marginLeft: '0.75rem', whiteSpace: 'nowrap', flexShrink: 0,
          letterSpacing: '0.02em',
        }}>
          📚 ארכיון
        </a>

        <div style={{ width: 1, height: 24, background: '#2a1a08', margin: '0 0.25rem', flexShrink: 0 }} />

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '0.15rem', flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {NAV.map(n => {
            const active = pathname?.includes(n.href.slice(1))
            return (
              <a key={n.href} href={`/${locale || "he"}${n.href}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.3rem 0.7rem',
                  borderRadius: 20,
                  textDecoration: 'none',
                  fontSize: '0.78rem',
                  whiteSpace: 'nowrap',
                  color: active ? '#0d0702' : '#c8b08a',
                  background: active ? '#c9a227' : '#1e1108',
                  fontWeight: active ? 'bold' : 'normal',
                  border: `1px solid ${active ? '#c9a227' : '#2a1808'}`,
                  transition: 'all .15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = '#2a1a08'
                    e.currentTarget.style.color = '#f5d98b'
                    e.currentTarget.style.borderColor = '#c9a22766'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = '#1e1108'
                    e.currentTarget.style.color = '#c8b08a'
                    e.currentTarget.style.borderColor = '#2a1808'
                  }
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </a>
            )
          })}
        </div>

        {/* Search */}
        <button onClick={() => setSearchOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            background: '#2a1a08', border: '1px solid #3a2a10',
            borderRadius: 20, padding: '0.3rem 0.9rem',
            color: '#b89a5a', cursor: 'pointer', fontSize: '0.78rem',
            whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a227'; e.currentTarget.style.color = '#c9a227' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a2a10'; e.currentTarget.style.color = '#b89a5a' }}>
          🔍 חיפוש
        </button>

        {/* Logout only */}
        {user && (
          <button onClick={logout}
            style={{
              background: 'none', border: '1px solid #2a1a08',
              borderRadius: 20, color: '#5a3a1a', cursor: 'pointer',
              fontSize: '0.72rem', padding: '0.28rem 0.7rem',
              transition: 'all .15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a22766'; e.currentTarget.style.color = '#c9a227' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a1a08'; e.currentTarget.style.color = '#5a3a1a' }}>
            יציאה
          </button>
        )}
      </nav>

      {/* Search modal */}
      {searchOpen && (
        <div onClick={() => setSearchOpen(false)}
          style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8vh 1rem' }}>
          <div onClick={e => e.stopPropagation()} dir="rtl"
            style={{ background: '#1a0f05', border: '1px solid #3a2a10', borderRadius: 14, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 20px 60px #000000aa', fontFamily: 'Arial' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.1rem', borderBottom: '1px solid #2a1a08' }}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="חפש אדם, משפחה..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f5e6c8', fontSize: '1rem', direction: 'rtl' }} />
              {searching && <span style={{ color: '#5a3a1a', fontSize: 12 }}>מחפש...</span>}
              <button onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', color: '#5a3a1a', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {results.length > 0 && results.map(r => (
              <a key={`${r.type}-${r.id}`} href={r.href} onClick={() => setSearchOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.7rem 1.1rem', textDecoration: 'none', borderBottom: '1px solid #150a01' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2a1a08')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: 18 }}>{r.type === 'אדם' ? '👤' : '👨‍👩‍👧'}</span>
                <span style={{ flex: 1, color: '#f5d98b', fontWeight: 'bold', fontSize: '0.88rem' }}>{r.name}</span>
                <span style={{ fontSize: '0.68rem', color: '#5a3a1a', background: '#2a1a08', padding: '2px 8px', borderRadius: 10 }}>{r.type}</span>
              </a>
            ))}

            {search && results.length === 0 && !searching && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#5a3a1a', fontSize: '0.88rem' }}>לא נמצאו תוצאות</div>
            )}

            {!search && (
              <div style={{ padding: '0.9rem 1.1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {NAV.map(n => (
                  <a key={n.href} href={`/${locale || "he"}${n.href}`} onClick={() => setSearchOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: 20, padding: '0.35rem 0.8rem', textDecoration: 'none', color: '#b89a5a', fontSize: '0.78rem' }}>
                    {n.icon} {n.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) { .nav-label { display: none; } }
        nav::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  )
}
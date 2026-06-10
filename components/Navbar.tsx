'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { supabase, getSession } from '@/lib/supabase'
import LanguageSwitcher from './LanguageSwitcher'
import Icon from './Icon'

const NAV = [
  { href: '/families', icon: 'families' as const, label: 'משפחות' },
  { href: '/people',   icon: 'people'   as const, label: 'אנשים'   },
  { href: '/tree',     icon: 'tree'     as const, label: 'עץ'      },
  { href: '/map',      icon: 'globe'    as const, label: 'מסעות'   },
  { href: '/timeline', icon: 'timeline' as const, label: 'ציר זמן' },
  { href: '/gallery',  icon: 'gallery'  as const, label: 'גלריה' },
  { href: '/stories',  icon: 'stories'  as const, label: 'סיפורים' },
  { href: '/calendar', icon: 'calendar' as const, label: 'לוח שנה' },
  { href: '/feed',     icon: 'feed'     as const, label: 'זיכרונות' },
  { href: '/ai-chat',  icon: 'ai'       as const, label: 'עוזר AI'  },
  { href: '/book',     icon: 'book'     as const, label: 'ספר'      },
  { href: '/documents',icon: 'documents'as const, label: 'מסמכים' },
]
const NAV_MAIN = NAV.slice(0, 5)
const NAV_MORE = NAV.slice(5)

const HIDE_ON = ['/', '/he', '/en', '/nl', '/de', '/login', '/join']

export default function Navbar() {
  const { locale } = (useParams() || {}) as { locale?: string }
  const pathname  = usePathname()
  const router    = useRouter()
  const [user, setUser]             = useState<string | null>(null)
  const [scrolled, setScrolled]     = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch]         = useState('')
  const [results, setResults]       = useState<{ id: number; name: string; type: string; href: string }[]>([])
  const [searching, setSearching]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const moreRef  = useRef<HTMLLIElement>(null)

  useEffect(() => { getSession().then(s => setUser(s?.user?.email?.split('@')[0] || null)) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o) }
      if (e.key === 'Escape') { setSearchOpen(false); setMoreOpen(false) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => { if (searchOpen) setTimeout(() => inputRef.current?.focus(), 80) }, [searchOpen])
  useEffect(() => { setMobileOpen(false); setMoreOpen(false) }, [pathname])
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
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
    for (const p of ppl || []) r.push({ id: p.id, name: `${[p.first_name, p.last_name].filter(Boolean).join(' ')}`, type: 'אדם', href: `/${locale}/people/${p.id}` })
    for (const f of fams || []) r.push({ id: f.id, name: f.name, type: 'משפחה', href: `/${locale}/families/${f.id}` })
    setResults(r)
    setSearching(false)
  }, [locale])

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 260)
    return () => clearTimeout(t)
  }, [search, doSearch])

  const shouldHide = HIDE_ON.includes(pathname || '') ||
    pathname === null ||
    /^\/(he|en|nl|de)\/?$/.test(pathname || '') ||
    pathname?.includes('/login') ||
    pathname?.includes('/join')

  if (shouldHide) return null

  async function logout() {
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
  }

  return (
    <>
      <motion.nav
        className={`cnavbar${scrolled ? ' scrolled' : ''}`}
        style={{ position: 'fixed' }}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        <a href={`/${locale}`} className="cnav-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 24 L14 14" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M14 19 L10 16 M14 19 L18 16" stroke="#c9a227" strokeWidth="1" strokeLinecap="round" opacity=".55"/>
            <path d="M14 14 L9 9 M14 14 L19 9" stroke="#c9a227" strokeWidth="1" strokeLinecap="round" opacity=".7"/>
            <circle cx="14" cy="7"  r="3"   fill="#c9a227" opacity=".9"/>
            <circle cx="9"  cy="8.5" r="2"  fill="#c9a227" opacity=".6"/>
            <circle cx="19" cy="8.5" r="2"  fill="#c9a227" opacity=".6"/>
            <circle cx="10" cy="15.5" r="1.5" fill="#c9a227" opacity=".38"/>
            <circle cx="18" cy="15.5" r="1.5" fill="#c9a227" opacity=".38"/>
          </svg>
          <span className="cnav-logo-text">ארכיון המשפחות</span>
        </a>

        <ul className="cnav-links">
          {NAV_MAIN.map(n => {
            const active = pathname === `/${locale}${n.href}` || pathname?.startsWith(`/${locale}${n.href}/`)
            return (
              <li key={n.href}>
                <a href={`/${locale}${n.href}`} className={`cnav-link${active ? ' active' : ''}`}>
                  <Icon name={n.icon} size={16} />
                  {n.label}
                </a>
              </li>
            )
          })}
          <li ref={moreRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMoreOpen(o => !o)}
              className={`cnav-link${NAV_MORE.some(n => pathname?.startsWith(`/${locale}${n.href}`)) ? ' active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              עוד
              <Icon name="chevronDown" size={14} />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.18 }}
                  style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'rgba(10,6,2,0.98)', border: '1px solid rgba(201,162,39,0.15)', borderRadius: 12, padding: '0.4rem', minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 200 }}
                  dir="rtl"
                >
                  {NAV_MORE.map(n => {
                    const active = pathname?.startsWith(`/${locale}${n.href}`)
                    return (
                      <a key={n.href} href={`/${locale}${n.href}`} onClick={() => setMoreOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.8rem', borderRadius: 8, textDecoration: 'none', color: active ? '#f5d98b' : '#b89a5a', fontSize: '0.85rem', background: active ? 'rgba(201,162,39,0.08)' : 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,162,39,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = active ? 'rgba(201,162,39,0.08)' : 'transparent')}>
                        <Icon name={n.icon} size={15} color={active ? '#f5d98b' : '#b89a5a'} />
                        <span>{n.label}</span>
                      </a>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        </ul>

        <div className="cnav-actions">
          <button onClick={() => setSearchOpen(true)} className="cbtn cbtn-ghost cbtn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Icon name="search" size={16} />
          </button>
          <LanguageSwitcher />
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.96 }} title={user}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #c9a227, #7a6010)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', color: '#0a0600', fontWeight: 700, cursor: 'pointer', border: '2px solid rgba(201,162,39,0.35)', userSelect: 'none' }}>
                {user[0]?.toUpperCase() ?? <Icon name="person" size={16} color="#0a0600" />}
              </motion.div>
              <button onClick={logout} className="cbtn cbtn-ghost cbtn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Icon name="logout" size={15} />
                יציאה
              </button>
            </div>
          ) : (
            <a href={`/${locale}/login`} className="cbtn cbtn-primary cbtn-sm">כניסה</a>
          )}
          <button onClick={() => setMobileOpen(m => !m)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#c9a227', padding: '0.4rem', display: 'none' }}
            className="cnav-hamburger" aria-label="תפריט">
            <motion.div animate={{ rotate: mobileOpen ? 45 : 0 }}   style={{ width: 18, height: 2, background: '#c9a227', borderRadius: 2, marginBottom: 4, transformOrigin: 'center' }} />
            <motion.div animate={{ opacity: mobileOpen ? 0 : 1 }}   style={{ width: 18, height: 2, background: '#c9a227', borderRadius: 2, marginBottom: 4 }} />
            <motion.div animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -12 : 0 }} style={{ width: 18, height: 2, background: '#c9a227', borderRadius: 2, transformOrigin: 'center' }} />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'fixed', top: 56, right: 0, left: 0, zIndex: 149, background: 'rgba(10,6,2,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
            dir="rtl">
            {NAV.map((n, i) => {
              const active = pathname === `/${locale}${n.href}` || pathname?.startsWith(`/${locale}${n.href}/`)
              return (
                <motion.a key={n.href} href={`/${locale}${n.href}`}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setMobileOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', borderRadius: 10, textDecoration: 'none', color: active ? '#f5d98b' : '#f0e8d0', fontSize: '0.95rem', background: active ? 'rgba(201,162,39,0.1)' : 'rgba(201,162,39,0.03)', border: `1px solid ${active ? 'rgba(201,162,39,0.2)' : 'rgba(201,162,39,0.05)'}`, fontWeight: active ? 600 : 400 }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(201,162,39,0.08)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(201,162,39,0.03)' }}>
                  <Icon name={n.icon} size={18} color={active ? '#f5d98b' : '#b89a5a'} />
                  <span>{n.label}</span>
                  {active && <span style={{ marginRight: 'auto', fontSize: '0.6rem', color: '#c9a227' }}>&#9679;</span>}
                </motion.a>
              )
            })}
            <div style={{ borderTop: '1px solid rgba(201,162,39,0.1)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', gap: '0.5rem' }}>
              {user ? (
                <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)', color: '#c9a227', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem' }}>
                  <Icon name="logout" size={15} color="#c9a227" />
                  יציאה
                </button>
              ) : (
                <a href={`/${locale}/login`} style={{ background: 'linear-gradient(135deg,#c9a227,#a68520)', color: '#0d0702', borderRadius: 8, padding: '0.5rem 1.2rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>כניסה</a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={() => setSearchOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(4,2,1,0.85)', backdropFilter: 'blur(6px)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '10vh 1rem' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'rgba(14,8,2,0.98)', border: '1px solid rgba(42,22,8,0.9)', borderRadius: 16, width: '100%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.2rem', borderBottom: '1px solid rgba(42,22,8,0.7)' }}>
                <Icon name="search" size={16} style={{ opacity: 0.5 }} />
                <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="חפש אדם, משפחה..."
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f0e8d0', fontSize: '1rem', direction: 'rtl', fontFamily: 'var(--font-body)' }} />
                {searching && <span style={{ fontSize: '0.7rem', color: 'rgba(201,162,39,0.5)' }}>&#8230;</span>}
                <button onClick={() => setSearchOpen(false)}
                  style={{ background: 'rgba(42,22,8,0.6)', border: 'none', color: 'rgba(240,232,208,0.4)', cursor: 'pointer', fontSize: '0.7rem', borderRadius: 5, padding: '2px 6px' }}>ESC</button>
              </div>
              <AnimatePresence>
                {results.length > 0 && results.map((r, i) => (
                  <motion.a key={`${r.type}-${r.id}`} href={r.href}
                    onClick={() => { setSearchOpen(false); setSearch('') }}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.7rem 1.2rem', textDecoration: 'none', borderBottom: '1px solid rgba(20,10,2,0.8)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(42,22,8,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Icon name={r.type === 'אדם' ? 'person' : 'families'} size={16} color="rgba(201,162,39,0.6)" />
                    <span style={{ flex: 1, color: '#f0e8d0', fontSize: '0.88rem', fontWeight: 500 }}>{r.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(201,162,39,0.5)', background: 'rgba(42,22,8,0.7)', padding: '2px 8px', borderRadius: 10 }}>{r.type}</span>
                  </motion.a>
                ))}
              </AnimatePresence>
              {search && results.length === 0 && !searching && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(240,232,208,0.25)', fontSize: '0.85rem' }}>לא נמצאו תוצאות</div>
              )}
              {!search && (
                <div style={{ padding: '0.9rem 1.2rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {NAV.map(n => (
                    <a key={n.href} href={`/${locale}${n.href}`} onClick={() => setSearchOpen(false)} className="cquick-link"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Icon name={n.icon} size={13} />
                      {n.label}
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

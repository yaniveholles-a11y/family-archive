'use client'
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useRouter } from 'next/navigation'

type Family = {
  id: number
  name: string
  name_en?: string
  description?: string
  origin_country?: string
  image_url?: string
}

const FALLBACK: Record<string, string> = {
  'home.title': 'ארכיון המשפחות',
  'home.subtitle': 'שומרים על הזיכרון לדורות הבאים',
  'home.selectFamily': 'בחר משפחה',
  'nav.families': 'משפחות',
  'nav.join': 'הצטרפות',
  'nav.login': 'כניסה',
  'nav.home': 'דף הבית',
  'nav.people': 'אנשים',
  'nav.search': 'חיפוש',
  'common.loading': 'טוען...',
}

export default function Home() {
  const { locale } = useParams() as { locale: string }
  const rawT = useTranslations()
  const t = (key: string) => {
    try { return rawT(key) } catch { return FALLBACK[key] || key }
  }
  const router = useRouter()
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFamilies() {
      try {
        setLoading(true)

        // Check if user is logged in and belongs to a family → redirect
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('family_id, role')
              .eq('user_id', user.id)
              .maybeSingle()
            if (roleData?.family_id && roleData.role !== 'admin') {
              router.push(`/${locale}/families/${roleData.family_id}`)
              return
            }
          }
        } catch {}

        const { data, error: dbError } = await supabase.from('families').select('*').order('name')
        if (dbError) throw dbError
        setFamilies(data || [])
      } catch (err: any) {
        console.error('Load error:', err)
        setError(err?.message || 'שגיאה')
      } finally {
        setLoading(false)
      }
    }
    loadFamilies()
  }, [])

  return (
    <main dir="auto" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      {/* header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        padding: '1.5rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f5d98b' }}>
          {t('home.title')}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <LanguageSwitcher />
          <a href={`/${locale}/join`} style={{ background: 'transparent', color: '#f5d98b', border: '1px solid #f5d98b', padding: '0.5rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
            הצטרפות
          </a>
          <a href={`/${locale}/login`} style={{ background: '#c9a227', color: '#1a0f05', padding: '0.5rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
            {t('nav.login')}
          </a>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        position: 'relative', height: '100vh', minHeight: '600px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <video
          autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1rem', color: '#f5d98b', letterSpacing: '6px', marginBottom: '1.5rem' }}>❧ ✦ ❧</div>
          <h1 style={{
            fontSize: '3.5rem', fontWeight: 'bold', color: '#fff',
            marginBottom: '1rem', letterSpacing: '2px',
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          }}>
            {t('home.title')}
          </h1>
          <div style={{
            width: '120px', height: '1px',
            background: 'linear-gradient(90deg, transparent, #c9a227, transparent)',
            margin: '0 auto 1.5rem',
          }} />
          <p style={{
            fontSize: '1.2rem', color: '#f0e0c0',
            maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.8,
            textShadow: '0 1px 8px rgba(0,0,0,0.8)',
          }}>
            {t('home.subtitle')}
          </p>
          <a href={`/${locale}/join`} style={{
            display: 'inline-block', background: '#c9a227', color: '#1a0f05',
            padding: '0.9rem 2.5rem', borderRadius: '8px', textDecoration: 'none',
            fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '1px',
            boxShadow: '0 4px 20px rgba(201,162,39,0.4)',
          }}>
            🌳 הצטרפות
          </a>
        </div>

        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          color: '#f5d98b', fontSize: '1.5rem', zIndex: 2,
          animation: 'bounce 2s infinite',
        }}>↓</div>
      </div>

      {/* בחירת משפחה */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
        <h2 style={{
          fontSize: '1.4rem', color: '#f5d98b',
          borderBottom: '1px solid #3a2a10',
          paddingBottom: '0.75rem', marginBottom: '2rem',
        }}>
          {t('home.selectFamily')}
        </h2>

        {loading && <p style={{ color: '#b89a5a', textAlign: 'center', padding: '3rem' }}>{t('common.loading')}</p>}

        {error && (
          <div style={{ background: '#3a1a1a', border: '1px solid #c94949', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#ffb3b3', marginBottom: '1rem' }}>
            <p>❌ {error}</p>
            <button onClick={() => window.location.reload()} style={{
              marginTop: '0.75rem', padding: '0.5rem 1.5rem',
              background: '#c94949', color: '#fff', border: 'none',
              borderRadius: '6px', cursor: 'pointer',
            }}>נסה שוב</button>
          </div>
        )}

        {!loading && !error && families.length === 0 && (
          <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#b89a5a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌳</div>
            <p>{t('home.subtitle')}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {families.map((family) => (
            <a key={family.id} href={'/families/' + family.id}
              onClick={(e) => { e.preventDefault(); router.push('/families/' + family.id) }}
              style={{
                position: 'relative', borderRadius: '14px', overflow: 'hidden',
                textDecoration: 'none', color: 'inherit', display: 'block',
                height: '220px', border: '1px solid #3a2a10',
                transition: 'transform 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.borderColor = '#c9a227' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#3a2a10' }}
            >
              {family.image_url ? (
                <img src={family.image_url} alt={family.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #2a1a08, #3a2a10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🏛️</div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.2rem' }}>{family.name}</div>
                {family.name_en && <div style={{ fontSize: '0.9rem', color: '#f5d98b', marginBottom: '0.4rem' }}>{family.name_en}</div>}
                {family.origin_country && <div style={{ fontSize: '0.8rem', color: '#c9a227' }}>🌍 {family.origin_country}</div>}
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f5d98b' }}>כניסה →</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* תפריט תחתון */}
      <div style={{
        background: '#0d0702', borderTop: '1px solid #3a2a10',
        padding: '2rem', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap',
      }}>
        {[
          { icon: '🏠', label: t('nav.home'), href: '/' },
          { icon: '👨‍👩‍👧', label: t('nav.families'), href: '/families' },
          { icon: '👤', label: t('nav.people'), href: '/people' },
          { icon: '🔍', label: t('nav.search'), href: '/search' },
          { icon: '🔑', label: t('nav.login'), href: '/login' },
        ].map(item => (
          <a key={item.label} href={item.href} style={{ color: '#b89a5a', textDecoration: 'none', textAlign: 'center', fontSize: '0.85rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{item.icon}</div>
            {item.label}
          </a>
        ))}
      </div>

      <div style={{ background: '#0d0702', borderTop: '1px solid #1a0f05', padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#5a3a1a' }}>
        {t('home.title')}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>
    </main>
  )
}

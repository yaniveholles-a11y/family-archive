'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Icon from '@/components/Icon'

const TreeSVG = () => (
  <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.15 }}>
    <line x1="60" y1="110" x2="60" y2="60" stroke="#c9a227" strokeWidth="2"/>
    <line x1="60" y1="80" x2="35" y2="55" stroke="#c9a227" strokeWidth="1.5"/>
    <line x1="60" y1="80" x2="85" y2="55" stroke="#c9a227" strokeWidth="1.5"/>
    <circle cx="60" cy="60" r="4" fill="#c9a227"/>
    <circle cx="35" cy="55" r="3" fill="#c9a227"/>
    <circle cx="85" cy="55" r="3" fill="#c9a227"/>
  </svg>
)

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
    <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
    <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
    <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
  </svg>
)

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const { locale } = useParams() as { locale: string }

  async function handleLogin() {
    if (!email || !password) { setError('נא למלא אימייל וסיסמה'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('אימייל או סיסמה שגויים'); setLoading(false) }
    else router.push(`/${locale}/dashboard`)
  }

  async function handleGoogle() {
    setGoogleLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/dashboard`,
      },
    })
    if (error) { setError('שגיאה בהתחברות עם Google'); setGoogleLoading(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(13,7,2,0.8)',
    border: '1px solid rgba(201,162,39,0.2)', borderRadius: '10px',
    padding: '0.75rem 1rem', color: '#f0e8d0', fontSize: '0.95rem',
    fontFamily: '"Heebo", Arial, sans-serif', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <main dir="rtl" style={{
      minHeight: '100vh', background: '#080606',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Heebo", Arial, sans-serif', padding: '2rem',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 15 }}
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-8px' }}>
            <TreeSVG />
          </div>
          <h1 style={{ fontSize: '2rem', fontFamily: '"Playfair Display", serif', color: '#f5d98b', margin: '0 0 4px' }}>
            ארכיון המשפחות
          </h1>
          <div style={{ width: 80, height: 1, background: 'linear-gradient(90deg, transparent, #c9a227, transparent)', margin: '0.6rem auto 0.5rem' }} />
          <p style={{ color: '#5a3a1a', fontSize: '0.82rem' }}>כניסה למערכת</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(26,15,5,0.92)', border: '1px solid rgba(201,162,39,0.15)',
            borderRadius: '20px', padding: '2.5rem',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}
        >
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(58,16,16,0.8)', border: '1px solid rgba(200,80,80,0.3)',
                  borderRadius: '10px', padding: '0.75rem 1rem',
                  color: '#f5a5a5', fontSize: '0.88rem', textAlign: 'center', overflow: 'hidden',
                }}
              >{error}</motion.div>
            )}
          </AnimatePresence>

          {/* Google OAuth */}
          <motion.button
            onClick={handleGoogle} disabled={googleLoading}
            whileHover={{ scale: googleLoading ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px',
              padding: '0.75rem', fontSize: '0.92rem', fontWeight: '600',
              fontFamily: '"Heebo", Arial, sans-serif', color: '#f0e8d0',
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          >
            {googleLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 18, height: 18, border: '2px solid rgba(201,162,39,0.3)', borderTopColor: '#c9a227', borderRadius: '50%' }} />
            ) : <GoogleIcon />}
            {googleLoading ? 'מתחבר...' : 'המשך עם Google'}
          </motion.button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(201,162,39,0.12)' }} />
            <span style={{ color: '#3a2a10', fontSize: '0.72rem', letterSpacing: '0.1em' }}>או עם אימייל</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(201,162,39,0.12)' }} />
          </div>

          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#b89a5a', marginBottom: '0.4rem' }}>אימייל</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="you@example.com"
              style={{ ...inp, direction: 'ltr', textAlign: 'left' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.2)')} />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#b89a5a', marginBottom: '0.4rem' }}>סיסמה</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
              style={{ ...inp, direction: 'ltr' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.2)')} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <motion.button onClick={handleLogin} disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }}
              style={{
                width: '100%',
                background: loading ? 'rgba(90,74,16,0.6)' : 'linear-gradient(135deg, #c9a227, #a68520)',
                color: '#0d0702', border: 'none', borderRadius: '12px',
                padding: '0.85rem', fontSize: '1rem', fontWeight: '700',
                fontFamily: '"Heebo", Arial, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {loading ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, border: '2px solid rgba(13,7,2,0.3)', borderTopColor: '#0d0702', borderRadius: '50%' }} />
                נכנס...</>
              ) : (
                <><Icon name="person" size={16} color="#0d0702" />כניסה למערכת</>
              )}
            </motion.button>
          </motion.div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a href={`/${locale}`} style={{ color: '#5a3a1a', fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#5a3a1a')}>
              <Icon name="chevronRight" size={13} />
              חזרה לבית
            </a>
            <a href={`/${locale}/join`} style={{ color: '#8b6914', fontSize: '0.82rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b6914')}>
              בקשת הצטרפות
            </a>
          </div>
        </motion.div>
      </motion.div>
    </main>
  )
}

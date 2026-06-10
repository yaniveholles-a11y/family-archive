'use client'
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Family = { id: number; name: string }

export default function JoinPage() {
  const { locale } = useParams() as { locale: string }
  const [families, setFamilies] = useState<Family[]>([])
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedFamilies, setSelectedFamilies] = useState<number[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('families').select('*').order('name').then(({ data }) => setFamilies(data || []))
  }, [])

  function toggleFamily(id: number) {
    setSelectedFamilies(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  async function handleSubmit() {
    if (!fullName.trim() || !email.trim()) { setError('חובה למלא שם ואימייל'); return }
    setSending(true); setError('')
    const familiesToSubmit = selectedFamilies.length > 0 ? selectedFamilies : [null]
    for (const fid of familiesToSubmit) {
      const fam = families.find(f => f.id === fid)
      const { error: insertError } = await supabase.from('join_requests').insert({
        full_name: fullName.trim(), email: email.trim(),
        family_id: fid || null, family_name: fam?.name || null, status: 'pending',
      })
      if (insertError) { setError('שגיאה בשליחה: ' + insertError.message); setSending(false); return }
    }
    setSent(true)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(13,7,2,0.8)',
    border: '1px solid rgba(201,162,39,0.2)', borderRadius: '10px',
    padding: '0.75rem 1rem', color: '#f0e8d0', fontSize: '0.95rem',
    fontFamily: '"Heebo", Arial, sans-serif', outline: 'none', boxSizing: 'border-box' as const,
  }

  if (sent) return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={{ textAlign: 'center', maxWidth: '480px', padding: '2rem' }}
      >
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 12 }}
          style={{
            width: 70, height: 70, borderRadius: '50%',
            background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', margin: '0 auto 1.5rem', color: '#4ade80',
          }}
        >✓</motion.div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', color: '#f5d98b', marginBottom: '1rem' }}>
          הבקשה נשלחה!
        </h1>
        <div style={{ width: 60, height: 1, background: '#c9a227', margin: '0 auto 1rem' }} />
        <p style={{ color: '#b89a5a', lineHeight: 1.8 }}>
          הבקשה שלך התקבלה. מנהל האתר יבדוק אותה ואם תאושר תקבל אימייל עם פרטי הכניסה.
        </p>
        <a href={`/${locale}`} style={{
          display: 'inline-block', marginTop: '2rem',
          color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem',
          border: '1px solid rgba(201,162,39,0.3)', borderRadius: '10px', padding: '0.6rem 1.5rem',
        }}>← חזרה לעמוד הבית</a>
      </motion.div>
    </main>
  )

  return (
    <main dir="rtl" style={{
      minHeight: '100vh', background: '#080606',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Heebo", Arial, sans-serif', padding: '2rem',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ width: '100%', maxWidth: '520px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#c9a227', letterSpacing: '8px', marginBottom: '1rem', opacity: 0.6 }}>
            ✦ ✦ ✦
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.9rem', color: '#f5d98b', marginBottom: '0.5rem' }}>
            בקשת הצטרפות
          </h1>
          <div style={{ width: 80, height: 1, background: 'linear-gradient(90deg, transparent, #c9a227, transparent)', margin: '0.6rem auto 0.75rem' }} />
          <p style={{ color: '#5a3a1a', fontSize: '0.88rem', lineHeight: 1.7 }}>
            מלא את הטופס ומנהל האתר יאשר את בקשתך וישלח לך פרטי כניסה
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(26,15,5,0.92)', border: '1px solid rgba(201,162,39,0.15)',
            borderRadius: '20px', padding: '2.5rem',
            display: 'flex', flexDirection: 'column', gap: '1.5rem',
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
                  color: '#f5a5a5', fontSize: '0.88rem', overflow: 'hidden',
                }}
              >{error}</motion.div>
            )}
          </AnimatePresence>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#b89a5a', marginBottom: '0.4rem' }}>שם מלא *</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="שם פרטי ושם משפחה"
              style={inp}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.2)')} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#b89a5a', marginBottom: '0.4rem' }}>כתובת אימייל *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
              style={{ ...inp, direction: 'ltr', textAlign: 'left' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.2)')} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#b89a5a', marginBottom: '0.75rem' }}>
              שייכות למשפחות
              <span style={{ color: '#3a2a10', fontSize: '0.72rem', marginRight: '0.5rem' }}>(ניתן לבחור יותר מאחת)</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {families.map(f => {
                const selected = selectedFamilies.includes(f.id)
                return (
                  <motion.div key={f.id} onClick={() => toggleFamily(f.id)}
                    whileHover={{ x: -3 }} whileTap={{ scale: 0.98 }}
                    style={{
                      background: selected ? 'rgba(201,162,39,0.08)' : 'rgba(13,7,2,0.5)',
                      border: `1px solid ${selected ? 'rgba(201,162,39,0.4)' : 'rgba(201,162,39,0.1)'}`,
                      borderRadius: '10px', padding: '0.65rem 1rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '5px', flexShrink: 0,
                      background: selected ? '#c9a227' : 'transparent',
                      border: `2px solid ${selected ? '#c9a227' : '#3a2a10'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', color: '#0d0702', fontWeight: 'bold',
                    }}>{selected ? '✓' : ''}</div>
                    <span style={{ color: selected ? '#f5d98b' : '#c8b08a', fontSize: '0.92rem' }}>משפחת {f.name}</span>
                  </motion.div>
                )
              })}
            </div>
            {selectedFamilies.length > 1 && (
              <p style={{ color: '#c9a227', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                ✓ נבחרו {selectedFamilies.length} משפחות
              </p>
            )}
          </div>

          <motion.button onClick={handleSubmit} disabled={sending}
            whileHover={{ scale: sending ? 1 : 1.02 }} whileTap={{ scale: sending ? 1 : 0.97 }}
            style={{
              width: '100%',
              background: sending ? 'rgba(90,74,16,0.5)' : 'linear-gradient(135deg, #c9a227, #a68520)',
              color: '#0d0702', border: 'none', borderRadius: '12px', padding: '0.9rem',
              fontSize: '1rem', fontWeight: '700', fontFamily: '"Heebo", Arial, sans-serif',
              cursor: sending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {sending ? (
              <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>✦</motion.span>שולח...</>
            ) : 'שלח בקשת הצטרפות'}
          </motion.button>

          <div style={{ textAlign: 'center' }}>
            <a href={`/${locale}/login`} style={{ color: '#5a3a1a', fontSize: '0.82rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#5a3a1a')}>
              כבר יש לך חשבון? כניסה למערכת →
            </a>
          </div>
        </motion.div>
      </motion.div>
    </main>
  )
}

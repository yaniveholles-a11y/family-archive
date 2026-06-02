'use client'
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'
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
    async function load() {
      const { data } = await supabase.from('families').select('*').order('name')
      setFamilies(data || [])
    }
    load()
  }, [])

  function toggleFamily(id: number) {
    setSelectedFamilies(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  async function handleSubmit() {
    if (!fullName.trim() || !email.trim()) {
      setError('חובה למלא שם ואימייל')
      return
    }
    setSending(true)
    setError('')

    const familiesToSubmit = selectedFamilies.length > 0 ? selectedFamilies : [null]

    for (const fid of familiesToSubmit) {
      const fam = families.find(f => f.id === fid)
      const { error: insertError } = await supabase.from('join_requests').insert({
        full_name: fullName.trim(),
        email: email.trim(),
        family_id: fid || null,
        family_name: fam?.name || null,
        status: 'pending',
      })
      if (insertError) {
        setError('שגיאה בשליחה: ' + insertError.message)
        setSending(false)
        return
      }
    }

    setSent(true)
  }

  if (sent) return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h1 style={{ fontSize: '1.8rem', color: '#f5d98b', marginBottom: '1rem' }}>הבקשה נשלחה!</h1>
        <p style={{ color: '#b89a5a', lineHeight: 1.8 }}>הבקשה שלך התקבלה. מנהל האתר יבדוק אותה ואם תאושר תקבל אימייל עם פרטי הכניסה.</p>
        <a href="/" style={{ display: 'inline-block', marginTop: '1.5rem', color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>← חזרה לעמוד הבית</a>
      </div>
    </main>
  )

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#c9a227', letterSpacing: '6px', marginBottom: '1rem' }}>❧ ✦ ❧</div>
          <h1 style={{ fontSize: '1.8rem', color: '#f5d98b', marginBottom: '0.5rem' }}>בקשת הצטרפות</h1>
          <div style={{ width: '80px', height: '1px', background: 'linear-gradient(90deg, transparent, #c9a227, transparent)', margin: '0 auto 0.75rem' }} />
          <p style={{ color: '#b89a5a', fontSize: '0.9rem', lineHeight: 1.7 }}>מלא את הטופס ומנהל האתר יאשר את בקשתך וישלח לך פרטי כניסה</p>
        </div>

        <div style={{ background: '#1a0f05', border: '1px solid #3a2a10', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {error && (
            <div style={{ background: '#2a0a08', border: '1px solid #5a1a10', borderRadius: '6px', padding: '0.75rem 1rem', color: '#f08080', fontSize: '0.88rem' }}>
              ⚠️ {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#b89a5a', marginBottom: '0.4rem' }}>שם מלא *</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="שם פרטי ושם משפחה"
              style={{ width: '100%', background: '#0d0702', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.7rem 0.9rem', color: '#f5e6c8', fontSize: '0.95rem', boxSizing: 'border-box' as const }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#b89a5a', marginBottom: '0.4rem' }}>כתובת אימייל *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
              style={{ width: '100%', background: '#0d0702', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.7rem 0.9rem', color: '#f5e6c8', fontSize: '0.95rem', boxSizing: 'border-box' as const, direction: 'ltr', textAlign: 'left' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#b89a5a', marginBottom: '0.75rem' }}>
              שייכות למשפחות
              <span style={{ color: '#5a3a1a', fontSize: '0.8rem', marginRight: '0.5rem' }}>(ניתן לבחור יותר מאחת)</span>
            </label>
            {families.length === 0 && <p style={{ color: '#5a3a1a', fontSize: '0.85rem' }}>אין משפחות להצגה</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {families.map(f => {
                const selected = selectedFamilies.includes(f.id)
                return (
                  <div key={f.id} onClick={() => toggleFamily(f.id)}
                    style={{ background: selected ? '#2a1a00' : '#0d0702', border: '1px solid ' + (selected ? '#c9a227' : '#3a2a10'), borderRadius: '8px', padding: '0.65rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, background: selected ? '#c9a227' : 'transparent', border: '2px solid ' + (selected ? '#c9a227' : '#5a3a1a'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#0d0702', fontWeight: 'bold' }}>
                      {selected ? '✓' : ''}
                    </div>
                    <span style={{ color: selected ? '#f5d98b' : '#c8b08a', fontSize: '0.95rem' }}>משפחת {f.name}</span>
                  </div>
                )
              })}
            </div>
            {selectedFamilies.length > 1 && (
              <p style={{ color: '#c9a227', fontSize: '0.82rem', marginTop: '0.5rem' }}>✓ נבחרו {selectedFamilies.length} משפחות</p>
            )}
          </div>

          <button onClick={handleSubmit} disabled={sending}
            style={{ background: sending ? '#5a4a10' : '#c9a227', color: '#0d0702', border: 'none', borderRadius: '8px', padding: '0.85rem', fontSize: '1rem', fontWeight: 'bold', cursor: sending ? 'not-allowed' : 'pointer' }}>
            {sending ? 'שולח...' : 'שלח בקשת הצטרפות'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <a href={`/${locale}/login`} style={{ color: '#7a5a2a', fontSize: '0.85rem', textDecoration: 'none' }}>כבר יש לך חשבון? כניסה למערכת</a>
          </div>
        </div>
      </div>
    </main>
  )
}
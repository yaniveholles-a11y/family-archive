'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    if (!email || !password) { setError('נא למלא אימייל וסיסמה'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('אימייל או סיסמה שגויים')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  function handleKeyDown(e: any) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* לוגו */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '1rem', color: '#c9a227', letterSpacing: '6px', marginBottom: '0.75rem' }}>❧ ✦ ❧</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f5d98b', marginBottom: '0.25rem' }}>ארכיון המשפחות</h1>
          <p style={{ color: '#b89a5a', fontSize: '0.9rem' }}>כניסה למערכת</p>
        </div>

        {/* טופס */}
        <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {error && (
            <div style={{ background: '#3a1010', border: '1px solid #6a2a2a', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f5a5a5', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#b89a5a', marginBottom: '0.4rem' }}>אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@example.com"
              style={{ width: '100%', background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#f5e6c8', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#b89a5a', marginBottom: '0.4rem' }}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              style={{ width: '100%', background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#f5e6c8', fontSize: '1rem' }}
            />
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{ background: '#c9a227', color: '#1a0f05', border: 'none', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
            {loading ? 'נכנס...' : 'כניסה'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <a href="/" style={{ color: '#b89a5a', fontSize: '0.85rem', textDecoration: 'none' }}>← חזרה לעמוד הבית</a>
          </div>
        </div>
      </div>
    </main>
  )
}
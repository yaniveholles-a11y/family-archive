'use client'
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Request = {
  id: number
  full_name: string
  email: string
  family_name?: string
  family_id?: number
  status: string
  created_at: string
}

type UserRole = {
  id: number
  user_id: string
  role: string
  family_id?: number
  created_at: string
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

export default function AdminUsersPage() {
  const { locale } = useParams() as { locale: string }
  const [requests, setRequests] = useState<Request[]>([])
  const [users, setUsers] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'requests' | 'users'>('requests')
  const [processing, setProcessing] = useState<number | null>(null)
  const [lastPassword, setLastPassword] = useState<{ email: string, password: string } | null>(null)
  const router = useRouter()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/login'); return }

    const { data: requests } = await supabase
      .from('join_requests')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false })

    setRequests(requests || [])
    setUsers(roles || [])
    setLoading(false)
  }

  async function handleApprove(req: Request) {
    setProcessing(req.id)
    const password = generatePassword()

    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: req.email, password, family_id: req.family_id }),
    })

    const result = await res.json()

    if (!res.ok) {
      alert('שגיאה ביצירת המשתמש: ' + result.error)
      setProcessing(null)
      return
    }

    await supabase.from('join_requests').update({ status: 'approved' }).eq('id', req.id)
    setLastPassword({ email: req.email, password })
    setProcessing(null)
    load()
  }

  async function handleReject(id: number) {
    if (!confirm('לדחות את הבקשה?')) return
    await supabase.from('join_requests').update({ status: 'rejected' }).eq('id', id)
    load()
  }

  async function handleChangeRole(userId: string, role: string) {
    await supabase.from('user_roles').update({ role }).eq('user_id', userId)
    load()
  }

  async function handleResetPassword(userId: string) {
    const password = generatePassword()
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, password }),
    })
    if (res.ok) {
      setLastPassword({ email: userId, password })
    } else {
      alert('שגיאה באיפוס הסיסמה')
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('למחוק את המשתמש לגמרי?')) return
    await fetch('/api/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    await supabase.from('user_roles').delete().eq('user_id', userId)
    load()
  }

  const roleLabels: Record<string, string> = {
    admin: 'מנהל ראשי',
    editor: 'עורך',
    member: 'בן משפחה',
    viewer: 'צופה',
  }

  const roleColors: Record<string, string> = {
    admin: '#c9a227',
    editor: '#5a8ab0',
    member: '#4a9e6a',
    viewer: '#7a7a7a',
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#1c1008', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#b89a5a' }}>טוען...</p>
    </main>
  )

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={`/${locale}/dashboard`} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ דשבורד</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>ניהול משתמשים</span>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        <h1 style={{ fontSize: '1.8rem', color: '#f5d98b', marginBottom: '0.5rem' }}>ניהול משתמשים</h1>
        <div style={{ width: '80px', height: '1px', background: '#c9a227', marginBottom: '2rem' }} />

        {lastPassword && (
          <div style={{ background: '#0a2a10', border: '1px solid #1a5a20', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ color: '#80d080', fontWeight: 'bold', marginBottom: '0.5rem' }}>✅ סיסמה נוצרה — שמור אותה!</div>
            <div style={{ fontSize: '0.9rem', color: '#c8e6c8' }}>אימייל: <span style={{ direction: 'ltr', display: 'inline-block' }}>{lastPassword.email}</span></div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f5d98b', marginTop: '0.25rem', letterSpacing: '2px', direction: 'ltr' }}>{lastPassword.password}</div>
            <button onClick={() => setLastPassword(null)} style={{ marginTop: '0.75rem', background: 'transparent', border: '1px solid #1a5a20', borderRadius: '6px', color: '#5a9a5a', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem' }}>סגור</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', border: '1px solid #3a2a10', borderRadius: '8px', overflow: 'hidden' }}>
          <button onClick={() => setTab('requests')}
            style={{ flex: 1, padding: '0.65rem', background: tab === 'requests' ? '#c9a227' : 'transparent', color: tab === 'requests' ? '#0d0702' : '#b89a5a', border: 'none', cursor: 'pointer', fontWeight: tab === 'requests' ? 'bold' : 'normal', fontSize: '0.9rem', fontFamily: 'Arial, sans-serif' }}>
            בקשות ממתינות {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </button>
          <button onClick={() => setTab('users')}
            style={{ flex: 1, padding: '0.65rem', background: tab === 'users' ? '#c9a227' : 'transparent', color: tab === 'users' ? '#0d0702' : '#b89a5a', border: 'none', cursor: 'pointer', fontWeight: tab === 'users' ? 'bold' : 'normal', fontSize: '0.9rem', fontFamily: 'Arial, sans-serif' }}>
            כל המשתמשים ({users.length})
          </button>
        </div>

        {tab === 'requests' && (
          <div>
            {requests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#b89a5a' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
                <p>אין בקשות הצטרפות</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {requests.map(req => (
                <div key={req.id} style={{ background: '#2a1a08', border: '1px solid ' + (req.status === 'pending' ? '#5a3a10' : '#2a2a2a'), borderRadius: '10px', padding: '1.1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#f5d98b', marginBottom: '0.25rem' }}>{req.full_name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#b89a5a', direction: 'ltr', textAlign: 'left' }}>{req.email}</div>
                      {req.family_name && <div style={{ fontSize: '0.82rem', color: '#c9a227', marginTop: '0.25rem' }}>משפחת {req.family_name}</div>}
                      <div style={{ fontSize: '0.78rem', color: '#5a3a1a', marginTop: '0.25rem' }}>{new Date(req.created_at).toLocaleDateString('he-IL')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {req.status === 'pending' ? (
                        <>
                          <button onClick={() => handleApprove(req)} disabled={processing === req.id}
                            style={{ background: '#c9a227', color: '#0d0702', border: 'none', borderRadius: '6px', padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', fontFamily: 'Arial, sans-serif' }}>
                            {processing === req.id ? 'מעבד...' : '✓ אשר'}
                          </button>
                          <button onClick={() => handleReject(req.id)}
                            style={{ background: 'transparent', border: '1px solid #5a1a10', borderRadius: '6px', color: '#c05050', padding: '0.45rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Arial, sans-serif' }}>
                            ✕ דחה
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: req.status === 'approved' ? '#4a9e6a' : '#7a7a7a', border: '1px solid currentColor', borderRadius: '20px', padding: '0.2rem 0.75rem' }}>
                          {req.status === 'approved' ? '✓ אושר' : '✕ נדחה'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            {users.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#b89a5a' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                <p>אין משתמשים</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {users.map(u => (
                <div key={u.id} style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '10px', padding: '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#7a5a2a', direction: 'ltr', textAlign: 'left', marginBottom: '0.25rem' }}>{u.user_id}</div>
                    <div style={{ display: 'inline-block', background: roleColors[u.role] + '33', border: '1px solid ' + roleColors[u.role], borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.82rem', color: roleColors[u.role] }}>
                      {roleLabels[u.role] || u.role}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select value={u.role} onChange={e => handleChangeRole(u.user_id, e.target.value)}
                      style={{ background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '6px', padding: '0.4rem 0.6rem', color: '#f5e6c8', fontSize: '0.82rem', fontFamily: 'Arial, sans-serif' }}>
                      <option value="admin">מנהל ראשי</option>
                      <option value="editor">עורך</option>
                      <option value="member">בן משפחה</option>
                      <option value="viewer">צופה</option>
                    </select>
                    <button onClick={() => handleResetPassword(u.user_id)}
                      style={{ background: 'transparent', border: '1px solid #3a2a10', borderRadius: '6px', color: '#b89a5a', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Arial, sans-serif' }}>
                      🔑 אפס סיסמה
                    </button>
                    <button onClick={() => handleDeleteUser(u.user_id)}
                      style={{ background: 'transparent', border: '1px solid #5a1a10', borderRadius: '6px', color: '#c05050', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Arial, sans-serif' }}>
                      🗑️ מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

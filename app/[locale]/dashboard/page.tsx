'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type User = {
  id: string; email: string; full_name?: string; role?: string
  created_at?: string; family_id?: number; family?: { name: string }
}
type Request = {
  id: number; full_name: string; email: string; status: string
  family_id?: number; family_name?: string; created_at?: string
}
type LogEntry = {
  id: number; user_id?: string; action: string; details?: string; created_at?: string
}

function Counter({ target, color }: { target: number; color: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0; const step = Math.ceil(target / 40)
    const t = setInterval(() => {
      start = Math.min(start + step, target)
      setVal(start)
      if (start >= target) clearInterval(t)
    }, 28)
    return () => clearInterval(t)
  }, [target])
  return <span style={{ color }}>{val}</span>
}

export default function DashboardPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'users' | 'history'>('overview')
  const [actionMsg, setActionMsg] = useState('')
  const [stats, setStats] = useState({ people: 0, families: 0, photos: 0, events: 0 })
  const [roleEdit, setRoleEdit] = useState<Record<string, string>>({})
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({})

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push(`/${locale}/login`); return }

    const { data: profile } = await supabase.from('users').select('*, family:families(name)').eq('id', session.user.id).single()
    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      router.push(`/${locale}`); return
    }
    setCurrentUser({ ...profile, email: session.user.email || '' })

    if (profile.role === 'admin') {
      const [{ data: usersData }, { data: reqs }, { data: logsData }] = await Promise.all([
        supabase.from('users').select('*, family:families(name)').order('created_at', { ascending: false }),
        supabase.from('join_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(50),
      ])
      setUsers(usersData || [])
      setRequests(reqs || [])
      setLogs(logsData || [])
    }

    const [{ count: pCount }, { count: fCount }, { count: phCount }, { count: eCount }] = await Promise.all([
      supabase.from('people').select('*', { count: 'exact', head: true }),
      supabase.from('families').select('*', { count: 'exact', head: true }),
      supabase.from('photos').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
    ])
    setStats({ people: pCount || 0, families: fCount || 0, photos: phCount || 0, events: eCount || 0 })
    setLoading(false)
  }

  async function approveRequest(req: Request) {
    const tempPass = Math.random().toString(36).substring(2, 10)
    const { data, error: signUpError } = await supabase.auth.admin.createUser({
      email: req.email, password: tempPass, email_confirm: true,
    })
    if (signUpError) { setActionMsg('שגיאה: ' + signUpError.message); return }
    await supabase.from('users').insert({
      id: data.user!.id, email: req.email, full_name: req.full_name,
      role: 'viewer', family_id: req.family_id || null,
    })
    await supabase.from('join_requests').update({ status: 'approved' }).eq('id', req.id)
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
    setActionMsg(`✓ ${req.full_name} אושר — סיסמה זמנית: ${tempPass}`)
  }

  async function rejectRequest(id: number) {
    await supabase.from('join_requests').update({ status: 'rejected' }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
    setActionMsg('בקשה נדחתה')
  }

  async function changeRole(userId: string, newRole: string) {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      setActionMsg('תפקיד עודכן')
    }
  }

  async function resetPassword(userId: string) {
    const pass = newPasswords[userId]?.trim()
    if (!pass || pass.length < 6) { setActionMsg('סיסמה חייבת להיות לפחות 6 תווים'); return }
    const { error } = await supabase.auth.admin.updateUserById(userId, { password: pass })
    if (!error) {
      setNewPasswords(prev => ({ ...prev, [userId]: '' }))
      setActionMsg('סיסמה עודכנה בהצלחה')
    } else {
      setActionMsg('שגיאה: ' + error.message)
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const isAdmin = currentUser?.role === 'admin'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080606', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: '2.5rem', color: '#c9a227' }}>✦</motion.div>
    </div>
  )

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>

      {/* Sticky Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,6,6,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '0 2rem',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href={`/${locale}`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← בית</a>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.25rem', color: '#f5d98b' }}>לוח בקרה</h1>
            {pendingRequests.length > 0 && (
              <motion.span
                animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{
                  background: '#c9a227', color: '#0d0702', borderRadius: '50%',
                  width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700,
                }}>{pendingRequests.length}</motion.span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#3a2a10' }}>{currentUser?.email}</span>
            <span style={{
              background: currentUser?.role === 'admin' ? 'rgba(201,162,39,0.12)' : 'rgba(90,138,176,0.12)',
              color: currentUser?.role === 'admin' ? '#c9a227' : '#5a8ab0',
              border: `1px solid ${currentUser?.role === 'admin' ? 'rgba(201,162,39,0.3)' : 'rgba(90,138,176,0.3)'}`,
              borderRadius: 20, padding: '0.15rem 0.6rem', fontSize: '0.72rem',
            }}>{currentUser?.role}</span>
          </div>
        </div>

        {/* Tabs */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.25rem', paddingBottom: '0' }}>
            {([['overview', 'סקירה'], ['users', 'משתמשים'], ['history', 'היסטוריה']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === key ? '#c9a227' : 'transparent'}`,
                  color: tab === key ? '#c9a227' : '#3a2a10', padding: '0.5rem 1rem',
                  cursor: 'pointer', fontSize: '0.85rem', fontFamily: '"Heebo", Arial, sans-serif',
                  transition: 'all 0.2s',
                }}>{label}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 2rem 4rem' }}>

        {/* Action message */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{
                background: actionMsg.startsWith('שגיאה') ? 'rgba(58,16,16,0.8)' : 'rgba(74,158,106,0.1)',
                border: `1px solid ${actionMsg.startsWith('שגיאה') ? 'rgba(200,80,80,0.3)' : 'rgba(74,158,106,0.3)'}`,
                borderRadius: 10, padding: '0.75rem 1.1rem',
                color: actionMsg.startsWith('שגיאה') ? '#f5a5a5' : '#4a9e6a',
                fontSize: '0.88rem', marginBottom: '1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              {actionMsg}
              <button onClick={() => setActionMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem' }}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'אנשים', value: stats.people, icon: '👥', color: '#378ADD', path: 'people' },
                { label: 'משפחות', value: stats.families, icon: '🏛️', color: '#c9a227', path: 'families' },
                { label: 'תמונות', value: stats.photos, icon: '🖼️', color: '#9a6ab0', path: 'gallery' },
                { label: 'אירועים', value: stats.events, icon: '📅', color: '#4a9e6a', path: 'timeline' },
              ].map((s, i) => (
                <motion.a key={s.label} href={`/${locale}/${s.path}`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  style={{
                    background: 'rgba(26,15,5,0.8)', border: `1px solid ${s.color}22`,
                    borderTop: `3px solid ${s.color}`,
                    borderRadius: 14, padding: '1.25rem',
                    textDecoration: 'none', color: 'inherit',
                    display: 'flex', flexDirection: 'column', gap: '0.4rem',
                  }}>
                  <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>
                    <Counter target={s.value} color={s.color} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#3a2a10' }}>{s.label}</div>
                </motion.a>
              ))}
            </div>

            {/* Pending Requests */}
            {isAdmin && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#3a2a10', letterSpacing: '0.1em' }}>✦ בקשות הצטרפות ממתינות</div>
                  {pendingRequests.length > 0 && (
                    <span style={{ background: 'rgba(201,162,39,0.15)', color: '#c9a227', borderRadius: 20, padding: '0.1rem 0.6rem', fontSize: '0.72rem' }}>
                      {pendingRequests.length} ממתינות
                    </span>
                  )}
                </div>

                {pendingRequests.length === 0 ? (
                  <div style={{ background: 'rgba(26,15,5,0.5)', border: '1px solid rgba(201,162,39,0.08)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', color: '#3a2a10', fontSize: '0.88rem' }}>
                    אין בקשות ממתינות ✓
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {pendingRequests.map(req => (
                      <motion.div key={req.id}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        style={{
                          background: 'rgba(26,15,5,0.8)', border: '1px solid rgba(201,162,39,0.15)',
                          borderRadius: 12, padding: '1rem 1.25rem',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
                        }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f5d98b' }}>{req.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#3a2a10', direction: 'ltr' }}>{req.email}</div>
                          {req.family_name && <div style={{ fontSize: '0.72rem', color: '#c9a227' }}>🏛️ {req.family_name}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => approveRequest(req)}
                            style={{
                              background: 'rgba(74,158,106,0.15)', border: '1px solid rgba(74,158,106,0.35)',
                              color: '#4a9e6a', borderRadius: 8, padding: '0.4rem 0.9rem',
                              cursor: 'pointer', fontSize: '0.82rem', fontFamily: '"Heebo", Arial, sans-serif',
                            }}>✓ אשר</button>
                          <button onClick={() => rejectRequest(req.id)}
                            style={{
                              background: 'rgba(200,80,80,0.08)', border: '1px solid rgba(200,80,80,0.2)',
                              color: '#f5a5a5', borderRadius: 8, padding: '0.4rem 0.9rem',
                              cursor: 'pointer', fontSize: '0.82rem', fontFamily: '"Heebo", Arial, sans-serif',
                            }}>✕ דחה</button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Nav */}
            <div style={{ marginTop: '2rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#3a2a10', letterSpacing: '0.1em', marginBottom: '1rem' }}>✦ ניהול מהיר</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.6rem' }}>
                {[
                  ['עריכת אנשים', 'people-edit', '👤'],
                  ['עריכת אירועים', 'events-edit', '📅'],
                  ['עריכת תמונות', 'gallery-edit', '🖼️'],
                  ['עריכת סיפורים', 'stories-edit', '📖'],
                  ['שואה', 'holocaust', '✡️'],
                ].map(([label, path, icon]) => (
                  <a key={path} href={`/${locale}/${path}`}
                    style={{
                      background: 'rgba(26,15,5,0.6)', border: '1px solid rgba(201,162,39,0.08)',
                      borderRadius: 10, padding: '0.9rem 1rem',
                      textDecoration: 'none', color: '#c8b08a', fontSize: '0.85rem',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(201,162,39,0.25)'; e.currentTarget.style.color = '#f5d98b' }}
                    onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(201,162,39,0.08)'; e.currentTarget.style.color = '#c8b08a' }}
                  >{icon} {label}</a>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Users ── */}
        {tab === 'users' && isAdmin && (
          <div>
            <div style={{ fontSize: '0.7rem', color: '#3a2a10', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              ✦ ניהול משתמשים ({users.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {users.map(u => (
                <motion.div key={u.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.08)',
                    borderRadius: 12, padding: '1rem 1.25rem',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f5d98b', fontSize: '0.93rem' }}>{u.full_name || '—'}</div>
                      <div style={{ fontSize: '0.73rem', color: '#3a2a10', direction: 'ltr' }}>{u.email}</div>
                      {u.family?.name && <div style={{ fontSize: '0.72rem', color: '#c9a227' }}>🏛️ {u.family.name}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        value={roleEdit[u.id] ?? u.role ?? 'viewer'}
                        onChange={e => setRoleEdit(prev => ({ ...prev, [u.id]: e.target.value }))}
                        style={{
                          background: 'rgba(13,7,2,0.8)', border: '1px solid rgba(201,162,39,0.2)',
                          borderRadius: 8, padding: '0.35rem 0.6rem',
                          color: '#f0e8d0', fontSize: '0.82rem', fontFamily: '"Heebo", Arial, sans-serif', cursor: 'pointer', outline: 'none',
                        }}>
                        <option value="viewer">צופה</option>
                        <option value="editor">עורך</option>
                        <option value="admin">מנהל</option>
                      </select>
                      <button onClick={() => changeRole(u.id, roleEdit[u.id] ?? u.role ?? 'viewer')}
                        style={{
                          background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.25)',
                          color: '#c9a227', borderRadius: 8, padding: '0.35rem 0.75rem',
                          cursor: 'pointer', fontSize: '0.78rem', fontFamily: '"Heebo", Arial, sans-serif',
                        }}>עדכן</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="password"
                      placeholder="סיסמה חדשה (6+ תווים)"
                      value={newPasswords[u.id] || ''}
                      onChange={e => setNewPasswords(prev => ({ ...prev, [u.id]: e.target.value }))}
                      style={{
                        background: 'rgba(13,7,2,0.8)', border: '1px solid rgba(201,162,39,0.12)',
                        borderRadius: 8, padding: '0.35rem 0.75rem',
                        color: '#f0e8d0', fontSize: '0.82rem', fontFamily: '"Heebo", Arial, sans-serif',
                        outline: 'none', flex: 1, minWidth: 0,
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.4)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.12)')}
                    />
                    <button onClick={() => resetPassword(u.id)}
                      style={{
                        background: 'rgba(90,138,176,0.1)', border: '1px solid rgba(90,138,176,0.25)',
                        color: '#5a8ab0', borderRadius: 8, padding: '0.35rem 0.75rem',
                        cursor: 'pointer', fontSize: '0.78rem', fontFamily: '"Heebo", Arial, sans-serif', whiteSpace: 'nowrap',
                      }}>איפוס סיסמה</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── History ── */}
        {tab === 'history' && isAdmin && (
          <div>
            <div style={{ fontSize: '0.7rem', color: '#3a2a10', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              ✦ היסטוריית פעולות
            </div>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#3a2a10' }}>אין רשומות</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {logs.map((log, i) => (
                  <motion.div key={log.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    style={{
                      background: 'rgba(26,15,5,0.6)', border: '1px solid rgba(201,162,39,0.06)',
                      borderRadius: 8, padding: '0.65rem 1rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem',
                    }}>
                    <div>
                      <span style={{ color: '#c8b08a', fontSize: '0.85rem' }}>{log.action}</span>
                      {log.details && <span style={{ color: '#3a2a10', fontSize: '0.78rem', marginRight: '0.5rem' }}>· {log.details}</span>}
                    </div>
                    {log.created_at && (
                      <span style={{ color: '#1a0f05', fontSize: '0.72rem', flexShrink: 0 }}>
                        {new Date(log.created_at).toLocaleDateString('he-IL')}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

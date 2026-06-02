'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import TodayInHistory from '@/components/TodayInHistory'

type Stats = { people: number; families: number; photos: number; documents: number; stops: number }
type JoinRequest = { id: number; email: string; full_name: string; family_name?: string; status: string; created_at: string; family_id?: number }
type UserRole = { id: number; user_id: string; email?: string; full_name?: string; display_name?: string; role: string; family_id?: number; family_name?: string }
type HistoryItem = { id: string; action: string; entity_type: string; details: any; created_at: string; user_id?: string }

const NAV = [
  { icon: '👥', label: 'אנשים', desc: 'בני המשפחה', href: '/people', color: '#378ADD' },
  { icon: '🌳', label: 'עץ משפחה', href: '/tree', color: '#4ade80' },
  { icon: '🌍', label: 'מפת נדידה', href: '/map', color: '#c9a227' },
  { icon: '🖼️', label: 'גלריה', href: '/gallery', color: '#c97a20' },
  { icon: '📄', label: 'מסמכים', href: '/documents', color: '#4a9e6a' },
  { icon: '📅', label: 'ציר זמן', href: '/timeline', color: '#9a6ab0' },
  { icon: '📝', label: 'סיפורים', href: '/stories', color: '#4ab09a' },
  { icon: '📆', label: 'לוח שנה', href: '/calendar', color: '#b06a4a' },
  { icon: '📖', label: 'ספר', href: '/book', color: '#6a8ab0' },
  { icon: '✡️', label: 'שואה', href: '/holocaust', color: '#8b6914' },
  { icon: '🔍', label: 'חיפוש', href: '/search', color: '#888' },
]

export default function DashboardPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ people: 0, families: 0, photos: 0, documents: 0, stops: 0 })
  const [families, setFamilies] = useState<any[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [users, setUsers] = useState<UserRole[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [tab, setTab] = useState<'overview'|'users'|'history'>('overview')
  const [approving, setApproving] = useState<number|null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push(`/${locale}/login`); return }
        setUserName(user.email?.split('@')[0] || '')

        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
        const role = roleData?.role || ''
        setCanEdit(role === 'admin' || role === 'editor')
        setIsAdmin(role === 'admin')

        const pplRes = await supabase.from('people').select('id', { count: 'exact', head: true })
        const famsRes = await supabase.from('families').select('*')
        let photoCount = 0, docCount = 0, stopCount = 0
        try { const r = await supabase.from('photos').select('id', { count: 'exact', head: true }); photoCount = r.count || 0 } catch (e) {}
        try { const r = await supabase.from('documents').select('id', { count: 'exact', head: true }); docCount = r.count || 0 } catch (e) {}
        try { const r = await supabase.from('globe_stops').select('id', { count: 'exact', head: true }); stopCount = r.count || 0 } catch (e) {}
        setStats({ people: pplRes.count || 0, families: famsRes.data?.length || 0, photos: photoCount, documents: docCount, stops: stopCount })
        setFamilies(famsRes.data || [])

        // Load join requests
        if (role === 'admin') {
          const { data: requests } = await supabase.from('join_requests').select('*').order('created_at', { ascending: false })
          setJoinRequests(requests || [])

          // Load users — combine join_requests (has names) + user_roles (has roles)
          const { data: roles } = await supabase.from('user_roles').select('*').order('role')
          const { data: allRequests } = await supabase.from('join_requests').select('*').order('created_at', { ascending: false })
          setJoinRequests(allRequests || [])

          // Build user list: start with user_roles, enrich with join_requests
          const approvedRequests = (allRequests || []).filter(r => r.status === 'approved')
          const allUsers: any[] = []

          // Add all users from user_roles
          for (const role of (roles || [])) {
            // Find matching join request by user_id or email
            const matchingReq = approvedRequests.find(r => r.email === role.email) 
              || approvedRequests.find(r => r.full_name === role.full_name)
            
            allUsers.push({
              ...role,
              display_name: role.full_name || matchingReq?.full_name || role.email || role.user_id?.substring(0, 12) || '—',
              email: role.email || matchingReq?.email || '',
              family_name: role.family_name || matchingReq?.family_name || '',
            })
          }

          // Add approved requests that don't have a user_role entry yet
          for (const req of approvedRequests) {
            const exists = allUsers.find(u => u.email === req.email || u.full_name === req.full_name)
            if (!exists) {
              allUsers.push({
                id: req.id,
                user_id: '',
                role: 'viewer',
                display_name: req.full_name,
                email: req.email,
                family_name: req.family_name || '',
              })
            }
          }

          setUsers(allUsers)

          // Load edit history
          const [gh, th] = await Promise.all([
            supabase.from('globe_history').select('*').order('created_at', { ascending: false }).limit(30),
            supabase.from('tree_history').select('*').order('created_at', { ascending: false }).limit(30),
          ])
          const combined = [...(gh.data || []), ...(th.data || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50)
          setHistory(combined)
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [locale])

  // Approve join request
  const approveRequest = async (req: JoinRequest) => {
    setApproving(req.id)
    try {
      // Generate random password
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
      const password = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: req.email,
          password,
          full_name: req.full_name,
          role: 'viewer',
          family_ids: req.family_id ? [req.family_id] : [],
        }),
      })
      const data = await res.json()
      if (data.error) { alert('שגיאה: ' + data.error); setApproving(null); return }

      // Update join request status
      await supabase.from('join_requests').update({ status: 'approved' }).eq('id', req.id)

      // Add family access
      if (req.family_id && data.user_id) {
        try {
          await supabase.from('user_family_access').upsert({
            user_id: data.user_id, family_id: req.family_id,
          }, { onConflict: 'user_id,family_id' })
        } catch {}
      }

      setJoinRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))

      // Send password via EmailJS automatically
      try {
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: 'service_akgxyes',
            template_id: 'template_08gt7is',
            user_id: 'd3qyEoM8kI2LldfSK',
            template_params: {
              full_name: req.full_name,
              email: req.email,
              password,
              to_email: req.email,
            },
          }),
        })
      } catch (e) { console.error('שגיאה בשליחת אימייל:', e) }

      // Show password to admin — copy to clipboard
      try { await navigator.clipboard.writeText(password) } catch {}
      alert(`✅ ${req.full_name} אושר!\n\nסיסמה נשלחה אוטומטית ל-${req.email}\nסיסמה: ${password}\n\n(הועתקה ללוח)`)

      // Reload users
      const { data: roles } = await supabase.from('user_roles').select('*').order('role')
      const { data: joinData } = await supabase.from('join_requests').select('email, full_name, family_name, status')
      const enriched = (roles || []).map(u => {
        const ji = joinData?.find(j => j.email === u.email)
        return { ...u, display_name: ji?.full_name || u.full_name || u.email, family_name: ji?.family_name || u.family_name || '' }
      })
      setUsers(enriched)
    } catch (err) { alert('שגיאה באישור: ' + (err as Error).message) }
    setApproving(null)
  }

  const rejectRequest = async (req: JoinRequest) => {
    await supabase.from('join_requests').update({ status: 'rejected' }).eq('id', req.id)
    setJoinRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r))
  }

  const changeRole = async (userId: string, role: string) => {
    await supabase.from('user_roles').update({ role }).eq('user_id', userId)
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role } : u))
  }

  const resetPassword = async (userId: string, email: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    const newPass = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const res = await fetch('/api/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, password: newPass }) })
    const data = await res.json()
    if (data.success) {
      try { await navigator.clipboard.writeText(newPass) } catch {}
      alert(`🔑 סיסמה חדשה ל-${email}:\n\n${newPass}\n\nהסיסמה הועתקה ללוח.`)
    } else alert('שגיאה: ' + (data.error || 'לא ידוע'))
  }

  const pendingCount = joinRequests.filter(r => r.status === 'pending').length

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0702', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 48, color: '#c9a227' }}>✦</motion.div>
    </div>
  )

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0d0702, #1a0f05)', color: '#f5e6c8', fontFamily: '"Heebo", Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0d0702ee', borderBottom: '1px solid #c9a22722', padding: '1.2rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontFamily: '"Playfair Display", serif', color: '#f5d98b', marginBottom: 2 }}>שלום{userName ? `, ${userName}` : ''} 👋</h1>
            <p style={{ color: '#5a3a1a', fontSize: '0.8rem' }}>לוח בקרה · ארכיון המשפחות</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canEdit && <a href={`/${locale}/admin-edit`} style={{ background: 'linear-gradient(135deg, #c9a227, #a68520)', borderRadius: 10, padding: '7px 16px', color: '#0d0702', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>✏️ מרכז עריכה</a>}
            <a href={`/${locale}`} style={{ border: '1px solid #c9a22744', borderRadius: 10, padding: '7px 16px', color: '#c9a227', textDecoration: 'none', fontSize: 13 }}>🏠 בית</a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isAdmin && (
        <div style={{ background: '#0d070299', borderBottom: '1px solid #1a0f05', padding: '0 2rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 4 }}>
            {[
              { id: 'overview' as const, label: '📊 סקירה' },
              { id: 'users' as const, label: `👥 משתמשים${pendingCount ? ` (${pendingCount})` : ''}` },
              { id: 'history' as const, label: '📝 היסטוריה' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? '#c9a22718' : 'transparent',
                border: 'none', borderBottom: tab === t.id ? '2px solid #c9a227' : '2px solid transparent',
                padding: '10px 16px', color: tab === t.id ? '#f5d98b' : '#5a3a1a',
                cursor: 'pointer', fontSize: 13, fontFamily: '"Heebo", sans-serif',
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem' }}>
        {/* === OVERVIEW TAB === */}
        {tab === 'overview' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
              {[
                { label: 'בני משפחה', value: stats.people, icon: '👥', color: '#378ADD' },
                { label: 'משפחות', value: stats.families, icon: '🏠', color: '#c9a227' },
                { label: 'תמונות', value: stats.photos, icon: '🖼️', color: '#c97a20' },
                { label: 'מסמכים', value: stats.documents, icon: '📄', color: '#4a9e6a' },
                { label: 'תחנות', value: stats.stops, icon: '🌍', color: '#9a6ab0' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ background: '#1a0f0566', border: '1px solid #c9a22715', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#8b6914' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            <TodayInHistory />

            {/* Quick nav */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: '1.5rem' }}>
              {NAV.map((n, i) => (
                <motion.a key={n.label} href={`/${locale}${n.href}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -2 }}
                  style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 10, padding: '10px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{n.icon}</span>
                  <span style={{ fontSize: 13, color: '#f5e6c8' }}>{n.label}</span>
                </motion.a>
              ))}
            </div>

            {/* Families */}
            {families.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {families.map(f => (
                  <a key={f.id} href={`/${locale}/families/${f.id}`} style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 12, padding: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2a1a08', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {f.image_url ? <img src={f.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏛️'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f5e6c8' }}>{f.name}</div>
                      {f.origin_country && <div style={{ fontSize: 11, color: '#5a3a1a' }}>{f.origin_country}</div>}
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Pending requests alert */}
            {pendingCount > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ background: '#c9a22715', border: '1px solid #c9a22744', borderRadius: 12, padding: '14px 18px', marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#f5d98b', fontSize: 14 }}>📬 {pendingCount} בקשות הצטרפות ממתינות</span>
                <button onClick={() => setTab('users')} style={{ background: '#c9a227', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>צפה →</button>
              </motion.div>
            )}
          </>
        )}

        {/* === USERS TAB === */}
        {tab === 'users' && (
          <>
            {/* Pending requests */}
            <h3 style={{ fontSize: '1rem', color: '#c9a227', marginBottom: 10, fontWeight: 600, borderBottom: '1px solid #c9a22722', paddingBottom: 6 }}>
              📬 בקשות הצטרפות {pendingCount > 0 && `(${pendingCount} ממתינות)`}
            </h3>
            {joinRequests.filter(r => r.status === 'pending').length === 0 && (
              <div style={{ color: '#5a3a1a', fontSize: 13, padding: '1rem 0' }}>אין בקשות ממתינות</div>
            )}
            {joinRequests.filter(r => r.status === 'pending').map(req => (
              <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ background: '#c9a22711', border: '1px solid #c9a22733', borderRadius: 12, padding: '14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f5e6c8' }}>{req.full_name}</div>
                  <div style={{ fontSize: 12, color: '#8b6914' }}>{req.email}</div>
                  {req.family_name && <div style={{ fontSize: 11, color: '#5a3a1a' }}>משפחה: {req.family_name}</div>}
                  <div style={{ fontSize: 10, color: '#3a2a10' }}>{new Date(req.created_at).toLocaleDateString('he-IL')}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => approveRequest(req)} disabled={approving === req.id} style={{
                    background: '#4ade80', border: 'none', borderRadius: 8, padding: '6px 14px',
                    color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                    opacity: approving === req.id ? 0.5 : 1,
                  }}>{approving === req.id ? '⏳' : '✅ אשר ושלח סיסמה'}</button>
                  <button onClick={() => rejectRequest(req)} style={{
                    background: 'transparent', border: '1px solid #c94949', borderRadius: 8,
                    padding: '6px 12px', color: '#c94949', cursor: 'pointer', fontSize: 12,
                  }}>❌ דחה</button>
                </div>
              </motion.div>
            ))}

            {/* Approved/rejected */}
            {joinRequests.filter(r => r.status !== 'pending').length > 0 && (
              <>
                <h4 style={{ fontSize: '0.9rem', color: '#8b6914', marginTop: 16, marginBottom: 8 }}>היסטוריית בקשות</h4>
                {joinRequests.filter(r => r.status !== 'pending').map(req => (
                  <div key={req.id} style={{ background: '#1a0f0533', borderRadius: 8, padding: '8px 12px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ color: '#b89a5a' }}>{req.full_name} · {req.email}</span>
                    <span style={{ color: req.status === 'approved' ? '#4ade80' : '#c94949', border: '1px solid currentColor', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>
                      {req.status === 'approved' ? '✓ אושר' : '✕ נדחה'}
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Active users */}
            <h3 style={{ fontSize: '1rem', color: '#c9a227', marginTop: 24, marginBottom: 10, fontWeight: 600, borderBottom: '1px solid #c9a22722', paddingBottom: 6 }}>
              👥 משתמשים פעילים ({users.length})
            </h3>
            {users.map(u => (
              <div key={u.id} style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#f5e6c8', fontWeight: 600 }}>{u.display_name || u.full_name || u.email || '—'}</div>
                  <div style={{ fontSize: 11, color: '#5a3a1a' }}>
                    {u.role === 'admin' ? '👑 מנהל' : u.role === 'editor' ? '✏️ עורך' : '👁️ צופה'}
                    {u.family_name && ` · ${u.family_name}`}
                    {u.email && <span style={{ marginRight: 6, color: '#3a2a10' }}>({u.email})</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <select value={u.role} onChange={e => changeRole(u.user_id, e.target.value)} style={{
                    background: '#1a0f05', border: '1px solid #c9a22722', borderRadius: 6,
                    padding: '3px 6px', color: '#c9a227', fontSize: 11, cursor: 'pointer',
                  }}>
                    <option value="viewer">צופה</option>
                    <option value="editor">עורך</option>
                    <option value="admin">מנהל</option>
                  </select>
                  <button onClick={() => resetPassword(u.user_id, u.email || '')} style={{
                    background: 'transparent', border: '1px solid #c9a22733', borderRadius: 6,
                    padding: '3px 8px', color: '#8b6914', cursor: 'pointer', fontSize: 11,
                  }}>🔑</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* === HISTORY TAB === */}
        {tab === 'history' && (
          <>
            <h3 style={{ fontSize: '1rem', color: '#c9a227', marginBottom: 10, fontWeight: 600 }}>📝 היסטוריית עריכות</h3>
            {history.length === 0 && <div style={{ color: '#5a3a1a', fontSize: 13, padding: '2rem 0', textAlign: 'center' }}>אין עריכות עדיין</div>}
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {history.map((h, i) => {
                const time = new Date(h.created_at).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                const actionLabel = h.action === 'create' ? '➕ נוצר' : h.action === 'update' ? '✏️ עודכן' : h.action === 'delete' ? '🗑️ נמחק' : h.action === 'link' ? '🔗 קושר' : h.action
                const entityLabel = h.entity_type === 'person' ? 'אדם' : h.entity_type === 'stop' ? 'תחנה' : h.entity_type === 'route' ? 'מסלול' : h.entity_type === 'relation' ? 'קשר' : h.entity_type
                return (
                  <motion.div key={h.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: '1px solid #1a0f05', padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#c9a227', fontSize: 12 }}>{actionLabel}</span>
                      <span style={{ color: '#b89a5a', fontSize: 12, marginRight: 6 }}>{entityLabel}</span>
                      {h.details?.name && <span style={{ color: '#f5e6c8', fontSize: 12 }}>— {h.details.name}</span>}
                      {h.details?.city && <span style={{ color: '#8b6914', fontSize: 12 }}> · {h.details.city}</span>}
                    </div>
                    <span style={{ color: '#3a2a10', fontSize: 11, whiteSpace: 'nowrap' }}>{time}</span>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

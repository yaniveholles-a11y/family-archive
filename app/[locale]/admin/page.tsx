'use client'
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type UserRole = {
  id: number
  user_id: string
  role: string
  created_at: string
}

export default function AdminPage() {
  const { locale } = useParams() as { locale: string }
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('viewer')
  const [saving, setSaving] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState('')
  const router = useRouter()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/login'); return }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userData.user.id)
      .single()

    if (!roleData || roleData.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setCurrentUserRole(roleData.role)

    const { data: allRoles } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at')

    setRoles(allRoles || [])
    setLoading(false)
  }

  async function handleAddUser() {
    if (!newEmail.trim()) { alert('הכנס אימייל'); return }
    setSaving(true)

    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === newEmail.trim())

    if (!user) {
      alert('משתמש עם אימייל זה לא נמצא במערכת. הוא צריך להירשם קודם.')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('user_roles').insert({
      user_id: user.id,
      role: newRole,
    })

    if (error) {
      alert('שגיאה בהוספה: ' + error.message)
    } else {
      setNewEmail('')
      load()
    }
    setSaving(false)
  }

  async function handleChangeRole(id: number, role: string) {
    await supabase.from('user_roles').update({ role }).eq('id', id)
    load()
  }

  async function handleDelete(id: number) {
    if (!confirm('האם למחוק את ההרשאה?')) return
    await supabase.from('user_roles').delete().eq('id', id)
    load()
  }

  const roleLabels: Record<string, string> = {
    admin: 'מנהל ראשי',
    editor: 'עורך',
    viewer: 'צופה בלבד',
  }

  const roleColors: Record<string, string> = {
    admin: '#c9a227',
    editor: '#5a8ab0',
    viewer: '#5a5a5a',
  }

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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        <h1 style={{ fontSize: '1.8rem', color: '#f5d98b', marginBottom: '0.5rem' }}>ניהול הרשאות</h1>
        <div style={{ width: '80px', height: '1px', background: '#c9a227', marginBottom: '0.75rem' }} />
        <p style={{ color: '#b89a5a', fontSize: '0.88rem', marginBottom: '2rem' }}>
          מנהל ראשי — גישה מלאה לכל האתר ולניהול משתמשים<br />
          עורך — יכול להוסיף ולערך תוכן<br />
          צופה בלבד — יכול לצפות בלבד, לא לערוך
        </p>

        {/* הוספת משתמש */}
        <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#f5d98b', marginBottom: '1rem' }}>הוסף משתמש</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="אימייל המשתמש"
              style={{ flex: 1, minWidth: '200px', background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.95rem', direction: 'ltr' }}
            />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              style={{ background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.95rem' }}
            >
              <option value="viewer">צופה בלבד</option>
              <option value="editor">עורך</option>
              <option value="admin">מנהל ראשי</option>
            </select>
            <button
              onClick={handleAddUser}
              disabled={saving}
              style={{ background: '#c9a227', color: '#1a0f05', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
            >
              {saving ? 'מוסיף...' : 'הוסף'}
            </button>
          </div>
        </div>

        {/* רשימת משתמשים */}
        {roles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#b89a5a' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p>אין משתמשים עם הרשאות מוגדרות</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {roles.map(r => (
            <div key={r.id} style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#7a5a2a', marginBottom: '0.25rem', direction: 'ltr' }}>{r.user_id}</div>
                <div style={{ display: 'inline-block', background: roleColors[r.role] + '33', border: '1px solid ' + roleColors[r.role], borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.82rem', color: roleColors[r.role] }}>
                  {roleLabels[r.role] || r.role}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  value={r.role}
                  onChange={e => handleChangeRole(r.id, e.target.value)}
                  style={{ background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '6px', padding: '0.4rem 0.6rem', color: '#f5e6c8', fontSize: '0.85rem' }}
                >
                  <option value="viewer">צופה</option>
                  <option value="editor">עורך</option>
                  <option value="admin">מנהל</option>
                </select>
                <button
                  onClick={() => handleDelete(r.id)}
                  style={{ background: 'transparent', border: '1px solid #5a1a10', borderRadius: '6px', color: '#c05050', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  הסר
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
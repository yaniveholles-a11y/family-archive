'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function FamilyEditPage() {
  const { id } = useParams()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', origin_country: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('families').select('*').eq('id', id).single()
      if (data) setForm({ name: data.name || '', description: data.description || '', origin_country: data.origin_country || '' })
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    if (!form.name.trim()) { alert('חובה להכניס שם משפחה'); return }
    setSaving(true)
    const { error } = await supabase.from('families').update({
      name: form.name,
      description: form.description || null,
      origin_country: form.origin_country || null,
    }).eq('id', id)
    if (error) { alert('שגיאה בשמירה'); setSaving(false) }
    else router.push('/families/' + id)
  }

  async function handleDelete() {
    if (!confirm('האם אתה בטוח שרוצה למחוק את המשפחה?')) return
    await supabase.from('families').delete().eq('id', id)
    router.push('/')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#1c1008',
    border: '1px solid #3a2a10',
    borderRadius: '8px',
    padding: '0.65rem 0.9rem',
    color: '#f5e6c8',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    color: '#b89a5a',
    marginBottom: '0.4rem',
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#1c1008', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#b89a5a' }}>טוען...</p>
    </main>
  )

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={'/families/' + id} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ חזרה למשפחה</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>עריכת משפחה</span>
      </div>

      <div style={{ maxWidth: '580px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#f5d98b', marginBottom: '0.5rem' }}>עריכת פרטי משפחה</h1>
        <div style={{ width: '80px', height: '1px', background: '#c9a227', marginBottom: '2rem' }} />

        <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div>
            <label style={labelStyle}>שם המשפחה *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>מדינת מוצא</label>
            <input value={form.origin_country} onChange={e => setForm({ ...form, origin_country: e.target.value })} placeholder="לדוגמה: פולין, מרוקו, תימן" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>תיאור קצר</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ background: saving ? '#5a4a10' : '#c9a227', color: '#1a0f05', border: 'none', borderRadius: '8px', padding: '0.7rem 1.75rem', fontSize: '1rem', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', flex: 1 }}>
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
            <a href={'/families/' + id} style={{ border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.7rem 1.25rem', color: '#b89a5a', textDecoration: 'none', fontSize: '1rem', textAlign: 'center' }}>
              ביטול
            </a>
          </div>

          <div style={{ borderTop: '1px solid #3a2a10', paddingTop: '1.25rem' }}>
            <p style={{ fontSize: '0.82rem', color: '#5a3a1a', marginBottom: '0.75rem' }}>⚠️ מחיקת משפחה תמחק גם את כל הקשרים שלה</p>
            <button onClick={handleDelete}
              style={{ background: 'transparent', border: '1px solid #5a1a10', borderRadius: '8px', padding: '0.5rem 1.25rem', color: '#c05050', cursor: 'pointer', fontSize: '0.9rem' }}>
              🗑️ מחק משפחה זו
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
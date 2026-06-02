'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function DocumentsEditPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [docs, setDocs] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [form, setForm] = useState({ title: '', description: '', file_url: '', doc_type: 'certificate', person_id: '', year: '' })

  useEffect(() => {
    async function load() {
      const [{ data: d }, { data: p }] = await Promise.all([
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('people').select('id,first_name,last_name'),
      ])
      setDocs(d || []); setPeople(p || []); setLoading(false)
    }
    load()
  }, [])

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const { data, error } = await supabase.storage.from('documents').upload(fileName, file)
      if (error) {
        alert('שגיאה בהעלאה. ודא שיצרת bucket בשם "documents" ב-Supabase Storage.')
        return null
      }
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)
      return urlData.publicUrl
    } catch { return null }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFile(file)
    if (url) setForm(f => ({...f, file_url: url}))
  }

  const save = async () => {
    if (!form.title.trim()) { alert('כותרת חובה'); return }
    const payload = { title: form.title, description: form.description || null, file_url: form.file_url || null, doc_type: form.doc_type, person_id: form.person_id ? parseInt(form.person_id) : null, year: form.year ? parseInt(form.year) : null }
    if (editId) await supabase.from('documents').update(payload).eq('id', editId)
    else await supabase.from('documents').insert(payload)
    setShowAdd(false); setEditId(null)
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    setDocs(data || [])
  }

  const DOC_TYPES = [
    { id: 'certificate', label: 'תעודה' }, { id: 'letter', label: 'מכתב' },
    { id: 'id_card', label: 'תעודת זהות' }, { id: 'passport', label: 'דרכון' },
    { id: 'marriage', label: 'כתובה' }, { id: 'military', label: 'צבאי' },
    { id: 'immigration', label: 'הגירה' }, { id: 'other', label: 'אחר' },
  ]

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', color: '#f5e6c8', fontFamily: '"Heebo", sans-serif' }}>
      <div style={{ borderBottom: '1px solid #c9a22722', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 8, padding: '5px 12px', color: '#c9a227', cursor: 'pointer', fontSize: 13 }}>→ חזרה</button>
          <span style={{ fontSize: 18 }}>📄</span><span style={{ fontWeight: 600, fontSize: 16 }}>עריכת מסמכים</span>
        </div>
        <button onClick={() => { setEditId(null); setForm({ title: '', description: '', file_url: '', doc_type: 'certificate', person_id: '', year: '' }); setShowAdd(true) }}
          style={{ background: '#c9a227', border: 'none', borderRadius: 10, padding: '7px 16px', color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ הוסף מסמך</button>
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        {docs.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 12, padding: '14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f5e6c8' }}>📄 {d.title}</div>
              <div style={{ fontSize: 12, color: '#8b6914' }}>{DOC_TYPES.find(t => t.id === d.doc_type)?.label || d.doc_type}{d.year ? ` · ${d.year}` : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {d.file_url && <a href={d.file_url} target="_blank" style={{ border: '1px solid #c9a22733', borderRadius: 6, padding: '4px 8px', color: '#c9a227', textDecoration: 'none', fontSize: 12 }}>👁️</a>}
              <button onClick={() => { setEditId(d.id); setForm({ title: d.title, description: d.description || '', file_url: d.file_url || '', doc_type: d.doc_type || 'certificate', person_id: d.person_id?.toString() || '', year: d.year?.toString() || '' }); setShowAdd(true) }}
                style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 6, padding: '4px 8px', color: '#c9a227', cursor: 'pointer', fontSize: 12 }}>✏️</button>
              <button onClick={async () => { if (!confirm('למחוק?')) return; await supabase.from('documents').delete().eq('id', d.id); setDocs(prev => prev.filter(x => x.id !== d.id)) }}
                style={{ background: 'none', border: '1px solid #c9494933', borderRadius: 6, padding: '4px 8px', color: '#c94949', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
            </div>
          </motion.div>
        ))}
        {docs.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#5a3a1a' }}><div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>אין מסמכים</div>}
      </div>
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: '#000a', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} dir="rtl"
              style={{ background: 'linear-gradient(180deg, #1e140a, #0d0702)', border: '1px solid #c9a22744', borderRadius: 16, padding: 20, width: '100%', maxWidth: 420 }}>
              <h3 style={{ marginBottom: 14, color: '#f5e6c8' }}>{editId ? 'ערוך מסמך' : 'הוסף מסמך'}</h3>
              <Lab>כותרת *</Lab><input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} style={inp} />
              <Lab>תיאור</Lab><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} style={{...inp, resize: 'vertical' as const}} />
              <Lab>העלה קובץ</Lab>
              <label style={{ display: 'block', border: '2px dashed #c9a22744', borderRadius: 12, padding: '16px', textAlign: 'center', cursor: 'pointer', background: '#c9a22708', marginBottom: 8 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>📁</div>
                <div style={{ fontSize: 12, color: '#c9a227' }}>לחץ לבחור קובץ</div>
                <input type="file" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
              <Lab>או הזן URL</Lab><input value={form.file_url} onChange={e => setForm(f => ({...f, file_url: e.target.value}))} placeholder="https://..." style={inp} />
              <Lab>סוג מסמך</Lab><select value={form.doc_type} onChange={e => setForm(f => ({...f, doc_type: e.target.value}))} style={inp}>{DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
              <Lab>שנה</Lab><input value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} type="number" style={inp} />
              <Lab>אדם קשור</Lab><select value={form.person_id} onChange={e => setForm(f => ({...f, person_id: e.target.value}))} style={inp}><option value="">—</option>{people.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}</select>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={save} style={{ flex: 1, background: '#c9a227', border: 'none', borderRadius: 10, padding: 10, color: '#0d0702', cursor: 'pointer', fontWeight: 700 }}>שמור</button>
                <button onClick={() => setShowAdd(false)} style={{ border: '1px solid #c9a22744', borderRadius: 10, padding: '10px 20px', color: '#c9a227', cursor: 'pointer', background: 'none' }}>ביטול</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
function Lab({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 12, color: '#8b6914', marginBottom: 3, fontWeight: 600 }}>{children}</div> }
const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 8, padding: '7px 10px', marginBottom: 8, color: '#f5e6c8', fontSize: 13, outline: 'none' }

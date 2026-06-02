'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Photo = { id: number; url: string; caption?: string; taken_year?: number; taken_place?: string; person_id?: number; created_at: string }

export default function GalleryEditPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ url: '', caption: '', taken_year: '', taken_place: '', person_id: '' })
  const [editId, setEditId] = useState<number|null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: ph }, { data: ppl }] = await Promise.all([
        supabase.from('photos').select('*').order('created_at', { ascending: false }),
        supabase.from('people').select('id,first_name,last_name'),
      ])
      setPhotos(ph || [])
      setPeople(ppl || [])
      setLoading(false)
    }
    load()
  }, [])

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop()
      const fileName = Date.now() + '-' + Math.random().toString(36).substring(7) + '.' + ext
      const { data, error } = await supabase.storage.from('photos').upload(fileName, file)
      if (error) {
        // If bucket doesn't exist, fall back to URL
        alert('שגיאה בהעלאה. ודא שיצרת bucket בשם "photos" ב-Supabase Storage. בינתיים השתמש ב-URL.')
        return null
      }
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)
      return urlData.publicUrl
    } catch {
      alert('שגיאת העלאה')
      return null
    }
  }

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) { alert('רק קבצי תמונה'); return }
    const url = await uploadFile(file)
    if (url) setForm(f => ({...f, url}))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFile(file)
    if (url) setForm(f => ({...f, url}))
  }

  const save = async () => {
    if (!form.url.trim()) { alert('URL תמונה חובה'); return }
    const payload = { url: form.url, caption: form.caption || null, taken_year: form.taken_year ? parseInt(form.taken_year) : null, taken_place: form.taken_place || null, person_id: form.person_id ? parseInt(form.person_id) : null }
    if (editId) {
      await supabase.from('photos').update(payload).eq('id', editId)
    } else {
      await supabase.from('photos').insert(payload)
    }
    setShowAdd(false); setEditId(null); setForm({ url: '', caption: '', taken_year: '', taken_place: '', person_id: '' })
    const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false })
    setPhotos(data || [])
  }

  const deletePhoto = async (id: number) => {
    if (!confirm('למחוק תמונה?')) return
    await supabase.from('photos').delete().eq('id', id)
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', color: '#f5e6c8', fontFamily: '"Heebo", sans-serif' }}>
      <div style={{ borderBottom: '1px solid #c9a22722', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 8, padding: '5px 12px', color: '#c9a227', cursor: 'pointer', fontSize: 13 }}>→ חזרה</button>
          <span style={{ fontSize: 18 }}>🖼️</span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>עריכת גלריה</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setEditId(null); setForm({ url: '', caption: '', taken_year: '', taken_place: '', person_id: '' }); setShowAdd(true) }}
            style={{ background: '#c9a227', border: 'none', borderRadius: 10, padding: '7px 16px', color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ הוסף תמונה</button>
          <a href={`/${locale}/gallery`} style={{ border: '1px solid #c9a22766', borderRadius: 10, padding: '7px 14px', color: '#c9a227', textDecoration: 'none', fontSize: 13 }}>תצוגה ↗</a>
        </div>
      </div>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {photos.map(p => (
            <div key={p.id} style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 12, overflow: 'hidden' }}>
              <img src={p.url} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
              <div style={{ padding: '8px 10px' }}>
                {p.caption && <div style={{ fontSize: 12, color: '#f5e6c8', marginBottom: 2 }}>{p.caption}</div>}
                {p.taken_year && <div style={{ fontSize: 11, color: '#5a3a1a' }}>{p.taken_year}</div>}
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <button onClick={() => { setEditId(p.id); setForm({ url: p.url, caption: p.caption || '', taken_year: p.taken_year?.toString() || '', taken_place: p.taken_place || '', person_id: p.person_id?.toString() || '' }); setShowAdd(true) }}
                    style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 6, padding: '2px 8px', color: '#c9a227', cursor: 'pointer', fontSize: 11 }}>✏️</button>
                  <button onClick={() => deletePhoto(p.id)} style={{ background: 'none', border: '1px solid #c9494933', borderRadius: 6, padding: '2px 8px', color: '#c94949', cursor: 'pointer', fontSize: 11 }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {photos.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#5a3a1a' }}><div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>אין תמונות. לחץ "הוסף תמונה"</div>}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: '#000a', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} dir="rtl"
              style={{ background: 'linear-gradient(180deg, #1e140a, #0d0702)', border: '1px solid #c9a22744', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }}>
              <h3 style={{ marginBottom: 14, color: '#f5e6c8' }}>{editId ? 'ערוך תמונה' : 'הוסף תמונה'}</h3>
              <Lab>העלה תמונה</Lab>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                style={{ border: '2px dashed #c9a22744', borderRadius: 12, padding: '20px', textAlign: 'center', marginBottom: 10, cursor: 'pointer', background: '#c9a22708' }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
                <div style={{ fontSize: 12, color: '#c9a227' }}>גרור תמונה לכאן או לחץ לבחור</div>
                <input id="file-upload" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </div>
              <Lab>או הזן URL</Lab><input value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))} placeholder="https://..." style={inp} />
              <Lab>כיתוב</Lab><input value={form.caption} onChange={e => setForm(f => ({...f, caption: e.target.value}))} style={inp} />
              <Lab>שנת צילום</Lab><input value={form.taken_year} onChange={e => setForm(f => ({...f, taken_year: e.target.value}))} type="number" style={inp} />
              <Lab>מקום צילום</Lab><input value={form.taken_place} onChange={e => setForm(f => ({...f, taken_place: e.target.value}))} style={inp} />
              <Lab>אדם בתמונה</Lab>
              <select value={form.person_id} onChange={e => setForm(f => ({...f, person_id: e.target.value}))} style={inp}>
                <option value="">—</option>
                {people.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}
              </select>
              {form.url && <img src={form.url} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={save} style={{ flex: 1, background: '#c9a227', border: 'none', borderRadius: 10, padding: 10, color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>שמור</button>
                <button onClick={() => setShowAdd(false)} style={{ border: '1px solid #c9a22744', borderRadius: 10, padding: '10px 20px', color: '#c9a227', cursor: 'pointer', background: 'none', fontSize: 13 }}>ביטול</button>
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

'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Story = { id: number; title: string; content?: string; author?: string; person_id?: number; published: boolean; created_at: string }

export default function StoriesEditPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [form, setForm] = useState({ title: '', content: '', author: '', person_id: '', published: true })

  useEffect(() => {
    async function load() {
      const [{ data: st }, { data: ppl }] = await Promise.all([
        supabase.from('stories').select('*').order('created_at', { ascending: false }),
        supabase.from('people').select('id,first_name,last_name'),
      ])
      setStories(st || []); setPeople(ppl || []); setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    if (!form.title.trim()) { alert('כותרת חובה'); return }
    const payload = { title: form.title, content: form.content || null, author: form.author || null, person_id: form.person_id ? parseInt(form.person_id) : null, published: form.published }
    if (editId) await supabase.from('stories').update(payload).eq('id', editId)
    else await supabase.from('stories').insert(payload)
    setShowAdd(false); setEditId(null)
    const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false })
    setStories(data || [])
  }

  const deleteStory = async (id: number) => { if (!confirm('למחוק?')) return; await supabase.from('stories').delete().eq('id', id); setStories(prev => prev.filter(s => s.id !== id)) }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', color: '#f5e6c8', fontFamily: '"Heebo", sans-serif' }}>
      <div style={{ borderBottom: '1px solid #c9a22722', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 8, padding: '5px 12px', color: '#c9a227', cursor: 'pointer', fontSize: 13 }}>→ חזרה</button>
          <span style={{ fontSize: 18 }}>📝</span><span style={{ fontWeight: 600, fontSize: 16 }}>עריכת סיפורים</span>
        </div>
        <button onClick={() => { setEditId(null); setForm({ title: '', content: '', author: '', person_id: '', published: true }); setShowAdd(true) }}
          style={{ background: '#c9a227', border: 'none', borderRadius: 10, padding: '7px 16px', color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ סיפור חדש</button>
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        {stories.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 12, padding: '14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f5e6c8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.title}
                  {!s.published && <span style={{ fontSize: 10, color: '#8b6914', border: '1px solid #5a3a1a', borderRadius: 4, padding: '1px 6px' }}>טיוטה</span>}
                </div>
                {s.author && <div style={{ fontSize: 12, color: '#8b6914' }}>מאת: {s.author}</div>}
                {s.content && <div style={{ fontSize: 12, color: '#5a3a1a', marginTop: 4, maxHeight: 60, overflow: 'hidden' }}>{s.content.substring(0, 150)}...</div>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => { setEditId(s.id); setForm({ title: s.title, content: s.content || '', author: s.author || '', person_id: s.person_id?.toString() || '', published: s.published }); setShowAdd(true) }}
                  style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 6, padding: '4px 8px', color: '#c9a227', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                <button onClick={() => deleteStory(s.id)} style={{ background: 'none', border: '1px solid #c9494933', borderRadius: 6, padding: '4px 8px', color: '#c94949', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
              </div>
            </div>
          </motion.div>
        ))}
        {stories.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#5a3a1a' }}><div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>אין סיפורים</div>}
      </div>
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: '#000a', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} dir="rtl"
              style={{ background: 'linear-gradient(180deg, #1e140a, #0d0702)', border: '1px solid #c9a22744', borderRadius: 16, padding: 20, width: '100%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' }}>
              <h3 style={{ marginBottom: 14, color: '#f5e6c8' }}>{editId ? 'ערוך סיפור' : 'סיפור חדש'}</h3>
              <Lab>כותרת *</Lab><input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} style={inp} />
              <Lab>מחבר</Lab><input value={form.author} onChange={e => setForm(f => ({...f, author: e.target.value}))} style={inp} />
              <Lab>תוכן</Lab><textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} rows={10} style={{...inp, resize: 'vertical' as const, minHeight: 200}} />
              <Lab>אדם קשור</Lab>
              <select value={form.person_id} onChange={e => setForm(f => ({...f, person_id: e.target.value}))} style={inp}>
                <option value="">—</option>{people.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8b6914', fontSize: 12, cursor: 'pointer', marginBottom: 12 }}>
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({...f, published: e.target.checked}))} /> פרסם
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
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

'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Event = { id: number; title: string; description?: string; year?: number; month?: number; day?: number; place?: string; event_type?: string; person_id?: number; family_id?: number; created_at: string }

export default function TimelineEditPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [families, setFamilies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [form, setForm] = useState({ title: '', description: '', year: '', month: '', day: '', place: '', event_type: 'general', person_id: '', family_id: '' })

  useEffect(() => {
    async function load() {
      const [{ data: ev }, { data: ppl }, { data: fams }] = await Promise.all([
        supabase.from('events').select('*').order('year', { ascending: false }),
        supabase.from('people').select('id,first_name,last_name'),
        supabase.from('families').select('id,name'),
      ])
      setEvents(ev || [])
      setPeople(ppl || [])
      setFamilies(fams || [])
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    if (!form.title.trim()) { alert('כותרת חובה'); return }
    const payload = { title: form.title, description: form.description || null, year: form.year ? parseInt(form.year) : null, month: form.month ? parseInt(form.month) : null, day: form.day ? parseInt(form.day) : null, place: form.place || null, event_type: form.event_type, person_id: form.person_id ? parseInt(form.person_id) : null, family_id: form.family_id ? parseInt(form.family_id) : null }
    if (editId) await supabase.from('events').update(payload).eq('id', editId)
    else await supabase.from('events').insert(payload)
    setShowAdd(false); setEditId(null)
    const { data } = await supabase.from('events').select('*').order('year', { ascending: false })
    setEvents(data || [])
  }

  const deleteEvent = async (id: number) => {
    if (!confirm('למחוק אירוע?')) return
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const EVENT_TYPES = ['general','birth','death','marriage','immigration','war','milestone','holiday','other']

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', color: '#f5e6c8', fontFamily: '"Heebo", sans-serif' }}>
      <div style={{ borderBottom: '1px solid #c9a22722', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 8, padding: '5px 12px', color: '#c9a227', cursor: 'pointer', fontSize: 13 }}>→ חזרה</button>
          <span style={{ fontSize: 18 }}>📅</span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>עריכת ציר זמן</span>
        </div>
        <button onClick={() => { setEditId(null); setForm({ title: '', description: '', year: '', month: '', day: '', place: '', event_type: 'general', person_id: '', family_id: '' }); setShowAdd(true) }}
          style={{ background: '#c9a227', border: 'none', borderRadius: 10, padding: '7px 16px', color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ הוסף אירוע</button>
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        {events.map((ev, i) => (
          <motion.div key={ev.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 12, padding: '14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f5e6c8' }}>{ev.title}</div>
              <div style={{ fontSize: 12, color: '#8b6914' }}>{ev.year || ''}{ev.place ? ` · ${ev.place}` : ''}</div>
              {ev.description && <div style={{ fontSize: 12, color: '#5a3a1a', marginTop: 4 }}>{ev.description}</div>}
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => { setEditId(ev.id); setForm({ title: ev.title, description: ev.description || '', year: ev.year?.toString() || '', month: ev.month?.toString() || '', day: ev.day?.toString() || '', place: ev.place || '', event_type: ev.event_type || 'general', person_id: ev.person_id?.toString() || '', family_id: ev.family_id?.toString() || '' }); setShowAdd(true) }}
                style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 6, padding: '4px 8px', color: '#c9a227', cursor: 'pointer', fontSize: 12 }}>✏️</button>
              <button onClick={() => deleteEvent(ev.id)} style={{ background: 'none', border: '1px solid #c9494933', borderRadius: 6, padding: '4px 8px', color: '#c94949', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
            </div>
          </motion.div>
        ))}
        {events.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#5a3a1a' }}><div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>אין אירועים. לחץ "הוסף אירוע"</div>}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: '#000a', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} dir="rtl"
              style={{ background: 'linear-gradient(180deg, #1e140a, #0d0702)', border: '1px solid #c9a22744', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, maxHeight: '80vh', overflowY: 'auto' }}>
              <h3 style={{ marginBottom: 14, color: '#f5e6c8' }}>{editId ? 'ערוך אירוע' : 'הוסף אירוע'}</h3>
              <Lab>כותרת *</Lab><input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} style={inp} />
              <Lab>תיאור</Lab><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} style={{...inp, resize: 'vertical' as const}} />
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 2 }}><Lab>שנה</Lab><input value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} type="number" style={inp} /></div>
                <div style={{ flex: 1 }}><Lab>חודש</Lab><input value={form.month} onChange={e => setForm(f => ({...f, month: e.target.value}))} type="number" min="1" max="12" style={inp} /></div>
                <div style={{ flex: 1 }}><Lab>יום</Lab><input value={form.day} onChange={e => setForm(f => ({...f, day: e.target.value}))} type="number" min="1" max="31" style={inp} /></div>
              </div>
              <Lab>מקום</Lab><input value={form.place} onChange={e => setForm(f => ({...f, place: e.target.value}))} style={inp} />
              <Lab>סוג</Lab>
              <select value={form.event_type} onChange={e => setForm(f => ({...f, event_type: e.target.value}))} style={inp}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t === 'general' ? 'כללי' : t === 'birth' ? 'לידה' : t === 'death' ? 'פטירה' : t === 'marriage' ? 'נישואין' : t === 'immigration' ? 'הגירה' : t === 'war' ? 'מלחמה' : t === 'milestone' ? 'אבן דרך' : t === 'holiday' ? 'חג' : 'אחר'}</option>)}
              </select>
              <Lab>אדם קשור</Lab>
              <select value={form.person_id} onChange={e => setForm(f => ({...f, person_id: e.target.value}))} style={inp}>
                <option value="">—</option>
                {people.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}
              </select>
              <Lab>משפחה</Lab>
              <select value={form.family_id} onChange={e => setForm(f => ({...f, family_id: e.target.value}))} style={inp}>
                <option value="">—</option>
                {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
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

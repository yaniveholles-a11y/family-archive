'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function CalendarEditPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [form, setForm] = useState({ title: '', date: '', event_type: 'yahrzeit', person_id: '', recurring: true, notes: '' })

  useEffect(() => {
    async function load() {
      const [{ data: ev }, { data: ppl }] = await Promise.all([
        supabase.from('calendar_events').select('*').order('date'),
        supabase.from('people').select('id,first_name,last_name,death_date'),
      ])
      setEvents(ev || []); setPeople(ppl || []); setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    if (!form.title.trim()) { alert('כותרת חובה'); return }
    const payload = { title: form.title, date: form.date || null, event_type: form.event_type, person_id: form.person_id ? parseInt(form.person_id) : null, recurring: form.recurring, notes: form.notes || null }
    if (editId) await supabase.from('calendar_events').update(payload).eq('id', editId)
    else await supabase.from('calendar_events').insert(payload)
    setShowAdd(false); setEditId(null)
    const { data } = await supabase.from('calendar_events').select('*').order('date')
    setEvents(data || [])
  }

  const CAL_TYPES = [
    { id: 'yahrzeit', label: '🕯️ יארצייט' }, { id: 'birthday', label: '🎂 יום הולדת' },
    { id: 'anniversary', label: '💍 יום נישואין' }, { id: 'memorial', label: '✡️ הנצחה' },
    { id: 'holiday', label: '🕎 חג' }, { id: 'other', label: '📌 אחר' },
  ]

  // Auto-generate yahrzeits from people with death_date
  const generateYahrzeits = async () => {
    const deceased = people.filter(p => p.death_date)
    let count = 0
    for (const p of deceased) {
      const exists = events.find(e => e.person_id === p.id && e.event_type === 'yahrzeit')
      if (!exists) {
        await supabase.from('calendar_events').insert({
          title: `יארצייט ${[p.first_name, p.last_name].filter(Boolean).join(' ')}`,
          date: p.death_date, event_type: 'yahrzeit', person_id: p.id, recurring: true,
        })
        count++
      }
    }
    if (count > 0) {
      alert(`נוצרו ${count} יארצייטים`)
      const { data } = await supabase.from('calendar_events').select('*').order('date')
      setEvents(data || [])
    } else alert('כל היארצייטים כבר קיימים')
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', color: '#f5e6c8', fontFamily: '"Heebo", sans-serif' }}>
      <div style={{ borderBottom: '1px solid #c9a22722', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 8, padding: '5px 12px', color: '#c9a227', cursor: 'pointer', fontSize: 13 }}>→ חזרה</button>
          <span style={{ fontSize: 18 }}>📆</span><span style={{ fontWeight: 600, fontSize: 16 }}>עריכת לוח שנה</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={generateYahrzeits} style={{ background: 'transparent', border: '1px solid #c9a22744', borderRadius: 10, padding: '7px 14px', color: '#c9a227', cursor: 'pointer', fontSize: 12 }}>🕯️ צור יארצייטים אוטומטית</button>
          <button onClick={() => { setEditId(null); setForm({ title: '', date: '', event_type: 'yahrzeit', person_id: '', recurring: true, notes: '' }); setShowAdd(true) }}
            style={{ background: '#c9a227', border: 'none', borderRadius: 10, padding: '7px 16px', color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ הוסף אירוע</button>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        {events.map((ev, i) => {
          const typeInfo = CAL_TYPES.find(t => t.id === ev.event_type) || CAL_TYPES[5]
          return (
            <motion.div key={ev.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 10, padding: '12px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, color: '#f5e6c8' }}>{typeInfo.label} {ev.title}</div>
                <div style={{ fontSize: 12, color: '#5a3a1a' }}>{ev.date || ''}{ev.recurring ? ' · חוזר' : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => { setEditId(ev.id); setForm({ title: ev.title, date: ev.date || '', event_type: ev.event_type, person_id: ev.person_id?.toString() || '', recurring: ev.recurring, notes: ev.notes || '' }); setShowAdd(true) }}
                  style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 6, padding: '3px 7px', color: '#c9a227', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                <button onClick={async () => { if (!confirm('למחוק?')) return; await supabase.from('calendar_events').delete().eq('id', ev.id); setEvents(prev => prev.filter(e => e.id !== ev.id)) }}
                  style={{ background: 'none', border: '1px solid #c9494933', borderRadius: 6, padding: '3px 7px', color: '#c94949', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
              </div>
            </motion.div>
          )
        })}
        {events.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#5a3a1a' }}><div style={{ fontSize: 48, marginBottom: 12 }}>📆</div>אין אירועים. נסה "צור יארצייטים אוטומטית"</div>}
      </div>
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: '#000a', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} dir="rtl"
              style={{ background: 'linear-gradient(180deg, #1e140a, #0d0702)', border: '1px solid #c9a22744', borderRadius: 16, padding: 20, width: '100%', maxWidth: 420 }}>
              <h3 style={{ marginBottom: 14, color: '#f5e6c8' }}>{editId ? 'ערוך אירוע' : 'הוסף אירוע'}</h3>
              <Lab>כותרת *</Lab><input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} style={inp} />
              <Lab>תאריך</Lab><input value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} type="date" style={inp} />
              <Lab>סוג</Lab><select value={form.event_type} onChange={e => setForm(f => ({...f, event_type: e.target.value}))} style={inp}>{CAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
              <Lab>אדם קשור</Lab><select value={form.person_id} onChange={e => setForm(f => ({...f, person_id: e.target.value}))} style={inp}><option value="">—</option>{people.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}</select>
              <Lab>הערות</Lab><textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} style={{...inp, resize: 'vertical' as const}} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8b6914', fontSize: 12, cursor: 'pointer', marginBottom: 12 }}>
                <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({...f, recurring: e.target.checked}))} /> אירוע חוזר שנתי
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

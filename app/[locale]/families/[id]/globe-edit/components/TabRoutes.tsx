'use client'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { GlobeRoute, GlobeStop, GlobePerson } from '../page'

const TRAVEL_TYPES = [
  { id: 'default', label: 'ברירת מחדל', icon: '✈️', lineStyle: 'קו מקוקו לבן' },
  { id: 'ship', label: 'ספינה', icon: '🚢', lineStyle: 'קו גלי כחול' },
  { id: 'train', label: 'רכבת', icon: '🚂', lineStyle: 'קו ישר + פסים' },
  { id: 'exile', label: 'הגירה/בריחה', icon: '🏃', lineStyle: 'קו אדום עבה' },
  { id: 'pilgrimage', label: 'עלייה לרגל', icon: '✡️', lineStyle: 'קו זהב' },
  { id: 'captivity', label: 'שבי/גירוש', icon: '⛓️', lineStyle: 'קו אפור מנוקד' },
  { id: 'unknown', label: 'לא ידוע', icon: '❓', lineStyle: 'קו שקוף' },
  { id: 'walking', label: 'רגלית', icon: '🚶', lineStyle: 'קו ירוק דק' },
]

interface Props {
  routes: GlobeRoute[]; stops: GlobeStop[]; people: GlobePerson[]
  familyId: string; onRefresh: () => void
  logHistory: (a: string, t: string, id?: string, d?: any) => void
}

export default function TabRoutes({ routes, stops, people, familyId, onRefresh, logHistory }: Props) {
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ travel_type: 'default', note: '', duration: '' })

  // Build route list from consecutive stops
  const routeList = useMemo(() => {
    const list: Array<{
      personId: string; personName: string; fromStop: GlobeStop; toStop: GlobeStop
      route?: GlobeRoute
    }> = []
    for (const p of people) {
      const pStops = stops.filter(s => s.globe_person_id === p.id).sort((a, b) => (a.year || 0) - (b.year || 0))
      for (let i = 0; i < pStops.length - 1; i++) {
        const existingRoute = routes.find(r => r.from_stop_id === pStops[i].id && r.to_stop_id === pStops[i + 1].id)
        list.push({ personId: p.id, personName: p.name, fromStop: pStops[i], toStop: pStops[i + 1], route: existingRoute })
      }
    }
    return list
  }, [people, stops, routes])

  const openEdit = (item: typeof routeList[0]) => {
    setForm({
      travel_type: item.route?.travel_type || 'default',
      note: item.route?.note || '',
      duration: item.route?.duration || '',
    })
    setEditId(item.route?.id || `new:${item.fromStop.id}:${item.toStop.id}:${item.personId}`)
  }

  const save = async () => {
    if (!editId) return
    if (editId.startsWith('new:')) {
      const [, fromId, toId, personId] = editId.split(':')
      const { data } = await supabase.from('globe_routes').insert({
        globe_person_id: personId, from_stop_id: fromId, to_stop_id: toId,
        travel_type: form.travel_type, note: form.note || null, duration: form.duration || null,
      }).select().single()
      if (data) logHistory('create', 'route', data.id, { travel_type: form.travel_type })
    } else {
      await supabase.from('globe_routes').update({
        travel_type: form.travel_type, note: form.note || null, duration: form.duration || null,
      }).eq('id', editId)
      logHistory('update', 'route', editId, { travel_type: form.travel_type })
    }
    setEditId(null); onRefresh()
  }

  const typeInfo = (t: string) => TRAVEL_TYPES.find(tt => tt.id === t) || TRAVEL_TYPES[0]

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 12, color: '#5a3a1a', marginBottom: 12, lineHeight: 1.6 }}>
        מסלולים נוצרים אוטומטית בין תחנות עוקבות. כאן ניתן לשנות את סוג הנסיעה ולהוסיף פרטים.
      </div>

      {routeList.map((item, i) => {
        const ti = typeInfo(item.route?.travel_type || 'default')
        const isEditing = editId === (item.route?.id || `new:${item.fromStop.id}:${item.toStop.id}:${item.personId}`)
        return (
          <motion.div key={`${item.fromStop.id}-${item.toStop.id}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            style={{
              background: '#1a0f0544', border: '1px solid #c9a22715',
              borderRadius: 10, padding: '10px 12px', marginBottom: 6, fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#f5e6c8' }}>{item.personName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b89a5a' }}>
              <span>{item.fromStop.city || item.fromStop.country} {item.fromStop.year || ''}</span>
              <span style={{ color: '#c9a227' }}>→</span>
              <span>{item.toStop.city || item.toStop.country} {item.toStop.year || ''}</span>
              <span style={{ marginRight: 'auto' }} />
              <span style={{ fontSize: 14 }}>{ti.icon}</span>
              <button onClick={() => openEdit(item)} style={{
                background: 'transparent', border: '1px solid #c9a22722',
                borderRadius: 6, padding: '2px 8px', cursor: 'pointer',
                color: '#8b6914', fontSize: 11,
              }}>✏️</button>
            </div>
            {item.route?.note && <div style={{ color: '#5a3a1a', marginTop: 4, fontStyle: 'italic' }}>{item.route.note}</div>}

            {/* Edit panel */}
            {isEditing && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #c9a22722' }}>
                <div style={{ fontSize: 11, color: '#8b6914', marginBottom: 4, fontWeight: 600 }}>סוג נסיעה</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                  {TRAVEL_TYPES.map(tt => (
                    <button key={tt.id} onClick={() => setForm(f => ({ ...f, travel_type: tt.id }))} style={{
                      background: form.travel_type === tt.id ? '#c9a22722' : '#1a0f05',
                      border: `1px solid ${form.travel_type === tt.id ? '#c9a227' : '#2a1a08'}`,
                      borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
                      color: form.travel_type === tt.id ? '#f5d98b' : '#5a3a1a', fontSize: 11,
                    }}>{tt.icon} {tt.label}</button>
                  ))}
                </div>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="הערה..." style={inputStyle} />
                <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="משך: 3 ימים..." style={inputStyle} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={save} style={{ flex: 1, background: '#c9a227', border: 'none', borderRadius: 8, padding: '6px', cursor: 'pointer', color: '#0d0702', fontWeight: 700, fontSize: 12 }}>שמור</button>
                  <button onClick={() => setEditId(null)} style={{ background: 'none', border: '1px solid #c9a22744', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#c9a227', fontSize: 12 }}>ביטול</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )
      })}

      {routeList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#5a3a1a', fontSize: 13 }}>
          אין מסלולים. הוסף לפחות שתי תחנות לאדם כדי ליצור מסלול.
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#1a0f0566',
  border: '1px solid #c9a22722', borderRadius: 8, padding: '6px 10px',
  marginBottom: 6, color: '#f5e6c8', fontSize: 12, outline: 'none',
  fontFamily: '"Heebo", sans-serif',
}

'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { GlobeStop, GlobePerson } from '../page'

const STOP_TYPES = [
  { id: 'birth', label: 'לידה', icon: '👶' },
  { id: 'childhood', label: 'ילדות', icon: '💒' },
  { id: 'residence', label: 'מגורים', icon: '🏠' },
  { id: 'transit', label: 'מעבר ארעי', icon: '🚶' },
  { id: 'work', label: 'עבודה', icon: '💼' },
  { id: 'study', label: 'לימודים', icon: '📚' },
  { id: 'marriage', label: 'נישואין', icon: '💍' },
  { id: 'death', label: 'פטירה', icon: '✝️' },
  { id: 'pilgrimage', label: 'עלייה לרגל', icon: '✡️' },
  { id: 'exile', label: 'גלות/בריחה', icon: '🏃' },
  { id: 'other', label: 'אחר', icon: '📌' },
]

interface Props {
  stops: GlobeStop[]; people: GlobePerson[]; familyId: string
  onRefresh: () => void; onFocus: (c: {lat:number;lng:number}|null) => void
  logHistory: (a: string, t: string, id?: string, d?: any) => void
}

export default function TabStops({ stops, people, familyId, onRefresh, onFocus, logHistory }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [filterPerson, setFilterPerson] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterType, setFilterType] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [delConfirm, setDelConfirm] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    globe_person_id: '', year: '', is_bce: false, month: '', day: '',
    year_hebrew: '', month_hebrew: '', day_hebrew: '',
    country: '', city: '', address: '', lat: '', lng: '',
    stop_type: 'residence', note: '', photo_url: '', sources: '',
    is_public: true, priority: 'normal',
  })

  const resetForm = () => setForm({
    globe_person_id: people[0]?.id || '', year: '', is_bce: false, month: '', day: '',
    year_hebrew: '', month_hebrew: '', day_hebrew: '',
    country: '', city: '', address: '', lat: '', lng: '',
    stop_type: 'residence', note: '', photo_url: '', sources: '',
    is_public: true, priority: 'normal',
  })

  // Filter stops
  const filtered = useMemo(() => {
    return stops.filter(s => {
      if (filterPerson && s.globe_person_id !== filterPerson) return false
      if (filterCountry && s.country !== filterCountry) return false
      if (filterType && s.stop_type !== filterType) return false
      if (searchQ) {
        const q = searchQ.toLowerCase()
        return (s.city?.toLowerCase().includes(q) || s.country?.toLowerCase().includes(q) ||
          s.person_name?.toLowerCase().includes(q) || s.note?.toLowerCase().includes(q) ||
          s.year?.toString().includes(q))
      }
      return true
    })
  }, [stops, filterPerson, filterCountry, filterType, searchQ])

  const countries = [...new Set(stops.map(s => s.country).filter(Boolean))]

  const geocode = async () => {
    const place = [form.address, form.city, form.country].filter(Boolean).join(', ')
    if (!place) return
    setGeocoding(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`,
        { headers: { 'User-Agent': 'FamilyArchive/1.0' } })
      const data = await res.json()
      if (data.length > 0) {
        setForm(f => ({ ...f, lat: data[0].lat, lng: data[0].lon }))
      }
    } catch {}
    setGeocoding(false)
  }

  const save = async () => {
    if (!form.globe_person_id) { alert('בחר אדם'); return }
    if (!form.country && !form.city) { alert('הזן לפחות מדינה או עיר'); return }
    setSaving(true)

    // Auto-geocode if no coordinates
    let lat = form.lat ? parseFloat(form.lat as string) : null
    let lng = form.lng ? parseFloat(form.lng as string) : null

    if ((!lat || !lng) && (form.city || form.country)) {
      const place = [form.address, form.city, form.country].filter(Boolean).join(', ')
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`,
          { headers: { 'User-Agent': 'FamilyArchive/1.0' } })
        const data = await res.json()
        if (data.length > 0) {
          lat = parseFloat(data[0].lat)
          lng = parseFloat(data[0].lon)
        }
      } catch {}
    }

    const payload = {
      globe_person_id: form.globe_person_id,
      year: form.year ? parseInt(form.year) * (form.is_bce ? -1 : 1) : null,
      is_bce: form.is_bce,
      month: form.month ? parseInt(form.month) : null,
      day: form.day ? parseInt(form.day) : null,
      year_hebrew: form.year_hebrew || null,
      month_hebrew: form.month_hebrew || null,
      day_hebrew: form.day_hebrew || null,
      country: form.country || null, city: form.city || null,
      address: form.address || null,
      lat, lng,
      stop_type: form.stop_type, note: form.note || null,
      photo_url: form.photo_url || null,
      sources: form.sources ? form.sources.split('\n').filter(Boolean) : null,
      is_public: form.is_public, priority: form.priority,
    }
    if (editId) {
      const { error } = await supabase.from('globe_stops').update(payload).eq('id', editId)
      if (error) { alert('שגיאה: ' + error.message); setSaving(false); return }
      logHistory('update', 'stop', editId, { city: form.city, year: form.year })
    } else {
      const { data, error } = await supabase.from('globe_stops').insert(payload).select().single()
      if (error) { alert('שגיאה: ' + error.message); setSaving(false); return }
      if (data) logHistory('create', 'stop', data.id, { city: form.city, year: form.year })
    }
    setSaving(false); setShowAdd(false); resetForm(); onRefresh()
  }

  const duplicate = async (s: GlobeStop) => {
    const { id, person_name, ...rest } = s
    const { data } = await supabase.from('globe_stops').insert(rest).select().single()
    if (data) logHistory('create', 'stop', data.id, { duplicated_from: id })
    onRefresh()
  }

  const deleteStop = async (s: GlobeStop) => {
    await supabase.from('globe_stops').delete().eq('id', s.id)
    logHistory('delete', 'stop', s.id, { city: s.city, year: s.year })
    setDelConfirm(null); onRefresh()
  }

  const openEdit = (s: GlobeStop) => {
    const absYear = Math.abs(s.year || 0)
    setForm({
      globe_person_id: s.globe_person_id, year: absYear ? absYear.toString() : '',
      is_bce: s.is_bce, month: s.month?.toString() || '', day: s.day?.toString() || '',
      year_hebrew: s.year_hebrew || '', month_hebrew: s.month_hebrew || '', day_hebrew: s.day_hebrew || '',
      country: s.country || '', city: s.city || '', address: s.address || '',
      lat: s.lat?.toString() || '', lng: s.lng?.toString() || '',
      stop_type: s.stop_type, note: s.note || '', photo_url: s.photo_url || '',
      sources: (s.sources || []).join('\n'), is_public: s.is_public, priority: s.priority,
    })
    setEditId(s.id); setShowAdd(true)
  }

  const formatYear = (y?: number, bce?: boolean) => {
    if (!y && y !== 0) return ''
    const abs = Math.abs(y)
    return bce || y < 0 ? `${abs} לפנה"ס` : `${abs}`
  }

  const typeInfo = (t: string) => STOP_TYPES.find(s => s.id === t) || { icon: '📌', label: t }

  return (
    <div style={{ padding: '12px 14px' }}>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)} style={selectStyle}>
          <option value="">כל האנשים</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={selectStyle}>
          <option value="">כל המדינות</option>
          {countries.map(c => <option key={c} value={c!}>{c}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
          <option value="">כל הסוגים</option>
          {STOP_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
        </select>
      </div>

      <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
        placeholder="🔍 חיפוש חופשי..." style={{ ...inputStyle, marginBottom: 10 }} />

      {/* Add button */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { resetForm(); setEditId(null); setShowAdd(true) }}
        style={{
          width: '100%', background: 'linear-gradient(135deg, #c9a22718, #c9a22708)',
          border: '1px dashed #c9a22744', borderRadius: 12, padding: '10px',
          cursor: 'pointer', color: '#c9a227', fontSize: 13, marginBottom: 10,
          fontFamily: '"Heebo", sans-serif',
        }}>+ הוסף תחנה</motion.button>

      {/* Stops list */}
      {filtered.map((s, i) => {
        const ti = typeInfo(s.stop_type)
        return (
          <motion.div key={s.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onMouseEnter={() => s.lat && s.lng ? onFocus({ lat: s.lat, lng: s.lng }) : null}
            onMouseLeave={() => onFocus(null)}
            style={{
              background: '#1a0f0544', border: '1px solid #c9a22715',
              borderRadius: 10, padding: '10px 12px', marginBottom: 6, fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <span style={{ color: '#c9a227', marginLeft: 4 }}>{ti.icon}</span>
                <span style={{ fontWeight: 600, color: '#f5e6c8' }}>{s.person_name}</span>
                <span style={{ color: '#5a3a1a', marginRight: 6 }}>{formatYear(s.year, s.is_bce)}</span>
                {s.year_hebrew && <span style={{ color: '#8b6914', fontSize: 11 }}>({s.year_hebrew})</span>}
              </div>
              <span style={{ fontSize: 10, color: '#5a3a1a', background: '#c9a22711', padding: '1px 6px', borderRadius: 4 }}>
                {ti.label}
              </span>
            </div>

            {s.country && <div style={{ color: '#8b6914' }}>🌍 {s.country}</div>}
            {s.city && <div style={{ color: '#b89a5a' }}>🏙️ {s.city}</div>}
            {s.address && <div style={{ color: '#5a3a1a' }}>📍 {s.address}</div>}
            {s.note && <div style={{ color: '#6a5a40', marginTop: 4, fontStyle: 'italic', lineHeight: 1.4 }}>{s.note}</div>}
            {s.lat && s.lng && (
              <div style={{ color: '#3a2a10', fontSize: 10, marginTop: 2 }}>
                {s.lat.toFixed(4)}° {s.lng.toFixed(4)}°
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
              <SmBtn onClick={() => openEdit(s)}>✏️ ערוך</SmBtn>
              <SmBtn onClick={() => duplicate(s)}>📋 שכפל</SmBtn>
              <SmBtn onClick={() => setDelConfirm(s.id)} danger>🗑️ מחק</SmBtn>
            </div>

            <AnimatePresence>
              {delConfirm === s.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ background: '#3a1a1a', borderRadius: 6, padding: 8, marginTop: 6, textAlign: 'center', color: '#ffb3b3' }}>
                  <p>למחוק תחנה זו?</p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
                    <button onClick={() => deleteStop(s)} style={{ background: '#c94949', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 11 }}>מחק</button>
                    <button onClick={() => setDelConfirm(null)} style={{ background: 'none', color: '#8b6914', border: '1px solid #5a3a1a', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 11 }}>ביטול</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#5a3a1a', fontSize: 13 }}>
          {stops.length === 0 ? 'אין תחנות. הוסף אנשים קודם, ואז תחנות.' : 'לא נמצאו תחנות עם הסינון הנוכחי.'}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
            style={{ position: 'fixed', inset: 0, background: '#000000aa', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()} dir="rtl"
              style={{ background: 'linear-gradient(180deg, #1e140a, #0d0702)', border: '1px solid #c9a22744', borderRadius: 16, padding: '20px', width: '100%', maxWidth: 440, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px #000a' }}>

              <div style={{ fontSize: 16, fontWeight: 600, color: '#f5e6c8', marginBottom: 14, fontFamily: '"Playfair Display", serif' }}>
                {editId ? 'ערוך תחנה' : 'הוסף תחנה'}
              </div>

              {/* Person */}
              <Label>לאיזה אדם</Label>
              <select value={form.globe_person_id} onChange={e => setForm(f => ({ ...f, globe_person_id: e.target.value }))} style={inputStyle}>
                <option value="">בחר...</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              {/* Date */}
              <SectionTitle>מתי</SectionTitle>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <div style={{ flex: 2 }}>
                  <Label>שנה</Label>
                  <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    type="number" placeholder="1920" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>חודש</Label>
                  <input value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                    type="number" min="1" max="12" placeholder="1-12" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>יום</Label>
                  <input value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                    type="number" min="1" max="31" placeholder="1-31" style={inputStyle} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#8b6914', fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_bce} onChange={e => setForm(f => ({ ...f, is_bce: e.target.checked }))} />
                לפנה"ס
              </label>

              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <Label>שנה עברית</Label>
                  <input value={form.year_hebrew} onChange={e => setForm(f => ({ ...f, year_hebrew: e.target.value }))} placeholder="תר״פ" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>חודש עברי</Label>
                  <input value={form.month_hebrew} onChange={e => setForm(f => ({ ...f, month_hebrew: e.target.value }))} placeholder="ניסן" style={inputStyle} />
                </div>
              </div>

              {/* Location */}
              <SectionTitle>איפה</SectionTitle>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <Label>מדינה</Label>
                  <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="פולין" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>עיר</Label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="ורשה" style={inputStyle} />
                </div>
              </div>
              <Label>כתובת</Label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="רחוב..." style={inputStyle} />

              <button onClick={geocode} disabled={geocoding} style={{
                width: '100%', background: '#c9a22715', border: '1px solid #c9a22733',
                borderRadius: 8, padding: '7px', cursor: 'pointer', color: '#c9a227',
                fontSize: 12, marginBottom: 8, fontFamily: '"Heebo", sans-serif',
              }}>{geocoding ? '⏳ מחפש...' : '🔍 מצא על המפה אוטומטית'}</button>

              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <Label>קו רוחב</Label>
                  <input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="52.2297" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>קו אורך</Label>
                  <input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="21.0122" style={inputStyle} />
                </div>
              </div>

              {/* Type */}
              <SectionTitle>סוג התחנה</SectionTitle>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                {STOP_TYPES.map(t => (
                  <button key={t.id} onClick={() => setForm(f => ({ ...f, stop_type: t.id }))} style={{
                    background: form.stop_type === t.id ? '#c9a22722' : '#1a0f05',
                    border: `1px solid ${form.stop_type === t.id ? '#c9a227' : '#2a1a08'}`,
                    borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                    color: form.stop_type === t.id ? '#f5d98b' : '#5a3a1a', fontSize: 11,
                  }}>{t.icon} {t.label}</button>
                ))}
              </div>

              {/* Details */}
              <SectionTitle>פרטים</SectionTitle>
              <Label>הערה / סיפור</Label>
              <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                rows={3} placeholder="נולד כאן בבית הוריו..." style={{ ...inputStyle, resize: 'vertical' }} />
              <Label>תמונה (URL)</Label>
              <input value={form.photo_url} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))} placeholder="https://..." style={inputStyle} />
              <Label>מקורות (שורה לכל קישור)</Label>
              <textarea value={form.sources} onChange={e => setForm(f => ({ ...f, sources: e.target.value }))}
                rows={2} placeholder="https://..." style={{ ...inputStyle, resize: 'vertical' }} />

              {/* Visibility */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b6914', fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} />
                  ציבורי
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b6914', fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.priority === 'highlighted'} onChange={e => setForm(f => ({ ...f, priority: e.target.checked ? 'highlighted' : 'normal' }))} />
                  מודגש
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={save} disabled={saving} style={{
                  flex: 1, background: 'linear-gradient(135deg, #c9a227, #a68520)',
                  border: 'none', borderRadius: 10, padding: '10px',
                  color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  opacity: saving ? 0.5 : 1,
                }}>{saving ? '...' : 'שמור'}</button>
                <button onClick={() => setShowAdd(false)} style={{
                  background: 'transparent', border: '1px solid #c9a22744',
                  borderRadius: 10, padding: '10px 20px',
                  color: '#c9a227', cursor: 'pointer', fontSize: 13,
                }}>ביטול</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SmBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: `1px solid ${danger ? '#c9494933' : '#c9a22722'}`,
      borderRadius: 6, padding: '2px 8px', cursor: 'pointer',
      color: danger ? '#c94949' : '#8b6914', fontSize: 11,
    }}>{children}</button>
  )
}
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#8b6914', marginBottom: 3, fontWeight: 600 }}>{children}</div>
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: '#c9a227', fontWeight: 600, marginTop: 12, marginBottom: 6, paddingTop: 8, borderTop: '1px solid #c9a22722' }}>
      {children}
    </div>
  )
}
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#1a0f0566',
  border: '1px solid #c9a22722', borderRadius: 8, padding: '7px 10px',
  marginBottom: 6, color: '#f5e6c8', fontSize: 13, outline: 'none',
  fontFamily: '"Heebo", sans-serif',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle, flex: 1, cursor: 'pointer', marginBottom: 0,
}

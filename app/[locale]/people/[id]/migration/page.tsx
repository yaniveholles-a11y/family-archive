'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Stop = { id?: number; place: string; country: string; year_from?: string; year_to?: string; reason?: string; lat?: number; lng?: number }

const geocodeCache: Record<string, { lat: number; lng: number } | null> = {}
async function geocodePlace(place: string): Promise<{ lat: number; lng: number } | null> {
  if (place in geocodeCache) return geocodeCache[place]
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`, { headers: { 'User-Agent': 'family-archive-app' } })
    const data = await res.json()
    if (data[0]) { const c = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }; geocodeCache[place] = c; return c }
  } catch {}
  geocodeCache[place] = null; return null
}

export default function MigrationEditPage() {
  const { locale } = useParams() as { locale: string }
  const { id } = useParams()
  const router = useRouter()
  const [person, setPerson] = useState<any>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const [basicForm, setBasicForm] = useState({ birth_place: '', birth_date: '', death_place: '', death_date: '' })
  const [saving, setSaving] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [mapPreview, setMapPreview] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/login'); return }
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).single()
    const role = roleData?.role
    if (role !== 'admin' && role !== 'editor') { router.push('/people/' + id); return }
    setCanEdit(true)

    const { data: personData } = await supabase.from('people').select('*').eq('id', id).single()
    setPerson(personData)
    setBasicForm({
      birth_place: personData?.birth_place || '',
      birth_date: personData?.birth_date ? personData.birth_date.substring(0, 10) : '',
      death_place: personData?.death_place || '',
      death_date: personData?.death_date ? personData.death_date.substring(0, 10) : '',
    })

    // טען תחנות נדודים מורחבות
    const { data: stopsData } = await supabase.from('migration_stops').select('*').eq('person_id', id).order('year_from')
    setStops(stopsData || [])
  }

  async function saveBasic() {
    setSaving(true)
    await supabase.from('people').update({
      birth_place: basicForm.birth_place || null,
      birth_date: basicForm.birth_date || null,
      death_place: basicForm.death_place || null,
      death_date: basicForm.death_date || null,
    }).eq('id', id)
    setSaving(false)
    alert('נשמר בהצלחה!')
  }

  async function addStop() {
    setStops(prev => [...prev, { place: '', country: '', year_from: '', year_to: '', reason: '' }])
  }

  async function updateStop(idx: number, field: keyof Stop, value: string) {
    setStops(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  async function removeStop(idx: number) {
    const stop = stops[idx]
    if (stop.id) await supabase.from('migration_stops').delete().eq('id', stop.id)
    setStops(prev => prev.filter((_, i) => i !== idx))
  }

  async function saveStops() {
    setSaving(true)
    for (const stop of stops) {
      if (!stop.place.trim()) continue
      const coords = await geocodePlace(stop.place + ', ' + stop.country)
      const data = {
        person_id: id,
        place: stop.place,
        country: stop.country,
        year_from: stop.year_from || null,
        year_to: stop.year_to || null,
        reason: stop.reason || null,
        lat: coords?.lat || null,
        lng: coords?.lng || null,
      }
      if (stop.id) {
        await supabase.from('migration_stops').update(data).eq('id', stop.id)
      } else {
        await supabase.from('migration_stops').insert(data)
      }
    }
    setSaving(false)
    load()
    alert('תחנות נשמרו!')
  }

  const reasonOptions = ['לידה', 'עלייה לישראל', 'עבודה', 'מלחמה', 'בריחה', 'נישואין', 'לימודים', 'פטירה', 'אחר']

  if (!person) return (
    <main style={{ minHeight: '100vh', background: '#1c1008', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#b89a5a' }}>טוען...</p>
    </main>
  )

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={'/people/' + id} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ חזרה לפרופיל</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>🌍 עריכת מסע — {[person.first_name, person.last_name].filter(Boolean).join(" ")}</span>
        <a href={`/${locale}/map`} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>פתח בגלוב ←</a>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>

        {/* חלק 1: פרטי לידה ופטירה */}
        <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#f5d98b', marginBottom: '1.25rem' }}>📍 מקומות לידה ופטירה</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'מקום לידה', key: 'birth_place', type: 'text', placeholder: 'עיר, מדינה', color: '#4ade80' },
              { label: 'תאריך לידה', key: 'birth_date', type: 'date', placeholder: '', color: '#4ade80' },
              { label: 'מקום פטירה', key: 'death_place', type: 'text', placeholder: 'עיר, מדינה', color: '#f87171' },
              { label: 'תאריך פטירה', key: 'death_date', type: 'date', placeholder: '', color: '#f87171' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: field.color, marginBottom: '0.3rem' }}>{field.label}</label>
                <input
                  type={field.type}
                  value={(basicForm as any)[field.key]}
                  onChange={e => setBasicForm(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ width: '100%', background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
          <button onClick={saveBasic} disabled={saving} style={{ marginTop: '1rem', background: '#c9a227', color: '#0d0702', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Arial' }}>
            {saving ? 'שומר...' : '💾 שמור פרטים בסיסיים'}
          </button>
        </div>

        {/* חלק 2: תחנות נדודים מפורטות */}
        <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#f5d98b' }}>🗺️ תחנות הנדודים המפורטות</h2>
            <button onClick={addStop} style={{ background: '#1a0f05', border: '1px solid #c9a227', borderRadius: '8px', padding: '0.45rem 0.9rem', color: '#c9a227', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Arial' }}>+ הוסף תחנה</button>
          </div>

          {stops.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#5a3a18', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
              <p>אין תחנות עדיין. לחץ "הוסף תחנה" להתחלה.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stops.map((stop, idx) => (
              <div key={idx} style={{ background: '#1a0f05', border: '1px solid #2a1a08', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#8a6a3a' }}>תחנה {idx + 1}</span>
                  <button onClick={() => removeStop(idx)} style={{ background: 'transparent', border: '1px solid #5a1a10', borderRadius: '4px', color: '#f87171', padding: '0.15rem 0.5rem', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'Arial' }}>✕ הסר</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#8a6a3a', marginBottom: '0.2rem' }}>עיר</label>
                    <input value={stop.place} onChange={e => updateStop(idx, 'place', e.target.value)} placeholder="שם העיר"
                      style={{ width: '100%', background: '#0d0702', border: '1px solid #2a1a08', borderRadius: '6px', padding: '0.5rem 0.7rem', color: '#f5e6c8', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#8a6a3a', marginBottom: '0.2rem' }}>מדינה</label>
                    <input value={stop.country} onChange={e => updateStop(idx, 'country', e.target.value)} placeholder="שם המדינה"
                      style={{ width: '100%', background: '#0d0702', border: '1px solid #2a1a08', borderRadius: '6px', padding: '0.5rem 0.7rem', color: '#f5e6c8', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#8a6a3a', marginBottom: '0.2rem' }}>שנת הגעה</label>
                    <input value={stop.year_from || ''} onChange={e => updateStop(idx, 'year_from', e.target.value)} placeholder="1942" type="number"
                      style={{ width: '100%', background: '#0d0702', border: '1px solid #2a1a08', borderRadius: '6px', padding: '0.5rem 0.7rem', color: '#f5e6c8', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#8a6a3a', marginBottom: '0.2rem' }}>שנת עזיבה</label>
                    <input value={stop.year_to || ''} onChange={e => updateStop(idx, 'year_to', e.target.value)} placeholder="1948" type="number"
                      style={{ width: '100%', background: '#0d0702', border: '1px solid #2a1a08', borderRadius: '6px', padding: '0.5rem 0.7rem', color: '#f5e6c8', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#8a6a3a', marginBottom: '0.2rem' }}>סיבת המעבר</label>
                  <select value={stop.reason || ''} onChange={e => updateStop(idx, 'reason', e.target.value)}
                    style={{ width: '100%', background: '#0d0702', border: '1px solid #2a1a08', borderRadius: '6px', padding: '0.5rem 0.7rem', color: '#f5e6c8', fontSize: '0.85rem', fontFamily: 'Arial' }}>
                    <option value="">בחר סיבה...</option>
                    {reasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {stops.length > 0 && (
            <button onClick={saveStops} disabled={saving} style={{ marginTop: '1rem', background: '#c9a227', color: '#0d0702', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Arial' }}>
              {saving ? 'שומר...' : '💾 שמור תחנות'}
            </button>
          )}
        </div>

        {/* SQL הוראות */}
        <div style={{ background: '#0d0702', border: '1px dashed #3a2a10', borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#5a3a18', marginBottom: '0.5rem' }}>⚠️ כדי שתחנות מפורטות יעבדו — הרץ ב-Supabase SQL Editor:</div>
          <pre style={{ fontSize: '0.72rem', color: '#8a6a3a', lineHeight: 1.6, overflow: 'auto' }}>{`CREATE TABLE IF NOT EXISTS migration_stops (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  place TEXT NOT NULL,
  country TEXT,
  year_from INTEGER,
  year_to INTEGER,
  reason TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}</pre>
        </div>
      </div>
    </main>
  )
}
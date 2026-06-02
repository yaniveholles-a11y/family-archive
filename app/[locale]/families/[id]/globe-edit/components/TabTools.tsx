'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { GlobeStop, GlobePerson, GlobeRoute } from '../page'

interface Props {
  people: GlobePerson[]; stops: GlobeStop[]; routes: GlobeRoute[]
  familyId: string; onRefresh: () => void
  logHistory: (a: string, t: string, id?: string, d?: any) => void
}

export default function TabTools({ people, stops, routes, familyId, onRefresh, logHistory }: Props) {
  const [history, setHistory] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    supabase.from('globe_history').select('*').eq('family_id', familyId)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setHistory(data || []))
  }, [familyId])

  // Export JSON
  const exportJSON = () => {
    const data = { people, stops, routes }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'globe-data.json'; a.click()
    URL.revokeObjectURL(url)
  }

  // Export CSV
  const exportCSV = () => {
    const header = 'שם_אדם,שנה,לפנה"ס,חודש,יום,מדינה,עיר,כתובת,סוג_תחנה,הערה'
    const rows = stops.map(s => {
      const person = people.find(p => p.id === s.globe_person_id)
      return [person?.name, Math.abs(s.year || 0), s.is_bce ? 'כן' : 'לא',
        s.month || '', s.day || '', s.country || '', s.city || '',
        s.address || '', s.stop_type, (s.note || '').replace(/,/g, ';')
      ].join(',')
    })
    const csv = '\uFEFF' + header + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'globe-stops.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Import JSON
  const importJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      if (data.people) {
        for (const p of data.people) {
          await supabase.from('globe_people').insert({ ...p, family_id: parseInt(familyId), id: undefined })
        }
      }
      logHistory('import', 'json', undefined, { count: data.people?.length })
      onRefresh()
      alert('ייבוא הושלם!')
    } catch { alert('שגיאה בקובץ JSON') }
  }

  // Error check
  const checkErrors = () => {
    const errs: string[] = []
    stops.forEach(s => {
      if (!s.lat || !s.lng) errs.push(`📍 ${s.person_name}: ${s.city || 'תחנה'} — חסרות קואורדינטות`)
      if (!s.year && s.year !== 0) errs.push(`📅 ${s.person_name}: ${s.city || 'תחנה'} — חסרה שנה`)
    })
    people.forEach(p => {
      const pStops = stops.filter(s => s.globe_person_id === p.id)
      if (pStops.length === 0) errs.push(`👤 ${p.name} — אין תחנות`)
      const birth = pStops.find(s => s.stop_type === 'birth')
      const death = pStops.find(s => s.stop_type === 'death')
      if (birth && death && (birth.year || 0) > (death.year || 0)) {
        errs.push(`⚠️ ${p.name} — לידה אחרי פטירה!`)
      }
    })
    stops.forEach(s => {
      if (s.lat && s.lng && Math.abs(s.lat) < 0.5 && Math.abs(s.lng) < 0.5)
        errs.push(`🌊 ${s.person_name}: ${s.city || 'תחנה'} — קואורדינטות חשודות (ים)`)
    })
    setErrors(errs)
  }

  return (
    <div style={{ padding: '12px 14px' }}>

      <Section title="ייצוא">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <ToolBtn onClick={exportJSON}>📥 ייצא JSON</ToolBtn>
          <ToolBtn onClick={exportCSV}>📥 ייצא CSV</ToolBtn>
        </div>
      </Section>

      <Section title="ייבוא">
        <label style={{
          display: 'block', background: '#c9a22715', border: '1px dashed #c9a22744',
          borderRadius: 10, padding: '12px', textAlign: 'center', cursor: 'pointer',
          color: '#c9a227', fontSize: 12,
        }}>
          📤 ייבא JSON
          <input type="file" accept=".json" onChange={importJSON} style={{ display: 'none' }} />
        </label>
      </Section>

      <Section title="בדיקת שגיאות">
        <ToolBtn onClick={checkErrors}>🔍 בדוק שגיאות</ToolBtn>
        {errors.length > 0 && (
          <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
            {errors.map((err, i) => (
              <div key={i} style={{ fontSize: 11, color: '#ffb3b3', padding: '4px 0', borderBottom: '1px solid #1a0f05' }}>{err}</div>
            ))}
          </div>
        )}
        {errors.length === 0 && errors !== null && (
          <div style={{ fontSize: 12, color: '#4ade80', marginTop: 6 }}>✅ לא נמצאו שגיאות</div>
        )}
      </Section>

      <Section title="היסטוריית שינויים">
        <div style={{ maxHeight: 250, overflowY: 'auto' }}>
          {history.map(h => (
            <div key={h.id} style={{ fontSize: 11, padding: '4px 0', borderBottom: '1px solid #1a0f05', color: '#8b6914' }}>
              <span style={{ color: '#5a3a1a' }}>[{new Date(h.created_at).toLocaleString('he-IL')}]</span>
              {' '}{h.action}: {h.entity_type}
              {h.details?.name && ` — ${h.details.name}`}
            </div>
          ))}
          {history.length === 0 && <div style={{ color: '#3a2a10', fontSize: 12 }}>אין היסטוריה</div>}
        </div>
      </Section>

      <Section title="סטטיסטיקות">
        <Stat label="אנשים" value={people.length} />
        <Stat label="תחנות" value={stops.length} />
        <Stat label="מסלולים" value={routes.length} />
        <Stat label="מדינות" value={[...new Set(stops.map(s => s.country).filter(Boolean))].length} />
        <Stat label="תקופה" value={(() => {
          const years = stops.map(s => s.year).filter(Boolean) as number[]
          if (years.length === 0) return '—'
          return `${Math.min(...years)} — ${Math.max(...years)}`
        })()} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: '#c9a227', fontWeight: 600, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #c9a22722' }}>{title}</div>
      {children}
    </div>
  )
}
function ToolBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} style={{
      background: '#c9a22712', border: '1px solid #c9a22733', borderRadius: 8,
      padding: '8px 14px', cursor: 'pointer', color: '#c9a227', fontSize: 12,
      fontFamily: '"Heebo", sans-serif',
    }}>{children}</motion.button>
  )
}
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
      <span style={{ color: '#8b6914' }}>{label}</span>
      <span style={{ color: '#f5e6c8', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

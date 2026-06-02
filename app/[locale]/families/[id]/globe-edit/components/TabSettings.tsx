'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { GlobeSettings } from '../page'

interface Props { settings: GlobeSettings; familyId: string; onRefresh: () => void }

export default function TabSettings({ settings, familyId, onRefresh }: Props) {
  const [form, setForm] = useState<GlobeSettings>(settings)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('globe_settings').upsert({
      family_id: parseInt(familyId), ...form,
    }, { onConflict: 'family_id' })
    setSaving(false); onRefresh()
  }

  const S = ({ label, field, type = 'toggle' }: { label: string; field: keyof GlobeSettings; type?: string }) => {
    const val = form[field]
    if (type === 'toggle') return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
        <span style={{ fontSize: 12, color: '#b89a5a' }}>{label}</span>
        <button onClick={() => setForm(f => ({ ...f, [field]: !val }))} style={{
          width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: val ? '#c9a227' : '#2a1a08', position: 'relative', transition: 'all 0.2s',
        }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 2, left: val ? 18 : 2, transition: 'all 0.2s' }} />
        </button>
      </div>
    )
    if (type === 'range') return (
      <div style={{ padding: '6px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#b89a5a' }}>{label}</span>
          <span style={{ fontSize: 11, color: '#5a3a1a' }}>{String(val)}</span>
        </div>
        <input type="range" min={0} max={field.includes('count') ? 3000 : field.includes('speed') ? 3 : 5}
          step={field.includes('count') ? 100 : 0.1}
          value={Number(val)} onChange={e => setForm(f => ({ ...f, [field]: parseFloat(e.target.value) }))}
          style={{ width: '100%', accentColor: '#c9a227' }} />
      </div>
    )
    if (type === 'color') return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
        <span style={{ fontSize: 12, color: '#b89a5a' }}>{label}</span>
        <input type="color" value={String(val)} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          style={{ width: 32, height: 24, border: '1px solid #c9a22733', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
      </div>
    )
    return null
  }

  const Select = ({ label, field, options }: { label: string; field: keyof GlobeSettings; options: Array<{value:string;label:string}> }) => (
    <div style={{ padding: '6px 0' }}>
      <span style={{ fontSize: 12, color: '#b89a5a', display: 'block', marginBottom: 3 }}>{label}</span>
      <select value={String(form[field])} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={{
        width: '100%', background: '#1a0f0566', border: '1px solid #c9a22722',
        borderRadius: 8, padding: '6px 8px', color: '#f5e6c8', fontSize: 12, cursor: 'pointer',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div style={{ padding: '12px 14px' }}>
      <Section title="תצוגה">
        <S label="צבע רקע" field="bg_color" type="color" />
        <S label="הצג כוכבים" field="show_stars" />
        <S label="מספר כוכבים" field="star_count" type="range" />
        <S label="גודל כוכבים" field="star_size" type="range" />
        <S label="הצג אטמוספרה" field="show_atmosphere" />
        <S label="עוצמת אטמוספרה" field="atmosphere_intensity" type="range" />
        <S label="עובי קווי מסע" field="line_width" type="range" />
        <S label="גודל נקודות" field="point_size" type="range" />
        <S label="הצג שמות מדינות" field="show_country_names" />
        <Select label="הצג שמות תחנות" field="show_stop_names" options={[
          { value: 'yes', label: 'כן' }, { value: 'no', label: 'לא' }, { value: 'zoom', label: 'בזום בלבד' }
        ]} />
      </Section>

      <Section title="אנימציה">
        <S label="מהירות אנימציה" field="animation_speed" type="range" />
        <S label="סיבוב עצמי" field="auto_rotate" />
        <S label="מהירות סיבוב" field="rotate_speed" type="range" />
        <S label="הפעלה אוטומטית" field="auto_play" />
        <S label="חזור על אנימציה" field="loop_animation" />
      </Section>

      <Section title="ציר זמן">
        <S label="הצג ציר זמן" field="show_timeline" />
        <Select label="פורמט שנים" field="year_format" options={[
          { value: 'gregorian', label: 'לועזי' }, { value: 'hebrew', label: 'עברי' }, { value: 'both', label: 'שניהם' }
        ]} />
        <S label="סמן אבני דרך" field="show_milestones" />
      </Section>

      <Section title="זום">
        <S label="אפשר זום לרחוב" field="allow_street_zoom" />
        <Select label="סגנון מפה" field="map_style" options={[
          { value: 'satellite', label: 'לוויין + רחובות' }, { value: 'streets', label: 'רחובות' },
          { value: 'dark', label: 'כהה' }, { value: 'light', label: 'בהיר' }
        ]} />
      </Section>

      <button onClick={save} disabled={saving} style={{
        width: '100%', background: 'linear-gradient(135deg, #c9a227, #a68520)',
        border: 'none', borderRadius: 10, padding: '10px', marginTop: 12,
        color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 14,
        opacity: saving ? 0.5 : 1,
      }}>{saving ? '⏳ שומר...' : '💾 שמור הגדרות'}</button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: '#c9a227', fontWeight: 600, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #c9a22722' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

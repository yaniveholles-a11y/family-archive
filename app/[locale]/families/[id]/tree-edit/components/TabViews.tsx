'use client'
// @ts-nocheck
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TabViews({ settings, familyId, onRefresh }: any) {
  const [form, setForm] = useState(settings || {
    card_size: 'medium', generation_gap: 120, sibling_gap: 60, tree_direction: 'top-down',
    blood_line_color: '#c9a227', blood_line_width: 2, blood_line_style: 'curved',
    spouse_line_color: '#8b6914', spouse_line_width: 1.5, spouse_line_style: 'dashed',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('tree_settings').upsert({ family_id: parseInt(familyId), ...form }, { onConflict: 'family_id' })
    setSaving(false); onRefresh()
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      <Sec title="תצוגה כללית">
        <Sel label="גודל כרטיסים" value={form.card_size} onChange={(v: any) => setForm((f: any) => ({...f, card_size: v}))} options={[['small','קטן'],['medium','בינוני'],['large','גדול']]} />
        <Range label="מרחק בין דורות" value={form.generation_gap} min={60} max={250} onChange={(v: any) => setForm((f: any) => ({...f, generation_gap: v}))} />
        <Range label="מרחק בין אחים" value={form.sibling_gap} min={30} max={150} onChange={(v: any) => setForm((f: any) => ({...f, sibling_gap: v}))} />
        <Sel label="כיוון העץ" value={form.tree_direction} onChange={(v: any) => setForm((f: any) => ({...f, tree_direction: v}))} options={[['top-down','מלמעלה למטה'],['bottom-up','מלמטה למעלה']]} />
      </Sec>
      <Sec title="קווי קרבת דם">
        <Color label="צבע" value={form.blood_line_color} onChange={(v: any) => setForm((f: any) => ({...f, blood_line_color: v}))} />
        <Range label="עובי" value={form.blood_line_width} min={1} max={5} step={0.5} onChange={(v: any) => setForm((f: any) => ({...f, blood_line_width: v}))} />
        <Sel label="סגנון" value={form.blood_line_style} onChange={(v: any) => setForm((f: any) => ({...f, blood_line_style: v}))} options={[['straight','ישר'],['curved','מעוגל'],['angular','זוויתי']]} />
      </Sec>
      <Sec title="קווי זוגיות">
        <Color label="צבע" value={form.spouse_line_color} onChange={(v: any) => setForm((f: any) => ({...f, spouse_line_color: v}))} />
        <Range label="עובי" value={form.spouse_line_width} min={0.5} max={4} step={0.5} onChange={(v: any) => setForm((f: any) => ({...f, spouse_line_width: v}))} />
        <Sel label="סגנון" value={form.spouse_line_style} onChange={(v: any) => setForm((f: any) => ({...f, spouse_line_style: v}))} options={[['dashed','מקוקו'],['dotted','מנוקד'],['straight','ישר']]} />
      </Sec>
      <button onClick={save} disabled={saving} style={{ width: '100%', background: '#c9a227', border: 'none', borderRadius: 10, padding: '10px', color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 14, marginTop: 12 }}>
        {saving ? '⏳' : '💾 שמור הגדרות תצוגה'}
      </button>
    </div>
  )
}
function Sec({ title, children }: any) { return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 13, color: '#c9a227', fontWeight: 600, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #c9a22722' }}>{title}</div>{children}</div> }
function Sel({ label, value, onChange, options }: any) { return <div style={{ padding: '4px 0' }}><span style={{ fontSize: 12, color: '#b89a5a', display: 'block', marginBottom: 3 }}>{label}</span><select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 8, padding: '6px 8px', color: '#f5e6c8', fontSize: 12, cursor: 'pointer' }}>{options.map((o: any) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select></div> }
function Range({ label, value, min, max, step, onChange }: any) { return <div style={{ padding: '4px 0' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: '#b89a5a' }}>{label}</span><span style={{ fontSize: 11, color: '#5a3a1a' }}>{value}</span></div><input type="range" min={min} max={max} step={step || 1} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#c9a227' }} /></div> }
function Color({ label, value, onChange }: any) { return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}><span style={{ fontSize: 12, color: '#b89a5a' }}>{label}</span><input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 32, height: 24, border: '1px solid #c9a22733', borderRadius: 6, cursor: 'pointer', background: 'none' }} /></div> }

'use client'
// @ts-nocheck
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TabTreeSettings({ settings, familyId, onRefresh }: any) {
  const [form, setForm] = useState(settings || {
    title: '', date_language: 'both', bce_format: 'hebrew', show_approximate: true,
    visibility: 'private', allow_pdf: false, primary_color: '#c9a227',
    card_style: 'dark', popup_photo_size: 'medium', popup_show_gallery: true, popup_show_globe: true,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('tree_settings').upsert({ family_id: parseInt(familyId), ...form }, { onConflict: 'family_id' })
    setSaving(false); onRefresh()
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      <Sec title="כותרת">
        <Label>שם המשפחה / כותרת</Label>
        <input value={form.title} onChange={e => setForm((f: any) => ({...f, title: e.target.value}))} style={inp} placeholder="משפחת כהן" />
      </Sec>
      <Sec title="תצוגת תאריכים">
        <Sel label="שפת תאריכים" value={form.date_language} onChange={(v: string) => setForm((f: any) => ({...f, date_language: v}))} options={[['gregorian','לועזי'],['hebrew','עברי'],['both','שניהם']]} />
        <Sel label='פורמט שנים לפנה"ס' value={form.bce_format} onChange={(v: string) => setForm((f: any) => ({...f, bce_format: v}))} options={[['hebrew','500 לפנה"ס'],['bce','500 BCE'],['negative','-500']]} />
        <Toggle label='הצג "~" ליד תאריכים משוערים' value={form.show_approximate} onChange={(v: boolean) => setForm((f: any) => ({...f, show_approximate: v}))} />
      </Sec>
      <Sec title="גישה">
        <Sel label="מי רואה את העץ" value={form.visibility} onChange={(v: string) => setForm((f: any) => ({...f, visibility: v}))} options={[['private','פרטי'],['public','ציבורי'],['link','קישור בלבד']]} />
        <Toggle label="אפשר הורדת PDF לאורחים" value={form.allow_pdf} onChange={(v: boolean) => setForm((f: any) => ({...f, allow_pdf: v}))} />
      </Sec>
      <Sec title="מראה">
        <Color label="צבע עיקרי" value={form.primary_color} onChange={(v: string) => setForm((f: any) => ({...f, primary_color: v}))} />
        <Sel label="סגנון כרטיסים" value={form.card_style} onChange={(v: string) => setForm((f: any) => ({...f, card_style: v}))} options={[['minimal','מינימלי'],['framed','עם מסגרת'],['dark','כהה']]} />
      </Sec>
      <Sec title="חלון קופץ">
        <Sel label="גודל תמונה" value={form.popup_photo_size} onChange={(v: string) => setForm((f: any) => ({...f, popup_photo_size: v}))} options={[['small','קטן'],['medium','בינוני'],['large','גדול']]} />
        <Toggle label="הצג גלריה" value={form.popup_show_gallery} onChange={(v: boolean) => setForm((f: any) => ({...f, popup_show_gallery: v}))} />
        <Toggle label="הצג כפתור גלובוס" value={form.popup_show_globe} onChange={(v: boolean) => setForm((f: any) => ({...f, popup_show_globe: v}))} />
      </Sec>
      <button onClick={save} disabled={saving} style={{ width: '100%', background: '#c9a227', border: 'none', borderRadius: 10, padding: '10px', color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 14, marginTop: 12 }}>
        {saving ? '⏳' : '💾 שמור הגדרות'}
      </button>
    </div>
  )
}
function Sec({ title, children }: any) { return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 13, color: '#c9a227', fontWeight: 600, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #c9a22722' }}>{title}</div>{children}</div> }
function Label({ children }: any) { return <div style={{ fontSize: 12, color: '#8b6914', marginBottom: 3, fontWeight: 600 }}>{children}</div> }
function Sel({ label, value, onChange, options }: any) { return <div style={{ padding: '4px 0' }}><span style={{ fontSize: 12, color: '#b89a5a', display: 'block', marginBottom: 3 }}>{label}</span><select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 8, padding: '6px 8px', color: '#f5e6c8', fontSize: 12, cursor: 'pointer' }}>{options.map((o: any) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select></div> }
function Toggle({ label, value, onChange }: any) { return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}><span style={{ fontSize: 12, color: '#b89a5a' }}>{label}</span><button onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: value ? '#c9a227' : '#2a1a08', position: 'relative' }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: value ? 18 : 2, transition: 'all 0.2s' }} /></button></div> }
function Color({ label, value, onChange }: any) { return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}><span style={{ fontSize: 12, color: '#b89a5a' }}>{label}</span><input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 32, height: 24, border: '1px solid #c9a22733', borderRadius: 6, cursor: 'pointer', background: 'none' }} /></div> }
const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 8, padding: '7px 10px', marginBottom: 6, color: '#f5e6c8', fontSize: 13, outline: 'none' }

'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { TreePerson } from '../page'

interface Props {
  people: TreePerson[]; globePeople: any[]; familyId: string; locale: string
  onRefresh: () => void; onCenter: (id: number) => void
  logHistory: (a: string, t: string, id?: string, d?: any) => void
}

export default function TabPeople({ people, globePeople, familyId, locale, onRefresh, onCenter, logHistory }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [delConfirm, setDelConfirm] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const emptyForm = () => ({
    first_name: '', last_name: '', nickname: '', maiden_name: '', gender: 'unknown',
    birth_date: '', birth_place: '', birth_is_bce: false, birth_is_approximate: false, birth_year_hebrew: '',
    death_date: '', death_place: '', death_is_bce: false, death_is_approximate: false, death_year_hebrew: '',
    is_alive: false, profession: '', religion: '', origin_country: '', languages: '',
    bio: '', notes_internal: '', photo_url: '', is_public: true, globe_person_id: '',
  })
  const [form, setForm] = useState(emptyForm())

  const openEdit = (p: TreePerson) => {
    setForm({
      first_name: p.first_name || '', last_name: p.last_name || '',
      nickname: p.nickname || '', maiden_name: p.maiden_name || '',
      gender: p.gender || 'unknown',
      birth_date: p.birth_date || '', birth_place: p.birth_place || '',
      birth_is_bce: p.birth_is_bce || false, birth_is_approximate: p.birth_is_approximate || false,
      birth_year_hebrew: p.birth_year_hebrew || '',
      death_date: p.death_date || '', death_place: p.death_place || '',
      death_is_bce: p.death_is_bce || false, death_is_approximate: p.death_is_approximate || false,
      death_year_hebrew: p.death_year_hebrew || '',
      is_alive: p.is_alive || false, profession: p.profession || '',
      religion: p.religion || '', origin_country: p.origin_country || '',
      languages: p.languages || '', bio: p.bio || '', notes_internal: p.notes_internal || '',
      photo_url: p.photo_url || '', is_public: p.is_public !== false,
      globe_person_id: p.globe_person_id || '',
    })
    setEditId(p.id); setShowAdd(true)
  }

  const save = async () => {
    if (!form.first_name.trim()) { alert('שם פרטי חובה'); return }
    setSaving(true)
    const payload: any = {
      first_name: form.first_name, last_name: form.last_name || null,
      nickname: form.nickname || null, maiden_name: form.maiden_name || null,
      gender: form.gender, birth_date: form.birth_date || null,
      birth_place: form.birth_place || null, birth_is_bce: form.birth_is_bce,
      birth_is_approximate: form.birth_is_approximate, birth_year_hebrew: form.birth_year_hebrew || null,
      death_date: form.death_date || null, death_place: form.death_place || null,
      death_is_bce: form.death_is_bce, death_is_approximate: form.death_is_approximate,
      death_year_hebrew: form.death_year_hebrew || null, is_alive: form.is_alive,
      profession: form.profession || null, religion: form.religion || null,
      origin_country: form.origin_country || null, languages: form.languages || null,
      bio: form.bio || null, notes_internal: form.notes_internal || null,
      photo_url: form.photo_url || null, is_public: form.is_public,
      globe_person_id: form.globe_person_id || null,
    }
    if (editId) {
      const { error } = await supabase.from('people').update(payload).eq('id', editId)
      if (error) { alert('שגיאה: ' + error.message); setSaving(false); return }
      logHistory('update', 'person', String(editId), { name: form.first_name })
    } else {
      payload.family_id = parseInt(familyId)
      const { data, error } = await supabase.from('people').insert(payload).select().single()
      if (error) { alert('שגיאה: ' + error.message); setSaving(false); return }
      if (data) logHistory('create', 'person', String(data.id), { name: form.first_name })
    }
    setSaving(false); setShowAdd(false); setForm(emptyForm()); setEditId(null); onRefresh()
  }

  const deletePerson = async (p: TreePerson) => {
    await supabase.from('tree_relationships').delete().or(`person_a_id.eq.${p.id},person_b_id.eq.${p.id}`)
    const { error } = await supabase.from('people').delete().eq('id', p.id)
    if (error) { alert('שגיאה: ' + error.message); return }
    logHistory('delete', 'person', String(p.id), { name: `${[p.first_name, p.last_name].filter(Boolean).join(' ')}` })
    setDelConfirm(null); onRefresh()
  }

  const filtered = people.filter(p => {
    if (!searchQ) return true
    const name = `${[p.first_name, p.last_name].filter(Boolean).join(' ')}`.toLowerCase()
    return name.includes(searchQ.toLowerCase()) || p.birth_place?.toLowerCase().includes(searchQ.toLowerCase())
  })

  const getYear = (d?: string) => d?.substring(0, 4) || ''

  return (
    <div style={{ padding: '12px 14px' }}>
      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 חיפוש..."
        style={{ ...inputStyle, marginBottom: 10 }} />

      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => { setForm(emptyForm()); setEditId(null); setShowAdd(true) }}
        style={{ width: '100%', background: 'linear-gradient(135deg, #c9a22718, #c9a22708)', border: '1px dashed #c9a22744', borderRadius: 12, padding: '10px', cursor: 'pointer', color: '#c9a227', fontSize: 13, marginBottom: 10, fontFamily: '"Heebo", sans-serif' }}>
        + הוסף אדם חדש
      </motion.button>

      {filtered.map((p, i) => (
        <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
          style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 10, padding: '10px 12px', marginBottom: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Photo */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2a1a08', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            {p.photo_url ? <img src={p.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.gender === 'male' ? '👨' : p.gender === 'female' ? '👩' : '👤')}
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f5e6c8' }}>
              {[p.first_name, p.last_name].filter(Boolean).join(" ")}
              {p.globe_person_id && <span style={{ fontSize: 9, color: '#4ade80', marginRight: 4 }}>🌍</span>}
            </div>
            <div style={{ fontSize: 11, color: '#5a3a1a' }}>
              {getYear(p.birth_date)}{p.death_date ? ` – ${getYear(p.death_date)}` : p.is_alive ? ' · בחיים' : ''}
              {p.birth_place ? ` · ${p.birth_place}` : ''}
            </div>
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 3 }}>
            <SmBtn onClick={() => openEdit(p)}>✏️</SmBtn>
            <SmBtn onClick={() => onCenter(p.id)}>🎯</SmBtn>
            <SmBtn onClick={() => setDelConfirm(p.id)} danger>🗑️</SmBtn>
          </div>
        </motion.div>
      ))}

      {/* Delete confirm */}
      {delConfirm && (() => {
        const p = people.find(x => x.id === delConfirm)
        return p ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: '#3a1a1a', border: '1px solid #c94949', borderRadius: 8, padding: 10, marginBottom: 6, fontSize: 12, color: '#ffb3b3', textAlign: 'center' }}>
            <p>למחוק את {[p.first_name, p.last_name].filter(Boolean).join(" ")} וכל הקשרים?</p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
              <button onClick={() => deletePerson(p)} style={{ background: '#c94949', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12 }}>מחק</button>
              <button onClick={() => setDelConfirm(null)} style={{ background: 'none', color: '#8b6914', border: '1px solid #5a3a1a', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12 }}>ביטול</button>
            </div>
          </motion.div>
        ) : null
      })()}

      {people.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#5a3a1a', fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>🌳</div>אין אנשים. לחץ "הוסף אדם" כדי להתחיל.</div>}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
            style={{ position: 'fixed', inset: 0, background: '#000000aa', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()} dir="rtl"
              style={{ background: 'linear-gradient(180deg, #1e140a, #0d0702)', border: '1px solid #c9a22744', borderRadius: 16, padding: '20px', width: '100%', maxWidth: 460, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px #000a' }}>

              <div style={{ fontSize: 16, fontWeight: 600, color: '#f5e6c8', marginBottom: 14, fontFamily: '"Playfair Display", serif' }}>
                {editId ? 'ערוך אדם' : 'הוסף אדם חדש'}
              </div>

              <Sec title="פרטי זהות">
                <Row>
                  <Field label="שם פרטי *" value={form.first_name} onChange={v => setForm(f => ({ ...f, first_name: v }))} />
                  <Field label="שם משפחה" value={form.last_name} onChange={v => setForm(f => ({ ...f, last_name: v }))} />
                </Row>
                <Row>
                  <Field label="כינוי" value={form.nickname} onChange={v => setForm(f => ({ ...f, nickname: v }))} />
                  <Field label="שם לפני נישואין" value={form.maiden_name} onChange={v => setForm(f => ({ ...f, maiden_name: v }))} />
                </Row>
                <Label>מין</Label>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[{ v: 'male', l: '👨 זכר' }, { v: 'female', l: '👩 נקבה' }, { v: 'other', l: 'אחר' }, { v: 'unknown', l: '?' }].map(g => (
                    <Chip key={g.v} active={form.gender === g.v} onClick={() => setForm(f => ({ ...f, gender: g.v }))}>{g.l}</Chip>
                  ))}
                </div>
              </Sec>

              <Sec title="לידה">
                <Row>
                  <Field label="תאריך לידה" value={form.birth_date} onChange={v => setForm(f => ({ ...f, birth_date: v }))} placeholder="YYYY-MM-DD" />
                  <Field label="מקום לידה" value={form.birth_place} onChange={v => setForm(f => ({ ...f, birth_place: v }))} />
                </Row>
                <Row>
                  <Field label="שנה עברית" value={form.birth_year_hebrew} onChange={v => setForm(f => ({ ...f, birth_year_hebrew: v }))} placeholder="תר״פ" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Check label="לפנה״ס" checked={form.birth_is_bce} onChange={v => setForm(f => ({ ...f, birth_is_bce: v }))} />
                    <Check label="משוער" checked={form.birth_is_approximate} onChange={v => setForm(f => ({ ...f, birth_is_approximate: v }))} />
                  </div>
                </Row>
              </Sec>

              <Sec title="פטירה">
                <Check label="בחיים" checked={form.is_alive} onChange={v => setForm(f => ({ ...f, is_alive: v }))} />
                {!form.is_alive && (
                  <>
                    <Row>
                      <Field label="תאריך פטירה" value={form.death_date} onChange={v => setForm(f => ({ ...f, death_date: v }))} placeholder="YYYY-MM-DD" />
                      <Field label="מקום פטירה" value={form.death_place} onChange={v => setForm(f => ({ ...f, death_place: v }))} />
                    </Row>
                    <Row>
                      <Field label="שנה עברית" value={form.death_year_hebrew} onChange={v => setForm(f => ({ ...f, death_year_hebrew: v }))} placeholder="תש״ג" />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Check label="לפנה״ס" checked={form.death_is_bce} onChange={v => setForm(f => ({ ...f, death_is_bce: v }))} />
                        <Check label="משוער" checked={form.death_is_approximate} onChange={v => setForm(f => ({ ...f, death_is_approximate: v }))} />
                      </div>
                    </Row>
                  </>
                )}
              </Sec>

              <Sec title="פרטים נוספים">
                <Row>
                  <Field label="מקצוע" value={form.profession} onChange={v => setForm(f => ({ ...f, profession: v }))} />
                  <Field label="ארץ מוצא" value={form.origin_country} onChange={v => setForm(f => ({ ...f, origin_country: v }))} />
                </Row>
                <Field label="סיפור חיים" value={form.bio} onChange={v => setForm(f => ({ ...f, bio: v }))} textarea />
                <Field label="הערות פנימיות" value={form.notes_internal} onChange={v => setForm(f => ({ ...f, notes_internal: v }))} textarea />
              </Sec>

              <Sec title="מדיה">
                <Field label="תמונה ראשית (URL)" value={form.photo_url} onChange={v => setForm(f => ({ ...f, photo_url: v }))} placeholder="https://..." />
              </Sec>

              <Sec title="קישור לגלובוס">
                <Label>אדם בגלובוס</Label>
                <select value={form.globe_person_id} onChange={e => setForm(f => ({ ...f, globe_person_id: e.target.value }))} style={inputStyle}>
                  <option value="">אין</option>
                  {globePeople.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </Sec>

              <Check label="הצג בתצוגה ציבורית" checked={form.is_public} onChange={v => setForm(f => ({ ...f, is_public: v }))} />

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg, #c9a227, #a68520)', border: 'none', borderRadius: 10, padding: '10px', color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: saving ? 0.5 : 1 }}>{saving ? '...' : 'שמור'}</button>
                <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', border: '1px solid #c9a22744', borderRadius: 10, padding: '10px 20px', color: '#c9a227', cursor: 'pointer', fontSize: 13 }}>ביטול</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SmBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>{children}</button>
}
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#8b6914', marginBottom: 3, fontWeight: 600 }}>{children}</div>
}
function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><div style={{ fontSize: 13, color: '#c9a227', fontWeight: 600, marginBottom: 6, paddingTop: 8, borderTop: '1px solid #c9a22722' }}>{title}</div>{children}</div>
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>{children}</div>
}
function Field({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return <div style={{ flex: 1 }}><Label>{label}</Label>{textarea ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} style={{ ...inputStyle, resize: 'vertical' }} /> : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />}</div>
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b6914', fontSize: 12, cursor: 'pointer', marginBottom: 6 }}><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />{label}</label>
}
function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={{ background: active ? '#c9a22722' : '#1a0f05', border: `1px solid ${active ? '#c9a227' : '#2a1a08'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: active ? '#f5d98b' : '#5a3a1a', fontSize: 11 }}>{children}</button>
}
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 8, padding: '7px 10px', marginBottom: 6, color: '#f5e6c8', fontSize: 13, outline: 'none', fontFamily: '"Heebo", sans-serif' }

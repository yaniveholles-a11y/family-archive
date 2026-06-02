'use client'
import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { GlobePerson } from '../page'

const SYMBOLS = [
  { id: 'circle', label: 'עיגול', icon: '●' },
  { id: 'star', label: 'כוכב', icon: '★' },
  { id: 'diamond', label: 'יהלום', icon: '◆' },
  { id: 'heart', label: 'לב', icon: '♥' },
]

const COLORS = ['#c9a227','#1D9E75','#E74C3C','#3498DB','#9B59B6','#E67E22','#1ABC9C','#F39C12','#2ECC71','#E91E63']

interface Props {
  people: GlobePerson[]
  treePeople: any[]
  familyId: string
  onRefresh: () => void
  onHighlight: (id: string | null) => void
  logHistory: (action: string, type: string, id?: string, details?: any) => void
}

export default function TabPeople({ people, treePeople, familyId, onRefresh, onHighlight, logHistory }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', color: '#c9a227', symbol: 'circle', visible: true, tree_person_id: '' })
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [treeSearch, setTreeSearch] = useState('')

  const resetForm = () => {
    setForm({ name: '', color: '#c9a227', symbol: 'circle', visible: true, tree_person_id: '' })
    setTreeSearch('')
  }

  const openAdd = () => { resetForm(); setEditId(null); setShowAdd(true) }

  const openEdit = (p: GlobePerson) => {
    setForm({
      name: p.name, color: p.color, symbol: p.symbol,
      visible: p.visible, tree_person_id: p.tree_person_id?.toString() || '',
    })
    setEditId(p.id)
    setShowAdd(true)
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (editId) {
      const res = await supabase.from('globe_people').update({
        name: form.name, color: form.color, symbol: form.symbol,
        visible: form.visible,
        tree_person_id: form.tree_person_id ? parseInt(form.tree_person_id) : null,
      }).eq('id', editId)
      if (res.error) { alert('שגיאה: ' + res.error.message); setSaving(false); return }
      logHistory('update', 'person', editId, { name: form.name })
    } else {
      const { data, error } = await supabase.from('globe_people').insert({
        family_id: parseInt(familyId),
        name: form.name, color: form.color, symbol: form.symbol,
        visible: form.visible, sort_order: people.length,
        tree_person_id: form.tree_person_id ? parseInt(form.tree_person_id) : null,
      }).select().single()
      if (error) { alert('שגיאה: ' + error.message); setSaving(false); return }
      if (data) logHistory('create', 'person', data.id, { name: form.name })
    }
    setSaving(false)
    setShowAdd(false)
    resetForm()
    onRefresh()
  }

  const toggleVisible = async (p: GlobePerson) => {
    await supabase.from('globe_people').update({ visible: !p.visible }).eq('id', p.id)
    logHistory('update', 'person', p.id, { visible: !p.visible })
    onRefresh()
  }

  const deletePerson = async (p: GlobePerson) => {
    await supabase.from('globe_stops').delete().eq('globe_person_id', p.id)
    await supabase.from('globe_routes').delete().eq('globe_person_id', p.id)
    await supabase.from('globe_people').delete().eq('id', p.id)
    logHistory('delete', 'person', p.id, { name: p.name })
    setDelConfirm(null)
    onRefresh()
  }

  const reorder = async (newOrder: GlobePerson[]) => {
    for (let i = 0; i < newOrder.length; i++) {
      await supabase.from('globe_people').update({ sort_order: i }).eq('id', newOrder[i].id)
    }
    onRefresh()
  }

  const filteredTree = treePeople.filter(tp => {
    if (!treeSearch) return true
    const name = `${tp.first_name} ${tp.last_name}`.toLowerCase()
    return name.includes(treeSearch.toLowerCase())
  })

  return (
    <div style={{ padding: '12px 14px' }}>

      {/* Add button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={openAdd}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #c9a22718, #c9a22708)',
          border: '1px dashed #c9a22744',
          borderRadius: 12, padding: '10px', cursor: 'pointer',
          color: '#c9a227', fontSize: 13, marginBottom: 12,
          fontFamily: '"Heebo", sans-serif',
          transition: 'all 0.2s',
        }}
      >+ הוסף אדם למסע</motion.button>

      {/* People list */}
      <Reorder.Group axis="y" values={people} onReorder={reorder} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {people.map((p) => (
          <Reorder.Item key={p.id} value={p} style={{ listStyle: 'none' }}>
            <motion.div
              layout
              onMouseEnter={() => onHighlight(p.id)}
              onMouseLeave={() => onHighlight(null)}
              style={{
                background: '#1a0f0544',
                border: '1px solid #c9a22715',
                borderRadius: 10, padding: '10px 12px',
                marginBottom: 6, cursor: 'grab',
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: p.visible ? 1 : 0.4,
                transition: 'all 0.15s',
              }}
            >
              {/* Color dot */}
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: p.color, flexShrink: 0,
                boxShadow: `0 0 8px ${p.color}44`,
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f5e6c8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {p.name}
                  {p.tree_person_id && <span style={{ fontSize: 9, color: '#4ade80' }}>🌳</span>}
                </div>
                <div style={{ fontSize: 11, color: '#5a3a1a' }}>
                  {p.stop_count || 0} תחנות · {SYMBOLS.find(s => s.id === p.symbol)?.icon}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn onClick={() => openEdit(p)} title="ערוך">✏️</Btn>
                <Btn onClick={() => toggleVisible(p)} title={p.visible ? 'הסתר' : 'הצג'}>
                  {p.visible ? '👁️' : '🚫'}
                </Btn>
                <Btn onClick={() => setDelConfirm(p.id)} title="מחק" danger>🗑️</Btn>
              </div>
            </motion.div>

            {/* Delete confirm */}
            <AnimatePresence>
              {delConfirm === p.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{
                    background: '#3a1a1a', border: '1px solid #c94949',
                    borderRadius: 8, padding: '10px', marginBottom: 6,
                    fontSize: 12, color: '#ffb3b3', textAlign: 'center',
                  }}
                >
                  <p>למחוק את <strong>{p.name}</strong> וכל {p.stop_count || 0} התחנות?</p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                    <button onClick={() => deletePerson(p)} style={{
                      background: '#c94949', color: '#fff', border: 'none',
                      borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12,
                    }}>מחק</button>
                    <button onClick={() => setDelConfirm(null)} style={{
                      background: 'transparent', color: '#8b6914', border: '1px solid #5a3a1a',
                      borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12,
                    }}>ביטול</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {people.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#5a3a1a', fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
          אין אנשים עדיין. לחץ "הוסף אדם" כדי להתחיל.
        </div>
      )}

      {/* ── Add/Edit Panel ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
            style={{
              position: 'fixed', inset: 0, background: '#000000aa',
              backdropFilter: 'blur(8px)', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              dir="rtl"
              style={{
                background: 'linear-gradient(180deg, #1e140a, #0d0702)',
                border: '1px solid #c9a22744',
                borderRadius: 16, padding: '20px',
                width: '100%', maxWidth: 400, maxHeight: '80vh', overflowY: 'auto',
                boxShadow: '0 20px 60px #000a',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: '#f5e6c8', marginBottom: 16, fontFamily: '"Playfair Display", serif' }}>
                {editId ? 'ערוך אדם' : 'הוסף אדם למסע'}
              </div>

              {/* Name — search tree */}
              <Label>שם האדם</Label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="שם מלא..." style={inputStyle} />

              <Label>חפש בעץ משפחה</Label>
              <input value={treeSearch} onChange={e => setTreeSearch(e.target.value)}
                placeholder="חיפוש..." style={inputStyle} />
              {treeSearch && (
                <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8, borderRadius: 8, border: '1px solid #1a0f05' }}>
                  {filteredTree.map(tp => (
                    <button key={tp.id} onClick={() => {
                      setForm(f => ({ ...f, name: `${tp.first_name} ${tp.last_name}`, tree_person_id: tp.id.toString() }))
                      setTreeSearch('')
                    }} style={{
                      display: 'block', width: '100%', textAlign: 'right',
                      background: 'transparent', border: 'none', padding: '6px 10px',
                      color: '#b89a5a', cursor: 'pointer', fontSize: 12,
                      borderBottom: '1px solid #1a0f05',
                    }}>
                      {[tp.first_name, tp.last_name].filter(Boolean).join(' ')}
                    </button>
                  ))}
                </div>
              )}

              {/* Color */}
              <Label>צבע הקו</Label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    border: form.color === c ? '3px solid #fff' : '2px solid #1a0f05',
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: form.color === c ? `0 0 12px ${c}66` : 'none',
                  }} />
                ))}
              </div>

              {/* Symbol */}
              <Label>סמל</Label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {SYMBOLS.map(s => (
                  <button key={s.id} onClick={() => setForm(f => ({ ...f, symbol: s.id }))} style={{
                    background: form.symbol === s.id ? '#c9a22722' : '#1a0f05',
                    border: `1px solid ${form.symbol === s.id ? '#c9a227' : '#2a1a08'}`,
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                    color: form.symbol === s.id ? '#f5d98b' : '#5a3a1a', fontSize: 16,
                  }}>{s.icon}</button>
                ))}
              </div>

              {/* Visible */}
              <Label>גלוי בתצוגה ציבורית</Label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setForm(f => ({ ...f, visible: v }))} style={{
                    background: form.visible === v ? '#c9a22722' : 'transparent',
                    border: `1px solid ${form.visible === v ? '#c9a227' : '#2a1a08'}`,
                    borderRadius: 8, padding: '6px 16px', cursor: 'pointer',
                    color: form.visible === v ? '#f5d98b' : '#5a3a1a', fontSize: 12,
                  }}>{v ? 'כן' : 'לא'}</button>
                ))}
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

// Helpers
function Btn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: 'transparent', border: 'none', cursor: 'pointer',
      fontSize: 14, padding: '2px 4px', borderRadius: 4,
      filter: danger ? 'saturate(0.5)' : 'none',
      transition: 'all 0.15s',
    }}>{children}</button>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#8b6914', marginBottom: 4, fontWeight: 600 }}>{children}</div>
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#1a0f0566', border: '1px solid #c9a22722',
  borderRadius: 8, padding: '8px 12px', marginBottom: 10,
  color: '#f5e6c8', fontSize: 13, outline: 'none',
  fontFamily: '"Heebo", sans-serif',
}

'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { GlobePerson } from '../page'

interface Props {
  people: GlobePerson[]; treePeople: any[]; familyId: string
  onRefresh: () => void
  logHistory: (a: string, t: string, id?: string, d?: any) => void
}

export default function TabTreeLinks({ people, treePeople, familyId, onRefresh, logHistory }: Props) {
  const [linking, setLinking] = useState<string | null>(null)
  const [treeSearch, setTreeSearch] = useState('')

  const link = async (globePersonId: string, treePersonId: number) => {
    await supabase.from('globe_people').update({ tree_person_id: treePersonId }).eq('id', globePersonId)
    await supabase.from('people').update({ globe_person_id: globePersonId }).eq('id', treePersonId)
    logHistory('link', 'tree_connection', globePersonId, { tree_person_id: treePersonId })
    setLinking(null); setTreeSearch(''); onRefresh()
  }

  const unlink = async (p: GlobePerson) => {
    if (p.tree_person_id) await supabase.from('people').update({ globe_person_id: null }).eq('id', p.tree_person_id)
    await supabase.from('globe_people').update({ tree_person_id: null }).eq('id', p.id)
    logHistory('unlink', 'tree_connection', p.id)
    onRefresh()
  }

  const autoLink = async () => {
    let count = 0
    for (const gp of people) {
      if (gp.tree_person_id) continue
      const match = treePeople.find(tp => `${tp.first_name} ${tp.last_name}`.trim() === gp.name.trim())
      if (match) { await link(gp.id, match.id); count++ }
    }
    alert(`קושרו ${count} אנשים אוטומטית`)
  }

  const filtered = treePeople.filter(tp => {
    if (!treeSearch) return true
    return `${tp.first_name} ${tp.last_name}`.toLowerCase().includes(treeSearch.toLowerCase())
  })

  return (
    <div style={{ padding: '12px 14px' }}>
      <motion.button whileTap={{ scale: 0.97 }} onClick={autoLink} style={{
        width: '100%', background: '#c9a22718', border: '1px solid #c9a22744',
        borderRadius: 10, padding: '10px', cursor: 'pointer', color: '#c9a227',
        fontSize: 13, marginBottom: 14, fontFamily: '"Heebo", sans-serif',
      }}>🔗 קשר אוטומטי לפי שם</motion.button>

      {people.map(p => (
        <div key={p.id} style={{
          background: '#1a0f0544', border: '1px solid #c9a22715',
          borderRadius: 10, padding: '10px 12px', marginBottom: 6, fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ fontWeight: 600, color: '#f5e6c8' }}>{p.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {p.tree_person_id ? (
              <>
                <span style={{ color: '#4ade80', fontSize: 11 }}>✅ מקושר</span>
                <button onClick={() => unlink(p)} style={{
                  background: 'none', border: '1px solid #c9494933', borderRadius: 6,
                  padding: '2px 8px', color: '#c94949', cursor: 'pointer', fontSize: 11,
                }}>נתק</button>
              </>
            ) : (
              <>
                <span style={{ color: '#8b6914', fontSize: 11 }}>⚠️ לא מקושר</span>
                <button onClick={() => setLinking(p.id)} style={{
                  background: 'none', border: '1px solid #c9a22733', borderRadius: 6,
                  padding: '2px 8px', color: '#c9a227', cursor: 'pointer', fontSize: 11,
                }}>חבר</button>
              </>
            )}
          </div>
        </div>
      ))}

      {linking && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#1e140a', border: '1px solid #c9a22744', borderRadius: 12, padding: 14, marginTop: 8 }}>
          <div style={{ fontSize: 13, color: '#f5e6c8', marginBottom: 8, fontWeight: 600 }}>
            חבר {people.find(p => p.id === linking)?.name} לאדם בעץ:
          </div>
          <input value={treeSearch} onChange={e => setTreeSearch(e.target.value)}
            placeholder="חפש בעץ..." style={inputStyle} autoFocus />
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.map(tp => (
              <button key={tp.id} onClick={() => link(linking, tp.id)} style={{
                display: 'block', width: '100%', textAlign: 'right',
                background: 'transparent', border: 'none', padding: '6px 10px',
                color: '#b89a5a', cursor: 'pointer', fontSize: 12,
                borderBottom: '1px solid #1a0f05',
              }}>{[tp.first_name, tp.last_name].filter(Boolean).join(' ')}</button>
            ))}
          </div>
          <button onClick={() => { setLinking(null); setTreeSearch('') }} style={{
            marginTop: 8, background: 'none', border: '1px solid #5a3a1a',
            borderRadius: 8, padding: '5px 14px', color: '#8b6914', cursor: 'pointer', fontSize: 12,
          }}>ביטול</button>
        </motion.div>
      )}
    </div>
  )
}
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#1a0f0566',
  border: '1px solid #c9a22722', borderRadius: 8, padding: '7px 10px',
  marginBottom: 8, color: '#f5e6c8', fontSize: 13, outline: 'none',
  fontFamily: '"Heebo", sans-serif',
}

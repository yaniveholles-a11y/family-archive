'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function TabTreeTools({ people, relations, familyId, onRefresh, logHistory }: any) {
  const [errors, setErrors] = useState<string[]>([])
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    supabase.from('tree_history').select('*').eq('family_id', familyId)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setHistory(data || []))
  }, [familyId])

  const checkErrors = () => {
    const errs: string[] = []
    const getName = (id: number) => { const p = people.find((x: any) => x.id === id); return p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : '?' }

    // People without relationships
    people.forEach((p: any) => {
      const rels = relations.filter((r: any) => r.person_a_id === p.id || r.person_b_id === p.id)
      if (rels.length === 0) errs.push(`⚠️ ${getName(p.id)} — ללא קשרים (צף בעץ)`)
    })
    // People without birth year
    people.forEach((p: any) => { if (!p.birth_date) errs.push(`📅 ${getName(p.id)} — חסר שנת לידה`) })
    // People without photo
    people.forEach((p: any) => { if (!p.photo_url) errs.push(`📷 ${getName(p.id)} — חסרה תמונה`) })
    // Self-referencing
    relations.forEach((r: any) => { if (r.person_a_id === r.person_b_id) errs.push(`❌ ${getName(r.person_a_id)} — קשר עצמי!`) })
    // More than 2 parents
    people.forEach((p: any) => {
      const parents = relations.filter((r: any) => ['parent'].includes(r.relation_type) && r.person_b_id === p.id)
      if (parents.length > 2) errs.push(`❌ ${getName(p.id)} — יותר מ-2 הורים (${parents.length})`)
    })
    // Duplicate names
    const names = new Map<string, number[]>()
    people.forEach((p: any) => {
      const n = `${p.first_name} ${p.last_name}`.trim()
      if (!names.has(n)) names.set(n, [])
      names.get(n)!.push(p.id)
    })
    names.forEach((ids, name) => { if (ids.length > 1) errs.push(`⚠️ שם כפול: ${name} (${ids.length} אנשים)`) })

    setErrors(errs)
  }

  // Stats
  const uniqueCountries = [...new Set(people.map((p: any) => p.origin_country).filter(Boolean))]
  const uniqueLastNames = [...new Set(people.map((p: any) => p.last_name).filter(Boolean))]
  const years = people.map((p: any) => parseInt(p.birth_date?.substring(0,4))).filter(Boolean)
  const oldestYear = years.length > 0 ? Math.min(...years) : '—'
  const youngestYear = years.length > 0 ? Math.max(...years) : '—'

  // Count generations
  const getDepth = (personId: number, visited = new Set<number>()): number => {
    if (visited.has(personId)) return 0
    visited.add(personId)
    const children = relations.filter((r: any) => r.relation_type === 'parent' && r.person_a_id === personId)
    if (children.length === 0) return 1
    return 1 + Math.max(...children.map((r: any) => getDepth(r.person_b_id, visited)))
  }
  const roots = people.filter((p: any) => !relations.find((r: any) => r.relation_type === 'parent' && r.person_b_id === p.id))
  const maxDepth = roots.length > 0 ? Math.max(...roots.map((r: any) => getDepth(r.id))) : 0

  return (
    <div style={{ padding: '12px 14px' }}>
      <Sec title="סטטיסטיקות">
        <Stat label="אנשים בעץ" value={people.length} />
        <Stat label="קשרים" value={relations.length} />
        <Stat label="דורות" value={maxDepth} />
        <Stat label="דור קדום ביותר" value={oldestYear} />
        <Stat label="דור צעיר ביותר" value={youngestYear} />
        <Stat label="מדינות מוצא" value={uniqueCountries.length} />
        <Stat label="שמות משפחה" value={uniqueLastNames.length} />
        {uniqueCountries.length > 0 && (
          <div style={{ fontSize: 11, color: '#5a3a1a', marginTop: 4 }}>{uniqueCountries.join(' · ')}</div>
        )}
        {uniqueLastNames.length > 0 && (
          <div style={{ fontSize: 11, color: '#5a3a1a', marginTop: 2 }}>{uniqueLastNames.join(' · ')}</div>
        )}
      </Sec>

      <Sec title="בדיקת שלמות">
        <motion.button whileTap={{ scale: 0.97 }} onClick={checkErrors} style={{ background: '#c9a22712', border: '1px solid #c9a22733', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#c9a227', fontSize: 12, marginBottom: 8 }}>🔍 בדוק שלמות העץ</motion.button>
        {errors.length > 0 ? (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: e.startsWith('❌') ? '#c94949' : '#ffb3b3', padding: '3px 0', borderBottom: '1px solid #1a0f05' }}>{e}</div>)}
          </div>
        ) : errors !== null && <div style={{ fontSize: 12, color: '#4ade80' }}>✅ לא נמצאו בעיות</div>}
      </Sec>

      <Sec title="היסטוריית שינויים">
        <div style={{ maxHeight: 250, overflowY: 'auto' }}>
          {history.map(h => {
            const time = new Date(h.created_at).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            return (
              <div key={h.id} style={{ fontSize: 11, padding: '4px 0', borderBottom: '1px solid #1a0f05', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8b6914' }}>
                  {h.action === 'create' ? '➕' : h.action === 'update' ? '✏️' : h.action === 'delete' ? '🗑️' : '🔗'} {h.entity_type}
                  {h.details?.name ? ` — ${h.details.name}` : ''}
                </span>
                <span style={{ color: '#3a2a10' }}>{time}</span>
              </div>
            )
          })}
          {history.length === 0 && <div style={{ color: '#3a2a10', fontSize: 12 }}>אין היסטוריה</div>}
        </div>
      </Sec>
    </div>
  )
}
function Sec({ title, children }: any) { return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#c9a227', fontWeight: 600, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #c9a22722' }}>{title}</div>{children}</div> }
function Stat({ label, value }: any) { return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}><span style={{ color: '#8b6914' }}>{label}</span><span style={{ color: '#f5e6c8', fontWeight: 600 }}>{value}</span></div> }

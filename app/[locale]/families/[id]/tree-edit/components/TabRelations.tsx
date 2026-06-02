'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { TreePerson, TreeRelation } from '../page'

const REL_TYPES = [
  // קרבת דם
  { id: 'parent', label: 'הורה של', cat: 'blood', icon: '👨‍👧' },
  { id: 'child', label: 'ילד/ה של', cat: 'blood', icon: '👶' },
  { id: 'sibling', label: 'אח/אחות של', cat: 'blood', icon: '👫' },
  { id: 'twin', label: 'תאום/ה של', cat: 'blood', icon: '👯' },
  { id: 'half_sibling', label: 'אח/ות חורג/ת', cat: 'blood', icon: '🧑‍🤝‍🧑' },
  { id: 'grandparent', label: 'סב/סבתא של', cat: 'blood', icon: '👴' },
  { id: 'grandchild', label: 'נכד/ה של', cat: 'blood', icon: '👧' },
  { id: 'uncle_aunt', label: 'דוד/דודה של', cat: 'blood', icon: '🧑' },
  { id: 'nephew_niece', label: 'אחיין/ית של', cat: 'blood', icon: '🧒' },
  { id: 'cousin', label: 'בן/בת דוד/ה', cat: 'blood', icon: '🤝' },
  // זוגיות
  { id: 'spouse', label: 'נשוי/אה ל', cat: 'marriage', icon: '💍' },
  { id: 'ex_spouse', label: 'גרוש/ה מ', cat: 'marriage', icon: '💔' },
  { id: 'engaged', label: 'מאורס/ת ל', cat: 'marriage', icon: '💎' },
  { id: 'partner', label: 'בן/בת זוג', cat: 'marriage', icon: '❤️' },
  { id: 'widowed', label: 'אלמן/ה של', cat: 'marriage', icon: '🖤' },
  // אימוץ ומשפחה מורחבת
  { id: 'adopted_parent', label: 'הורה מאמץ של', cat: 'extended', icon: '🤱' },
  { id: 'adopted_child', label: 'ילד/ה מאומץ/ת', cat: 'extended', icon: '👼' },
  { id: 'foster_parent', label: 'הורה אומנה של', cat: 'extended', icon: '🏠' },
  { id: 'foster_child', label: 'ילד/ה אומנה', cat: 'extended', icon: '🏡' },
  { id: 'step_parent', label: 'הורה חורג של', cat: 'extended', icon: '👨‍👦' },
  { id: 'step_child', label: 'ילד/ה חורג/ת', cat: 'extended', icon: '🧒' },
  { id: 'step_sibling', label: 'אח/ות חורג/ת (לא ביולוגי)', cat: 'extended', icon: '🧑‍🤝‍🧑' },
  { id: 'godparent', label: 'סנדק/ית של', cat: 'extended', icon: '✡️' },
  { id: 'godchild', label: 'חניך/ה של', cat: 'extended', icon: '🕯️' },
  // אחר
  { id: 'guardian', label: 'אפוטרופוס של', cat: 'other', icon: '🛡️' },
  { id: 'ward', label: 'חסוי/ה של', cat: 'other', icon: '👤' },
  { id: 'mentor', label: 'מורה/רב של', cat: 'other', icon: '📖' },
  { id: 'student', label: 'תלמיד/ה של', cat: 'other', icon: '✏️' },
  { id: 'friend', label: 'חבר/ה של', cat: 'other', icon: '🤗' },
  { id: 'neighbor', label: 'שכן/ה של', cat: 'other', icon: '🏘️' },
  { id: 'business_partner', label: 'שותף/ה עסקי', cat: 'other', icon: '💼' },
  { id: 'other', label: 'קשר אחר', cat: 'other', icon: '🔗' },
]

const CATEGORIES = [
  { id: 'blood', label: '🩸 קרבת דם' },
  { id: 'marriage', label: '💍 זוגיות' },
  { id: 'extended', label: '🏠 משפחה מורחבת' },
  { id: 'other', label: '🔗 אחר' },
]

interface Props {
  people: TreePerson[]; relations: TreeRelation[]; familyId: string
  onRefresh: () => void; logHistory: (a: string, t: string, id?: string, d?: any) => void
}

export default function TabRelations({ people, relations, familyId, onRefresh, logHistory }: Props) {
  const [personA, setPersonA] = useState(''); const [personB, setPersonB] = useState('')
  const [relType, setRelType] = useState('parent'); const [mYear, setMYear] = useState('')
  const [mBce, setMBce] = useState(false); const [dYear, setDYear] = useState('')
  const [note, setNote] = useState(''); const [filter, setFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [searchA, setSearchA] = useState(''); const [searchB, setSearchB] = useState('')

  const addRel = async () => {
    if (!personA || !personB || personA === personB) { alert('בחר שני אנשים שונים'); return }
    const { error } = await supabase.from('tree_relationships').insert({
      family_id: parseInt(familyId), person_a_id: parseInt(personA), person_b_id: parseInt(personB),
      relation_type: relType,
      marriage_year: mYear ? parseInt(mYear) : null, marriage_is_bce: mBce,
      divorce_year: dYear ? parseInt(dYear) : null,
      note: note || null,
    })
    if (error) { alert('שגיאה: ' + error.message); return }
    logHistory('create', 'relation', undefined, { type: relType })
    setPersonA(''); setPersonB(''); setNote(''); setMYear(''); setDYear(''); onRefresh()
  }

  const deleteRel = async (r: TreeRelation) => {
    await supabase.from('tree_relationships').delete().eq('id', r.id)
    logHistory('delete', 'relation', r.id); onRefresh()
  }

  const getName = (id: number) => { const p = people.find(x => x.id === id); return p ? `${[p.first_name, p.last_name].filter(Boolean).join(' ')}` : '?' }
  const getRelInfo = (type: string) => REL_TYPES.find(r => r.id === type) || { icon: '🔗', label: type, cat: 'other' }

  const filtered = relations.filter(r => {
    if (filter && r.relation_type !== filter) return false
    if (catFilter) { const info = getRelInfo(r.relation_type); if (info.cat !== catFilter) return false }
    return true
  })

  const filteredPeopleA = people.filter(p => !searchA || `${[p.first_name, p.last_name].filter(Boolean).join(' ')}`.toLowerCase().includes(searchA.toLowerCase()))
  const filteredPeopleB = people.filter(p => !searchB || `${[p.first_name, p.last_name].filter(Boolean).join(' ')}`.toLowerCase().includes(searchB.toLowerCase()))
  const selectedRelType = REL_TYPES.find(r => r.id === relType)
  const isMarriage = selectedRelType?.cat === 'marriage'

  const checkErrors = () => {
    const errs: string[] = []
    people.forEach(p => {
      const rels = relations.filter(r => r.person_a_id === p.id || r.person_b_id === p.id)
      if (rels.length === 0) errs.push(`⚠️ ${[p.first_name, p.last_name].filter(Boolean).join(' ')} — ללא קשרים (צף בעץ)`)
      const bioParents = relations.filter(r => r.relation_type === 'parent' && r.person_b_id === p.id)
      if (bioParents.length > 2) errs.push(`❌ ${[p.first_name, p.last_name].filter(Boolean).join(' ')} — יותר מ-2 הורים ביולוגיים`)
      if (relations.find(r => r.person_a_id === p.id && r.person_b_id === p.id))
        errs.push(`❌ ${[p.first_name, p.last_name].filter(Boolean).join(' ')} — קשר עצמי (לולאה)`)
    })
    // duplicate check
    const relKeys = new Set<string>()
    relations.forEach(r => {
      const key = `${Math.min(r.person_a_id, r.person_b_id)}-${Math.max(r.person_a_id, r.person_b_id)}-${r.relation_type}`
      if (relKeys.has(key)) errs.push(`⚠️ קשר כפול: ${getName(r.person_a_id)} ↔ ${getName(r.person_b_id)} (${getRelInfo(r.relation_type).label})`)
      relKeys.add(key)
    })
    setErrors(errs)
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      <Sec title="הוסף קשר חדש">
        {/* Person A */}
        <Label>אדם א</Label>
        <input value={searchA} onChange={e => setSearchA(e.target.value)} placeholder="🔍 חפש..." style={inp} />
        <select value={personA} onChange={e => setPersonA(e.target.value)} style={sel}>
          <option value="">בחר...</option>
          {filteredPeopleA.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}
        </select>

        {/* Relation type — grouped by category */}
        <Label>סוג קשר</Label>
        <select value={relType} onChange={e => setRelType(e.target.value)} style={sel}>
          {CATEGORIES.map(cat => (
            <optgroup key={cat.id} label={cat.label}>
              {REL_TYPES.filter(r => r.cat === cat.id).map(r => (
                <option key={r.id} value={r.id}>{r.icon} {r.label}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Person B */}
        <Label>אדם ב</Label>
        <input value={searchB} onChange={e => setSearchB(e.target.value)} placeholder="🔍 חפש..." style={inp} />
        <select value={personB} onChange={e => setPersonB(e.target.value)} style={sel}>
          <option value="">בחר...</option>
          {filteredPeopleB.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}
        </select>

        {/* Marriage fields */}
        {isMarriage && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <div style={{ flex: 1 }}><Label>שנת נישואין</Label><input value={mYear} onChange={e => setMYear(e.target.value)} type="number" placeholder="1920" style={inp} /></div>
            <div style={{ flex: 1 }}><Label>שנת גירושין</Label><input value={dYear} onChange={e => setDYear(e.target.value)} type="number" placeholder="" style={inp} /></div>
          </div>
        )}
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="הערה על הקשר..." style={inp} />
        <motion.button whileTap={{ scale: 0.97 }} onClick={addRel} style={{ width: '100%', background: '#c9a227', border: 'none', borderRadius: 10, padding: '8px', cursor: 'pointer', color: '#0d0702', fontWeight: 700, fontSize: 13, marginBottom: 12 }}>+ הוסף קשר</motion.button>
      </Sec>

      <Sec title="קשרים קיימים">
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          <Chip active={!catFilter} onClick={() => setCatFilter('')}>הכל ({relations.length})</Chip>
          {CATEGORIES.map(c => {
            const count = relations.filter(r => getRelInfo(r.relation_type).cat === c.id).length
            return count > 0 ? <Chip key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)}>{c.label} ({count})</Chip> : null
          })}
        </div>

        {filtered.map(r => {
          const info = getRelInfo(r.relation_type)
          return (
            <div key={r.id} style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 8, padding: '8px 10px', marginBottom: 4, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#f5e6c8' }}>{getName(r.person_a_id)}</span>
                <span style={{ color: '#c9a227', margin: '0 6px' }}>{info.icon} {info.label}</span>
                <span style={{ color: '#f5e6c8' }}>{getName(r.person_b_id)}</span>
                {r.marriage_year && <span style={{ color: '#5a3a1a', marginRight: 6 }}>({r.marriage_year})</span>}
                {r.note && <span style={{ color: '#3a2a10', marginRight: 4 }}>· {r.note}</span>}
              </div>
              <button onClick={() => deleteRel(r)} style={{ background: 'none', border: 'none', color: '#c94949', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
            </div>
          )
        })}
        {filtered.length === 0 && <div style={{ color: '#3a2a10', fontSize: 12, textAlign: 'center', padding: '1rem' }}>אין קשרים</div>}
      </Sec>

      <Sec title="בדיקת עץ">
        <motion.button whileTap={{ scale: 0.97 }} onClick={checkErrors} style={{ background: '#c9a22712', border: '1px solid #c9a22733', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#c9a227', fontSize: 12, marginBottom: 8 }}>🔍 בדוק שגיאות בקשרים</motion.button>
        {errors.length > 0 && <div style={{ maxHeight: 200, overflowY: 'auto' }}>{errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: '#ffb3b3', padding: '3px 0', borderBottom: '1px solid #1a0f05' }}>{e}</div>)}</div>}
        {errors.length === 0 && <div style={{ fontSize: 12, color: '#4ade80' }}>✅ לא נמצאו שגיאות</div>}
      </Sec>
    </div>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) { return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 13, color: '#c9a227', fontWeight: 600, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #c9a22722' }}>{title}</div>{children}</div> }
function Label({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 12, color: '#8b6914', marginBottom: 3, fontWeight: 600 }}>{children}</div> }
function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={{ background: active ? '#c9a22722' : 'transparent', border: `1px solid ${active ? '#c9a227' : '#2a1a08'}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: active ? '#f5d98b' : '#5a3a1a', fontSize: 11 }}>{children}</button>
}
const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 8, padding: '7px 10px', marginBottom: 6, color: '#f5e6c8', fontSize: 13, outline: 'none', fontFamily: '"Heebo", sans-serif' }
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

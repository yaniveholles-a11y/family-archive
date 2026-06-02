'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Person = { id: number; first_name: string; last_name: string }
type Relation = { id: number; relation_type: string; person: { first_name: string; last_name: string } }

export default function RelationsPage() {
  const { id } = useParams()
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPerson, setSelectedPerson] = useState('')
  const [relationType, setRelationType] = useState('parent')
  const [relations, setRelations] = useState<Relation[]>([])
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const { data: cp } = await supabase.from('people').select('*').eq('id', id).single()
    setCurrentPerson(cp)
    const { data: pp } = await supabase.from('people').select('*').neq('id', id).order('last_name')
    setPeople(pp || [])
    const { data: rels } = await supabase
      .from('family_relations')
      .select('*, person:related_person_id(first_name, last_name)')
      .eq('person_id', id)
    setRelations(rels || [])
  }

  async function addRelation() {
    if (!selectedPerson) return
    await supabase.from('family_relations').insert({ person_id: id, related_person_id: selectedPerson, relation_type: relationType })
    setSelectedPerson('')
    fetchAll()
  }

  async function deleteRelation(relationId: number) {
    await supabase.from('family_relations').delete().eq('id', relationId)
    fetchAll()
  }

  const relationLabels: Record<string, string> = { parent: 'הורה', child: 'ילד/ה', spouse: 'בן/בת זוג', sibling: 'אח/אחות' }
  const relationIcons: Record<string, string> = { parent: '👴', child: '👶', spouse: '💑', sibling: '👫' }

  const grouped = relations.reduce((acc: any, r) => {
    if (!acc[r.relation_type]) acc[r.relation_type] = []
    acc[r.relation_type].push(r)
    return acc
  }, {})

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={'/people/' + id} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ חזרה לפרופיל</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>{currentPerson?.first_name} — קשרי משפחה</span>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>

        {/* הוספת קשר */}
        <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#f5d98b', marginBottom: '1rem' }}>הוסף קשר חדש</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}
              style={{ flex: 1, minWidth: '160px', background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.9rem' }}>
              <option value="">בחר אדם</option>
              {people.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}
            </select>
            <select value={relationType} onChange={e => setRelationType(e.target.value)}
              style={{ background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.9rem' }}>
              <option value="parent">הורה</option>
              <option value="child">ילד/ה</option>
              <option value="spouse">בן/בת זוג</option>
              <option value="sibling">אח/אחות</option>
            </select>
            <button onClick={addRelation}
              style={{ background: '#c9a227', color: '#1a0f05', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', cursor: 'pointer', fontWeight: 'bold' }}>
              הוסף
            </button>
          </div>
        </div>

        {/* קשרים קיימים */}
        {relations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#b89a5a' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p>אין קשרים עדיין</p>
          </div>
        )}

        {Object.entries(grouped).map(([type, rels]: any) => (
          <div key={type} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#c9a227', marginBottom: '0.75rem' }}>
              {relationIcons[type]} {relationLabels[type]}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rels.map((r: any) => (
                <div key={r.id} style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#f5d98b' }}>{r.person?.first_name} {r.person?.last_name}</span>
                  <button onClick={() => deleteRelation(r.id)}
                    style={{ background: 'transparent', border: 'none', color: '#5a3a1a', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
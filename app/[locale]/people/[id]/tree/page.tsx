'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, getSession } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
type Person = {
  id: number
  first_name: string
  last_name: string
  birth_date?: string
  death_date?: string
  birth_place?: string
  death_place?: string
  photo_url?: string
  bio?: string
}

// ─── Person Card (square with photo) ─────────────────────────────────────────
function PersonNode({
  person,
  isMain = false,
  isSpouse = false,
  onClick,
}: {
  person: Person
  isMain?: boolean
  isSpouse?: boolean
  onClick: (p: Person) => void
}) {
  const name = `${[person.first_name, person.last_name].filter(Boolean).join(' ')}`
  const year = person.birth_date ? person.birth_date.substring(0, 4) : null
  const deathYear = person.death_date ? person.death_date.substring(0, 4) : null

  return (
    <div
      onClick={() => onClick(person)}
      title={name}
      style={{
        width: 110,
        background: isMain ? '#c9a227' : isSpouse ? '#1a1208' : '#2a1a08',
        border: `2px solid ${isMain ? '#f5d98b' : isSpouse ? '#c9a22766' : '#3a2a10'}`,
        borderRadius: 12,
        padding: '0.6rem',
        textAlign: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'transform 0.15s, border-color 0.15s',
        boxShadow: isMain ? '0 0 18px #c9a22744' : '0 2px 8px #00000044',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        if (!isMain) e.currentTarget.style.borderColor = '#c9a227'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        if (!isMain) e.currentTarget.style.borderColor = isSpouse ? '#c9a22766' : '#3a2a10'
      }}
    >
      {person.photo_url ? (
        <img
          src={person.photo_url}
          alt={name}
          style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: `2px solid ${isMain ? '#a07018' : '#c9a22766'}`, marginBottom: 6, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
        />
      ) : (
        <div style={{ width: 52, height: 52, borderRadius: 8, background: isMain ? '#a07018' : '#1a0e04', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 6, marginLeft: 'auto', marginRight: 'auto' }}>
          👤
        </div>
      )}
      <div style={{ fontWeight: 'bold', fontSize: '0.72rem', color: isMain ? '#0d0702' : '#f5d98b', lineHeight: 1.2, marginBottom: 3, wordBreak: 'break-word' }}>
        {name}
      </div>
      {(year || deathYear) && (
        <div style={{ fontSize: '0.65rem', color: isMain ? '#3a2000' : '#b89a5a' }}>
          {year || '?'}{deathYear ? ` – ${deathYear}` : ''}
        </div>
      )}
    </div>
  )
}

// ─── Connector line (vertical) ────────────────────────────────────────────────
function VLine({ height = 36 }: { height?: number }) {
  return <div style={{ width: 2, height, background: '#3a2a10', margin: '0 auto' }} />
}

// ─── Connector line (horizontal bar across children) ─────────────────────────
function HBar({ count }: { count: number }) {
  if (count <= 1) return null
  const w = Math.min(count * 130, 700)
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ height: 2, width: w, background: '#3a2a10' }} />
    </div>
  )
}

// ─── Popup ────────────────────────────────────────────────────────────────────
function PersonPopup({
  person,
  canEdit,
  onClose,
}: {
  person: Person
  canEdit: boolean
  onClose: () => void
}) {
  const name = `${[person.first_name, person.last_name].filter(Boolean).join(' ')}`

  function formatDate(d?: string) {
    if (!d) return null
    try {
      return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return d
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div dir="rtl" style={{ background: '#1a0f05', border: '1px solid #c9a227', borderRadius: 16, padding: '1.5rem', maxWidth: 380, width: '100%', position: 'relative', boxShadow: '0 8px 40px #00000088' }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'none', border: 'none', color: '#b89a5a', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>

        {/* Header */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          {person.photo_url ? (
            <img src={person.photo_url} alt={name} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: '2px solid #c9a227', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 10, background: '#2a1a08', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, border: '2px solid #3a2a10' }}>👤</div>
          )}
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#f5d98b', marginBottom: 4 }}>{name}</div>
            {person.birth_date && (
              <div style={{ fontSize: '0.8rem', color: '#b89a5a' }}>
                🌱 {formatDate(person.birth_date)}
                {person.birth_place && <span> · {person.birth_place}</span>}
              </div>
            )}
            {person.death_date && (
              <div style={{ fontSize: '0.8rem', color: '#7a7a7a', marginTop: 2 }}>
                🕯️ {formatDate(person.death_date)}
                {person.death_place && <span> · {person.death_place}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {person.bio && (
          <div style={{ borderTop: '1px solid #3a2a10', paddingTop: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#c9a227', fontWeight: 'bold', marginBottom: 4 }}>סיפור חיים</div>
            <div style={{ fontSize: '0.82rem', color: '#d4c0a0', lineHeight: 1.6, maxHeight: 120, overflowY: 'auto' }}>
              {person.bio}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a href={`/people/${person.id}`}
            style={{ flex: 1, background: '#c9a227', color: '#0d0702', padding: '0.5rem 0.75rem', borderRadius: 8, textDecoration: 'none', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
            פרופיל מלא →
          </a>
          {canEdit && (
            <a href={`/people/${person.id}/edit`}
              style={{ background: '#2a1a08', color: '#c9a227', border: '1px solid #c9a227', padding: '0.5rem 0.75rem', borderRadius: 8, textDecoration: 'none', textAlign: 'center', fontSize: '0.85rem' }}>
              ✏️ עריכה
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Level label ──────────────────────────────────────────────────────────────
function LevelLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: '0.7rem', color: '#c9a227', letterSpacing: '2px', textAlign: 'center', marginBottom: 8, opacity: 0.7 }}>
      {label}
    </div>
  )
}

// ─── Row of people ────────────────────────────────────────────────────────────
function PersonRow({ people, main, spouses = [], onClick }: {
  people: Person[]
  main?: Person
  spouses?: Person[]
  onClick: (p: Person) => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {people.map(p => (
        <PersonNode key={p.id} person={p} isMain={main?.id === p.id} onClick={onClick} />
      ))}
      {spouses.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: '#c9a22788', fontSize: 18 }}>💍</div>
          <PersonNode person={s} isSpouse onClick={onClick} />
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FamilyTree() {
  const { id } = useParams()
  const router = useRouter()
  const [person, setPerson] = useState<Person | null>(null)
  const [parents, setParents] = useState<Person[]>([])
  const [grandparents, setGrandparents] = useState<Person[]>([])
  const [parentSpouses, setParentSpouses] = useState<Person[]>([])
  const [children, setChildren] = useState<Person[]>([])
  const [spouses, setSpouses] = useState<Person[]>([])
  const [siblings, setSiblings] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [popup, setPopup] = useState<Person | null>(null)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const session = await getSession()
    if (!session) { router.push('/login'); return }

    // Auth check
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single()
    setCanEdit(roleData?.role === 'admin' || roleData?.role === 'editor')

    // Main person (full fields)
    const { data: personData } = await supabase
      .from('people')
      .select('id, first_name, last_name, birth_date, death_date, birth_place, death_place, photo_url, bio')
      .eq('id', id)
      .single()
    setPerson(personData)

    // Direct relations
    const { data: relsData } = await supabase
      .from('family_relations')
      .select('relation_type, related:related_person_id(id, first_name, last_name, birth_date, death_date, birth_place, death_place, photo_url, bio)')
      .eq('person_id', id)

    const rels = relsData || []
    const myParents: Person[] = rels.filter(r => r.relation_type === 'parent').map(r => r.related as unknown as Person)
    const myChildren: Person[] = rels.filter(r => r.relation_type === 'child').map(r => r.related as unknown as Person)
    const mySpouses: Person[] = rels.filter(r => r.relation_type === 'spouse').map(r => r.related as unknown as Person)
    const mySiblings: Person[] = rels.filter(r => r.relation_type === 'sibling').map(r => r.related as unknown as Person)

    setParents(myParents)
    setChildren(myChildren)
    setSpouses(mySpouses)
    setSiblings(mySiblings)

    // Grandparents — fetch parents' parents
    if (myParents.length > 0) {
      const gps: Person[] = []
      const pSpouses: Person[] = []

      for (const parent of myParents) {
        const { data: pRels } = await supabase
          .from('family_relations')
          .select('relation_type, related:related_person_id(id, first_name, last_name, birth_date, death_date, birth_place, death_place, photo_url, bio)')
          .eq('person_id', parent.id)

        for (const r of pRels || []) {
          const p = r.related as unknown as Person
          if (r.relation_type === 'parent') gps.push(p)
          if (r.relation_type === 'spouse') pSpouses.push(p)
        }
      }

      // Deduplicate
      const seen = new Set<number>()
      setGrandparents(gps.filter(g => { if (seen.has(g.id)) return false; seen.add(g.id); return true }))
      const seenS = new Set<number>([...myParents.map(p => p.id)])
      setParentSpouses(pSpouses.filter(s => { if (seenS.has(s.id)) return false; seenS.add(s.id); return true }))
    }

    setLoading(false)
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#0d0702', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#b89a5a' }}>טוען עץ משפחה...</p>
    </main>
  )

  if (!person) return (
    <main style={{ minHeight: '100vh', background: '#0d0702', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#b89a5a' }}>אדם לא נמצא</p>
    </main>
  )

  const hasTree = parents.length > 0 || children.length > 0 || spouses.length > 0 || siblings.length > 0

  // Everyone in the middle row: siblings + main person (in order, person highlighted)
  const middleRow: Person[] = [...siblings, person]

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      {/* Top bar */}
      <div style={{ background: '#0a0500', borderBottom: '1px solid #3a2a10', padding: '0.85rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={`/people/${id}`} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.88rem' }}>→ חזרה לפרופיל</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold', fontSize: '1rem' }}>
          🌳 אילן יוחסין — {[person.first_name, person.last_name].filter(Boolean).join(" ")}
        </span>
        <a href={`/people/${id}/relations`}
          style={{ background: '#c9a227', color: '#0d0702', padding: '0.4rem 1rem', borderRadius: 6, textDecoration: 'none', fontSize: '0.82rem', fontWeight: 'bold' }}>
          + הוסף קשרים
        </a>
      </div>

      {/* Hint */}
      <div style={{ textAlign: 'center', padding: '0.6rem', fontSize: '0.75rem', color: '#5a3a1a' }}>
        לחץ על כל אדם לפרטים נוספים
      </div>

      {!hasTree && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#b89a5a' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌱</div>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>אין קשרים משפחתיים עדיין</p>
          <p style={{ fontSize: '0.85rem', color: '#4a2a10', marginBottom: '2rem' }}>הוסף הורים, ילדים, בני זוג ואחים כדי לבנות את העץ</p>
          <a href={`/people/${id}/relations`}
            style={{ background: '#c9a227', color: '#0d0702', padding: '0.65rem 1.5rem', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold' }}>
            הוסף קשרים →
          </a>
        </div>
      )}

      {hasTree && (
        <div style={{ padding: '2rem 1rem 4rem', overflowX: 'auto' }}>
          <div style={{ minWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

            {/* ── LEVEL 1: Grandparents ── */}
            {grandparents.length > 0 && (
              <>
                <LevelLabel label="סבים וסבתות" />
                <PersonRow people={grandparents} onClick={setPopup} />
                <VLine height={32} />
              </>
            )}

            {/* ── LEVEL 2: Parents ── */}
            {(parents.length > 0 || parentSpouses.length > 0) && (
              <>
                <LevelLabel label="הורים" />
                <PersonRow people={parents} spouses={parentSpouses} onClick={setPopup} />
                <VLine height={32} />
              </>
            )}

            {/* ── LEVEL 3: Siblings + Main person + Spouses ── */}
            <LevelLabel label={siblings.length > 0 ? 'אחים ואחיות' : ''} />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {siblings.map(s => (
                <PersonNode key={s.id} person={s} onClick={setPopup} />
              ))}
              {siblings.length > 0 && (
                <div style={{ width: 2, height: 52, background: '#3a2a1044' }} />
              )}
              <PersonNode person={person} isMain onClick={setPopup} />
              {spouses.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: '#c9a22788', fontSize: 20 }}>💍</div>
                  <PersonNode person={s} isSpouse onClick={setPopup} />
                </div>
              ))}
            </div>

            {/* ── LEVEL 4: Children ── */}
            {children.length > 0 && (
              <>
                <VLine height={32} />
                <HBar count={children.length} />
                <LevelLabel label="ילדים" />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                  {children.map(c => (
                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <VLine height={24} />
                      <PersonNode person={c} onClick={setPopup} />
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Popup */}
      {popup && (
        <PersonPopup person={popup} canEdit={canEdit} onClose={() => setPopup(null)} />
      )}
    </main>
  )
}
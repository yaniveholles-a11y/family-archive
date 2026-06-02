'use client'
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type Person = { id: number; first_name: string; last_name: string; family_id?: number; birth_place?: string; death_place?: string }
type Family = { id: number; name: string }

function MigrationEditContent() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedFamily = searchParams.get('family')
  const preselectedPerson = searchParams.get('person')

  const [people, setPeople] = useState<Person[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [selectedFamily, setSelectedFamily] = useState(preselectedFamily || '')
  const [selectedPerson, setSelectedPerson] = useState(preselectedPerson || '')
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push(`/${locale}/login`); return }
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).single()
    if (roleData?.role !== 'admin' && roleData?.role !== 'editor') { router.push(`/${locale}/map`); return }
    setCanEdit(true)
    const { data: fams } = await supabase.from('families').select('id, name').order('name')
    setFamilies(fams || [])
    const { data: ppl } = await supabase.from('people').select('id, first_name, last_name, family_id, birth_place, death_place').order('last_name')
    setPeople(ppl || [])
    setLoading(false)
  }

  const filteredPeople = selectedFamily
    ? people.filter(p => p.family_id === parseInt(selectedFamily))
    : people

  function goToEdit() {
    if (selectedPerson) {
      router.push(`/${locale}/people/${selectedPerson}/migration`)
    }
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#1c1008', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#b89a5a' }}>טוען...</p>
    </main>
  )

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={`/${locale}/map`} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ מפת נדודים</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>🌍 עריכת מסעות נדודים</span>
      </div>

      <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#f5d98b', marginBottom: '0.5rem' }}>עריכת מסעות</h1>
        <div style={{ width: '80px', height: '1px', background: '#c9a227', marginBottom: '2rem' }} />

        <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* בחירת משפחה */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#b89a5a', marginBottom: '0.5rem' }}>1. בחר משפחה (אופציונלי)</label>
            <select value={selectedFamily} onChange={e => { setSelectedFamily(e.target.value); setSelectedPerson('') }}
              style={{ width: '100%', background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.7rem', color: '#f5e6c8', fontSize: '0.9rem', fontFamily: 'Arial' }}>
              <option value="">כל המשפחות</option>
              {families.map(f => <option key={f.id} value={f.id}>משפחת {f.name}</option>)}
            </select>
          </div>

          {/* בחירת אדם */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#b89a5a', marginBottom: '0.5rem' }}>2. בחר אדם לעריכה</label>
            <select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}
              style={{ width: '100%', background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.7rem', color: '#f5e6c8', fontSize: '0.9rem', fontFamily: 'Arial' }}>
              <option value="">-- בחר אדם --</option>
              {filteredPeople.map(p => (
                <option key={p.id} value={p.id}>
                  {[p.first_name, p.last_name].filter(Boolean).join(" ")}
                  {p.birth_place ? ` · ${p.birth_place}` : ''}
                  {p.death_place && p.death_place !== p.birth_place ? ` → ${p.death_place}` : ''}
                </option>
              ))}
            </select>
          </div>

          <button onClick={goToEdit} disabled={!selectedPerson}
            style={{ background: selectedPerson ? '#c9a227' : '#3a2a10', color: selectedPerson ? '#0d0702' : '#6a4a28', border: 'none', borderRadius: '8px', padding: '0.75rem', fontWeight: 'bold', cursor: selectedPerson ? 'pointer' : 'default', fontSize: '1rem', fontFamily: 'Arial' }}>
            ✏️ ערוך מסע →
          </button>
        </div>

        {/* רשימת כל האנשים עם מסלול */}
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#f5d98b', marginBottom: '1rem' }}>כל האנשים עם מסלול מוגדר</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredPeople.filter(p => p.birth_place || p.death_place).map(p => (
              <div key={p.id} style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', color: '#f5d98b' }}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6a4a28' }}>{[p.birth_place, p.death_place].filter(Boolean).join(' → ')}</div>
                </div>
                <a href={'/people/' + p.id + '/migration'} style={{ background: '#1a0f05', border: '1px solid #c9a227', borderRadius: '6px', padding: '0.3rem 0.7rem', color: '#c9a227', textDecoration: 'none', fontSize: '0.78rem' }}>
                  ✏️ ערוך
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function MigrationEditPage() {
  const { locale } = useParams() as { locale: string }
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', background: '#1c1008', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#b89a5a' }}>טוען...</p></main>}>
      <MigrationEditContent />
    </Suspense>
  )
}
'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Person = {
  id: number
  first_name: string
  last_name: string
  birth_place?: string
  birth_date?: string
  death_date?: string
  bio?: string
}

type YadVashemResult = {
  name: string
  birthYear?: string
  birthPlace?: string
  link?: string
}

const archives = [
  { name: 'יד ושם', url: 'https://www.yadvashem.org/he/names.html', desc: 'מאגר שמות קורבנות השואה', icon: '✡️' },
  { name: 'ארכיון אד-פרוגנס', url: 'https://www.arolsen-archives.org', desc: 'ארכיון גרמניה — רשימות ממחנות', icon: '📁' },
  { name: 'JewishGen', url: 'https://www.jewishgen.org', desc: 'גנאלוגיה יהודית עולמית', icon: '🌍' },
  { name: 'Family Search', url: 'https://www.familysearch.org', desc: 'רשומות היסטוריות בינלאומיות', icon: '🔍' },
  { name: 'Ancestry', url: 'https://www.ancestry.com', desc: 'עצי משפחה ורשומות היסטוריות', icon: '🌳' },
]

export default function HolocaustPage() {
  const { locale } = useParams() as { locale: string }
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [searching, setSearching] = useState<number | null>(null)
  const [searchResults, setSearchResults] = useState<Record<number, YadVashemResult[]>>({})
  const [expandedPerson, setExpandedPerson] = useState<number | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('people')
      .select('id, first_name, last_name, birth_place, birth_date, death_date, bio')
      .order('last_name')
    setPeople(data || [])
    setLoading(false)
  }

  async function searchYadVashem(person: Person) {
    setSearching(person.id)
    const name = encodeURIComponent(`${[person.first_name, person.last_name].filter(Boolean).join(' ')}`)
    // פתח חיפוש ביד ושם בחלון חדש
    window.open(`https://www.yadvashem.org/he/names.html#|language=he&s_id=&s_lastName=${encodeURIComponent(person.last_name)}&s_firstName=${encodeURIComponent(person.first_name)}`, '_blank')
    setSearching(null)
  }

  async function searchJewishGen(person: Person) {
    window.open(`https://www.jewishgen.org/databases/GivenName/Given.php?Given1=${encodeURIComponent(person.first_name)}&Soundex=yes`, '_blank')
  }

  const filtered = filter
    ? people.filter(p =>
        (p.first_name + ' ' + p.last_name).includes(filter) ||
        (p.birth_place || '').includes(filter)
      )
    : people

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0802', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#080502', borderBottom: '1px solid #3a2a10', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={`/${locale}/dashboard`} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ לוח בקרה</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>✡️ מדור שואה וגנאלוגיה</span>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg, #080502 0%, #0d0802 100%)', padding: '3rem 2rem', textAlign: 'center', borderBottom: '1px solid #1a1005' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🕯️</div>
        <h1 style={{ fontSize: '2rem', color: '#f5d98b', marginBottom: '0.5rem' }}>זכרון ושורשים</h1>
        <div style={{ width: '80px', height: '1px', background: '#c9a227', margin: '0 auto 1rem' }} />
        <p style={{ color: '#8a6a3a', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
          תיעוד בני משפחה, חיפוש בארכיונים וקישור למאגרי מידע היסטוריים
        </p>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>

        {/* ארכיונים */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#f5d98b', marginBottom: '1rem' }}>ארכיונים לחיפוש</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {archives.map(a => (
              <a key={a.name} href={a.url} target="_blank" rel="noopener noreferrer" style={{
                background: '#1a1005', border: '1px solid #2a1a08', borderRadius: '10px',
                padding: '1rem', textDecoration: 'none', color: 'inherit',
                transition: 'border-color 0.2s',
                display: 'flex', flexDirection: 'column', gap: '0.35rem',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9a227')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a1a08')}
              >
                <span style={{ fontSize: '1.4rem' }}>{a.icon}</span>
                <div style={{ fontWeight: 'bold', color: '#c9a227', fontSize: '0.88rem' }}>{a.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#7a5a2a' }}>{a.desc}</div>
              </a>
            ))}
          </div>
        </div>

        {/* חיפוש */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#f5d98b', marginBottom: '0.75rem' }}>חיפוש בני משפחה בארכיונים</h2>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="סנן לפי שם או מקום לידה..."
            style={{ width: '100%', background: '#1a1005', border: '1px solid #2a1a08', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f5e6c8', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>

        {loading && <p style={{ color: '#8a6a3a', textAlign: 'center', padding: '2rem' }}>טוען...</p>}

        {/* רשימת אנשים */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map(person => (
            <div key={person.id} style={{ background: '#1a1005', border: '1px solid #2a1a08', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                onClick={() => setExpandedPerson(expandedPerson === person.id ? null : person.id)}
                style={{ padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>👤</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#f5d98b', fontSize: '0.95rem' }}>
                      {[person.first_name, person.last_name].filter(Boolean).join(" ")}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#7a5a2a' }}>
                      {[
                        person.birth_date && `נולד: ${person.birth_date.substring(0, 4)}`,
                        person.birth_place && `מקום: ${person.birth_place}`,
                        person.death_date && `נפטר: ${person.death_date.substring(0, 4)}`,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                <span style={{ color: '#c9a227', fontSize: '0.85rem' }}>{expandedPerson === person.id ? '▲' : '▼'}</span>
              </div>

              {expandedPerson === person.id && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid #2a1a08' }}>
                  <div style={{ paddingTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <a href={'/people/' + person.id} style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '6px', color: '#c9a227', padding: '0.4rem 0.9rem', textDecoration: 'none', fontSize: '0.82rem' }}>
                      👤 פרופיל
                    </a>
                    <button
                      onClick={() => searchYadVashem(person)}
                      disabled={searching === person.id}
                      style={{ background: '#1a2a10', border: '1px solid #3a5a20', borderRadius: '6px', color: '#7ada50', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Arial' }}
                    >
                      {searching === person.id ? '⏳ מחפש...' : '✡️ חפש ביד ושם'}
                    </button>
                    <button
                      onClick={() => searchJewishGen(person)}
                      style={{ background: '#1a1a2a', border: '1px solid #2a2a5a', borderRadius: '6px', color: '#7a7ada', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Arial' }}
                    >
                      🌍 חפש ב-JewishGen
                    </button>
                    <a
                      href={`https://www.familysearch.org/search/record/results?q.givenName=${encodeURIComponent(person.first_name)}&q.surname=${encodeURIComponent(person.last_name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: '#2a1a08', border: '1px solid #5a3a10', borderRadius: '6px', color: '#c9a227', padding: '0.4rem 0.9rem', textDecoration: 'none', fontSize: '0.82rem' }}
                    >
                      🔍 Family Search
                    </a>
                  </div>
                  {person.bio && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#8a6a3a', lineHeight: 1.5 }}>
                      {person.bio}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    <FloatingEditButton editPath="holocaust-edit" />
    </main>
  )
}
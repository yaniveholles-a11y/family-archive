'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Person = {
  id: number; first_name: string; last_name: string
  birth_date?: string; death_date?: string; birth_place?: string; death_place?: string
  photo_url?: string; bio?: string
}
type Event = { id: number; title: string; event_date?: string; event_type: string; description?: string }
type Photo = { id: number; url: string; caption?: string; year?: number }
type Relation = { relation_type: string; related: { id: number; first_name: string; last_name: string } }

export default function ExportPage() {
  const { id } = useParams()
  const [person, setPerson] = useState<Person | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [relations, setRelations] = useState<Relation[]>([])
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [id])

  async function load() {
    const { data: personData } = await supabase.from('people').select('*').eq('id', id).single()
    setPerson(personData)
    const { data: eventsData } = await supabase.from('timeline_events').select('*').eq('person_id', id).order('event_date')
    setEvents(eventsData || [])
    const { data: photosData } = await supabase.from('photos').select('*').eq('person_id', id).limit(12)
    setPhotos(photosData || [])
    const { data: relsData } = await supabase.from('family_relations').select('*, related:related_person_id(id, first_name, last_name)').eq('person_id', id)
    setRelations(relsData || [])
    setLoading(false)
  }

  function handlePrint() {
    setPrinting(true)
    setTimeout(() => { window.print(); setPrinting(false) }, 300)
  }

  if (loading || !person) return (
    <main style={{ minHeight: '100vh', background: '#1c1008', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#b89a5a' }}>טוען...</p>
    </main>
  )

  const parents = relations.filter(r => r.relation_type === 'parent').map(r => r.related)
  const spouses = relations.filter(r => r.relation_type === 'spouse').map(r => r.related)
  const children = relations.filter(r => r.relation_type === 'child').map(r => r.related)

  const age = person.birth_date ? Math.floor(
    (new Date(person.death_date || new Date().toISOString()).getTime() - new Date(person.birth_date).getTime())
    / (365.25 * 24 * 60 * 60 * 1000)
  ) : null

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      {/* סרגל */}
      <div className="no-print" style={{ background: '#0d0702', borderBottom: '1px solid #3a2a10', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={'/people/' + id} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ חזרה לפרופיל</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>ייצוא פרופיל</span>
        <button onClick={handlePrint} disabled={printing} style={{ background: '#c9a227', color: '#0d0702', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'Arial', fontSize: '0.9rem' }}>
          {printing ? 'מכין...' : '🖨️ הדפס / שמור PDF'}
        </button>
      </div>

      {/* תצוגה מקדימה */}
      <div className="no-print" style={{ background: '#1a0f05', borderBottom: '1px solid #2a1a08', padding: '0.75rem 2rem', textAlign: 'center', fontSize: '0.82rem', color: '#8a6a3a' }}>
        לחץ על "הדפס / שמור PDF" ← בחר "שמור כ-PDF" במדפסת
      </div>

      {/* תוכן להדפסה */}
      <div ref={printRef} className="print-content" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', background: '#fff', color: '#1a0a00', fontFamily: 'Arial, sans-serif', borderRadius: '8px' }}>

        {/* כותרת */}
        <div style={{ borderBottom: '3px solid #c9a227', paddingBottom: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {person.photo_url && (
            <img src={person.photo_url} alt={person.first_name} style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover', border: '3px solid #c9a227', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', color: '#1a0a00', marginBottom: '0.25rem' }}>{[person.first_name, person.last_name].filter(Boolean).join(" ")}</h1>
            <div style={{ color: '#8a6a3a', fontSize: '1rem', marginBottom: '0.5rem' }}>
              {person.birth_date && `נולד/ה: ${person.birth_date.substring(0, 10)}`}
              {person.death_date && ` · נפטר/ה: ${person.death_date.substring(0, 10)}`}
              {age && ` · גיל: ${age}`}
            </div>
            {person.birth_place && <div style={{ color: '#5a3a18', fontSize: '0.9rem' }}>📍 {person.birth_place}{person.death_place && person.death_place !== person.birth_place && ` → ${person.death_place}`}</div>}
            {person.bio && <p style={{ color: '#3a2a10', fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: 1.7 }}>{person.bio}</p>}
          </div>
        </div>

        {/* קשרים משפחתיים */}
        {relations.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#c9a227', borderBottom: '1px solid #f5d98b', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>קשרים משפחתיים</h2>
            {parents.length > 0 && <div style={{ marginBottom: '0.4rem', fontSize: '0.9rem' }}><b>הורים:</b> {parents.map(p => p.first_name + ' ' + p.last_name).join(', ')}</div>}
            {spouses.length > 0 && <div style={{ marginBottom: '0.4rem', fontSize: '0.9rem' }}><b>בן/בת זוג:</b> {spouses.map(p => p.first_name + ' ' + p.last_name).join(', ')}</div>}
            {children.length > 0 && <div style={{ marginBottom: '0.4rem', fontSize: '0.9rem' }}><b>ילדים:</b> {children.map(p => p.first_name + ' ' + p.last_name).join(', ')}</div>}
          </div>
        )}

        {/* ציר זמן */}
        {events.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#c9a227', borderBottom: '1px solid #f5d98b', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>ציר זמן</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {events.map(event => (
                <div key={event.id} style={{ display: 'flex', gap: '1rem', fontSize: '0.88rem', paddingRight: '0.5rem', borderRight: '2px solid #c9a227' }}>
                  <div style={{ color: '#8a6a3a', minWidth: '80px', flexShrink: 0 }}>{event.event_date?.substring(0, 4)}</div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1a0a00' }}>{event.title}</div>
                    {event.description && <div style={{ color: '#5a3a18', fontSize: '0.82rem' }}>{event.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* תמונות */}
        {photos.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.1rem', color: '#c9a227', borderBottom: '1px solid #f5d98b', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>גלריה</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {photos.slice(0, 8).map(photo => (
                <div key={photo.id}>
                  <img src={photo.url} alt={photo.caption || ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e0d0b0' }} />
                  {photo.caption && <div style={{ fontSize: '0.65rem', color: '#8a6a3a', textAlign: 'center', marginTop: '2px' }}>{photo.caption}</div>}
                  {photo.year && <div style={{ fontSize: '0.6rem', color: '#b89a5a', textAlign: 'center' }}>{photo.year}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* פוטר */}
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e0d0b0', textAlign: 'center', fontSize: '0.75rem', color: '#b89a5a' }}>
          הופק מארכיון המשפחה · {new Date().toLocaleDateString('he-IL')}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-content { max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; padding: 1.5cm !important; }
          body { background: white !important; }
          main { background: white !important; min-height: auto !important; }
        }
      `}</style>
    </main>
  )
}
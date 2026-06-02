"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Event = {
  id: number
  title: string
  description?: string
  event_date?: string
  event_type: string
  person_id: number
}

const typeColors: Record<string, string> = { birth: '#4a9e6a', death: '#7a7a7a', marriage: '#c9a227', general: '#5a8ab0', education: '#b07a3a' }
const typeLabels: Record<string, string> = { birth: 'לידה', death: 'פטירה', marriage: 'נישואים', general: 'כללי', education: 'השכלה' }
const typeIcons: Record<string, string> = { birth: '🌱', death: '🕯️', marriage: '💍', general: '📌', education: '📚' }

const historicalEvents: Record<string, string> = {
  '1914': '🌍 מלחמת העולם הראשונה',
  '1939': '🌍 מלחמת העולם השנייה',
  '1945': '✌️ סיום המלחמה',
  '1948': '🇮🇱 הקמת מדינת ישראל',
  '1967': '⚔️ מלחמת ששת הימים',
  '1973': '🪖 מלחמת יום כיפור',
}

export default function PersonTimelinePage() {
  const { locale } = useParams() as { locale: string }
  const { id } = useParams()
  const [events, setEvents] = useState<Event[]>([])
  const [person, setPerson] = useState<{ first_name: string; last_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
  const router = useRouter()
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).single()
      const role = roleData?.role
      setCanEdit(role === 'admin' || role === 'editor')
      const { data: personData } = await supabase.from('people').select('first_name, last_name').eq('id', id).single()
      setPerson(personData)
      const { data } = await supabase.from('timeline_events').select('*').eq('person_id', id).order('event_date', { ascending: true })
      setEvents(data || [])
      setLoading(false)
    }
    init()
  }, [id])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.getAttribute('data-idx') || '0')
          setVisibleItems(prev => new Set([...prev, idx]))
        }
      })
    }, { threshold: 0.15 })

    itemRefs.current.forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [events])

  const grouped: Record<string, Event[]> = {}
  for (const e of events) {
    const year = e.event_date ? e.event_date.substring(0, 4) : 'ללא תאריך'
    if (!grouped[year]) grouped[year] = []
    grouped[year].push(e)
  }

  let globalIdx = 0

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={'/people/' + id} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ חזרה לפרופיל</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>ציר זמן אישי</span>
        {canEdit && (
          <a href={'/people/' + id + '/edit'} style={{ background: '#c9a227', color: '#0d0702', padding: '0.4rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>+ הוסף אירוע</a>
        )}
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
        {person && (
          <>
            <h1 style={{ fontSize: '1.8rem', color: '#f5d98b', marginBottom: '0.25rem' }}>
              {[person.first_name, person.last_name].filter(Boolean).join(" ")}
            </h1>
            <div style={{ width: '80px', height: '1px', background: '#c9a227', marginBottom: '2rem' }} />
          </>
        )}

        {loading && <p style={{ color: '#b89a5a', textAlign: 'center', padding: '3rem' }}>טוען...</p>}

        {!loading && events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#b89a5a' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <p>אין אירועים עדיין</p>
          </div>
        )}

        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([year, yearEvents]) => (
          <div key={year} style={{ marginBottom: '2rem' }}>
            {historicalEvents[year] && (
              <div style={{ background: 'rgba(201,162,39,0.07)', border: '1px dashed rgba(201,162,39,0.4)', borderRadius: '8px', padding: '0.45rem 0.9rem', fontSize: '0.75rem', color: '#c9a227', marginBottom: '0.6rem' }}>
                {historicalEvents[year]}
              </div>
            )}
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#c9a227', marginBottom: '1rem', borderBottom: '1px solid #3a2a10', paddingBottom: '0.5rem' }}>
              {year}
            </div>
            <div style={{ position: 'relative', paddingRight: '1.5rem', borderRight: '2px solid #3a2a10' }}>
              {yearEvents.map(event => {
                const idx = globalIdx++
                return (
                  <div
                    key={event.id}
                    data-idx={idx}
                    ref={el => { itemRefs.current[idx] = el }}
                    style={{
                      marginBottom: '1rem', position: 'relative',
                      opacity: visibleItems.has(idx) ? 1 : 0,
                      transform: visibleItems.has(idx) ? 'translateX(0)' : 'translateX(20px)',
                      transition: 'opacity 0.45s ease, transform 0.45s ease',
                    }}
                  >
                    <div style={{
                      width: '12px', height: '12px', borderRadius: '50%',
                      background: typeColors[event.event_type] || '#5a8ab0',
                      position: 'absolute', right: '-2.15rem', top: '0.8rem',
                      border: '2px solid #1c1008',
                      boxShadow: `0 0 8px ${typeColors[event.event_type] || '#5a8ab0'}55`,
                    }} />
                    <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '10px', padding: '0.9rem 1.1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{typeIcons[event.event_type] || '📌'}</span>
                          <span style={{ fontWeight: 'bold', color: '#f5d98b' }}>{event.title}</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: typeColors[event.event_type], flexShrink: 0 }}>
                          {typeLabels[event.event_type] || event.event_type}
                        </span>
                      </div>
                      {event.description && (
                        <div style={{ fontSize: '0.85rem', color: '#b89a5a', marginTop: '0.25rem' }}>{event.description}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
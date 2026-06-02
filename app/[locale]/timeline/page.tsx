'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useParams } from "next/navigation"
import { useEffect, useState, useRef } from 'react'
import { supabase, getSession } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Event = {
  id: number; title: string; description?: string
  event_date?: string; event_type: string; person_id: number
  person?: { id: number; first_name: string; last_name: string; photo_url?: string }
}
type Person = { id: number; first_name: string; last_name: string }

const TYPE_COLOR: Record<string, string>  = { birth:'#4a9e6a', death:'#7a7a7a', marriage:'#c9a227', general:'#5a8ab0', education:'#b07a3a', migration:'#8a4ab0' }
const TYPE_ICON:  Record<string, string>  = { birth:'🌱', death:'🕯️', marriage:'💍', general:'📌', education:'📚', migration:'✈️' }
const TYPE_LABEL: Record<string, string>  = { birth:'לידה', death:'פטירה', marriage:'נישואים', general:'כללי', education:'השכלה', migration:'הגירה' }

const HIST: Record<string, string> = {
  '1939': 'פרוץ מלחמת העולם השנייה',
  '1945': 'סוף מלחמת העולם השנייה',
  '1948': 'הקמת מדינת ישראל',
  '1967': 'מלחמת ששת הימים',
  '1973': 'מלחמת יום כיפור',
  '1991': 'מלחמת המפרץ הראשונה',
  '2001': 'פיגועי 11 בספטמבר',
}

function EventCard({ ev, animate }: { ev: Event; animate: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!animate || !ref.current) return
    const el = ref.current
    el.style.opacity = '0'
    el.style.transform = 'translateX(30px)'
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        el.style.transition = 'opacity .5s ease, transform .5s cubic-bezier(.34,1.2,.64,1)'
        el.style.opacity = '1'
        el.style.transform = 'none'
        observer.disconnect()
      }
    }, { threshold: 0.15 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [animate])

  const year = ev.event_date?.substring(0, 4)
  const color = TYPE_COLOR[ev.event_type] || '#5a8ab0'

  return (
    <div ref={ref} style={{ display:'flex', gap:'1rem', alignItems:'flex-start', marginBottom:'0.75rem' }}>
      {/* Icon bubble */}
      <div style={{ width:40, height:40, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, zIndex:1, border:'3px solid #0d0702', boxShadow:`0 0 0 2px ${color}55` }}>
        {TYPE_ICON[ev.event_type] || '📌'}
      </div>

      {/* Card */}
      <div style={{ flex:1, background:'#1e1108', border:`1px solid #3a2a10`, borderRadius:10, padding:'0.85rem 1rem', transition:'border-color .15s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#3a2a10')}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'0.4rem' }}>
          <div>
            <span style={{ fontWeight:'bold', color:'#f5d98b', fontSize:'0.92rem' }}>{ev.title}</span>
            <span style={{ marginRight:8, fontSize:'0.68rem', background:`${color}22`, color, padding:'1px 7px', borderRadius:10 }}>
              {TYPE_LABEL[ev.event_type]}
            </span>
          </div>
          {ev.event_date && <span style={{ fontSize:'0.75rem', color:'#7a5a2a' }}>{new Date(ev.event_date).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' })}</span>}
        </div>
        {ev.person && (
          <a href={`/people/${ev.person.id}`} style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, textDecoration:'none' }}>
            {ev.person.photo_url
              ? <img src={ev.person.photo_url} style={{ width:22, height:22, borderRadius:'50%', objectFit:'cover', border:'1px solid #c9a22766' }} />
              : <span style={{ fontSize:14 }}>👤</span>
            }
            <span style={{ fontSize:'0.78rem', color:'#c9a227' }}>{ev.person.first_name} {ev.person.last_name}</span>
          </a>
        )}
        {ev.description && <div style={{ fontSize:'0.83rem', color:'#c8b08a', marginTop:6, lineHeight:1.6 }}>{ev.description}</div>}
      </div>
    </div>
  )
}

export default function TimelinePage() {
  const { locale } = useParams() as { locale: string }
  const [events, setEvents]   = useState<Event[]>([])
  const [people, setPeople]   = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterPerson, setFilterPerson] = useState('')
  const [filterType, setFilterType]     = useState('')
  const [filterFrom, setFilterFrom]     = useState('')
  const [filterTo, setFilterTo]         = useState('')
  const [viewMode, setViewMode]         = useState<'single' | 'dual'>('single')
  const [animate, setAnimate]           = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const session = await getSession()
      if (!session) { router.push('/login'); return }
      const [{ data: evs }, { data: ppl }] = await Promise.all([
        supabase.from('timeline_events').select('*, person:person_id(id, first_name, last_name, photo_url)').order('event_date', { ascending: true }),
        supabase.from('people').select('id, first_name, last_name').order('last_name'),
      ])
      setEvents(evs || [])
      setPeople(ppl || [])
      setLoading(false)
    }
    init()
  }, [router])

  const filtered = events.filter(e => {
    const name = e.person ? `${e.person.first_name} ${e.person.last_name}` : ''
    if (search && !e.title.includes(search) && !name.includes(search) && !(e.description||'').includes(search)) return false
    if (filterPerson && String(e.person_id) !== filterPerson) return false
    if (filterType && e.event_type !== filterType) return false
    if (filterFrom && e.event_date && e.event_date < filterFrom + '-01-01') return false
    if (filterTo   && e.event_date && e.event_date > filterTo   + '-12-31') return false
    return true
  })

  // Group by year
  const byYear: Record<string, Event[]> = {}
  for (const e of filtered) {
    const y = e.event_date?.substring(0, 4) || 'ללא תאריך'
    if (!byYear[y]) byYear[y] = []
    byYear[y].push(e)
  }

  // For dual mode: split personal vs family
  const personalEvents = filtered.filter(e => e.person_id && filterPerson && String(e.person_id) === filterPerson)
  const familyEvents   = filtered.filter(e => !filterPerson || String(e.person_id) !== filterPerson)

  return (
    <main dir="rtl" style={{ minHeight:'100vh', background:'#0d0702', color:'#f5e6c8', fontFamily:'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ padding:'1.5rem 1.5rem 0', maxWidth:900, margin:'0 auto' }}>
        <h1 style={{ fontSize:'1.6rem', color:'#f5d98b', margin:'0 0 4px' }}>📅 ציר זמן המשפחה</h1>
        <div style={{ width:60, height:2, background:'#c9a227', marginBottom:'1.25rem' }} />

        {/* Filters */}
        <div style={{ background:'#1e1108', border:'1px solid #3a2a10', borderRadius:12, padding:'1rem', marginBottom:'1.5rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 חפש אירוע..."
              style={{ flex:1, minWidth:160, background:'#150a01', border:'1px solid #3a2a10', borderRadius:7, padding:'0.5rem 0.8rem', color:'#f5e6c8', fontSize:'0.88rem', direction:'rtl' }} />

            <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)}
              style={{ flex:1, minWidth:140, background:'#150a01', border:'1px solid #3a2a10', borderRadius:7, padding:'0.5rem 0.8rem', color:'#f5e6c8', fontSize:'0.88rem' }}>
              <option value="">כל האנשים</option>
              {people.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}
            </select>

            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ background:'#150a01', border:'1px solid #3a2a10', borderRadius:7, padding:'0.5rem 0.8rem', color:'#f5e6c8', fontSize:'0.88rem' }}>
              <option value="">כל הסוגים</option>
              {Object.entries(TYPE_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.78rem', color:'#5a3a1a' }}>תקופה:</span>
            <input type="number" placeholder="משנה" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              style={{ width:90, background:'#150a01', border:'1px solid #3a2a10', borderRadius:7, padding:'0.45rem 0.6rem', color:'#f5e6c8', fontSize:'0.85rem' }} />
            <span style={{ color:'#3a2a10' }}>–</span>
            <input type="number" placeholder="עד שנה" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              style={{ width:90, background:'#150a01', border:'1px solid #3a2a10', borderRadius:7, padding:'0.45rem 0.6rem', color:'#f5e6c8', fontSize:'0.85rem' }} />

            <div style={{ marginRight:'auto', display:'flex', gap:'0.4rem' }}>
              {(['single','dual'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  style={{ background: viewMode===m ? '#c9a22722' : 'transparent', border:`1px solid ${viewMode===m ? '#c9a227' : '#3a2a10'}`, color: viewMode===m ? '#c9a227' : '#5a3a1a', borderRadius:7, padding:'0.35rem 0.75rem', cursor:'pointer', fontSize:'0.78rem' }}>
                  {m==='single' ? '☰ רגיל' : '⚡ כפול'}
                </button>
              ))}
              <button onClick={() => setAnimate(a => !a)}
                style={{ background: animate ? '#c9a22722' : 'transparent', border:`1px solid ${animate ? '#c9a227' : '#3a2a10'}`, color: animate ? '#c9a227' : '#5a3a1a', borderRadius:7, padding:'0.35rem 0.75rem', cursor:'pointer', fontSize:'0.78rem' }}>
                ✨ אנימציה
              </button>
            </div>

            <span style={{ fontSize:'0.75rem', color:'#3a2a10' }}>{filtered.length} אירועים</span>
          </div>
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:'4rem', color:'#b89a5a' }}>טוען...</div>}

      {/* Single mode */}
      {!loading && viewMode === 'single' && (
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 1.5rem 4rem', position:'relative' }}>
          {/* Vertical line */}
          <div style={{ position:'absolute', top:0, bottom:0, right:52, width:2, background:'#2a1a08', zIndex:0 }} />

          {Object.entries(byYear).sort((a,b) => a[0].localeCompare(b[0])).map(([year, evs]) => (
            <div key={year}>
              {/* Year label */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'1.5rem 0 0.75rem' }}>
                <div style={{ background:'#c9a227', color:'#0d0702', fontWeight:'bold', fontSize:'0.82rem', padding:'2px 12px', borderRadius:20, zIndex:1, flexShrink:0 }}>{year}</div>
                {HIST[year] && <div style={{ fontSize:'0.72rem', color:'#5a3a1a', background:'#1a1208', border:'1px solid #2a1a08', borderRadius:20, padding:'2px 10px' }}>📰 {HIST[year]}</div>}
              </div>
              {evs.map(e => <EventCard key={e.id} ev={e} animate={animate} />)}
            </div>
          ))}

          {filtered.length === 0 && <div style={{ textAlign:'center', padding:'4rem', color:'#b89a5a' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:12 }}>📅</div>
            <p>אין אירועים מתאימים לסינון</p>
          </div>}
        </div>
      )}

      {/* Dual mode */}
      {!loading && viewMode === 'dual' && (
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 1.5rem 4rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem' }}>
            {/* Personal */}
            <div>
              <div style={{ fontSize:'0.75rem', color:'#c9a227', fontWeight:'bold', letterSpacing:'0.05em', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:'1px solid #2a1a08' }}>
                👤 {filterPerson ? people.find(p => String(p.id)===filterPerson)?.first_name || 'אישי' : 'בחר אדם מהסינון'}
              </div>
              {personalEvents.length === 0
                ? <div style={{ color:'#3a2a10', fontSize:'0.85rem', textAlign:'center', padding:'2rem' }}>בחר אדם בסינון למעלה</div>
                : personalEvents.map(e => <EventCard key={e.id} ev={e} animate={animate} />)
              }
            </div>
            {/* Family */}
            <div>
              <div style={{ fontSize:'0.75rem', color:'#c9a227', fontWeight:'bold', letterSpacing:'0.05em', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:'1px solid #2a1a08' }}>
                👨‍👩‍👧 כלל המשפחה
              </div>
              {familyEvents.map(e => <EventCard key={e.id} ev={e} animate={animate} />)}
            </div>
          </div>
        </div>
      )}
    <FloatingEditButton editPath="timeline-edit" />
    </main>
  )
}
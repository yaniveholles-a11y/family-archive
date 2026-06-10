'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useParams } from "next/navigation"
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Person = {
  id: number; first_name: string; last_name: string
  birth_place?: string; birth_date?: string; death_date?: string; bio?: string
}

const archives = [
  { name: 'יד ושם', url: 'https://www.yadvashem.org/he/names.html', desc: 'מאגר שמות קורבנות השואה', icon: '✡️', color: '#c9a227' },
  { name: 'ארכיון אד-פרוגנס', url: 'https://www.arolsen-archives.org', desc: 'ארכיון גרמניה — רשימות ממחנות', icon: '📁', color: '#9a6ab0' },
  { name: 'JewishGen', url: 'https://www.jewishgen.org', desc: 'גנאלוגיה יהודית עולמית', icon: '🌍', color: '#4a9e6a' },
  { name: 'Family Search', url: 'https://www.familysearch.org', desc: 'רשומות היסטוריות בינלאומיות', icon: '🔍', color: '#5a8ab0' },
  { name: 'Ancestry', url: 'https://www.ancestry.com', desc: 'עצי משפחה ורשומות היסטוריות', icon: '🌳', color: '#4ab09a' },
]

export default function HolocaustPage() {
  const { locale } = useParams() as { locale: string }
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [searching, setSearching] = useState<number | null>(null)
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

  function searchYadVashem(person: Person) {
    setSearching(person.id)
    window.open(`https://www.yadvashem.org/he/names.html#|language=he&s_id=&s_lastName=${encodeURIComponent(person.last_name)}&s_firstName=${encodeURIComponent(person.first_name)}`, '_blank')
    setSearching(null)
  }

  function searchJewishGen(person: Person) {
    window.open(`https://www.jewishgen.org/databases/GivenName/Given.php?Given1=${encodeURIComponent(person.first_name)}&Soundex=yes`, '_blank')
  }

  const filtered = filter
    ? people.filter(p =>
        (p.first_name + ' ' + p.last_name).includes(filter) ||
        (p.birth_place || '').includes(filter)
      )
    : people

  return (
    <main dir="rtl" style={{ minHeight:'100vh', background:'var(--c-ink, #080606)', color:'var(--c-text, #f0e8d0)', fontFamily:'"Heebo", Arial, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'rgba(8,6,6,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '0 2rem',
      }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'1rem 0 0.75rem', borderBottom:'1px solid rgba(201,162,39,0.06)' }}>
            <a href={`/${locale}/dashboard`} style={{ color:'#3a2a10', fontSize:'0.82rem', textDecoration:'none', transition:'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← לוח בקרה</a>
            <span style={{ color:'#1a0f05' }}>·</span>
            <span style={{ color:'#f5d98b', fontSize:'0.85rem' }}>✡️ זכרון ושורשים</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        padding: '3.5rem 2rem', textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{
          position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(ellipse, rgba(201,162,39,0.04) 0%, transparent 70%)',
          pointerEvents:'none',
        }} />
        <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ type:'spring', damping:15 }}
          style={{ fontSize:'3rem', marginBottom:'1rem' }}>🕯️</motion.div>
        <motion.h1
          initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          style={{ fontFamily:'"Playfair Display",serif', fontSize:'2.2rem', color:'#f5d98b', marginBottom:'0.5rem' }}
        >זכרון ושורשים</motion.h1>
        <motion.div
          initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.3 }}
          style={{ width:80, height:1, background:'linear-gradient(90deg,transparent,#c9a227,transparent)', margin:'0 auto 1rem' }}
        />
        <motion.p
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
          style={{ color:'#5a3a1a', fontSize:'0.9rem', maxWidth:500, margin:'0 auto' }}
        >
          תיעוד בני משפחה, חיפוש בארכיונים וקישור למאגרי מידע היסטוריים
        </motion.p>
      </div>

      <div style={{ maxWidth:980, margin:'0 auto', padding:'0 2rem 4rem' }}>

        {/* Archives */}
        <div style={{ marginBottom:'2.5rem' }}>
          <div style={{ fontSize:'0.7rem', color:'#3a2a10', letterSpacing:'0.1em', marginBottom:'1rem' }}>✦ ארכיונים לחיפוש</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(175px, 1fr))', gap:'0.75rem' }}>
            {archives.map((a, i) => (
              <motion.a
                key={a.name}
                href={a.url}
                target="_blank" rel="noopener noreferrer"
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: i*0.07 }}
                whileHover={{ y:-3 }}
                style={{
                  background:'rgba(26,15,5,0.7)',
                  border:'1px solid rgba(201,162,39,0.08)',
                  borderRadius:12, padding:'1rem',
                  textDecoration:'none', color:'inherit',
                  display:'flex', flexDirection:'column', gap:'0.4rem',
                  transition:'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = a.color + '55')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.08)')}
              >
                <span style={{ fontSize:'1.5rem' }}>{a.icon}</span>
                <div style={{ fontWeight:600, color: a.color, fontSize:'0.88rem' }}>{a.name}</div>
                <div style={{ fontSize:'0.73rem', color:'#5a3a1a', lineHeight:1.5 }}>{a.desc}</div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* People search */}
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ fontSize:'0.7rem', color:'#3a2a10', letterSpacing:'0.1em', marginBottom:'1rem' }}>
            ✦ חיפוש בני משפחה בארכיונים
          </div>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', right:'0.9rem', top:'50%', transform:'translateY(-50%)', color:'#3a2a10', pointerEvents:'none' }}>🔍</span>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="סנן לפי שם או מקום לידה..."
              style={{
                width:'100%', background:'rgba(26,15,5,0.7)',
                border:'1px solid rgba(201,162,39,0.12)',
                borderRadius:10, padding:'0.7rem 2.2rem 0.7rem 1rem',
                color:'#f0e8d0', fontSize:'0.92rem',
                boxSizing:'border-box', outline:'none', direction:'rtl',
                fontFamily:'"Heebo",Arial,sans-serif', transition:'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.12)')}
            />
          </div>
        </div>

        {loading && (
          <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
            <motion.div animate={{ rotate:360 }} transition={{ duration:2.5, repeat:Infinity, ease:'linear' }}
              style={{ fontSize:32, color:'#c9a227' }}>✦</motion.div>
          </div>
        )}

        {/* People list */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {filtered.map((person, i) => (
            <motion.div
              key={person.id}
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: Math.min(i*0.03, 0.4) }}
              style={{
                background:'rgba(26,15,5,0.7)',
                border:'1px solid rgba(201,162,39,0.08)',
                borderRadius:12, overflow:'hidden',
                transition:'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.08)')}
            >
              <div
                onClick={() => setExpandedPerson(expandedPerson === person.id ? null : person.id)}
                style={{ padding:'0.9rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{
                    width:36, height:36, borderRadius:'50%',
                    background:'rgba(201,162,39,0.1)',
                    border:'1px solid rgba(201,162,39,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'1rem', flexShrink:0,
                  }}>👤</div>
                  <div>
                    <div style={{ fontWeight:600, color:'#f5d98b', fontSize:'0.95rem' }}>
                      {[person.first_name, person.last_name].filter(Boolean).join(' ')}
                    </div>
                    <div style={{ fontSize:'0.73rem', color:'#3a2a10' }}>
                      {[
                        person.birth_date && `נולד: ${person.birth_date.substring(0,4)}`,
                        person.birth_place && `מקום: ${person.birth_place}`,
                        person.death_date && `נפטר: ${person.death_date.substring(0,4)}`,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                <motion.span
                  animate={{ rotate: expandedPerson === person.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color:'#c9a227', fontSize:'0.8rem' }}
                >▼</motion.span>
              </div>

              <AnimatePresence>
                {expandedPerson === person.id && (
                  <motion.div
                    initial={{ height:0, opacity:0 }}
                    animate={{ height:'auto', opacity:1 }}
                    exit={{ height:0, opacity:0 }}
                    transition={{ duration:0.3 }}
                    style={{ overflow:'hidden' }}
                  >
                    <div style={{ padding:'0 1.25rem 1.25rem', borderTop:'1px solid rgba(201,162,39,0.08)' }}>
                      <div style={{ paddingTop:'1rem', display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                        <a href={`/${locale}/people/${person.id}`} style={{
                          background:'rgba(201,162,39,0.1)', border:'1px solid rgba(201,162,39,0.2)',
                          borderRadius:8, color:'#c9a227', padding:'0.4rem 0.9rem',
                          textDecoration:'none', fontSize:'0.82rem',
                        }}>👤 פרופיל</a>
                        <button
                          onClick={() => searchYadVashem(person)}
                          disabled={searching === person.id}
                          style={{
                            background:'rgba(74,158,106,0.1)', border:'1px solid rgba(74,158,106,0.25)',
                            borderRadius:8, color:'#4a9e6a', padding:'0.4rem 0.9rem',
                            cursor:'pointer', fontSize:'0.82rem', fontFamily:'"Heebo",Arial,sans-serif',
                          }}
                        >{searching === person.id ? '⏳ מחפש...' : '✡️ חפש ביד ושם'}</button>
                        <button
                          onClick={() => searchJewishGen(person)}
                          style={{
                            background:'rgba(90,138,176,0.1)', border:'1px solid rgba(90,138,176,0.25)',
                            borderRadius:8, color:'#5a8ab0', padding:'0.4rem 0.9rem',
                            cursor:'pointer', fontSize:'0.82rem', fontFamily:'"Heebo",Arial,sans-serif',
                          }}
                        >🌍 JewishGen</button>
                        <a
                          href={`https://www.familysearch.org/search/record/results?q.givenName=${encodeURIComponent(person.first_name)}&q.surname=${encodeURIComponent(person.last_name)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{
                            background:'rgba(184,154,90,0.1)', border:'1px solid rgba(184,154,90,0.2)',
                            borderRadius:8, color:'#b89a5a', padding:'0.4rem 0.9rem',
                            textDecoration:'none', fontSize:'0.82rem',
                          }}
                        >🔍 Family Search</a>
                      </div>
                      {person.bio && (
                        <div style={{ marginTop:'0.75rem', fontSize:'0.82rem', color:'#5a3a1a', lineHeight:1.6 }}>
                          {person.bio}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      <FloatingEditButton editPath="holocaust-edit" />
    </main>
  )
}

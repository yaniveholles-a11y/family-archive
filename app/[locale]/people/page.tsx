'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, getSession } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'

type Person = {
  id: number; first_name: string; last_name: string
  birth_date?: string; death_date?: string; birth_place?: string
  photo_url?: string; family_id?: number; gender?: string; bio?: string; profession?: string
}
type Family = { id: number; name: string }

function PersonCard({ person, canEdit }: { person: Person; canEdit: boolean }) {
  const name  = `${[person.first_name, person.last_name].filter(Boolean).join(' ')}`
  const born  = person.birth_date?.substring(0, 4)
  const died  = person.death_date?.substring(0, 4)
  const age   = born && !died ? new Date().getFullYear() - parseInt(born) : null
  const years = [born, died].filter(Boolean).join(' – ')
  const genderColor = person.gender === 'male' ? '#378ADD' : person.gender === 'female' ? '#D4537E' : '#c9a227'

  return (
    <div onClick={() => window.location.href = `/people/${person.id}`}
      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: '#1e1108', border: '1px solid #2a1808', borderRadius: 14, overflow: 'hidden', transition: 'transform .18s, border-color .18s, box-shadow .18s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = genderColor; e.currentTarget.style.boxShadow = `0 8px 24px #00000066` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#2a1808'; e.currentTarget.style.boxShadow = 'none' }}>

      {/* Photo area */}
      <div style={{ height: 160, background: `linear-gradient(180deg, ${genderColor}22, #0d0702)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {person.photo_url
          ? <img src={person.photo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }} />
          : <div style={{ fontSize: 56, opacity: 0.4 }}>{person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤'}</div>
        }
        {/* Gender indicator */}
        <div style={{ position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: '50%', background: genderColor, boxShadow: `0 0 6px ${genderColor}` }} />
        {/* Living indicator */}
        {!died && born && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: '#4a9e6a22', border: '1px solid #4a9e6a66', borderRadius: 20, padding: '1px 8px', fontSize: '0.65rem', color: '#4a9e6a' }}>
            בחיים
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontFamily: 'Frank Ruhl Libre, serif', fontSize: '1.05rem', color: '#f5d98b', fontWeight: 'bold', lineHeight: 1.2 }}>{name}</div>
        {years && <div style={{ fontSize: '0.78rem', color: '#7a5a2a' }}>{years}{age ? ` · גיל ${age}` : ''}</div>}
        {person.birth_place && <div style={{ fontSize: '0.75rem', color: '#5a3a1a' }}>📍 {person.birth_place}</div>}
        {person.profession && <div style={{ fontSize: '0.72rem', color: '#b89a5a', marginTop: 2 }}>💼 {person.profession}</div>}
        {person.bio && <div style={{ fontSize: '0.72rem', color: '#3a2a10', lineHeight: 1.4, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{person.bio.replace(/<[^>]+>/g, '')}</div>}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a0f05', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: '#3a2a10' }}>צפה בפרופיל →</span>
        {canEdit && (
          <a href={`/people/${person.id}/edit`} onClick={e => e.stopPropagation()}
            style={{ fontSize: '0.7rem', color: '#5a3a1a', textDecoration: 'none', border: '1px solid #2a1808', borderRadius: 6, padding: '2px 7px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5a3a1a')}>
            ✏️
          </a>
        )}
      </div>
    </div>
  )
}

export default function PeoplePage() {
  const { locale } = useParams() as { locale: string }
  const [people, setPeople]         = useState<Person[]>([])
  const [families, setFamilies]     = useState<Family[]>([])
  const [loading, setLoading]       = useState(true)
  const [canEdit, setCanEdit]       = useState(false)
  const [search, setSearch]         = useState('')
  const [filterFamily, setFilterFamily] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterAlive, setFilterAlive]   = useState('')
  const [sortBy, setSortBy]         = useState<'name' | 'birth' | 'family'>('name')
  const [view, setView]             = useState<'grid' | 'list'>('grid')
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const session = await getSession()
      if (!session) { router.push('/login'); return }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle()
      setCanEdit(roleData?.role === 'admin' || roleData?.role === 'editor')
      const [{ data: ppl }, { data: fams }] = await Promise.all([
        supabase.from('people').select('id,first_name,last_name,birth_date,death_date,birth_place,photo_url,family_id,gender,bio,profession').order('last_name'),
        supabase.from('families').select('id,name').order('name'),
      ])
      setPeople(ppl || [])
      setFamilies(fams || [])
      setLoading(false)
    }
    init()
    // Focus search on Ctrl+F
    const h = (e: KeyboardEvent) => { if (e.ctrlKey && e.key === 'f') { e.preventDefault(); searchRef.current?.focus() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [router])

  const filtered = people
    .filter(p => {
      const name = `${[p.first_name, p.last_name].filter(Boolean).join(' ')} ${p.birth_place || ''} ${p.profession || ''}`.toLowerCase()
      if (search && !name.includes(search.toLowerCase())) return false
      if (filterFamily && String(p.family_id) !== filterFamily) return false
      if (filterGender && p.gender !== filterGender) return false
      if (filterAlive === 'alive' && p.death_date) return false
      if (filterAlive === 'deceased' && !p.death_date) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'birth') return (a.birth_date || '9999') > (b.birth_date || '9999') ? 1 : -1
      if (sortBy === 'family') return (a.family_id || 0) - (b.family_id || 0)
      return `${a.last_name}${a.first_name}` > `${b.last_name}${b.first_name}` ? 1 : -1
    })

  const stats = {
    total: people.length,
    alive: people.filter(p => !p.death_date).length,
    withPhoto: people.filter(p => p.photo_url).length,
    males: people.filter(p => p.gender === 'male').length,
    females: people.filter(p => p.gender === 'female').length,
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', color: '#f5e6c8', fontFamily: 'Heebo, Arial, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Frank Ruhl Libre, serif', fontSize: '2rem', color: '#f5d98b', margin: '0 0 4px' }}>👥 בני המשפחה</h1>
            <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg,#c9a227,transparent)' }} />
          </div>
          {canEdit && (
            <a href={`/${locale}/people/new`}
              style={{ background: 'linear-gradient(135deg,#d4af37,#c9a227)', color: '#0d0702', border: 'none', borderRadius: 10, padding: '0.6rem 1.4rem', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 12px rgba(201,162,39,.3)' }}>
              + הוסף אדם
            </a>
          )}
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {[
            { label: 'סה"כ', val: stats.total, icon: '👥' },
            { label: 'בחיים', val: stats.alive, icon: '💚' },
            { label: 'עם תמונה', val: stats.withPhoto, icon: '📸' },
            { label: 'גברים', val: stats.males, icon: '♂' },
            { label: 'נשים', val: stats.females, icon: '♀' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1e1108', border: '1px solid #2a1808', borderRadius: 10, padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f5d98b', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.68rem', color: '#5a3a1a' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#1e1108', border: '1px solid #2a1808', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 חפש שם, מקום, מקצוע..."
            style={{ flex: 1, minWidth: 180, background: '#0d0702', border: '1px solid #3a2a10', borderRadius: 8, padding: '0.5rem 0.8rem', color: '#f5e6c8', fontSize: '0.88rem', direction: 'rtl' }} />

          <select value={filterFamily} onChange={e => setFilterFamily(e.target.value)}
            style={{ background: '#0d0702', border: '1px solid #2a1808', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#f5e6c8', fontSize: '0.85rem' }}>
            <option value="">כל המשפחות</option>
            {families.map(f => <option key={f.id} value={f.id}>משפחת {f.name}</option>)}
          </select>

          <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
            style={{ background: '#0d0702', border: '1px solid #2a1808', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#f5e6c8', fontSize: '0.85rem' }}>
            <option value="">כל המגדרים</option>
            <option value="male">♂ גברים</option>
            <option value="female">♀ נשים</option>
          </select>

          <select value={filterAlive} onChange={e => setFilterAlive(e.target.value)}
            style={{ background: '#0d0702', border: '1px solid #2a1808', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#f5e6c8', fontSize: '0.85rem' }}>
            <option value="">כולם</option>
            <option value="alive">בחיים</option>
            <option value="deceased">נפטרו</option>
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            style={{ background: '#0d0702', border: '1px solid #2a1808', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#f5e6c8', fontSize: '0.85rem' }}>
            <option value="name">מיון: שם</option>
            <option value="birth">מיון: לידה</option>
            <option value="family">מיון: משפחה</option>
          </select>

          <div style={{ display: 'flex', background: '#0d0702', borderRadius: 8, border: '1px solid #2a1808', overflow: 'hidden' }}>
            {(['grid','list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ background: view===v ? '#c9a22722' : 'transparent', color: view===v ? '#c9a227' : '#5a3a1a', border: 'none', padding: '0.45rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', borderRight: '1px solid #2a1808' }}>
                {v === 'grid' ? '⊞' : '≡'}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.75rem', color: '#3a2a10' }}>{filtered.length} אנשים</span>
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
            {Array.from({length:8}).map((_,i) => (
              <div key={i} style={{ height:280, background:'#1e1108', borderRadius:14, border:'1px solid #2a1808', animation:'pulse 1.5s ease-in-out infinite', animationDelay:`${i*0.1}s` }} />
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.7}}`}</style>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'5rem', color:'#5a3a1a' }}>
            <div style={{ fontSize:'3rem', marginBottom:12 }}>👥</div>
            <p>{search ? 'לא נמצאו תוצאות לחיפוש' : 'אין אנשים במאגר עדיין'}</p>
            {canEdit && !search && <a href={`/${locale}/people/new`} style={{ display:'inline-block', marginTop:'1rem', background:'#c9a227', color:'#0d0702', padding:'0.6rem 1.4rem', borderRadius:8, textDecoration:'none', fontWeight:'bold' }}>+ הוסף אדם ראשון</a>}
          </div>
        )}

        {/* Grid view */}
        {!loading && filtered.length > 0 && view === 'grid' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem' }}>
            {filtered.map(p => <PersonCard key={p.id} person={p} canEdit={canEdit} />)}
          </div>
        )}

        {/* List view */}
        {!loading && filtered.length > 0 && view === 'list' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {filtered.map(p => {
              const years = [p.birth_date?.substring(0,4), p.death_date?.substring(0,4)].filter(Boolean).join(' – ')
              const genderColor = p.gender==='male'?'#378ADD':p.gender==='female'?'#D4537E':'#c9a227'
              return (
                <a key={p.id} href={`/people/${p.id}`}
                  style={{ display:'flex', alignItems:'center', gap:'1rem', background:'#1e1108', border:'1px solid #2a1808', borderRadius:12, padding:'0.75rem 1rem', textDecoration:'none', transition:'border-color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = genderColor)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a1808')}>
                  {p.photo_url
                    ? <img src={p.photo_url} style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover', border:`2px solid ${genderColor}`, flexShrink:0 }} />
                    : <div style={{ width:48, height:48, borderRadius:'50%', background:`${genderColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, border:`2px solid ${genderColor}44` }}>{p.gender==='male'?'👨':p.gender==='female'?'👩':'👤'}</div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'Frank Ruhl Libre, serif', fontSize:'1rem', color:'#f5d98b', fontWeight:'bold' }}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</div>
                    <div style={{ fontSize:'0.78rem', color:'#5a3a1a' }}>{[years, p.birth_place, p.profession].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'#3a2a10', flexShrink:0 }}>פרופיל →</div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
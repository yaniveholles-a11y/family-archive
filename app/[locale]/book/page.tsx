'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useEffect, useState, useRef } from 'react'
import { supabase, getSession } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Person = {
  id: number; first_name: string; last_name: string
  birth_date?: string; death_date?: string; birth_place?: string
  death_place?: string; photo_url?: string; bio?: string; family_id?: number
}
type Family = { id: number; name: string; origin_country?: string }

function formatDate(d?: string) {
  if (!d) return null
  try { return new Date(d).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' }) } catch { return d }
}

// ── Page component ─────────────────────────────────────────────────────────────
function BookPage({ children, pageNum }: { children: React.ReactNode; pageNum: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    el.style.opacity = '0'; el.style.transform = 'translateY(20px)'
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        el.style.transition = 'opacity .6s ease, transform .6s ease'
        el.style.opacity = '1'; el.style.transform = 'none'
        io.disconnect()
      }
    }, { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      background:'#1a0e05',
      border:'1px solid #3a2a10',
      borderRadius:14,
      padding:'2.5rem 2rem',
      marginBottom:'2rem',
      position:'relative',
      boxShadow:'0 4px 24px #00000055',
      minHeight:320,
    }}>
      {/* Page corner decoration */}
      <div style={{ position:'absolute', top:0, left:0, width:0, height:0, borderStyle:'solid', borderWidth:'32px 32px 0 0', borderColor:'#c9a22722 transparent transparent transparent', borderRadius:'14px 0 0 0' }} />
      <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', fontSize:'0.7rem', color:'#3a2a10' }}>{pageNum}</div>
      {children}
    </div>
  )
}

// ── Person chapter ──────────────────────────────────────────────────────────────
function PersonChapter({ person, pageNum }: { person: Person; pageNum: number }) {
  return (
    <BookPage pageNum={pageNum}>
      <div style={{ display:'flex', gap:'1.5rem', alignItems:'flex-start', marginBottom:'1.25rem' }}>
        {person.photo_url
          ? <img src={person.photo_url} style={{ width:90, height:90, borderRadius:12, objectFit:'cover', border:'2px solid #c9a22766', flexShrink:0 }} />
          : <div style={{ width:90, height:90, borderRadius:12, background:'#2a1a08', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, flexShrink:0 }}>👤</div>
        }
        <div>
          <h2 style={{ color:'#f5d98b', fontSize:'1.4rem', margin:'0 0 6px' }}>{[person.first_name, person.last_name].filter(Boolean).join(" ")}</h2>
          {person.birth_date && <div style={{ color:'#b89a5a', fontSize:'0.85rem' }}>🌱 {formatDate(person.birth_date)}{person.birth_place ? ` — ${person.birth_place}` : ''}</div>}
          {person.death_date && <div style={{ color:'#7a7a7a', fontSize:'0.85rem', marginTop:3 }}>🕯️ {formatDate(person.death_date)}{person.death_place ? ` — ${person.death_place}` : ''}</div>}
        </div>
      </div>
      {/* Decorative divider */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
        <div style={{ flex:1, height:1, background:'linear-gradient(to left, #c9a227, transparent)' }} />
        <span style={{ color:'#c9a227', fontSize:16 }}>✦</span>
        <div style={{ flex:1, height:1, background:'linear-gradient(to right, #c9a227, transparent)' }} />
      </div>
      {person.bio
        ? <p style={{ color:'#d4c0a0', lineHeight:2, fontSize:'0.95rem', textAlign:'justify', direction:'rtl' }}>{person.bio}</p>
        : <p style={{ color:'#3a2a10', fontSize:'0.85rem', fontStyle:'italic', textAlign:'center', marginTop:'1.5rem' }}>— אין סיפור חיים עדיין —</p>
      }
      <a href={`/people/${person.id}`} style={{ display:'inline-block', marginTop:'1.25rem', color:'#c9a227', textDecoration:'none', fontSize:'0.82rem', border:'1px solid #c9a22766', borderRadius:20, padding:'3px 12px' }}>
        פרופיל מלא ←
      </a>
    </BookPage>
  )
}

// ── Family cover page ───────────────────────────────────────────────────────────
function FamilyCover({ family, count, pageNum }: { family: Family; count: number; pageNum: number }) {
  return (
    <BookPage pageNum={pageNum}>
      <div style={{ textAlign:'center', padding:'2rem 0' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>📖</div>
        <h2 style={{ fontSize:'2rem', color:'#c9a227', marginBottom:8 }}>משפחת {family.name}</h2>
        {family.origin_country && <div style={{ color:'#b89a5a', fontSize:'0.9rem', marginBottom:8 }}>מוצא: {family.origin_country}</div>}
        <div style={{ color:'#5a3a1a', fontSize:'0.85rem' }}>{count} בני משפחה</div>
        <div style={{ marginTop:'1.5rem', display:'flex', alignItems:'center', gap:'0.75rem', justifyContent:'center' }}>
          <div style={{ flex:1, height:1, background:'linear-gradient(to left, #c9a22766, transparent)', maxWidth:120 }} />
          <span style={{ color:'#c9a22766', fontSize:20 }}>✦</span>
          <div style={{ flex:1, height:1, background:'linear-gradient(to right, #c9a22766, transparent)', maxWidth:120 }} />
        </div>
      </div>
    </BookPage>
  )
}

// ── PDF export ──────────────────────────────────────────────────────────────────
async function exportPDF(families: Family[], people: Person[]) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = 20
  doc.setFont('helvetica')
  doc.setFontSize(24)
  doc.text('Family Archive Book', 105, y, { align: 'center' }); y += 20

  for (const fam of families) {
    const famPeople = people.filter(p => p.family_id === fam.id)
    if (famPeople.length === 0) continue

    doc.setFontSize(18)
    doc.setTextColor(201, 162, 39)
    if (y > 250) { doc.addPage(); y = 20 }
    doc.text(`Family: ${fam.name}`, 20, y); y += 12

    for (const p of famPeople) {
      if (y > 250) { doc.addPage(); y = 20 }
      doc.setFontSize(14); doc.setTextColor(245, 217, 139)
      doc.text(`${[p.first_name, p.last_name].filter(Boolean).join(' ')}`, 20, y); y += 8

      doc.setFontSize(10); doc.setTextColor(184, 154, 90)
      if (p.birth_date) { doc.text(`Born: ${p.birth_date}${p.birth_place ? ' · ' + p.birth_place : ''}`, 25, y); y += 6 }
      if (p.death_date) { doc.text(`Died: ${p.death_date}`, 25, y); y += 6 }

      if (p.bio) {
        doc.setFontSize(9); doc.setTextColor(212, 192, 160)
        const lines = doc.splitTextToSize(p.bio, 165)
        const take = lines.slice(0, 6)
        doc.text(take, 25, y); y += take.length * 5 + 4
      }
      y += 4
    }
    y += 8
  }

  doc.save('family-archive-book.pdf')
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function BookPage_() {
  const [families, setFamilies] = useState<Family[]>([])
  const [people, setPeople]     = useState<Person[]>([])
  const [loading, setLoading]   = useState(true)
  const [selFamily, setSelFamily] = useState<number | 'all'>('all')
  const [exporting, setExporting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const session = await getSession()
      if (!session) { router.push('/login'); return }
      const [{ data: fams }, { data: ppl }] = await Promise.all([
        supabase.from('families').select('*').order('name'),
        supabase.from('people').select('id,first_name,last_name,birth_date,death_date,birth_place,death_place,photo_url,bio,family_id').order('birth_date', { ascending: true }),
      ])
      setFamilies(fams || [])
      setPeople(ppl || [])
      setLoading(false)
    }
    init()
  }, [router])

  const shownFamilies = selFamily === 'all' ? families : families.filter(f => f.id === selFamily)
  let pageNum = 1

  async function handleExport() {
    setExporting(true)
    await exportPDF(shownFamilies, people)
    setExporting(false)
  }

  return (
    <main dir="rtl" style={{ minHeight:'100vh', background:'#0d0702', color:'#f5e6c8', fontFamily:'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ padding:'1.5rem 1.5rem 0', maxWidth:760, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
          <h1 style={{ fontSize:'1.6rem', color:'#f5d98b', margin:0 }}>📖 ספר המשפחה</h1>
          <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
            {families.length > 1 && (
              <select value={selFamily} onChange={e => setSelFamily(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ background:'#1e1108', border:'1px solid #3a2a10', borderRadius:7, padding:'0.4rem 0.7rem', color:'#f5e6c8', fontSize:'0.85rem' }}>
                <option value="all">כל המשפחות</option>
                {families.map(f => <option key={f.id} value={f.id}>משפחת {f.name}</option>)}
              </select>
            )}
            <button onClick={handleExport} disabled={exporting || loading}
              style={{ background:'#c9a227', color:'#0d0702', border:'none', borderRadius:8, padding:'0.45rem 1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem', opacity: exporting ? 0.7 : 1 }}>
              {exporting ? 'מייצא...' : '⬇ PDF'}
            </button>
          </div>
        </div>
        <div style={{ width:60, height:2, background:'#c9a227', marginBottom:'1.5rem' }} />
      </div>

      {loading && <div style={{ textAlign:'center', padding:'4rem', color:'#b89a5a' }}>טוען ספר...</div>}

      {/* Book content */}
      {!loading && (
        <div style={{ maxWidth:760, margin:'0 auto', padding:'0 1.5rem 4rem' }}>
          {shownFamilies.map(fam => {
            const famPeople = people.filter(p => p.family_id === fam.id)
            if (famPeople.length === 0) return null
            return (
              <div key={fam.id}>
                <FamilyCover family={fam} count={famPeople.length} pageNum={pageNum++} />
                {famPeople.map(p => <PersonChapter key={p.id} person={p} pageNum={pageNum++} />)}
              </div>
            )
          })}
          {shownFamilies.every(f => people.filter(p => p.family_id === f.id).length === 0) && (
            <div style={{ textAlign:'center', padding:'4rem', color:'#b89a5a' }}>
              <div style={{ fontSize:'3rem', marginBottom:12 }}>📖</div>
              <p>אין תוכן להצגה. הוסף אנשים עם סיפור חיים.</p>
            </div>
          )}
        </div>
      )}
    <FloatingEditButton editPath="book-edit" />
    </main>
  )
}
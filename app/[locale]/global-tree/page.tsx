'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { supabase } from '@/lib/supabase'

const FamilyTree = dynamic(() => import('@/components/FamilyTree'), { ssr: false })

export default function GlobalTreePage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [families, setFamilies] = useState<any[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLink, setShowLink] = useState(false)
  const [people, setPeople] = useState<any[]>([])
  const [linkForm, setLinkForm] = useState({ personA: '', personB: '', relType: 'spouse' })
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push(`/${locale}/login`); return }
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
        if (roleData?.role !== 'admin' && roleData?.role !== 'editor') {
          router.push(`/${locale}/dashboard`); return
        }
        setCanEdit(true)
        const { data: fams } = await supabase.from('families').select('id, name')
        setFamilies(fams || [])
        const { data: ppl } = await supabase.from('people').select('id, first_name, last_name, family_id')
        setPeople(ppl || [])
      } catch {}
      setLoading(false)
    }
    init()
  }, [locale])

  useEffect(() => {
    if (!loading && headerRef.current) {
      gsap.fromTo(headerRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
    }
  }, [loading])

  const linkPeople = async () => {
    if (!linkForm.personA || !linkForm.personB || linkForm.personA === linkForm.personB) {
      alert('בחר שני אנשים שונים'); return
    }
    const { error } = await supabase.from('tree_relationships').insert({
      person_a_id: parseInt(linkForm.personA),
      person_b_id: parseInt(linkForm.personB),
      relation_type: linkForm.relType,
    })
    if (error) { alert('שגיאה: ' + error.message); return }
    alert('✅ קשר נוצר! רענן את העמוד לראות את השינוי.')
    setShowLink(false)
    setLinkForm({ personA: '', personB: '', relType: 'spouse' })
  }

  const getName = (p: any) => [p.first_name, p.last_name].filter(Boolean).join(' ')
  const getFamilyName = (fId: number) => families.find(f => f.id === fId)?.name || ''

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0702', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 48, color: '#c9a227' }}>✦</motion.div>
    </div>
  )

  return (
    <main dir="rtl" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse at 50% 0%, #1a0f05, #0d0702)', overflow: 'hidden' }}>
      <div ref={headerRef} style={{
        background: 'linear-gradient(180deg, #0d0702ee, #0d0702cc)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #c9a22722', padding: '0.6rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0, fontFamily: '"Heebo", Arial, sans-serif', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push(`/${locale}/dashboard`)} style={{
            background: 'none', border: '1px solid #c9a22733', borderRadius: 8,
            padding: '6px 14px', color: '#c9a227', cursor: 'pointer', fontSize: 13,
          }}>→ חזרה</button>
          <span style={{ fontSize: 20, color: '#c9a227' }}>🌐</span>
          <span style={{ color: '#f5e6c8', fontWeight: 600, fontSize: 15, fontFamily: '"Playfair Display", serif' }}>
            עץ משפחה גלובלי — כל המשפחות
          </span>
          <span style={{ fontSize: 10, color: '#c9a227', border: '1px solid #c9a22744', borderRadius: 4, padding: '2px 8px' }}>עורכים בלבד</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {families.map(f => (
              <span key={f.id} style={{ fontSize: 11, color: '#8b6914', background: '#c9a22711', borderRadius: 6, padding: '3px 8px' }}>{f.name}</span>
            ))}
          </div>
          <button onClick={() => setShowLink(!showLink)} style={{
            background: showLink ? '#c9a22733' : 'linear-gradient(135deg, #c9a227, #a68520)',
            border: 'none', borderRadius: 8, padding: '6px 14px',
            color: showLink ? '#c9a227' : '#0d0702', cursor: 'pointer', fontSize: 12, fontWeight: 700,
          }}>🔗 חבר בין משפחות</button>
        </div>
      </div>

      {/* Link panel */}
      {showLink && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          style={{ background: '#1a0f05', borderBottom: '1px solid #c9a22722', padding: '12px 1.5rem', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#8b6914', fontWeight: 600 }}>חבר:</span>
          <select value={linkForm.personA} onChange={e => setLinkForm(f => ({...f, personA: e.target.value}))} style={sel}>
            <option value="">בחר אדם A...</option>
            {families.map(fam => (
              <optgroup key={fam.id} label={fam.name}>
                {people.filter(p => p.family_id === fam.id).map(p => (
                  <option key={p.id} value={p.id}>{getName(p)}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select value={linkForm.relType} onChange={e => setLinkForm(f => ({...f, relType: e.target.value}))} style={sel}>
            <option value="spouse">נשוי/אה ל</option>
            <option value="parent">הורה של</option>
            <option value="child">ילד/ה של</option>
            <option value="sibling">אח/אחות</option>
            <option value="cousin">בן/בת דוד</option>
            <option value="partner">בן/בת זוג</option>
          </select>
          <select value={linkForm.personB} onChange={e => setLinkForm(f => ({...f, personB: e.target.value}))} style={sel}>
            <option value="">בחר אדם B...</option>
            {families.map(fam => (
              <optgroup key={fam.id} label={fam.name}>
                {people.filter(p => p.family_id === fam.id).map(p => (
                  <option key={p.id} value={p.id}>{getName(p)}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button onClick={linkPeople} style={{
            background: '#c9a227', border: 'none', borderRadius: 8, padding: '6px 16px',
            color: '#0d0702', cursor: 'pointer', fontWeight: 700, fontSize: 12,
          }}>✓ חבר</button>
        </motion.div>
      )}

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <FamilyTree locale={locale} />
      </div>
    </main>
  )
}
const sel: React.CSSProperties = { background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 8, padding: '5px 8px', color: '#f5e6c8', fontSize: 12, cursor: 'pointer' }

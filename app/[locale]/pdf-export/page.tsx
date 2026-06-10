'use client'
import { useParams } from 'next/navigation'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Person = {
  id: number; first_name: string; last_name?: string
  birth_date?: string; death_date?: string; bio?: string; photo_url?: string
}

export default function PdfExportPage() {
  const { locale } = useParams() as { locale: string }
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const contentRef = useRef<HTMLDivElement>(null)

  async function loadPeople() {
    setLoading(true)
    const { data } = await supabase.from('people')
      .select('id,first_name,last_name,birth_date,death_date,bio,photo_url')
      .order('birth_date', { ascending: true })
      .limit(60)
    setPeople(data || [])
    setSelected(new Set((data || []).map((p: Person) => p.id)))
    setReady(true)
    setLoading(false)
  }

  async function exportPdf() {
    if (!contentRef.current) return
    setExporting(true); setExportProgress(0)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      setExportProgress(20)

      const pages = contentRef.current.querySelectorAll<HTMLElement>('.pdf-page')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210, H = 297

      for (let i = 0; i < pages.length; i++) {
        setExportProgress(20 + Math.round((i / pages.length) * 70))
        const canvas = await html2canvas(pages[i], { scale: 2, backgroundColor: '#080606', useCORS: true })
        const img = canvas.toDataURL('image/jpeg', 0.92)
        if (i > 0) pdf.addPage()
        pdf.addImage(img, 'JPEG', 0, 0, W, H)
      }

      setExportProgress(95)
      pdf.save('family-archive.pdf')
      setExportProgress(100)
      setTimeout(() => { setExporting(false); setExportProgress(0) }, 1200)
    } catch (e) {
      console.error(e)
      setExporting(false)
    }
  }

  const filteredPeople = people.filter(p => selected.has(p.id))

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'rgba(8,6,6,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href={`/${locale}`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')} onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← בית</a>
            <span style={{ color: '#1a0f05' }}>·</span>
            <span style={{ color: '#f5d98b', fontSize: '0.85rem' }}>📖 ספר משפחתי — ייצוא PDF</span>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {!ready && (
              <motion.button onClick={loadPeople} disabled={loading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                style={{ background: 'rgba(201,162,39,0.1)', color: '#c9a227', border: '1px solid rgba(201,162,39,0.25)', borderRadius: 10, padding: '0.5rem 1.1rem', cursor: 'pointer', fontSize: '0.82rem', fontFamily: '"Heebo", Arial, sans-serif' }}>
                {loading ? '⟳ טוען...' : '⟳ טען אנשים'}
              </motion.button>
            )}
            {ready && (
              <motion.button onClick={exportPdf} disabled={exporting || filteredPeople.length === 0} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                style={{ background: filteredPeople.length > 0 ? 'linear-gradient(135deg,#c9a227,#a68520)' : 'rgba(90,74,16,0.3)', color: '#0d0702', border: 'none', borderRadius: 10, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: '0.82rem', fontFamily: '"Heebo", Arial, sans-serif', cursor: filteredPeople.length > 0 ? 'pointer' : 'not-allowed' }}>
                {exporting ? `ייצוא... ${exportProgress}%` : `📥 ייצא PDF (${filteredPeople.length} עמודים)`}
              </motion.button>
            )}
          </div>
        </div>
        {exporting && (
          <div style={{ height: 3, background: 'rgba(201,162,39,0.1)' }}>
            <motion.div animate={{ width: `${exportProgress}%` }} style={{ height: '100%', background: 'linear-gradient(90deg,#c9a227,#f5d98b)' }} />
          </div>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 2rem 4rem' }}>

        {!ready ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#5a3a1a' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📖</div>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, marginBottom: '1.5rem', maxWidth: 420, margin: '0 auto 1.5rem' }}>
              צור ספר PDF יפה של היסטוריית המשפחה עם תמונות, תאריכים, ועצי משפחה
            </p>
            <motion.button onClick={loadPeople} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
              style={{ background: 'linear-gradient(135deg,#c9a227,#a68520)', color: '#0d0702', border: 'none', borderRadius: 12, padding: '0.75rem 2rem', fontWeight: 700, fontSize: '1rem', fontFamily: '"Heebo", Arial, sans-serif', cursor: 'pointer' }}>
              ⟳ טען נתונים
            </motion.button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
            {/* Sidebar: person selector */}
            <div>
              <div style={{ fontSize: '0.72rem', color: '#5a3a1a', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>בחר אנשים ({selected.size})</div>
              <motion.button onClick={() => setSelected(new Set(people.map(p => p.id)))}
                style={{ background: 'none', border: '1px solid rgba(201,162,39,0.15)', color: '#c9a227', borderRadius: 8, padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.75rem', fontFamily: '"Heebo", Arial, sans-serif', marginBottom: '0.4rem', width: '100%' }}>
                ✓ בחר הכל
              </motion.button>
              <motion.button onClick={() => setSelected(new Set())}
                style={{ background: 'none', border: '1px solid rgba(201,162,39,0.1)', color: '#5a3a1a', borderRadius: 8, padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.75rem', fontFamily: '"Heebo", Arial, sans-serif', marginBottom: '0.75rem', width: '100%' }}>
                ✗ נקה הכל
              </motion.button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: 400, overflowY: 'auto' }}>
                {people.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', borderRadius: 8, cursor: 'pointer', background: selected.has(p.id) ? 'rgba(201,162,39,0.05)' : 'transparent' }}>
                    <input type="checkbox" checked={selected.has(p.id)}
                      onChange={e => { const s = new Set(selected); e.target.checked ? s.add(p.id) : s.delete(p.id); setSelected(s) }}
                      style={{ accentColor: '#c9a227', cursor: 'pointer' }} />
                    <span style={{ fontSize: '0.78rem', color: selected.has(p.id) ? '#f5d98b' : '#5a3a1a' }}>
                      {p.first_name} {p.last_name || ''}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <div style={{ fontSize: '0.72rem', color: '#5a3a1a', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>תצוגה מקדימה ({filteredPeople.length} עמודים)</div>
              <div ref={contentRef}>
                {/* Cover page */}
                <div className="pdf-page" style={{ background: '#0d0702', border: '1px solid rgba(201,162,39,0.15)', borderRadius: 12, aspectRatio: '210/297', padding: '4rem 3rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,162,39,0.04) 0%, transparent 70%)' }} />
                  <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✦</div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.2rem', color: '#f5d98b', marginBottom: '0.75rem', lineHeight: 1.3 }}>ספר המשפחה</div>
                  <div style={{ color: '#c9a227', fontSize: '0.9rem', letterSpacing: '0.15em', marginBottom: '2rem' }}>FAMILY ARCHIVE</div>
                  <div style={{ width: 60, height: 1, background: 'rgba(201,162,39,0.3)', marginBottom: '2rem' }} />
                  <div style={{ fontSize: '0.8rem', color: '#5a3a1a' }}>{new Date().getFullYear()}</div>
                </div>

                {/* Person pages */}
                <AnimatePresence>
                  {filteredPeople.map((p, i) => (
                    <motion.div key={p.id} className="pdf-page"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.6) }}
                      style={{ background: '#0d0702', border: '1px solid rgba(201,162,39,0.1)', borderRadius: 12, aspectRatio: '210/297', padding: '2.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                      {/* Gold corner accent */}
                      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'linear-gradient(225deg,rgba(201,162,39,0.08),transparent)' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 80, height: 80, background: 'linear-gradient(45deg,rgba(201,162,39,0.08),transparent)' }} />

                      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {p.photo_url ? (
                          <img src={p.photo_url} alt="" style={{ width: 90, height: 110, objectFit: 'cover', borderRadius: 8, border: '2px solid rgba(201,162,39,0.2)', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 90, height: 110, borderRadius: 8, background: 'rgba(201,162,39,0.05)', border: '2px solid rgba(201,162,39,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>👤</div>
                        )}
                        <div>
                          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', color: '#f5d98b', marginBottom: '0.3rem' }}>{p.first_name} {p.last_name || ''}</div>
                          {p.birth_date && <div style={{ fontSize: '0.8rem', color: '#c9a227', marginBottom: '0.15rem' }}>🌱 {p.birth_date.substring(0,10).split('-').reverse().join('/')}</div>}
                          {p.death_date && <div style={{ fontSize: '0.8rem', color: '#b89a5a' }}>🕯️ {p.death_date.substring(0,10).split('-').reverse().join('/')}</div>}
                        </div>
                      </div>
                      <div style={{ width: '100%', height: 1, background: 'rgba(201,162,39,0.1)', marginBottom: '1rem' }} />
                      <p style={{ fontSize: '0.82rem', color: '#b89a5a', lineHeight: 1.9, flex: 1 }}>
                        {p.bio || 'אין ביוגרפיה זמינה עבור אדם זה.'}
                      </p>
                      <div style={{ fontSize: '0.65rem', color: '#2a1a08', textAlign: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
                        ✦ ארכיון המשפחה · עמוד {i + 2}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

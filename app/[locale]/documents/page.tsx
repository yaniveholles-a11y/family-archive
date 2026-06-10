'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon, { IconName } from '@/components/Icon'
import { supabase } from '@/lib/supabase'

type Doc = {
  id: number; title: string; doc_type?: string; doc_date?: string
  description?: string; file_url?: string; person_id?: number
  person?: { first_name: string; last_name: string }
}
const DOC_ICONS: Record<string, string> = {
  birth_certificate:'birth', death_certificate:'candle', marriage_certificate:'marriage',
  passport:'documents', letter:'stories', photo:'gallery', other:'documents',
}
const DOC_COLORS: Record<string, string> = {
  birth_certificate:'#4a9e6a', death_certificate:'#c9a227', marriage_certificate:'#378ADD',
  passport:'#9a6ab0', letter:'#e8a045', other:'#b89a5a',
}

export default function DocumentsPage() {
  const { locale } = useParams() as { locale: string }
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ text: string; fields: Record<string,string> } | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('documents')
      .select('*, person:people(first_name,last_name)')
      .order('doc_date', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  async function handleScan(file: File) {
    setScanning(true); setScanResult(null); setScanProgress(0)
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(['heb','eng'], 1, {
        logger: (m: any) => { if (m.status === 'recognizing text') setScanProgress(Math.round(m.progress * 100)) },
      })
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()
      const fields: Record<string,string> = {}
      const lower = text.toLowerCase()
      if (lower.includes('לידה') || lower.includes('birth')) fields['סוג'] = 'תעודת לידה'
      else if (lower.includes('פטירה') || lower.includes('death')) fields['סוג'] = 'תעודת פטירה'
      else if (lower.includes('נישואין') || lower.includes('marriage')) fields['סוג'] = 'תעודת נישואין'
      const dateMatch = text.match(/\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}/)
      if (dateMatch) fields['תאריך'] = dateMatch[0]
      const nameMatch = text.match(/(?:שם|שמו|שמה)[:\s]+([א-ת\s]{3,30})/)
      if (nameMatch) fields['שם'] = nameMatch[1].trim()
      setScanResult({ text: text.split('\n').filter(Boolean).slice(0,15).join('\n'), fields })
    } catch { setScanResult({ text: 'שגיאה בסריקה', fields: {} }) }
    setScanning(false); setScanProgress(0)
  }

  const filtered = docs.filter(d => {
    if (typeFilter !== 'all' && d.doc_type !== typeFilter) return false
    if (filter && !d.title.toLowerCase().includes(filter) && !(d.description||'').toLowerCase().includes(filter)) return false
    return true
  })
  const docTypes = ['all',...Array.from(new Set(docs.map(d=>d.doc_type||'other')))]

  return (
    <main dir="rtl" style={{ minHeight:'100vh', background:'#080606', color:'#f0e8d0', fontFamily:'"Heebo",Arial,sans-serif' }}>
      <div style={{ background:'rgba(8,6,6,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(201,162,39,0.12)', padding:'0 2rem', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.85rem 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <a href={`/${locale}`} style={{ color:'#3a2a10', fontSize:'0.82rem', textDecoration:'none' }}
              onMouseEnter={e=>(e.currentTarget.style.color='#c9a227')} onMouseLeave={e=>(e.currentTarget.style.color='#3a2a10')}>← בית</a>
            <span style={{ color:'#1a0f05' }}>·</span>
            <span style={{ color:'#f5d98b', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.4rem' }}><Icon name="documents" size={14} color="#f5d98b" /> מסמכים</span>
          </div>
          <motion.button onClick={()=>fileInputRef.current?.click()} whileHover={{ scale:1.03 }} whileTap={{ scale:0.96 }}
            style={{ background:'linear-gradient(135deg,#c9a227,#a68520)', color:'#0d0702', border:'none', borderRadius:10, padding:'0.5rem 1.1rem', fontWeight:700, fontSize:'0.82rem', fontFamily:'"Heebo",Arial,sans-serif', cursor:'pointer' }}>
            📷 סרוק מסמך (OCR)
          </motion.button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }}
            onChange={e=>{ const f=e.target.files?.[0]; if(f) handleScan(f); e.target.value='' }} />
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'1.5rem 2rem 4rem' }}>
        <AnimatePresence>
          {(scanning||scanResult) && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              style={{ background:'rgba(26,15,5,0.9)', border:'1px solid rgba(201,162,39,0.2)', borderRadius:14, padding:'1.5rem', marginBottom:'1.5rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
                <div style={{ fontSize:'0.72rem', color:'#c9a227', letterSpacing:'0.1em' }}>📷 OCR — {scanning ? 'מעבד...' : 'תוצאה'}</div>
                {!scanning && <button onClick={()=>setScanResult(null)} style={{ background:'none', border:'none', color:'#3a2a10', cursor:'pointer' }}><Icon name="close" size={16} /></button>}
              </div>
              {scanning && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'#b89a5a', marginBottom:'0.4rem' }}>
                    <span>מזהה טקסט עברי + אנגלי...</span><span>{scanProgress}%</span>
                  </div>
                  <div style={{ height:4, background:'rgba(201,162,39,0.1)', borderRadius:2, overflow:'hidden' }}>
                    <motion.div animate={{ width:`${scanProgress}%` }} style={{ height:'100%', background:'linear-gradient(90deg,#c9a227,#f5d98b)', borderRadius:2 }} />
                  </div>
                </div>
              )}
              {scanResult && !scanning && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  <div>
                    <div style={{ fontSize:'0.7rem', color:'#5a3a1a', marginBottom:'0.4rem' }}>טקסט שזוהה:</div>
                    <pre style={{ color:'#b89a5a', fontSize:'0.72rem', lineHeight:1.7, background:'rgba(13,7,2,0.6)', borderRadius:8, padding:'0.65rem', overflow:'auto', maxHeight:180, fontFamily:'"Heebo",monospace', whiteSpace:'pre-wrap' }}>
                      {scanResult.text}
                    </pre>
                  </div>
                  <div>
                    <div style={{ fontSize:'0.7rem', color:'#5a3a1a', marginBottom:'0.4rem' }}>שדות שזוהו:</div>
                    {Object.keys(scanResult.fields).length > 0 ? (
                      Object.entries(scanResult.fields).map(([k,v])=>(
                        <div key={k} style={{ display:'flex', gap:'0.4rem', fontSize:'0.78rem', marginBottom:'0.3rem' }}>
                          <span style={{ color:'#c9a227', minWidth:60 }}>{k}:</span>
                          <span style={{ color:'#f5d98b' }}>{v}</span>
                        </div>
                      ))
                    ) : <div style={{ color:'#3a2a10', fontSize:'0.78rem' }}>לא זוהו שדות</div>}
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      style={{ marginTop:'0.75rem', background:'rgba(74,158,106,0.12)', border:'1px solid rgba(74,158,106,0.3)', color:'#4a9e6a', borderRadius:8, padding:'0.4rem 0.9rem', cursor:'pointer', fontSize:'0.78rem', fontFamily:'"Heebo",Arial,sans-serif' }}>
                      שמור כמסמך חדש
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:180 }}>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="חפש מסמך..."
              style={{ width:'100%', boxSizing:'border-box', background:'rgba(26,15,5,0.7)', border:'1px solid rgba(201,162,39,0.12)', borderRadius:10, padding:'0.6rem 1rem', color:'#f0e8d0', fontSize:'0.88rem', fontFamily:'"Heebo",Arial,sans-serif', outline:'none', direction:'rtl' }}
              onFocus={e=>(e.target.style.borderColor='rgba(201,162,39,0.4)')} onBlur={e=>(e.target.style.borderColor='rgba(201,162,39,0.12)')} />
          </div>
          <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
            {docTypes.map(t=>(
              <button key={t} onClick={()=>setTypeFilter(t)}
                style={{ background:typeFilter===t?'rgba(201,162,39,0.12)':'transparent', color:typeFilter===t?'#f5d98b':'#5a3a1a', border:`1px solid ${typeFilter===t?'rgba(201,162,39,0.3)':'rgba(201,162,39,0.08)'}`, borderRadius:20, padding:'0.3rem 0.75rem', cursor:'pointer', fontSize:'0.75rem', fontFamily:'"Heebo",Arial,sans-serif' }}>
                {t==='all'?'הכל':<span style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><Icon name={(DOC_ICONS[t]||'documents') as IconName} size={13} />{t.replace(/_/g,' ')}</span>}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
            <motion.div animate={{ rotate:360 }} transition={{ duration:2, repeat:Infinity, ease:'linear' }} style={{ fontSize:'2rem', color:'#c9a227' }}>✦</motion.div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'0.75rem' }}>
            {filtered.length===0 ? (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'4rem', color:'#3a2a10' }}>
                <div style={{ marginBottom:'1rem' }}><Icon name="documents" size={48} color="rgba(201,162,39,0.3)" /></div><div>אין מסמכים</div>
              </div>
            ) : filtered.map((doc,i)=>{
              const color=DOC_COLORS[doc.doc_type||'other']||'#b89a5a'
              const icon:IconName=(DOC_ICONS[doc.doc_type||'other']||'documents') as IconName
              return (
                <motion.div key={doc.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:Math.min(i*0.03,0.4) }} whileHover={{ y:-4 }}
                  style={{ background:'rgba(26,15,5,0.8)', border:`1px solid rgba(201,162,39,0.08)`, borderTop:`3px solid ${color}`, borderRadius:12, padding:'1.1rem', cursor:'pointer' }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(201,162,39,0.25)')}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(201,162,39,0.08)')}>
                  <div style={{ fontSize:'1.8rem', marginBottom:'0.6rem' }}>{icon}</div>
                  <div style={{ fontWeight:600, color:'#f5d98b', fontSize:'0.9rem', marginBottom:'0.3rem' }}>{doc.title}</div>
                  {doc.doc_date && <div style={{ fontSize:'0.72rem', color }}>{doc.doc_date.substring(0,10).split('-').reverse().join('/')}</div>}
                  {doc.person && <div style={{ fontSize:'0.72rem', color:'#3a2a10', marginTop:'0.3rem' }}>👤 {[doc.person.first_name,doc.person.last_name].filter(Boolean).join(' ')}</div>}
                  {doc.description && <p style={{ fontSize:'0.75rem', color:'#8a6a3a', marginTop:'0.4rem', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>{doc.description}</p>}
                  {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', marginTop:'0.5rem', color, fontSize:'0.72rem', textDecoration:'none' }}>⬇ צפה</a>}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      <FloatingEditButton editPath="documents-edit" />
    </main>
  )
}

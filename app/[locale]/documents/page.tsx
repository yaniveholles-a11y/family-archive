'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import FloatingEditButton from '@/components/FloatingEditButton'

const DOC_ICONS: Record<string, string> = { certificate: '📜', letter: '✉️', id_card: '🪪', passport: '🛂', marriage: '💍', military: '🎖️', immigration: '🚢', other: '📄' }

export default function DocumentsPage() {
  const { locale } = useParams() as { locale: string }
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function load() {
      try { const { data } = await supabase.from('documents').select('*').order('year', { ascending: false }); setDocs(data || []) } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const filtered = docs.filter(d => !filter || d.title?.toLowerCase().includes(filter.toLowerCase()))

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0d0702, #1a0f05)', color: '#f5e6c8', fontFamily: '"Heebo", Arial, sans-serif' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: '#0d0702ee', borderBottom: '1px solid #c9a22722', padding: '2rem 2rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>📄</span>
            <h1 style={{ fontSize: '1.8rem', fontFamily: '"Playfair Display", serif', color: '#f5d98b', margin: 0 }}>ארכיון מסמכים</h1>
          </div>
          <div style={{ width: 80, height: 1, background: 'linear-gradient(90deg, #c9a227, transparent)', marginBottom: 12 }} />
          <p style={{ color: '#8b6914', fontSize: 14, margin: 0 }}>תעודות, מכתבים ומסמכים היסטוריים</p>
          {docs.length > 0 && (
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="🔍 חיפוש..."
              style={{ marginTop: 12, width: '100%', maxWidth: 300, boxSizing: 'border-box', background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 10, padding: '8px 14px', color: '#f5e6c8', fontSize: 13, outline: 'none' }} />
          )}
        </div>
      </motion.div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 32, color: '#c9a227' }}>✦</motion.div>
          </div>
        ) : docs.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: 72, marginBottom: 20, opacity: 0.15 }}>📜</div>
            <h2 style={{ fontSize: '1.4rem', color: '#f5d98b', fontFamily: '"Playfair Display", serif', marginBottom: 8 }}>הארכיון ממתין למסמכים</h2>
            <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, #c9a22744, transparent)', margin: '12px auto' }} />
            <p style={{ color: '#8b6914', fontSize: 14, maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.7 }}>
              תעודות לידה, מכתבים, דרכונים, כתובות — כל מסמך מספר סיפור. התחילו להעלות מסמכים.
            </p>
            <a href={`/${locale}/documents-edit`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #c9a227, #a68520)', color: '#0d0702', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px rgba(201,162,39,0.3)' }}>
              📄 הוסף מסמך ראשון
            </a>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map((doc, i) => (
              <motion.a key={doc.id} href={doc.file_url || '#'} target={doc.file_url ? '_blank' : undefined}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                style={{ background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 14, padding: '18px', textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>{DOC_ICONS[doc.doc_type] || '📄'}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f5e6c8', marginBottom: 4 }}>{doc.title}</div>
                  {doc.year && <div style={{ fontSize: 12, color: '#c9a227' }}>{doc.year}</div>}
                  {doc.description && <div style={{ fontSize: 12, color: '#5a3a1a', marginTop: 4, lineHeight: 1.5 }}>{doc.description}</div>}
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
      <FloatingEditButton editPath="documents-edit" />
    </main>
  )
}

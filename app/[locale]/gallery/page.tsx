'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import FloatingEditButton from '@/components/FloatingEditButton'

type Photo = { id: number; url: string; caption?: string; taken_year?: number; taken_place?: string; person_id?: number }

export default function GalleryPage() {
  const { locale } = useParams() as { locale: string }
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('photos').select('*').order('taken_year', { ascending: false })
        setPhotos(data || [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const filtered = photos.filter(p => {
    if (!filter) return true
    return p.caption?.toLowerCase().includes(filter.toLowerCase()) || p.taken_place?.toLowerCase().includes(filter.toLowerCase())
  })

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0d0702, #1a0f05)', color: '#f5e6c8', fontFamily: '"Heebo", Arial, sans-serif' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: '#0d0702ee', borderBottom: '1px solid #c9a22722', padding: '2rem 2rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>🖼️</span>
            <h1 style={{ fontSize: '1.8rem', fontFamily: '"Playfair Display", serif', color: '#f5d98b', margin: 0 }}>גלריה משפחתית</h1>
          </div>
          <div style={{ width: 80, height: 1, background: 'linear-gradient(90deg, #c9a227, transparent)', marginBottom: 12 }} />
          <p style={{ color: '#8b6914', fontSize: 14, margin: 0 }}>תמונות, זיכרונות ורגעים מיוחדים של המשפחה</p>
          {photos.length > 0 && (
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="🔍 חיפוש תמונות..."
              style={{ marginTop: 12, width: '100%', maxWidth: 300, boxSizing: 'border-box', background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 10, padding: '8px 14px', color: '#f5e6c8', fontSize: 13, outline: 'none' }} />
          )}
        </div>
      </motion.div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 32, color: '#c9a227' }}>✦</motion.div>
          </div>
        ) : photos.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: 72, marginBottom: 20, opacity: 0.15 }}>📷</div>
            <h2 style={{ fontSize: '1.4rem', color: '#f5d98b', fontFamily: '"Playfair Display", serif', marginBottom: 8 }}>הגלריה ממתינה לתמונות</h2>
            <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, #c9a22744, transparent)', margin: '12px auto' }} />
            <p style={{ color: '#8b6914', fontSize: 14, maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.7 }}>
              כאן ישמרו תמונות יקרות, מסמכים היסטוריים, ורגעים שלא נשכח. התחילו להעלות תמונות כדי לבנות את הגלריה.
            </p>
            <a href={`/${locale}/gallery-edit`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #c9a227, #a68520)', color: '#0d0702', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px rgba(201,162,39,0.3)' }}>
              🖼️ הוסף תמונה ראשונה
            </a>
          </motion.div>
        ) : (
          <div style={{ columns: 'auto 250px', gap: 12 }}>
            {filtered.map((photo, i) => (
              <motion.div key={photo.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedPhoto(photo)}
                style={{ breakInside: 'avoid', marginBottom: 12, cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: '1px solid #c9a22715', transition: 'all 0.2s' }}
                whileHover={{ scale: 1.02 }}>
                <img src={photo.url} alt={photo.caption || ''} style={{ width: '100%', display: 'block' }} />
                {(photo.caption || photo.taken_year) && (
                  <div style={{ background: '#0d0702ee', padding: '8px 10px' }}>
                    {photo.caption && <div style={{ fontSize: 12, color: '#f5e6c8' }}>{photo.caption}</div>}
                    {photo.taken_year && <div style={{ fontSize: 11, color: '#5a3a1a' }}>{photo.taken_year}{photo.taken_place ? ` · ${photo.taken_place}` : ''}</div>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            style={{ position: 'fixed', inset: 0, background: '#000e', backdropFilter: 'blur(20px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', cursor: 'zoom-out' }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={{ maxWidth: '90vw', maxHeight: '85vh' }}>
              <img src={selectedPhoto.url} alt={selectedPhoto.caption || ''} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 20px 60px #000c' }} />
              {selectedPhoto.caption && (
                <div style={{ textAlign: 'center', marginTop: 12, color: '#f5e6c8', fontSize: 14 }}>{selectedPhoto.caption}</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingEditButton editPath="gallery-edit" />
    </main>
  )
}

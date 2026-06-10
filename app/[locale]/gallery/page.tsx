'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Photo = {
  id: number; url: string; caption?: string; year?: number; family_id?: number
  people?: string; uploaded_at?: string
}

export default function GalleryPage() {
  const { locale } = useParams() as { locale: string }
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Photo | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [filter, setFilter] = useState('')
  const [colorized, setColorized] = useState<Record<number, string>>({})
  const [colorizing, setColorizing] = useState<number | null>(null)
  const [sliderPos, setSliderPos] = useState(50)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false })
    setPhotos(data || [])
    setLoading(false)
  }

  async function colorizePhoto(photo: Photo) {
    if (colorized[photo.id] || colorizing === photo.id) return
    setColorizing(photo.id)
    // Cloudinary AI colorization stub — replace CLOUD_NAME with actual value
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'
    const encoded = encodeURIComponent(photo.url)
    const colorizedUrl = `https://res.cloudinary.com/${cloudName}/image/fetch/e_improve,e_saturation:50/${encoded}`
    // Simulate slight delay for UX
    await new Promise(r => setTimeout(r, 1200))
    setColorized(prev => ({ ...prev, [photo.id]: colorizedUrl }))
    setColorizing(null)
    setSliderPos(50)
  }

  function openPhoto(p: Photo) {
    const idx = filtered.findIndex(x => x.id === p.id)
    setSelected(p)
    setSelectedIdx(idx)
  }

  const goNext = useCallback(() => {
    const next = (selectedIdx + 1) % filtered.length
    setSelected(filtered[next])
    setSelectedIdx(next)
  }, [selectedIdx, photos, filter])

  const goPrev = useCallback(() => {
    const prev = (selectedIdx - 1 + filtered.length) % filtered.length
    setSelected(filtered[prev])
    setSelectedIdx(prev)
  }, [selectedIdx, photos, filter])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selected) return
      if (e.key === 'ArrowLeft') goNext()
      if (e.key === 'ArrowRight') goPrev()
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, goNext, goPrev])

  const filtered = filter
    ? photos.filter(p => (p.caption || '').includes(filter) || (p.people || '').includes(filter) || String(p.year || '').includes(filter))
    : photos

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'rgba(8,6,6,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(201,162,39,0.12)',
        padding: '0 2rem',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 0 0.75rem', borderBottom: '1px solid rgba(201,162,39,0.06)' }}>
            <a href={`/${locale}`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← בית</a>
            <span style={{ color: '#1a0f05' }}>·</span>
            <span style={{ color: '#f5d98b', fontSize: '0.85rem' }}>🖼️ גלריית תמונות</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '2.5rem 2rem 1.5rem', textAlign: 'center' }}>
        <motion.h1
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', color: '#f5d98b', marginBottom: '0.4rem' }}
        >גלריית תמונות</motion.h1>
        <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, #c9a227, transparent)', margin: '0.5rem auto 0.75rem' }} />
        <p style={{ color: '#3a2a10', fontSize: '0.85rem' }}>{photos.length} תמונות בארכיון</p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 4rem' }}>

        {/* Filter */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <span style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#3a2a10', pointerEvents: 'none' }}>🔍</span>
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="סנן לפי כיתוב, אנשים, שנה..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.12)',
              borderRadius: 10, padding: '0.65rem 2.2rem 0.65rem 1rem',
              color: '#f0e8d0', fontSize: '0.9rem', fontFamily: '"Heebo", Arial, sans-serif',
              outline: 'none', direction: 'rtl',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.12)')}
          />
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '2rem', color: '#c9a227' }}>✦</motion.div>
          </div>
        )}

        {/* Masonry Grid */}
        {!loading && (
          <div style={{ columns: 'auto 220px', columnGap: 12 }}>
            {filtered.map((photo, i) => (
              <motion.div key={photo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), type: 'spring', damping: 20 }}
                onClick={() => openPhoto(photo)}
                whileHover={{ scale: 1.02, y: -3 }}
                style={{
                  breakInside: 'avoid', marginBottom: 14, cursor: 'pointer',
                  borderRadius: 10, overflow: 'hidden',
                  border: '1px solid rgba(201,162,39,0.1)',
                  position: 'relative',
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'תמונה'}
                  style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                  loading="lazy"
                />
                {(photo.caption || photo.year) && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(8,6,6,0.85))',
                    padding: '1.5rem 0.75rem 0.6rem',
                  }}>
                    {photo.caption && <div style={{ color: '#f0e8d0', fontSize: '0.78rem' }}>{photo.caption}</div>}
                    {photo.year && <div style={{ color: '#c9a227', fontSize: '0.7rem' }}>{photo.year}</div>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#3a2a10' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
            <div>לא נמצאו תמונות</div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            >
              {/* Before/After colorization slider */}
              {colorized[selected.id] ? (
                <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '80vh', overflow: 'hidden', borderRadius: 8, userSelect: 'none' }}>
                  <img src={colorized[selected.id]} alt="" style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                    <img src={selected.url} alt="" style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
                  </div>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`, width: 2, background: '#c9a227', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', background: '#c9a227', border: '2px solid #0d0702', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#0d0702', fontWeight: 700 }}>◀▶</div>
                  </div>
                  <input type="range" min={0} max={100} value={sliderPos} onChange={e => setSliderPos(Number(e.target.value))}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'ew-resize', margin: 0 }} />
                  <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.68rem', background: 'rgba(8,6,6,0.8)', color: '#5a3a1a', padding: '0.2rem 0.5rem', borderRadius: 6 }}>מקורי</div>
                  <div style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.68rem', background: 'rgba(201,162,39,0.15)', color: '#c9a227', padding: '0.2rem 0.5rem', borderRadius: 6 }}>🎨 צבעוני</div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img src={selected.url} alt={selected.caption || ''} style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8, display: 'block' }} />
                  <motion.button onClick={() => colorizePhoto(selected)} disabled={colorizing === selected.id}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                    style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: colorizing === selected.id ? 'rgba(90,74,16,0.5)' : 'linear-gradient(135deg,#c9a227,#a68520)', color: '#0d0702', border: 'none', borderRadius: 20, padding: '0.4rem 1.1rem', fontWeight: 700, fontSize: '0.78rem', fontFamily: '"Heebo",Arial,sans-serif', cursor: colorizing === selected.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {colorizing === selected.id ? '🎨 מצבע...' : '🎨 צבע תמונה'}
                  </motion.button>
                </div>
              )}
              {(selected.caption || selected.year) && (
                <div style={{ textAlign: 'center', marginTop: '0.75rem', color: '#f0e8d0', fontSize: '0.9rem' }}>
                  {selected.caption && <span>{selected.caption}</span>}
                  {selected.year && <span style={{ color: '#c9a227', marginRight: '0.5rem' }}> · {selected.year}</span>}
                </div>
              )}
              <div style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                left: -50, right: -50, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none',
              }}>
                {[{ dir: 'prev', click: goPrev, pos: 'right', label: '›' },
                  { dir: 'next', click: goNext, pos: 'left', label: '‹' }].map(btn => (
                  <button key={btn.dir} onClick={btn.click}
                    style={{
                      pointerEvents: 'all',
                      background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)',
                      color: '#c9a227', borderRadius: '50%', width: 40, height: 40,
                      cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >{btn.label}</button>
                ))}
              </div>
              <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', color: '#5a3a1a', fontSize: '0.8rem' }}>
                {selectedIdx + 1} / {filtered.length}
              </div>
            </motion.div>
            <button onClick={() => setSelected(null)}
              style={{
                position: 'fixed', top: 20, left: 20,
                background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)',
                color: '#c9a227', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: '1.2rem',
              }}
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingEditButton editPath="gallery-edit" />
    </main>
  )
}

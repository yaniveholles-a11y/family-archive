'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Person = {
  id: number; first_name: string; last_name: string
  birth_date?: string; death_date?: string; birth_place?: string
  death_place?: string; photo_url?: string; bio?: string
  family?: { name: string }
}

function formatDate(d?: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

function PersonPage({ person, side }: { person: Person; side: 'front' | 'back' }) {
  const age = person.birth_date
    ? (person.death_date
      ? parseInt(person.death_date.substring(0,4)) - parseInt(person.birth_date.substring(0,4))
      : new Date().getFullYear() - parseInt(person.birth_date.substring(0,4)))
    : null

  return (
    <div style={{
      width: '100%', height: '100%',
      background: side === 'front'
        ? 'linear-gradient(160deg, #1a0f05 0%, #0d0702 100%)'
        : 'linear-gradient(160deg, #0d0702 0%, #1a0f05 100%)',
      padding: '2.5rem 2rem',
      display: 'flex', flexDirection: 'column', gap: '1rem',
      fontFamily: '"Heebo", Arial, sans-serif',
      overflow: 'hidden',
      border: '1px solid rgba(201,162,39,0.12)',
      borderRadius: side === 'front' ? '0 12px 12px 0' : '12px 0 0 12px',
      position: 'relative',
    }}>
      {/* Decorative corner */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 40, height: 40, opacity: 0.1,
        background: 'radial-gradient(circle, #c9a227, transparent)',
      }} />

      {/* Photo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
        {person.photo_url ? (
          <img src={person.photo_url} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(201,162,39,0.3)' }} />
        ) : (
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'rgba(201,162,39,0.08)', border: '2px solid rgba(201,162,39,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', color: 'rgba(201,162,39,0.4)',
          }}>
            {person.first_name?.[0] || '?'}
          </div>
        )}
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', color: '#f5d98b', marginBottom: '0.2rem' }}>
          {[person.first_name, person.last_name].filter(Boolean).join(' ')}
        </h2>
        {person.family?.name && (
          <div style={{ fontSize: '0.72rem', color: '#c9a227', letterSpacing: '0.1em' }}>
            משפחת {person.family.name}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: '60%', height: 1, background: 'linear-gradient(90deg, transparent, #c9a227, transparent)', margin: '0 auto' }} />

      {/* Dates */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#b89a5a' }}>
        {person.birth_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#4a9e6a' }}>🌱</span>
            <span>{formatDate(person.birth_date)}</span>
            {person.birth_place && <span style={{ color: '#5a3a1a' }}>· {person.birth_place}</span>}
          </div>
        )}
        {person.death_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🕯️</span>
            <span>{formatDate(person.death_date)}</span>
            {person.death_place && <span style={{ color: '#5a3a1a' }}>· {person.death_place}</span>}
          </div>
        )}
        {age !== null && (
          <div style={{ color: '#3a2a10', fontSize: '0.72rem' }}>
            {person.death_date ? `חי ${age} שנים` : `בן/בת ${age}`}
          </div>
        )}
      </div>

      {/* Bio */}
      {person.bio && (
        <p style={{ fontSize: '0.78rem', color: '#8a6a3a', lineHeight: 1.7, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' as const }}>
          {person.bio}
        </p>
      )}

      {/* Page ornament */}
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', color: 'rgba(201,162,39,0.15)', fontSize: '1rem' }}>✦</div>
    </div>
  )
}

export default function BookPage() {
  const { locale } = useParams() as { locale: string }
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSpread, setCurrentSpread] = useState(0)
  const [flipping, setFlipping] = useState<null | 'next' | 'prev'>(null)
  const audioRef = useRef<AudioContext | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('people').select('*, family:families(name)').order('last_name')
    setPeople(data || [])
    setLoading(false)
  }

  function playFlip() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate)
      const ch = buf.getChannelData(0)
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length) * 0.15
      const src = ctx.createBufferSource()
      src.buffer = buf
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'; filter.frequency.value = 800
      src.connect(filter); filter.connect(ctx.destination)
      src.start()
    } catch {}
  }

  function goNext() {
    if (flipping || currentSpread >= Math.floor((people.length - 1) / 2)) return
    setFlipping('next')
    playFlip()
    setTimeout(() => { setCurrentSpread(s => s + 1); setFlipping(null) }, 600)
  }

  function goPrev() {
    if (flipping || currentSpread <= 0) return
    setFlipping('prev')
    playFlip()
    setTimeout(() => { setCurrentSpread(s => s - 1); setFlipping(null) }, 600)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goNext()
      if (e.key === 'ArrowRight') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentSpread, flipping])

  const leftIdx = currentSpread * 2
  const rightIdx = currentSpread * 2 + 1
  const leftPerson = people[leftIdx]
  const rightPerson = people[rightIdx]
  const totalSpreads = Math.ceil(people.length / 2)

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>
      <style>{`
        .book-page { perspective: 1500px; }
        .page-flip-next { animation: flipNext 0.6s ease-in-out forwards; }
        .page-flip-prev { animation: flipPrev 0.6s ease-in-out forwards; }
        @keyframes flipNext {
          0%   { transform: rotateY(0deg); }
          50%  { transform: rotateY(-90deg); box-shadow: -20px 0 40px rgba(0,0,0,0.8); }
          100% { transform: rotateY(0deg); }
        }
        @keyframes flipPrev {
          0%   { transform: rotateY(0deg); }
          50%  { transform: rotateY(90deg); box-shadow: 20px 0 40px rgba(0,0,0,0.8); }
          100% { transform: rotateY(0deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '2.5rem 2rem 1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: '#c9a227', letterSpacing: '0.3em', marginBottom: '0.5rem' }}>✦ FAMILY ARCHIVE ✦</div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', color: '#f5d98b' }}>
          ספר המשפחה
        </h1>
        <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, #c9a227, transparent)', margin: '0.5rem auto' }} />
        {!loading && (
          <p style={{ color: '#3a2a10', fontSize: '0.8rem' }}>
            עמוד {currentSpread + 1} מתוך {totalSpreads} · {people.length} בני משפחה
          </p>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '2.5rem', color: '#c9a227' }}>✦</motion.div>
        </div>
      ) : (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1rem 4rem' }}>
          {/* Book spread */}
          <div className="book-page" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,162,39,0.1)',
              borderRadius: 12, overflow: 'hidden',
              width: '100%', maxWidth: 700, minHeight: 420,
            }}
              className={flipping === 'next' ? 'page-flip-next' : flipping === 'prev' ? 'page-flip-prev' : ''}
            >
              {/* Left page */}
              <div style={{ flex: 1, minHeight: 420 }}>
                {leftPerson ? (
                  <PersonPage person={leftPerson} side="front" />
                ) : (
                  <div style={{ width: '100%', height: '100%', minHeight: 420, background: 'linear-gradient(160deg, #1a0f05, #0d0702)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(201,162,39,0.08)' }}>
                    <div style={{ textAlign: 'center', color: 'rgba(201,162,39,0.15)', fontSize: '3rem' }}>✦</div>
                  </div>
                )}
              </div>
              {/* Spine */}
              <div style={{
                width: 8,
                background: 'linear-gradient(180deg, #3a2a10, #1a0f05, #3a2a10)',
                flexShrink: 0,
                boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.5), inset 2px 0 4px rgba(0,0,0,0.5)',
              }} />
              {/* Right page */}
              <div style={{ flex: 1, minHeight: 420 }}>
                {rightPerson ? (
                  <PersonPage person={rightPerson} side="back" />
                ) : (
                  <div style={{ width: '100%', height: '100%', minHeight: 420, background: 'linear-gradient(160deg, #0d0702, #1a0f05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(201,162,39,0.08)' }}>
                    <span style={{ color: 'rgba(201,162,39,0.1)', fontSize: '0.8rem' }}>סוף הספר</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
            <motion.button onClick={goPrev} disabled={currentSpread <= 0 || !!flipping}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              style={{
                background: currentSpread <= 0 ? 'rgba(26,15,5,0.3)' : 'rgba(201,162,39,0.12)',
                border: '1px solid rgba(201,162,39,0.2)', color: currentSpread <= 0 ? '#3a2a10' : '#c9a227',
                borderRadius: '50%', width: 44, height: 44, cursor: currentSpread <= 0 ? 'not-allowed' : 'pointer',
                fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>›</motion.button>

            {/* Page dots */}
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              {Array.from({ length: Math.min(totalSpreads, 10) }, (_, i) => (
                <motion.div key={i}
                  animate={{ scale: i === currentSpread ? 1.4 : 1, opacity: i === currentSpread ? 1 : 0.3 }}
                  onClick={() => {
                    if (!flipping) {
                      const dir = i > currentSpread ? 'next' : 'prev'
                      setFlipping(dir)
                      playFlip()
                      setTimeout(() => { setCurrentSpread(i); setFlipping(null) }, 600)
                    }
                  }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9a227', cursor: 'pointer' }}
                />
              ))}
              {totalSpreads > 10 && <span style={{ color: '#3a2a10', fontSize: '0.72rem' }}>+{totalSpreads - 10}</span>}
            </div>

            <motion.button onClick={goNext} disabled={currentSpread >= totalSpreads - 1 || !!flipping}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              style={{
                background: currentSpread >= totalSpreads - 1 ? 'rgba(26,15,5,0.3)' : 'rgba(201,162,39,0.12)',
                border: '1px solid rgba(201,162,39,0.2)', color: currentSpread >= totalSpreads - 1 ? '#3a2a10' : '#c9a227',
                borderRadius: '50%', width: 44, height: 44, cursor: currentSpread >= totalSpreads - 1 ? 'not-allowed' : 'pointer',
                fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>‹</motion.button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem', color: '#1a0f05', fontSize: '0.72rem' }}>
            ← → מקשי חצים לדפדוף
          </div>

          {/* Jump to person */}
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#3a2a10', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>✦ דלג לאדם</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
              {people.map((p, i) => (
                <button key={p.id}
                  onClick={() => {
                    const spread = Math.floor(i / 2)
                    if (!flipping && spread !== currentSpread) {
                      setFlipping(spread > currentSpread ? 'next' : 'prev')
                      playFlip()
                      setTimeout(() => { setCurrentSpread(spread); setFlipping(null) }, 600)
                    }
                  }}
                  style={{
                    background: Math.floor(i / 2) === currentSpread ? 'rgba(201,162,39,0.15)' : 'rgba(26,15,5,0.5)',
                    border: `1px solid ${Math.floor(i / 2) === currentSpread ? 'rgba(201,162,39,0.4)' : 'rgba(201,162,39,0.08)'}`,
                    color: Math.floor(i / 2) === currentSpread ? '#f5d98b' : '#8a6a3a',
                    borderRadius: 8, padding: '0.3rem 0.7rem', cursor: 'pointer',
                    fontSize: '0.75rem', fontFamily: '"Heebo", Arial, sans-serif',
                  }}>
                  {[p.first_name, p.last_name].filter(Boolean).join(' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

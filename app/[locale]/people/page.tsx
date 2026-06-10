'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Person = {
  id: number; first_name: string; last_name: string
  birth_date?: string; death_date?: string; birth_place?: string
  gender?: string; family_id?: number; photo_url?: string
  family?: { name: string }
}

const GENDER_COLORS = { male: '#378ADD', female: '#D4537E', other: '#c9a227' }
const GENDER_LABELS = { male: 'זכר', female: 'נקבה', other: 'אחר' }

function PersonCard({ person, locale }: { person: Person; locale: string }) {
  const color = GENDER_COLORS[(person.gender as keyof typeof GENDER_COLORS) || 'other']
  const initials = [person.first_name?.[0], person.last_name?.[0]].filter(Boolean).join('')
  const age = person.birth_date
    ? (person.death_date
        ? parseInt(person.death_date.substring(0, 4)) - parseInt(person.birth_date.substring(0, 4))
        : new Date().getFullYear() - parseInt(person.birth_date.substring(0, 4)))
    : null

  return (
    <motion.a href={`/${locale}/people/${person.id}`}
      whileHover={{ y: -5 }} whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        display: 'block', textDecoration: 'none', color: 'inherit',
        background: 'rgba(26,15,5,0.8)', border: '1px solid rgba(201,162,39,0.1)',
        borderRadius: 14, overflow: 'hidden', position: 'relative',
      }}
      onMouseEnter={e => (e.currentTarget.style.border = '1px solid rgba(201,162,39,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.border = '1px solid rgba(201,162,39,0.1)')}
    >
      {/* Photo / Avatar */}
      <div style={{
        height: 130, background: `linear-gradient(135deg, ${color}15, rgba(26,15,5,0.95))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        borderBottom: `1px solid ${color}20`,
      }}>
        {person.photo_url ? (
          <img src={person.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `${color}20`, border: `2px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', color, fontFamily: '"Playfair Display", serif', fontWeight: 700,
          }}>{initials || '?'}</div>
        )}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: `${color}20`, border: `1px solid ${color}40`,
          borderRadius: 6, padding: '0.15rem 0.5rem',
          fontSize: '0.65rem', color,
        }}>{GENDER_LABELS[(person.gender as keyof typeof GENDER_LABELS) || 'other']}</div>
      </div>

      {/* Info */}
      <div style={{ padding: '0.9rem 1rem' }}>
        <div style={{ fontWeight: 700, color: '#f5d98b', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
          {[person.first_name, person.last_name].filter(Boolean).join(' ') || 'ללא שם'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#5a3a1a', lineHeight: 1.7 }}>
          {person.birth_date && <span>נ. {person.birth_date.substring(0, 4)}</span>}
          {person.death_date && <span> · ד. {person.death_date.substring(0, 4)}</span>}
          {age !== null && !person.death_date && <span> · {age} שנה</span>}
          {person.birth_place && <div>📍 {person.birth_place}</div>}
          {person.family && <div style={{ color: '#c9a227' }}>🏛️ {person.family.name}</div>}
        </div>
      </div>
    </motion.a>
  )
}

function PersonRow({ person, locale }: { person: Person; locale: string }) {
  const color = GENDER_COLORS[(person.gender as keyof typeof GENDER_COLORS) || 'other']
  return (
    <motion.a href={`/${locale}/people/${person.id}`}
      whileHover={{ x: -4 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.08)',
        borderRight: `3px solid ${color}`,
        borderRadius: 10, padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.08)')}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
      }}>
        {[person.first_name?.[0], person.last_name?.[0]].filter(Boolean).join('') || '?'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: '#f5d98b', fontSize: '0.93rem' }}>
          {[person.first_name, person.last_name].filter(Boolean).join(' ') || 'ללא שם'}
        </div>
        <div style={{ fontSize: '0.73rem', color: '#3a2a10' }}>
          {[
            person.birth_date && `נ. ${person.birth_date.substring(0, 4)}`,
            person.birth_place,
            person.family?.name,
          ].filter(Boolean).join(' · ')}
        </div>
      </div>
      <span style={{ color: '#3a2a10', fontSize: '0.8rem' }}>←</span>
    </motion.a>
  )
}

export default function PeoplePage() {
  const { locale } = useParams() as { locale: string }
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'birth'>('name')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('people')
      .select('*, family:families(name)')
      .order('last_name')
    setPeople(data || [])
    setLoading(false)
  }

  let filtered = people.filter(p => {
    if (genderFilter !== 'all' && p.gender !== genderFilter) return false
    if (filter) {
      const q = filter.toLowerCase()
      const name = (p.first_name + ' ' + p.last_name).toLowerCase()
      if (!name.includes(q) && !(p.birth_place || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  if (sortBy === 'name') filtered = [...filtered].sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
  if (sortBy === 'birth') filtered = [...filtered].sort((a, b) => (a.birth_date || '').localeCompare(b.birth_date || ''))

  const stats = {
    total: people.length,
    male: people.filter(p => p.gender === 'male').length,
    female: people.filter(p => p.gender === 'female').length,
    withPhoto: people.filter(p => p.photo_url).length,
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'rgba(8,6,6,0.95)', borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 0 0.75rem', borderBottom: '1px solid rgba(201,162,39,0.06)' }}>
            <a href={`/${locale}`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← בית</a>
            <span style={{ color: '#1a0f05' }}>·</span>
            <span style={{ color: '#f5d98b', fontSize: '0.85rem' }}>👥 אנשים</span>
          </div>
        </div>
      </div>

      {/* Hero + Stats */}
      <div style={{ background: 'rgba(26,15,5,0.4)', borderBottom: '1px solid rgba(201,162,39,0.08)', padding: '2rem 2rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.9rem', color: '#f5d98b', marginBottom: '1.25rem' }}>
            ספר המשפחה
          </motion.h1>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'סה״כ', value: stats.total, color: '#c9a227' },
              { label: 'גברים', value: stats.male, color: '#378ADD' },
              { label: 'נשים', value: stats.female, color: '#D4537E' },
              { label: 'עם תמונה', value: stats.withPhoto, color: '#4a9e6a' },
            ].map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, fontFamily: '"Playfair Display", serif' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#3a2a10' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem 4rem' }}>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#3a2a10', pointerEvents: 'none' }}>🔍</span>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="חפש לפי שם, מקום..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.12)',
                borderRadius: 10, padding: '0.6rem 2rem 0.6rem 1rem',
                color: '#f0e8d0', fontSize: '0.88rem', fontFamily: '"Heebo", Arial, sans-serif',
                outline: 'none', direction: 'rtl',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.12)')}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['all', 'male', 'female'].map(g => (
              <button key={g} onClick={() => setGenderFilter(g)}
                style={{
                  background: genderFilter === g ? 'rgba(201,162,39,0.1)' : 'transparent',
                  color: genderFilter === g ? '#f5d98b' : '#5a3a1a',
                  border: `1px solid ${genderFilter === g ? 'rgba(201,162,39,0.3)' : 'rgba(201,162,39,0.08)'}`,
                  borderRadius: 20, padding: '0.3rem 0.8rem', cursor: 'pointer',
                  fontSize: '0.78rem', fontFamily: '"Heebo", Arial, sans-serif',
                }}
              >{{ all: 'הכל', male: 'גברים', female: 'נשים' }[g]}</button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'birth')}
            style={{
              background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.12)',
              borderRadius: 10, padding: '0.5rem 0.75rem', color: '#f0e8d0',
              fontSize: '0.82rem', fontFamily: '"Heebo", Arial, sans-serif', cursor: 'pointer', outline: 'none',
            }}>
            <option value="name">מיון: שם</option>
            <option value="birth">מיון: שנת לידה</option>
          </select>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{
                  background: viewMode === v ? 'rgba(201,162,39,0.12)' : 'transparent',
                  color: viewMode === v ? '#c9a227' : '#3a2a10',
                  border: '1px solid rgba(201,162,39,0.1)',
                  borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: '0.9rem',
                }}
              >{v === 'grid' ? '⊞' : '☰'}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '0.75rem', fontSize: '0.78rem', color: '#3a2a10' }}>
          {filtered.length} אנשים
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '2rem', color: '#c9a227' }}>✦</motion.div>
          </div>
        )}

        {/* Grid view */}
        {!loading && viewMode === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
            {filtered.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
              >
                <PersonCard person={p} locale={locale} />
              </motion.div>
            ))}
          </div>
        )}

        {/* List view */}
        {!loading && viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
              >
                <PersonRow person={p} locale={locale} />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#3a2a10' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
            <div>לא נמצאו אנשים</div>
          </div>
        )}
      </div>

      <FloatingEditButton editPath="people-edit" />
    </main>
  )
}

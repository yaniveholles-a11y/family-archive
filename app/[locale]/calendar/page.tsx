'use client'
import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/Icon'
import { supabase } from '@/lib/supabase'
import FloatingEditButton from '@/components/FloatingEditButton'
import { HDate, HebrewCalendar, CalOptions, Event as HEvent } from '@hebcal/core'

const TYPE_ICONS: Record<string, string> = {
  yahrzeit: 'candle', birthday: 'birth', anniversary: 'marriage',
  memorial: '✡️', holiday: '🕎', other: '📌',
}
const TYPE_LABELS: Record<string, string> = {
  yahrzeit: 'יארצייט', birthday: 'יום הולדת', anniversary: 'יום נישואין',
  memorial: 'הנצחה', holiday: 'חג', other: 'אחר',
}
const TYPE_COLORS: Record<string, string> = {
  yahrzeit: '#c9a227', birthday: '#4a9e6a', anniversary: '#378ADD',
  memorial: '#9a6ab0', holiday: '#e8a045', other: '#b89a5a',
}

const HEB_MONTHS = ['', 'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול']
const HEB_DAYS = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ז\'', 'ח\'', 'ט\'', 'י\'', 'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז', 'י"ז', 'י"ח', 'י"ט', 'כ\'', 'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט', 'ל\'']

interface CalEvent {
  id: number | string; title: string; date: string; type: string
  person?: string; description?: string; hebrewDate?: string; isHoliday?: boolean
}

function toHebrewDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const hd = new HDate(d)
    const day = HEB_DAYS[hd.getDate() - 1] || hd.getDate().toString()
    const month = HEB_MONTHS[hd.getMonth()] || ''
    const year = hd.getFullYear()
    return `${day} ${month} ${year}`
  } catch { return '' }
}

function getYahrzeit(deathDate: string, targetYear: number): string {
  try {
    const d = new Date(deathDate)
    const hd = new HDate(d)
    const yahrzeit = new HDate(hd.getDate(), hd.getMonth(), targetYear)
    return yahrzeit.greg().toISOString().substring(0, 10)
  } catch { return '' }
}

export default function CalendarPage() {
  const { locale } = useParams() as { locale: string }
  const [events, setEvents] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'month'>('list')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [expandedId, setExpandedId] = useState<number | string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: evts }, { data: ppl }] = await Promise.all([
      supabase.from('calendar_events').select('*').order('date'),
      supabase.from('people').select('id, first_name, last_name, birth_date, death_date').order('last_name'),
    ])
    setEvents(evts || [])
    setPeople(ppl || [])
    setLoading(false)
  }

  // Generate yahrzeit events for current year
  const yahrzeit_events: CalEvent[] = useMemo(() => {
    const year = selectedYear
    return people
      .filter(p => p.death_date)
      .map(p => {
        const name = [p.first_name, p.last_name].filter(Boolean).join(' ')
        // Calculate Hebrew yahrzeit
        const yahrzeitDate = getYahrzeit(p.death_date, year + 3761) // approx Hebrew year
        const hebrewDate = toHebrewDate(p.death_date)
        return {
          id: `yahrzeit-${p.id}`,
          title: `יארצייט — ${name}`,
          date: yahrzeitDate || p.death_date,
          type: 'yahrzeit',
          person: name,
          hebrewDate,
          description: `יום השנה ה-${year - parseInt(p.death_date.substring(0,4))} לפטירת ${name}`,
        }
      })
      .filter(e => e.date)
  }, [people, selectedYear])

  // Generate birthday events
  const birthday_events: CalEvent[] = useMemo(() =>
    people
      .filter(p => p.birth_date && !p.death_date)
      .map(p => {
        const name = [p.first_name, p.last_name].filter(Boolean).join(' ')
        const bday = p.birth_date.substring(5) // MM-DD
        return {
          id: `bday-${p.id}`,
          title: `יום הולדת — ${name}`,
          date: `${selectedYear}-${bday}`,
          type: 'birthday',
          person: name,
          description: `גיל ${selectedYear - parseInt(p.birth_date.substring(0,4))}`,
        }
      })
  , [people, selectedYear])

  // Hebrew holidays for current year
  const holidays: CalEvent[] = useMemo(() => {
    try {
      const opts: CalOptions = {
        year: selectedYear, isHebrewYear: false,
        il: true, locale: 'he',
        sedrot: false, omer: false,
        noModern: true,
      }
      const evts = HebrewCalendar.calendar(opts)
      return evts.slice(0, 30).map((e: HEvent) => ({
        id: `holiday-${e.getDate().toString()}`,
        title: e.renderBrief('he'),
        date: e.getDate().greg().toISOString().substring(0, 10),
        type: 'holiday',
        isHoliday: true,
        hebrewDate: e.getDate().toString(),
      }))
    } catch { return [] }
  }, [selectedYear])

  const allEvents: CalEvent[] = [
    ...events.map(e => ({ ...e, hebrewDate: e.date ? toHebrewDate(e.date) : '' })),
    ...yahrzeit_events,
    ...birthday_events,
    ...holidays,
  ].sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const filtered = allEvents.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false
    if (filter && !e.title.toLowerCase().includes(filter.toLowerCase())) return false
    const eMonth = e.date ? parseInt(e.date.substring(5, 7)) - 1 : -1
    if (viewMode === 'month' && eMonth !== selectedMonth) return false
    return true
  })

  // Upcoming events (next 30 days)
  const today = new Date().toISOString().substring(0, 10)
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10)
  const upcoming = allEvents.filter(e => e.date >= today && e.date <= in30).slice(0, 5)

  const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'rgba(8,6,6,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '0 2rem' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 0 0.75rem', borderBottom: '1px solid rgba(201,162,39,0.06)' }}>
            <a href={`/${locale}`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← בית</a>
            <span style={{ color: '#1a0f05' }}>·</span>
            <span style={{ color: '#f5d98b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="calendar" size={14} color="#f5d98b" /> לוח שנה</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '2rem 2rem 1.5rem', textAlign: 'center' }}>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.9rem', color: '#f5d98b', marginBottom: '0.3rem' }}>
          לוח שנה משפחתי
        </motion.h1>
        <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, #c9a227, transparent)', margin: '0.4rem auto 0.6rem' }} />
        <p style={{ color: '#3a2a10', fontSize: '0.82rem' }}>
          יארצייטים · ימי הולדת · חגים · אירועים
        </p>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 2rem 4rem' }}>

        {/* Upcoming strip */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: '1.5rem', background: 'rgba(201,162,39,0.04)', border: '1px solid rgba(201,162,39,0.12)', borderRadius: 12, padding: '0.9rem 1.2rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#c9a227', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>✦ 30 יום הקרובים</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {upcoming.map(e => {
                const color = TYPE_COLORS[e.type] || '#b89a5a'
                const daysLeft = Math.ceil((new Date(e.date).getTime() - Date.now()) / 86400000)
                return (
                  <div key={e.id} style={{
                    background: `${color}12`, border: `1px solid ${color}30`,
                    borderRadius: 8, padding: '0.4rem 0.8rem', fontSize: '0.78rem',
                  }}>
                    <span style={{ color }}>{TYPE_ICONS[e.type]}</span>{' '}
                    <span style={{ color: '#f5d98b' }}>{e.title}</span>{' '}
                    <span style={{ color: '#3a2a10' }}>·{' '}
                      {daysLeft === 0 ? 'היום!' : daysLeft === 1 ? 'מחר' : `בעוד ${daysLeft} ימים`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="חפש אירוע..."
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.12)', borderRadius: 10, padding: '0.6rem 1rem', color: '#f0e8d0', fontSize: '0.88rem', fontFamily: '"Heebo", Arial, sans-serif', outline: 'none', direction: 'rtl' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.12)')} />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.12)', borderRadius: 10, padding: '0.55rem 0.75rem', color: '#f0e8d0', fontSize: '0.82rem', fontFamily: '"Heebo", Arial, sans-serif', cursor: 'pointer', outline: 'none' }}>
            <option value="all">כל הסוגים</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
            style={{ background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.12)', borderRadius: 10, padding: '0.55rem 0.75rem', color: '#f0e8d0', fontSize: '0.82rem', fontFamily: '"Heebo", Arial, sans-serif', cursor: 'pointer', outline: 'none' }}>
            {[2023,2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {(['list', 'month'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{ background: viewMode === v ? 'rgba(201,162,39,0.12)' : 'transparent', color: viewMode === v ? '#c9a227' : '#3a2a10', border: `1px solid ${viewMode === v ? 'rgba(201,162,39,0.3)' : 'rgba(201,162,39,0.08)'}`, borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem', fontFamily: '"Heebo", Arial, sans-serif' }}>
                {v === 'list' ? <><Icon name="list" size={13} /> רשימה</> : <><Icon name="calendar" size={13} /> חודש</>}
              </button>
            ))}
          </div>
        </div>

        {/* Month picker */}
        {viewMode === 'month' && (
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {MONTHS_HE.map((m, i) => (
              <button key={i} onClick={() => setSelectedMonth(i)}
                style={{ background: selectedMonth === i ? 'rgba(201,162,39,0.15)' : 'transparent', color: selectedMonth === i ? '#f5d98b' : '#5a3a1a', border: `1px solid ${selectedMonth === i ? 'rgba(201,162,39,0.35)' : 'rgba(201,162,39,0.08)'}`, borderRadius: 20, padding: '0.25rem 0.65rem', cursor: 'pointer', fontSize: '0.75rem', fontFamily: '"Heebo", Arial, sans-serif' }}>
                {m}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '2rem', color: '#c9a227' }}>✦</motion.div>
          </div>
        )}

        {/* Events list */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#3a2a10' }}>
                <div style={{ marginBottom: '1rem' }}><Icon name="calendar" size={48} color="rgba(201,162,39,0.3)" /></div>
                <div>אין אירועים</div>
              </div>
            ) : filtered.map((event, i) => {
              const color = TYPE_COLORS[event.type] || '#b89a5a'
              const isExpanded = expandedId === event.id
              return (
                <motion.div key={event.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.4) }}
                  style={{ background: 'rgba(26,15,5,0.7)', border: `1px solid rgba(201,162,39,0.08)`, borderRight: `3px solid ${color}`, borderRadius: 10, overflow: 'hidden' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.25)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.08)')}
                >
                  <div onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{TYPE_ICONS[event.type] || '📌'}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f5d98b', fontSize: '0.9rem' }}>{event.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#3a2a10', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                          {event.date && <span>{new Date(event.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}</span>}
                          {event.hebrewDate && <span style={{ color: color, opacity: 0.8 }}>· {event.hebrewDate}</span>}
                          <span style={{ background: `${color}15`, color, borderRadius: 6, padding: '0.05rem 0.4rem', fontSize: '0.65rem' }}>{TYPE_LABELS[event.type] || event.type}</span>
                        </div>
                      </div>
                    </div>
                    <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} style={{ color: '#c9a227', fontSize: '0.75rem' }}>▼</motion.span>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 1rem 0.9rem', borderTop: '1px solid rgba(201,162,39,0.06)' }}>
                          {event.description && <p style={{ color: '#b89a5a', fontSize: '0.82rem', lineHeight: 1.6, marginTop: '0.75rem' }}>{event.description}</p>}
                          {event.person && (
                            <a href={`/${locale}/people`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: '#378ADD', fontSize: '0.78rem', textDecoration: 'none' }}>
                              👤 {event.person}
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* iCal export */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={() => {
              const ical = [
                'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Family Archive//HE',
                ...filtered.filter(e => e.date).map(e => [
                  'BEGIN:VEVENT',
                  `UID:${e.id}@family-archive`,
                  `SUMMARY:${e.title}`,
                  `DTSTART:${e.date.replace(/-/g, '')}`,
                  `DESCRIPTION:${e.description || ''}`,
                  'END:VEVENT',
                ].join('\r\n')),
                'END:VCALENDAR',
              ].join('\r\n')
              const blob = new Blob([ical], { type: 'text/calendar' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'family-calendar.ics'; a.click()
              URL.revokeObjectURL(url)
            }}
            style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)', color: '#c9a227', borderRadius: 10, padding: '0.65rem 1.5rem', cursor: 'pointer', fontFamily: '"Heebo", Arial, sans-serif', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >📥 ייצוא ל-iCal / Google Calendar</button>
        </div>
      </div>

      <FloatingEditButton editPath="calendar-edit" />
    </main>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import FloatingEditButton from '@/components/FloatingEditButton'

const TYPE_ICONS: Record<string, string> = { yahrzeit: '🕯️', birthday: '🎂', anniversary: '💍', memorial: '✡️', holiday: '🕎', other: '📌' }
const TYPE_LABELS: Record<string, string> = { yahrzeit: 'יארצייט', birthday: 'יום הולדת', anniversary: 'יום נישואין', memorial: 'הנצחה', holiday: 'חג', other: 'אחר' }

export default function CalendarPage() {
  const { locale } = useParams() as { locale: string }
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('calendar_events').select('*').order('date')
        if (error) console.error('Calendar error:', error)
        setEvents(data || [])
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = events.filter(e => !filter || e.event_type === filter)

  // Group by month
  const byMonth: Record<string, any[]> = {}
  filtered.forEach(e => {
    const d = e.date ? new Date(e.date) : null
    const key = d ? d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }) : 'ללא תאריך'
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(e)
  })

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0d0702, #1a0f05)', color: '#f5e6c8', fontFamily: '"Heebo", Arial, sans-serif' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: '#0d0702ee', borderBottom: '1px solid #c9a22722', padding: '2rem 2rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>📆</span>
            <h1 style={{ fontSize: '1.8rem', fontFamily: '"Playfair Display", serif', color: '#f5d98b', margin: 0 }}>לוח שנה משפחתי</h1>
          </div>
          <div style={{ width: 80, height: 1, background: 'linear-gradient(90deg, #c9a227, transparent)', marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip active={!filter} onClick={() => setFilter('')}>הכל ({events.length})</Chip>
            {Object.entries(TYPE_LABELS).map(([k, v]) => {
              const count = events.filter(e => e.event_type === k).length
              return count > 0 ? <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{TYPE_ICONS[k]} {v} ({count})</Chip> : null
            })}
          </div>
        </div>
      </motion.div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 32, color: '#c9a227' }}>✦</motion.div>
          </div>
        ) : events.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: 72, marginBottom: 20, opacity: 0.15 }}>📆</div>
            <h2 style={{ color: '#f5d98b', fontFamily: '"Playfair Display", serif', marginBottom: 8 }}>הלוח ממתין לאירועים</h2>
            <p style={{ color: '#8b6914', fontSize: 14, maxWidth: 400, margin: '0 auto 20px' }}>יארצייטים, ימי הולדת, ימי נישואין ואירועים משפחתיים</p>
            <a href={`/${locale}/calendar-edit`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#c9a227', color: '#0d0702', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>📆 הוסף אירוע ראשון</a>
          </motion.div>
        ) : (
          Object.entries(byMonth).map(([month, evts]) => (
            <div key={month} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, color: '#c9a227', fontWeight: 600, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #c9a22722' }}>{month}</h3>
              {evts.map((e: any, i: number) => {
                const d = e.date ? new Date(e.date) : null
                const day = d ? d.toLocaleDateString('he-IL', { day: 'numeric', weekday: 'short' }) : ''
                return (
                  <motion.div key={e.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 12, padding: '12px 16px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{TYPE_ICONS[e.event_type] || '📌'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f5e6c8' }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: '#8b6914' }}>{day}{e.recurring ? ' · חוזר שנתי' : ''}</div>
                      {e.notes && <div style={{ fontSize: 12, color: '#5a3a1a', marginTop: 2 }}>{e.notes}</div>}
                    </div>
                    <div style={{ fontSize: 10, color: '#5a3a1a', background: '#c9a22711', padding: '3px 8px', borderRadius: 6 }}>{TYPE_LABELS[e.event_type] || e.event_type}</div>
                  </motion.div>
                )
              })}
            </div>
          ))
        )}
      </div>
      <FloatingEditButton editPath="calendar-edit" />
    </main>
  )
}
function Chip({ children, active, onClick }: any) {
  return <button onClick={onClick} style={{ background: active ? '#c9a22722' : 'transparent', border: `1px solid ${active ? '#c9a227' : '#2a1a08'}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: active ? '#f5d98b' : '#5a3a1a', fontSize: 12, fontFamily: '"Heebo", sans-serif' }}>{children}</button>
}

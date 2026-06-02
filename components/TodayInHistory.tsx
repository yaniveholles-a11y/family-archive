'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function TodayInHistory() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const today = new Date()
      const month = today.getMonth() + 1
      const day = today.getDate()

      // Find people born or died today
      const items: any[] = []

      const { data: people } = await supabase.from('people').select('id, first_name, last_name, birth_date, death_date')
      people?.forEach(p => {
        if (p.birth_date) {
          const d = new Date(p.birth_date)
          if (d.getMonth() + 1 === month && d.getDate() === day) {
            items.push({ type: 'birthday', name: [p.first_name, p.last_name].filter(Boolean).join(' '), year: d.getFullYear(), icon: '🎂' })
          }
        }
        if (p.death_date) {
          const d = new Date(p.death_date)
          if (d.getMonth() + 1 === month && d.getDate() === day) {
            items.push({ type: 'yahrzeit', name: [p.first_name, p.last_name].filter(Boolean).join(' '), year: d.getFullYear(), icon: '🕯️' })
          }
        }
      })

      // Find calendar events for today
      const { data: calEvents } = await supabase.from('calendar_events').select('title, date, event_type')
      calEvents?.forEach(e => {
        if (e.date) {
          const d = new Date(e.date)
          if (d.getMonth() + 1 === month && d.getDate() === day) {
            items.push({ type: e.event_type, name: e.title, icon: e.event_type === 'yahrzeit' ? '🕯️' : '📅' })
          }
        }
      })

      setEvents(items)
    }
    load()
  }, [])

  if (events.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'linear-gradient(135deg, #c9a22711, #c9a22705)', border: '1px solid #c9a22733', borderRadius: 14, padding: '16px 20px', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f5d98b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>📜</span> היום בהיסטוריה המשפחתית
      </div>
      {events.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, color: '#f5e6c8' }}>
          <span>{e.icon}</span>
          <span>{e.name}</span>
          {e.year && <span style={{ color: '#5a3a1a', fontSize: 11 }}>({e.year})</span>}
        </div>
      ))}
    </motion.div>
  )
}

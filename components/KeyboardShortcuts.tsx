'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], desc: 'חיפוש גלובלי' },
  { keys: ['Esc'], desc: 'סגור חלון' },
  { keys: ['←', '→'], desc: 'ניווט בגלריה' },
]

export default function KeyboardShortcuts() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) { e.preventDefault(); setShow(s => !s) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShow(false)}
          style={{ position: 'fixed', inset: 0, background: '#000c', backdropFilter: 'blur(8px)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} dir="rtl"
            style={{ background: '#1e140a', border: '1px solid #c9a22744', borderRadius: 16, padding: '24px', minWidth: 300 }}>
            <h3 style={{ color: '#f5d98b', marginBottom: 16, fontFamily: '"Playfair Display", serif' }}>⌨️ קיצורי מקלדת</h3>
            {SHORTCUTS.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1a0f05' }}>
                <span style={{ fontSize: 13, color: '#f5e6c8' }}>{s.desc}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {s.keys.map(k => (
                    <kbd key={k} style={{ background: '#0d0702', border: '1px solid #c9a22733', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#c9a227' }}>{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 11, color: '#3a2a10', textAlign: 'center' }}>לחץ Shift+? לפתיחה/סגירה</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

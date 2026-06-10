'use client'
import { useParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/Icon'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function AiChatPage() {
  const { locale } = useParams() as { locale: string }
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'שלום! אני עוזר המשפחה. אני יכול לענות על שאלות על ההיסטוריה המשפחתית, לחפש ביוגרפיות, ולהסביר מסמכים. מה תרצה לדעת?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const SUGGESTIONS = [
    'ספר לי על הדור הראשון במשפחה',
    'מה יש לי על שורשי המשפחה?',
    'מי היו הילדים של הסב?',
    'מה קרה במשפחה בשנות ה-40?',
  ]

  async function send(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const userMsg: Msg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'מצטער, לא הצלחתי לעבד את הבקשה.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ שגיאת חיבור. נסה שנית.' }])
    }
    setLoading(false)
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: 'rgba(8,6,6,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '0 2rem', flexShrink: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, padding: '0.85rem 0' }}>
          <a href={`/${locale}`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')} onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← בית</a>
          <span style={{ color: '#1a0f05' }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#4a9e6a' }} />
            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.05rem', color: '#f5d98b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="ai" size={16} color="#f5d98b" /> עוזר משפחתי AI</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.5rem 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Suggestions (only if 1 message) */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {SUGGESTIONS.map(s => (
                <motion.button key={s} onClick={() => send(s)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.12)', borderRadius: 20, padding: '0.4rem 0.9rem', color: '#b89a5a', fontSize: '0.8rem', cursor: 'pointer', fontFamily: '"Heebo", Arial, sans-serif' }}>
                  {s}
                </motion.button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1.5rem' }}>
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25 }}
                  style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end', gap: '0.6rem' }}>
                  {m.role === 'assistant' && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a227,#7a6010)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}><Icon name="ai" size={18} color="#0a0600" /></div>
                  )}
                  <div style={{
                    maxWidth: '78%', background: m.role === 'user' ? 'rgba(201,162,39,0.08)' : 'rgba(26,15,5,0.85)',
                    border: `1px solid ${m.role === 'user' ? 'rgba(201,162,39,0.18)' : 'rgba(201,162,39,0.08)'}`,
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '0.8rem 1.1rem', color: '#d4b878', fontSize: '0.91rem', lineHeight: 1.75, whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0, alignSelf: 'flex-end', color: '#c9a227', fontWeight: 700 }}>א</div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a227,#7a6010)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="ai" size={18} color="#0a0600" /></div>
                  <div style={{ background: 'rgba(26,15,5,0.85)', border: '1px solid rgba(201,162,39,0.08)', borderRadius: '16px 16px 16px 4px', padding: '0.8rem 1.2rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {[0, 0.15, 0.3].map((d, k) => (
                      <motion.div key={k} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: d }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9a227' }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(201,162,39,0.1)', background: 'rgba(8,6,6,0.97)', padding: '1rem 1.5rem 1.25rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="שאל שאלה על המשפחה... (Enter לשליחה)"
            rows={2}
            style={{ flex: 1, background: 'rgba(26,15,5,0.8)', border: '1px solid rgba(201,162,39,0.12)', borderRadius: 14, padding: '0.75rem 1rem', color: '#f0e8d0', fontSize: '0.9rem', fontFamily: '"Heebo", Arial, sans-serif', resize: 'none', outline: 'none', direction: 'rtl', lineHeight: 1.6 }}
            onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.12)')}
          />
          <motion.button onClick={() => send()} disabled={!input.trim() || loading}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
            style={{ background: input.trim() && !loading ? 'linear-gradient(135deg,#c9a227,#a68520)' : 'rgba(90,74,16,0.3)', color: '#0d0702', border: 'none', borderRadius: 14, padding: '0.75rem 1.25rem', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', fontSize: '1.1rem', flexShrink: 0 }}>
            ➤
          </motion.button>
        </div>
        <div style={{ maxWidth: 720, margin: '0.4rem auto 0', fontSize: '0.68rem', color: '#2a1a08', textAlign: 'center' }}>
          מופעל על ידי Claude AI · מחובר לארכיון המשפחתי
        </div>
      </div>
    </main>
  )
}

'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/Icon'
import { supabase } from '@/lib/supabase'

type Memory = {
  id: number; content: string; author_name?: string; author_id?: string
  created_at: string; family_id?: number; photo_url?: string
  reactions?: Record<string, number>; family?: { name: string }
}
type User = { id: string; full_name?: string; role?: string }

const REACTIONS = ['💛', '😢', '🕯️', '❤️', '🌟']

export default function FeedPage() {
  const { locale } = useParams() as { locale: string }
  const [memories, setMemories] = useState<Memory[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [text, setText] = useState('')
  const [newCount, setNewCount] = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    init()
    return () => { channelRef.current?.unsubscribe() }
  }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      setUser(profile)
    }
    await loadMemories()

    // Supabase Realtime subscription
    const channel = supabase.channel('memories-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memories' }, (payload) => {
        setMemories(prev => [payload.new as Memory, ...prev])
        setNewCount(n => n + 1)
        setTimeout(() => setNewCount(n => Math.max(0, n - 1)), 5000)
      })
      .subscribe()
    channelRef.current = channel
  }

  async function loadMemories() {
    const { data } = await supabase
      .from('memories')
      .select('*, family:families(name)')
      .order('created_at', { ascending: false })
      .limit(50)
    setMemories(data || [])
    setLoading(false)
  }

  async function postMemory() {
    if (!text.trim() || !user) return
    setPosting(true)
    await supabase.from('memories').insert({
      content: text.trim(),
      author_id: user.id,
      author_name: user.full_name || 'אנונימי',
    })
    setText('')
    setPosting(false)
  }

  async function addReaction(memoryId: number, emoji: string) {
    const memory = memories.find(m => m.id === memoryId)
    if (!memory) return
    const reactions = { ...(memory.reactions || {}), [emoji]: ((memory.reactions || {})[emoji] || 0) + 1 }
    await supabase.from('memories').update({ reactions }).eq('id', memoryId)
    setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, reactions } : m))
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'עכשיו'
    if (mins < 60) return `לפני ${mins} דקות`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `לפני ${hrs} שעות`
    const days = Math.floor(hrs / 24)
    return `לפני ${days} ימים`
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'rgba(8,6,6,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href={`/${locale}`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← בית</a>
            <span style={{ color: '#1a0f05' }}>·</span>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: '#f5d98b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="feed" size={16} color="#f5d98b" /> זיכרונות משותפים</h1>
          </div>
          <AnimatePresence>
            {newCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                style={{ background: '#c9a227', color: '#0d0702', borderRadius: 20, padding: '0.15rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>
                +{newCount} חדש
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>

        {/* Post box */}
        {user ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(26,15,5,0.8)', border: '1px solid rgba(201,162,39,0.15)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a227,#7a6010)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d0702', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                {user.full_name?.[0] || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="שתף זיכרון, בדיחה משפחתית, או סיפור..."
                  rows={3}
                  style={{ width: '100%', background: 'rgba(13,7,2,0.6)', border: '1px solid rgba(201,162,39,0.12)', borderRadius: 10, padding: '0.75rem', color: '#f0e8d0', fontSize: '0.9rem', fontFamily: '"Heebo", Arial, sans-serif', resize: 'none', outline: 'none', boxSizing: 'border-box', direction: 'rtl' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.4)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.12)')}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#3a2a10' }}>{text.length}/500</span>
                  <motion.button onClick={postMemory} disabled={!text.trim() || posting}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                    style={{ background: text.trim() ? 'linear-gradient(135deg,#c9a227,#a68520)' : 'rgba(90,74,16,0.3)', color: '#0d0702', border: 'none', borderRadius: 10, padding: '0.45rem 1.2rem', fontWeight: 700, fontSize: '0.85rem', fontFamily: '"Heebo", Arial, sans-serif', cursor: text.trim() ? 'pointer' : 'not-allowed' }}>
                    {posting ? '...' : 'פרסם'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(26,15,5,0.5)', borderRadius: 12, border: '1px solid rgba(201,162,39,0.08)', fontSize: '0.85rem', color: '#5a3a1a' }}>
            <a href={`/${locale}/login`} style={{ color: '#c9a227', textDecoration: 'none' }}>התחבר</a> כדי לשתף זיכרון
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '2rem', color: '#c9a227' }}>✦</motion.div>
          </div>
        ) : memories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#3a2a10' }}>
            <div style={{ marginBottom: '1rem' }}><Icon name="feed" size={48} color="rgba(201,162,39,0.3)" /></div>
            <div>אין זיכרונות עדיין — היה הראשון לשתף</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {memories.map((m, i) => (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.5) }}
                style={{ background: 'rgba(26,15,5,0.7)', border: '1px solid rgba(201,162,39,0.08)', borderRadius: 14, padding: '1.2rem 1.4rem' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.08)')}
              >
                {/* Author + time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(201,162,39,0.3),rgba(201,162,39,0.1))', border: '1px solid rgba(201,162,39,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#c9a227', fontWeight: 700, flexShrink: 0 }}>
                    {m.author_name?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f5d98b' }}>{m.author_name || 'אנונימי'}</div>
                    <div style={{ fontSize: '0.68rem', color: '#3a2a10' }}>
                      {timeAgo(m.created_at)}
                      {m.family?.name && <span style={{ color: '#c9a227', marginRight: '0.35rem' }}> · {m.family.name}</span>}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p style={{ color: '#c8b08a', fontSize: '0.93rem', lineHeight: 1.75, marginBottom: '0.9rem', whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </p>

                {/* Photo */}
                {m.photo_url && (
                  <img src={m.photo_url} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: '0.75rem', objectFit: 'cover', maxHeight: 260 }} />
                )}

                {/* Reactions */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {REACTIONS.map(emoji => {
                    const count = m.reactions?.[emoji] || 0
                    return (
                      <motion.button key={emoji} onClick={() => addReaction(m.id, emoji)}
                        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        style={{ background: count > 0 ? 'rgba(201,162,39,0.1)' : 'rgba(26,15,5,0.5)', border: `1px solid ${count > 0 ? 'rgba(201,162,39,0.3)' : 'rgba(201,162,39,0.06)'}`, borderRadius: 20, padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f0e8d0' }}>
                        {emoji}{count > 0 && <span style={{ fontSize: '0.7rem', color: '#c9a227' }}>{count}</span>}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

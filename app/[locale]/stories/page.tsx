'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Story = {
  id: number; title: string; content: string; author?: string
  created_at?: string; family_id?: number; cover_image?: string
  family?: { name: string }
}

type User = { id: string; role?: string }

// ── Rich Editor ────────────────────────────────────────────────────────────────
function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (divRef.current && divRef.current.innerHTML !== value) {
      divRef.current.innerHTML = value
    }
  }, [])

  function cmd(command: string, arg?: string) {
    document.execCommand(command, false, arg)
    if (divRef.current) onChange(divRef.current.innerHTML)
  }

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    background: active ? 'rgba(201,162,39,0.2)' : 'transparent',
    border: '1px solid rgba(201,162,39,0.15)',
    color: '#c9a227', borderRadius: 6,
    padding: '0.3rem 0.6rem', cursor: 'pointer',
    fontSize: '0.85rem', fontFamily: 'monospace',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        <button type="button" style={btnStyle()} onClick={() => cmd('bold')} title="Bold"><b>B</b></button>
        <button type="button" style={btnStyle()} onClick={() => cmd('italic')} title="Italic"><i>I</i></button>
        <button type="button" style={btnStyle()} onClick={() => cmd('underline')} title="Underline"><u>U</u></button>
        <div style={{ width: 1, background: 'rgba(201,162,39,0.15)', margin: '0 0.15rem' }} />
        <button type="button" style={btnStyle()} onClick={() => cmd('formatBlock', 'h3')} title="כותרת">H</button>
        <button type="button" style={btnStyle()} onClick={() => cmd('insertUnorderedList')} title="רשימה">•</button>
        <button type="button" style={btnStyle()} onClick={() => cmd('insertOrderedList')} title="רשימה מספרית">1.</button>
        <div style={{ width: 1, background: 'rgba(201,162,39,0.15)', margin: '0 0.15rem' }} />
        <button type="button" style={btnStyle()} onClick={() => cmd('justifyRight')} title="ימין">⇒</button>
        <button type="button" style={btnStyle()} onClick={() => cmd('justifyCenter')} title="מרכז">↔</button>
        <button type="button" style={btnStyle()} onClick={() => cmd('removeFormat')} title="נקה">✕</button>
      </div>
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        dir="rtl"
        onInput={() => { if (divRef.current) onChange(divRef.current.innerHTML) }}
        style={{
          minHeight: 200, background: 'rgba(13,7,2,0.8)',
          border: '1px solid rgba(201,162,39,0.15)', borderRadius: 10,
          padding: '0.9rem 1rem', color: '#f0e8d0', fontSize: '0.93rem',
          lineHeight: 1.8, outline: 'none', direction: 'rtl',
          fontFamily: '"Heebo", Arial, sans-serif',
        }}
      />
    </div>
  )
}

// ── Story Editor Modal ─────────────────────────────────────────────────────────
function StoryEditor({
  story, onClose, onSaved, locale,
}: {
  story: Partial<Story> | null
  onClose: () => void
  onSaved: () => void
  locale: string
}) {
  const [title, setTitle] = useState(story?.title || '')
  const [content, setContent] = useState(story?.content || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!title.trim()) { setError('חובה למלא כותרת'); return }
    setSaving(true); setError('')
    const payload = { title: title.trim(), content }
    const { error: e } = story?.id
      ? await supabase.from('stories').update(payload).eq('id', story.id)
      : await supabase.from('stories').insert(payload)
    if (e) { setError(e.message); setSaving(false); return }
    onSaved()
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box' as const,
    background: 'rgba(13,7,2,0.8)', border: '1px solid rgba(201,162,39,0.2)',
    borderRadius: 10, padding: '0.7rem 1rem',
    color: '#f0e8d0', fontSize: '0.95rem',
    fontFamily: '"Heebo", Arial, sans-serif', outline: 'none',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{
          background: 'rgba(16,10,4,0.97)',
          border: '1px solid rgba(201,162,39,0.25)',
          borderRadius: 18, padding: '2rem', width: '100%', maxWidth: 680,
          maxHeight: '90vh', overflowY: 'auto',
          backdropFilter: 'blur(20px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', color: '#f5d98b', fontSize: '1.3rem' }}>
            {story?.id ? 'עריכת סיפור' : 'סיפור חדש'}
          </h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#3a2a10',
            fontSize: '1.3rem', cursor: 'pointer',
          }}>✕</button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              style={{ background: 'rgba(58,16,16,0.8)', borderRadius: 8, padding: '0.65rem 1rem', color: '#f5a5a5', fontSize: '0.85rem', marginBottom: '1rem', overflow: 'hidden' }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#b89a5a', marginBottom: '0.4rem' }}>כותרת *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת הסיפור" style={inp}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.2)')} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#b89a5a', marginBottom: '0.4rem' }}>תוכן</label>
            <RichEditor value={content} onChange={setContent} />
          </div>
          <motion.button onClick={save} disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.97 }}
            style={{
              background: saving ? 'rgba(90,74,16,0.5)' : 'linear-gradient(135deg, #c9a227, #a68520)',
              color: '#0d0702', border: 'none', borderRadius: 12,
              padding: '0.85rem', fontWeight: 700, fontSize: '0.95rem',
              fontFamily: '"Heebo", Arial, sans-serif', cursor: saving ? 'not-allowed' : 'pointer',
            }}>
            {saving ? 'שומר...' : story?.id ? 'שמור שינויים' : 'פרסם סיפור'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Story Card ─────────────────────────────────────────────────────────────────
function StoryCard({ story, locale, canEdit, onEdit, onDelete }: {
  story: Story; locale: string; canEdit: boolean
  onEdit: () => void; onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const preview = story.content.replace(/<[^>]+>/g, '').substring(0, 180)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(26,15,5,0.8)', border: '1px solid rgba(201,162,39,0.1)',
        borderRadius: 14, overflow: 'hidden',
      }}
      onMouseEnter={e => (e.currentTarget.style.border = '1px solid rgba(201,162,39,0.25)')}
      onMouseLeave={e => (e.currentTarget.style.border = '1px solid rgba(201,162,39,0.1)')}
    >
      <div style={{ padding: '1.25rem 1.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: '"Playfair Display", serif', color: '#f5d98b', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
              {story.title}
            </h3>
            {(story.author || story.created_at) && (
              <div style={{ fontSize: '0.72rem', color: '#3a2a10', marginBottom: '0.6rem' }}>
                {story.author && <span>✍️ {story.author}</span>}
                {story.created_at && <span style={{ marginRight: '0.5rem' }}>· {story.created_at.substring(0, 10).split('-').reverse().join('/')}</span>}
                {story.family?.name && <span style={{ marginRight: '0.5rem', color: '#c9a227' }}>· 🏛️ {story.family.name}</span>}
              </div>
            )}
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
              <button onClick={onEdit} style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)', color: '#c9a227', borderRadius: 7, padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.78rem' }}>עריכה</button>
              <button onClick={onDelete} style={{ background: 'rgba(200,80,80,0.08)', border: '1px solid rgba(200,80,80,0.2)', color: '#f5a5a5', borderRadius: 7, padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.78rem' }}>מחיקה</button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p style={{ color: '#b89a5a', fontSize: '0.87rem', lineHeight: 1.7, margin: '0 0 0.75rem' }}>
                {preview}{story.content.replace(/<[^>]+>/g, '').length > 180 && '...'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                dangerouslySetInnerHTML={{ __html: story.content }}
                style={{ color: '#c8b08a', fontSize: '0.9rem', lineHeight: 1.85 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => setExpanded(!expanded)}
          style={{
            background: 'transparent', border: 'none', color: '#c9a227',
            cursor: 'pointer', fontSize: '0.8rem', padding: 0,
            fontFamily: '"Heebo", Arial, sans-serif',
          }}>
          {expanded ? '▲ סגור' : '▼ קרא עוד'}
        </button>
      </div>
    </motion.div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function StoriesPage() {
  const { locale } = useParams() as { locale: string }
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [editing, setEditing] = useState<Partial<Story> | null | false>(false)
  const [filter, setFilter] = useState('')

  useEffect(() => { load(); checkUser() }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: profile } = await supabase.from('users').select('role').eq('id', session.user.id).single()
      setUser({ id: session.user.id, role: profile?.role })
    }
  }

  async function load() {
    const { data } = await supabase
      .from('stories')
      .select('*, family:families(name)')
      .order('created_at', { ascending: false })
    setStories(data || [])
    setLoading(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('האם למחוק את הסיפור?')) return
    await supabase.from('stories').delete().eq('id', id)
    load()
  }

  const canEdit = user?.role === 'admin' || user?.role === 'editor'
  const filtered = filter
    ? stories.filter(s => s.title.includes(filter) || s.content.replace(/<[^>]+>/g, '').includes(filter))
    : stories

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo", Arial, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'rgba(8,6,6,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(201,162,39,0.12)',
        padding: '1.75rem 2rem 1.5rem',
      }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.6rem' }}>
                <a href={`/${locale}`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← בית</a>
                <span style={{ color: '#1a0f05' }}>·</span>
                <span style={{ color: '#f5d98b', fontSize: '0.85rem' }}>📖 סיפורים</span>
              </div>
              <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', color: '#f5d98b' }}>
                סיפורי המשפחה
              </h1>
            </div>
            {canEdit && (
              <motion.button onClick={() => setEditing({})}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{
                  background: 'linear-gradient(135deg, #c9a227, #a68520)',
                  color: '#0d0702', border: 'none', borderRadius: 10,
                  padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.88rem',
                  fontFamily: '"Heebo", Arial, sans-serif', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>+ סיפור חדש</motion.button>
            )}
          </div>

          <div style={{ marginTop: '1rem', position: 'relative' }}>
            <span style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#3a2a10', pointerEvents: 'none' }}>🔍</span>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="חפש סיפור..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(13,7,2,0.7)', border: '1px solid rgba(201,162,39,0.12)',
                borderRadius: 10, padding: '0.6rem 2rem 0.6rem 1rem',
                color: '#f0e8d0', fontSize: '0.88rem', fontFamily: '"Heebo", Arial, sans-serif',
                outline: 'none', direction: 'rtl',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(201,162,39,0.12)')}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '2rem', color: '#c9a227' }}>✦</motion.div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#3a2a10' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
            <div>{filter ? 'לא נמצאו סיפורים' : 'אין סיפורים עדיין'}</div>
            {canEdit && !filter && (
              <button onClick={() => setEditing({})}
                style={{
                  marginTop: '1.5rem', background: 'rgba(201,162,39,0.12)',
                  border: '1px solid rgba(201,162,39,0.25)', color: '#c9a227',
                  borderRadius: 10, padding: '0.65rem 1.5rem', cursor: 'pointer',
                  fontFamily: '"Heebo", Arial, sans-serif', fontSize: '0.9rem',
                }}>+ כתוב את הסיפור הראשון</button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(story => (
            <StoryCard key={story.id} story={story} locale={locale} canEdit={canEdit}
              onEdit={() => setEditing(story)}
              onDelete={() => handleDelete(story.id)} />
          ))}
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editing !== false && (
          <StoryEditor
            story={editing || null}
            locale={locale}
            onClose={() => setEditing(false)}
            onSaved={() => { setEditing(false); load() }}
          />
        )}
      </AnimatePresence>

      <FloatingEditButton editPath="stories-edit" />
    </main>
  )
}

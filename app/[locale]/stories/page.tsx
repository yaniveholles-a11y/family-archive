'use client'
import FloatingEditButton from '@/components/FloatingEditButton'
import { useEffect, useState, useRef } from 'react'
import { supabase, getSession } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Story = {
  id: number; title: string; content: string; excerpt?: string
  author_person_id?: number; cover_url?: string
  created_at: string; updated_at: string
  author?: { first_name: string; last_name: string }
  tags?: string
}
type Person = { id: number; first_name: string; last_name: string }

const S = {
  bg:'#0d0702', card:'#1e1108', border:'#3a2a10',
  gold:'#c9a227', goldDim:'#b89a5a', text:'#f5e6c8',
  inputBg:'#150a01',
}

// ── Simple rich text toolbar ──────────────────────────────────────────────────
function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  const tools = [
    { label:'B', cmd:'bold', title:'מודגש' },
    { label:'I', cmd:'italic', title:'נטוי' },
    { label:'U', cmd:'underline', title:'קו תחתון' },
    { label:'H2', cmd:'formatBlock', val:'h2', title:'כותרת' },
    { label:'H3', cmd:'formatBlock', val:'h3', title:'כותרת קטנה' },
    { label:'¶', cmd:'formatBlock', val:'p', title:'פסקה' },
    { label:'•', cmd:'insertUnorderedList', title:'רשימה' },
    { label:'1.', cmd:'insertOrderedList', title:'רשימה ממוספרת' },
    { label:'—', cmd:'insertHorizontalRule', title:'קו מפריד' },
  ]

  return (
    <div style={{ border:`1px solid ${S.border}`, borderRadius:10, overflow:'hidden' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:'2px', padding:'6px 8px', background:'#150a01', borderBottom:`1px solid ${S.border}`, flexWrap:'wrap' }}>
        {tools.map(t => (
          <button key={t.cmd + t.label}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd, t.val) }}
            title={t.title}
            style={{
              background:'none', border:`1px solid ${S.border}`, borderRadius:5,
              color:S.goldDim, cursor:'pointer', padding:'3px 8px',
              fontSize: t.label === 'B' ? '14px' : '12px',
              fontWeight: t.label === 'B' ? 'bold' : 'normal',
              fontStyle: t.label === 'I' ? 'italic' : 'normal',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2a1a08'; e.currentTarget.style.color = S.gold }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = S.goldDim }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content editable */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML) }}
        dir="rtl"
        style={{
          minHeight:280, padding:'1rem', outline:'none',
          color:S.text, fontSize:'0.95rem', lineHeight:1.9,
          background:S.inputBg, direction:'rtl',
        }}
      />

      <style>{`
        [contenteditable] h2 { color:#f5d98b; font-size:1.3rem; margin:0.75rem 0 0.4rem; }
        [contenteditable] h3 { color:#c9a227; font-size:1.1rem; margin:0.6rem 0 0.3rem; }
        [contenteditable] p  { margin:0.4rem 0; }
        [contenteditable] ul,[contenteditable] ol { padding-right:1.5rem; }
        [contenteditable] li { margin:0.25rem 0; }
        [contenteditable] hr { border:none; border-top:1px solid #3a2a10; margin:1rem 0; }
        [contenteditable]:empty:before { content:attr(placeholder); color:#3a2a10; }
      `}</style>
    </div>
  )
}

// ── Story card ────────────────────────────────────────────────────────────────
function StoryCard({ story, onEdit, onDelete, canEdit }: {
  story: Story; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(story.created_at).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' })

  // Strip HTML and decode entities for excerpt
  const decodeHtml = (html: string) => {
    const txt = html.replace(/<[^>]+>/g, '')
    const el = typeof document !== 'undefined' ? document.createElement('textarea') : null
    if (el) { el.innerHTML = txt; return el.value }
    return txt.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  }
  const plainText = decodeHtml(story.content).substring(0, 200)

  return (
    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, overflow:'hidden', transition:'border-color .15s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = S.gold)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = S.border)}>

      {/* Cover image */}
      {story.cover_url && (
        <img src={story.cover_url} style={{ width:'100%', height:200, objectFit:'cover', display:'block' }} />
      )}

      <div style={{ padding:'1.25rem' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:'0.5rem' }}>
          <h2 style={{ color:'#f5d98b', fontSize:'1.2rem', margin:0, flex:1 }}>{story.title}</h2>
          {canEdit && (
            <div style={{ display:'flex', gap:'0.4rem', flexShrink:0 }}>
              <button onClick={onEdit} style={{ background:'none', border:`1px solid ${S.border}`, borderRadius:6, color:S.goldDim, cursor:'pointer', padding:'3px 8px', fontSize:'0.75rem' }}>✏️</button>
              <button onClick={onDelete} style={{ background:'none', border:'1px solid #3a1010', borderRadius:6, color:'#8a3a3a', cursor:'pointer', padding:'3px 8px', fontSize:'0.75rem' }}>✕</button>
            </div>
          )}
        </div>

        {/* Meta */}
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
          {story.author && (
            <span style={{ fontSize:'0.78rem', color:S.gold }}>
              ✍️ {story.author.first_name} {story.author.last_name}
            </span>
          )}
          <span style={{ fontSize:'0.75rem', color:'#5a3a1a' }}>📅 {date}</span>
          {story.tags && story.tags.split(',').map(tag => (
            <span key={tag} style={{ fontSize:'0.7rem', background:'#2a1a08', border:`1px solid ${S.border}`, borderRadius:20, padding:'1px 8px', color:S.goldDim }}>
              #{tag.trim()}
            </span>
          ))}
        </div>

        {/* Content */}
        {expanded
          ? <div dir="rtl" style={{ color:S.text, fontSize:'0.93rem', lineHeight:1.9 }} dangerouslySetInnerHTML={{ __html: story.content }} />
          : <p style={{ color:'#c8b08a', fontSize:'0.88rem', lineHeight:1.7, margin:'0 0 8px' }}>{plainText}{plainText.length >= 200 ? '...' : ''}</p>
        }

        <button onClick={() => setExpanded(e => !e)}
          style={{ background:'none', border:'none', color:S.gold, cursor:'pointer', fontSize:'0.82rem', padding:'4px 0', textDecoration:'underline' }}>
          {expanded ? 'הסתר ↑' : 'קרא עוד →'}
        </button>
      </div>
    </div>
  )
}

// ── Editor modal ──────────────────────────────────────────────────────────────
function StoryEditor({ story, people, onSave, onClose }: {
  story?: Partial<Story>; people: Person[]
  onSave: (s: Partial<Story>) => Promise<void>; onClose: () => void
}) {
  const [form, setForm] = useState({
    title: story?.title || '',
    content: story?.content || '',
    author_person_id: story?.author_person_id || '',
    tags: story?.tags || '',
    cover_url: story?.cover_url || '',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave({ ...form, author_person_id: form.author_person_id ? Number(form.author_person_id) : undefined })
    setSaving(false)
  }

  const inp = (extra?: object) => ({
    style: { width:'100%', background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:8, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem', direction:'rtl' as const, boxSizing:'border-box' as const, ...extra },
  })

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, background:'#000000aa', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', overflowY:'auto' }}>
      <div dir="rtl" style={{ background:'#1a0f05', border:`1px solid ${S.gold}`, borderRadius:16, padding:'1.5rem', width:'100%', maxWidth:700, position:'relative', boxShadow:'0 8px 40px #000000bb', fontFamily:'Arial', maxHeight:'90vh', overflowY:'auto' }}>
        <button onClick={onClose} style={{ position:'absolute', top:'0.75rem', left:'0.75rem', background:'none', border:'none', color:S.goldDim, cursor:'pointer', fontSize:'1.1rem' }}>✕</button>
        <h2 style={{ color:'#f5d98b', fontSize:'1.2rem', margin:'0 0 1.25rem' }}>{story?.id ? 'עריכת סיפור' : 'סיפור חדש'}</h2>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
          <input {...inp()} placeholder="כותרת הסיפור *" value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} />

          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            <select {...inp({ flex:1, minWidth:160 })} value={form.author_person_id} onChange={e => setForm(f => ({ ...f, author_person_id:e.target.value }))}>
              <option value="">✍️ בחר כותב/ת (אופציונלי)</option>
              {people.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}
            </select>
            <input {...inp({ flex:1, minWidth:160 })} placeholder="תגיות (מופרדות בפסיק)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags:e.target.value }))} />
          </div>

          <input {...inp()} placeholder="קישור לתמונת שער (URL, אופציונלי)" value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url:e.target.value }))} />

          <div>
            <div style={{ fontSize:'0.75rem', color:S.goldDim, marginBottom:6 }}>תוכן הסיפור</div>
            <RichEditor value={form.content} onChange={v => setForm(f => ({ ...f, content:v }))} />
          </div>

          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
            <button onClick={onClose} style={{ background:'transparent', border:`1px solid ${S.border}`, borderRadius:8, color:S.goldDim, padding:'0.55rem 1.1rem', cursor:'pointer', fontSize:'0.88rem' }}>ביטול</button>
            <button onClick={save} disabled={saving || !form.title.trim()}
              style={{ background:S.gold, color:'#0d0702', border:'none', borderRadius:8, padding:'0.55rem 1.25rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.88rem', opacity: saving || !form.title.trim() ? 0.6 : 1 }}>
              {saving ? 'שומר...' : '💾 שמור סיפור'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [people, setPeople]   = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editStory, setEditStory]   = useState<Partial<Story> | undefined>()
  const [search, setSearch]         = useState('')
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const session = await getSession()
      if (!session) { router.push('/login'); return }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle()
      setCanEdit(roleData?.role === 'admin' || roleData?.role === 'editor')
      const { data: ppl } = await supabase.from('people').select('id,first_name,last_name').order('last_name')
      setPeople(ppl || [])
      await loadStories()
    }
    init()
  }, [router])

  async function loadStories() {
    const { data } = await supabase
      .from('stories')
      .select('*, author:author_person_id(first_name, last_name)')
      .order('created_at', { ascending: false })
    setStories(data || [])
    setLoading(false)
  }

  async function saveStory(form: Partial<Story>) {
    if (editStory?.id) {
      await supabase.from('stories').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editStory.id)
    } else {
      await supabase.from('stories').insert({ ...form })
    }
    setShowEditor(false); setEditStory(undefined)
    loadStories()
  }

  async function deleteStory(id: number) {
    if (!confirm('למחוק את הסיפור?')) return
    await supabase.from('stories').delete().eq('id', id)
    loadStories()
  }

  function openNew() { setEditStory(undefined); setShowEditor(true) }
  function openEdit(story: Story) { setEditStory(story); setShowEditor(true) }

  const filtered = stories.filter(s =>
    !search ||
    s.title.includes(search) ||
    (s.author ? `${s.author.first_name} ${s.author.last_name}` : '').includes(search) ||
    (s.tags || '').includes(search)
  )

  return (
    <main dir="rtl" style={{ minHeight:'100vh', background:S.bg, color:S.text, fontFamily:'Arial, sans-serif' }}>
      <div style={{ maxWidth:800, margin:'0 auto', padding:'1.5rem' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
          <h1 style={{ fontSize:'1.6rem', color:'#f5d98b', margin:0 }}>📝 סיפורי המשפחה</h1>
          {canEdit && (
            <button onClick={openNew}
              style={{ background:S.gold, color:'#0d0702', border:'none', borderRadius:8, padding:'0.5rem 1.1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.88rem' }}>
              + כתוב סיפור חדש
            </button>
          )}
        </div>
        <div style={{ width:60, height:2, background:S.gold, marginBottom:'1.25rem' }} />

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 חפש לפי כותרת, כותב/ת או תגית..."
          style={{ width:'100%', background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'0.6rem 0.9rem', color:S.text, fontSize:'0.9rem', direction:'rtl', marginBottom:'1.5rem', boxSizing:'border-box' }} />

        {loading && <div style={{ textAlign:'center', padding:'4rem', color:S.goldDim }}>טוען סיפורים...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'4rem', color:S.goldDim }}>
            <div style={{ fontSize:'3rem', marginBottom:12 }}>📝</div>
            <p>{search ? 'לא נמצאו סיפורים' : 'אין סיפורים עדיין'}</p>
            {canEdit && !search && (
              <button onClick={openNew}
                style={{ marginTop:'1rem', background:S.gold, color:'#0d0702', border:'none', borderRadius:8, padding:'0.6rem 1.4rem', cursor:'pointer', fontWeight:'bold' }}>
                כתוב את הסיפור הראשון
              </button>
            )}
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {filtered.map(s => (
            <StoryCard key={s.id} story={s} canEdit={canEdit}
              onEdit={() => openEdit(s)}
              onDelete={() => deleteStory(s.id)} />
          ))}
        </div>
      </div>

      {showEditor && (
        <StoryEditor story={editStory} people={people} onSave={saveStory} onClose={() => { setShowEditor(false); setEditStory(undefined) }} />
      )}
    <FloatingEditButton editPath="stories-edit" />
    </main>
  )
}
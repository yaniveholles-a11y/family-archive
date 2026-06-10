'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, getSession } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

// ─── Types ─────────────────────────────────────────────────────────────────────
type Person = {
  id: number; first_name: string; last_name: string
  birth_date?: string; birth_place?: string
  death_date?: string; death_place?: string
  photo_url?: string; bio?: string; family_id?: number; gender?: string
}
type Photo     = { id: number; url: string; caption?: string; created_at?: string }
type TimelineEvent = { id: number; title: string; description?: string; event_date?: string; event_type: string }
type Doc       = { id: number; name: string; url: string; doc_type?: string; created_at?: string }
type Interview = { id: number; title: string; content?: string; audio_url?: string; created_at?: string }
type Relation  = { id: number; relation_type: string; related: { id: number; first_name: string; last_name: string; photo_url?: string } }
type Migration = { id: number; city?: string; country?: string; year_from?: number; year_to?: number; notes?: string }

// ─── Constants ─────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = { birth:'#2a7a4a', death:'#5a5a5a', marriage:'#c9a227', general:'#3a6a9a', education:'#8a5a28' }
const TYPE_ICON:  Record<string, string> = { birth:'🌱', death:'🕯️', marriage:'💍', general:'📌', education:'📚' }
const TYPE_LABEL: Record<string, string> = { birth:'לידה', death:'פטירה', marriage:'נישואים', general:'כללי', education:'השכלה' }
const REL_LABEL:  Record<string, string> = { parent:'הורה', child:'ילד/ה', spouse:'בן/בת זוג', sibling:'אח/אחות' }

const TABS = [
  { key:'about',     icon:'👤', label:'אודות'    },
  { key:'timeline',  icon:'📅', label:'ציר זמן'  },
  { key:'gallery',   icon:'🖼️', label:'גלריה'    },
  { key:'documents', icon:'📄', label:'מסמכים'   },
  { key:'interviews',icon:'🎙️', label:'הקלטות'   },
  { key:'relations', icon:'👨‍👩‍👧', label:'קשרים'    },
  { key:'migration', icon:'🌍', label:'נדודים'   },
]

function formatDate(d?: string) {
  if (!d) return null
  try { return new Date(d).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' }) }
  catch { return d }
}

// ─── Input style helper ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(8,6,6,0.8)',
  border: '1px solid rgba(42,22,8,0.8)',
  borderRadius: 9,
  padding: '0.6rem 0.9rem',
  color: '#f0e8d0',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  boxSizing: 'border-box' as const,
  direction: 'rtl' as const,
}
const inputLtrStyle: React.CSSProperties = { ...inputStyle, direction: 'ltr' }

// ─── Shared micro-components ───────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem', flexDirection:'column', gap:'0.75rem' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease:'linear' }}
        style={{ width:32, height:32, borderRadius:'50%', border:'2px solid rgba(201,162,39,0.15)', borderTopColor:'#c9a227' }}
      />
      <span style={{ color:'rgba(201,162,39,0.35)', fontSize:'0.75rem' }}>טוען...</span>
    </div>
  )
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      style={{ textAlign:'center', padding:'3.5rem 2rem', color:'rgba(184,154,90,0.35)' }}
    >
      <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>{icon}</div>
      <p style={{ fontSize:'0.85rem' }}>{text}</p>
    </motion.div>
  )
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:'rgba(16,10,4,0.9)',
      border:'1px solid rgba(42,22,8,0.8)',
      borderRadius:12,
      padding:'1.35rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize:'0.62rem', color:'rgba(201,162,39,0.4)', letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:'0.9rem' }}>
      {children}
    </div>
  )
}

// ─── TAB: ABOUT ────────────────────────────────────────────────────────────────
function TabAbout({ person, canEdit, id, locale }: { person: Person; canEdit: boolean; id: string; locale: string }) {
  const fields = [
    { label:'תאריך לידה',  value: formatDate(person.birth_date) },
    { label:'מקום לידה',   value: person.birth_place },
    { label:'תאריך פטירה', value: formatDate(person.death_date) },
    { label:'מקום פטירה',  value: person.death_place },
  ].filter(f => f.value)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
      {person.bio && (
        <SectionCard>
          <SectionLabel>סיפור חיים</SectionLabel>
          <p style={{ color:'rgba(240,232,208,0.82)', lineHeight:1.85, fontSize:'0.93rem', whiteSpace:'pre-wrap' }}>
            {person.bio}
          </p>
        </SectionCard>
      )}
      {fields.length > 0 && (
        <SectionCard>
          <SectionLabel>פרטים</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem' }}>
            {fields.map(f => (
              <div key={f.label}>
                <div style={{ fontSize:'0.68rem', color:'rgba(201,162,39,0.38)', marginBottom:'0.2rem', letterSpacing:'0.08em' }}>{f.label}</div>
                <div style={{ color:'#f0e8d0', fontSize:'0.9rem' }}>{f.value}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      {canEdit && (
        <a href={`/${locale}/people/${id}/edit`} className="cbtn cbtn-primary" style={{ alignSelf:'flex-start' }}>
          ✏️ ערוך פרטים
        </a>
      )}
      {!person.bio && fields.length === 0 && <Empty icon="👤" text="אין פרטים עדיין" />}
    </div>
  )
}

// ─── TAB: TIMELINE ─────────────────────────────────────────────────────────────
function TabTimeline({ id }: { id: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title:'', event_date:'', event_type:'general', description:'' })
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('timeline_events').select('*').eq('person_id', id).order('event_date', { ascending:true })
    setEvents(data || [])
    setLoading(false)
  }
  async function save() {
    if (!form.title) return
    setSaving(true)
    await supabase.from('timeline_events').insert({ ...form, person_id:id })
    setForm({ title:'', event_date:'', event_type:'general', description:'' })
    setAdding(false); setSaving(false); load()
  }
  async function del(eid: number) {
    if (!confirm('למחוק?')) return
    await supabase.from('timeline_events').delete().eq('id', eid)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <button onClick={() => setAdding(a => !a)} className="cbtn cbtn-primary" style={{ alignSelf:'flex-start' }}>
        {adding ? '✕ ביטול' : '+ הוסף אירוע'}
      </button>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            transition={{ duration:0.35, ease:[0.16,1,0.3,1] }}
          >
            <SectionCard style={{ border:'1px solid rgba(201,162,39,0.25)', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <input placeholder="כותרת האירוע *" value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} style={inputStyle} />
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <input type="date" value={form.event_date} onChange={e => setForm(f => ({...f, event_date:e.target.value}))} style={{ ...inputStyle, flex:1 }} />
                <select value={form.event_type} onChange={e => setForm(f => ({...f, event_type:e.target.value}))}
                  style={{ ...inputStyle, flex:1 }}>
                  {Object.entries(TYPE_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <textarea placeholder="תיאור (אופציונלי)" value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}
                rows={2} style={{ ...inputStyle, resize:'vertical' }} />
              <button onClick={save} disabled={saving} className="cbtn cbtn-primary" style={{ alignSelf:'flex-start' }}>
                {saving ? 'שומר...' : 'שמור אירוע'}
              </button>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {events.length === 0 && !adding && <Empty icon="📅" text="אין אירועים עדיין" />}

      <div className="ctimeline">
        {events.length > 0 && <div className="ctimeline-line" />}
        {events.map((ev, i) => (
          <motion.div
            key={ev.id}
            className="ctimeline-item"
            initial={{ opacity:0, x:12 }}
            animate={{ opacity:1, x:0 }}
            transition={{ delay:i*0.04, duration:0.4, ease:[0.16,1,0.3,1] }}
          >
            <div className="ctimeline-dot" style={{ background:TYPE_COLOR[ev.event_type] || '#3a2a10' }}>
              {TYPE_ICON[ev.event_type] || '📌'}
            </div>
            <div className="ctimeline-body">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem' }}>
                <div>
                  <span className="ctimeline-title">{ev.title}</span>
                  <span style={{ marginRight:'0.5rem', fontSize:'0.65rem', background:`${TYPE_COLOR[ev.event_type]}22`, color:TYPE_COLOR[ev.event_type], padding:'1px 6px', borderRadius:10 }}>
                    {TYPE_LABEL[ev.event_type]}
                  </span>
                </div>
                <button onClick={() => del(ev.id)} style={{ background:'none', border:'none', color:'rgba(90,30,30,0.6)', cursor:'pointer', fontSize:13, flexShrink:0 }}>✕</button>
              </div>
              {ev.event_date && <div className="ctimeline-date">{formatDate(ev.event_date)}</div>}
              {ev.description && <div className="ctimeline-desc">{ev.description}</div>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── TAB: GALLERY ──────────────────────────────────────────────────────────────
function TabGallery({ id }: { id: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<Photo | null>(null)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('photos').select('*').eq('person_id', id).order('created_at', { ascending:false })
    setPhotos(data || [])
    setLoading(false)
  }
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${id}/${Date.now()}-${file.name}`
    await supabase.storage.from('photos').upload(path, file)
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    await supabase.from('photos').insert({ person_id:id, url:urlData.publicUrl, caption })
    setCaption(''); setUploading(false); load()
  }
  async function del(pid: number) {
    if (!confirm('למחוק?')) return
    await supabase.from('photos').delete().eq('id', pid)
    setLightbox(null); load()
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <SectionCard style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
        <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="כיתוב (אופציונלי)"
          style={{ ...inputStyle, flex:'1 1 160px', width:'auto' }} />
        <label className="cbtn cbtn-primary" style={{ cursor:'pointer', whiteSpace:'nowrap' }}>
          {uploading ? 'מעלה...' : '📷 בחר תמונה'}
          <input type="file" accept="image/*" onChange={upload} style={{ display:'none' }} disabled={uploading} />
        </label>
      </SectionCard>

      {photos.length === 0 && <Empty icon="🖼️" text="אין תמונות עדיין" />}

      <div className="cphoto-grid">
        {photos.map((p, i) => (
          <motion.div
            key={p.id}
            className="cphoto-thumb"
            onClick={() => setLightbox(p)}
            initial={{ opacity:0, scale:0.9 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ delay:i*0.04, duration:0.4, ease:[0.34,1.56,0.64,1] }}
          >
            <img src={p.url} alt={p.caption || ''} />
            <div className="cphoto-overlay">
              <span style={{ fontSize:'1.2rem' }}>🔍</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setLightbox(null)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:'1rem', backdropFilter:'blur(8px)' }}
          >
            <motion.div
              initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
              transition={{ duration:0.3, ease:[0.34,1.56,0.64,1] }}
              onClick={e => e.stopPropagation()}
              style={{ background:'rgba(14,8,2,0.98)', border:'1px solid rgba(42,22,8,0.8)', borderRadius:14, overflow:'hidden', maxWidth:720, width:'100%' }}
            >
              <img src={lightbox.url} alt={lightbox.caption || ''} style={{ width:'100%', maxHeight:'70vh', objectFit:'contain', display:'block' }} />
              <div style={{ padding:'0.9rem 1.1rem', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'0.5rem', borderTop:'1px solid rgba(42,22,8,0.6)' }}>
                <span style={{ color:'rgba(184,154,90,0.6)', fontSize:'0.85rem' }}>{lightbox.caption}</span>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button onClick={() => del(lightbox.id)} style={{ background:'rgba(80,20,20,0.5)', border:'1px solid rgba(200,50,50,0.3)', borderRadius:7, color:'#f5a5a5', padding:'0.35rem 0.8rem', cursor:'pointer', fontSize:'0.8rem' }}>מחק</button>
                  <button onClick={() => setLightbox(null)} className="cbtn cbtn-ghost cbtn-sm">סגור</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── TAB: DOCUMENTS ────────────────────────────────────────────────────────────
function TabDocuments({ id }: { id: string }) {
  const [docs, setDocs]       = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName]       = useState('')
  const [docType, setDocType] = useState('general')
  const [uploading, setUploading] = useState(false)
  const DOC_ICONS:  Record<string, string> = { general:'📄', id:'🪪', certificate:'📜', photo:'🖼️', letter:'✉️' }
  const DOC_LABELS: Record<string, string> = { general:'כללי', id:'תעודת זהות', certificate:'תעודה', photo:'תמונה', letter:'מכתב' }

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('documents').select('*').eq('person_id', id).order('created_at', { ascending:false })
    setDocs(data || [])
    setLoading(false)
  }
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `docs/${id}/${Date.now()}-${file.name}`
    await supabase.storage.from('documents').upload(path, file)
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
    await supabase.from('documents').insert({ person_id:id, url:urlData.publicUrl, name:name||file.name, doc_type:docType })
    setName(''); setUploading(false); load()
  }
  async function del(did: number) {
    if (!confirm('למחוק?')) return
    await supabase.from('documents').delete().eq('id', did)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <SectionCard style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="שם המסמך (אופציונלי)"
          style={{ ...inputStyle, flex:'1 1 150px', width:'auto' }} />
        <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inputStyle, width:'auto', flex:'0 0 auto' }}>
          {Object.entries(DOC_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="cbtn cbtn-primary" style={{ cursor:'pointer', whiteSpace:'nowrap' }}>
          {uploading ? 'מעלה...' : '📎 העלה מסמך'}
          <input type="file" onChange={upload} style={{ display:'none' }} disabled={uploading} />
        </label>
      </SectionCard>

      {docs.length === 0 && <Empty icon="📄" text="אין מסמכים עדיין" />}

      <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
        {docs.map((d, i) => (
          <motion.div
            key={d.id}
            className="ccard"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:i*0.04, duration:0.35 }}
            style={{ display:'flex', alignItems:'center', gap:'0.9rem', padding:'0.9rem 1rem', cursor:'default' }}
          >
            <span style={{ fontSize:22, flexShrink:0 }}>{DOC_ICONS[d.doc_type||'general']}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:'#f0e8d0', fontWeight:500, fontSize:'0.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
              <div style={{ fontSize:'0.7rem', color:'rgba(201,162,39,0.38)', marginTop:'0.15rem' }}>{DOC_LABELS[d.doc_type||'general']}</div>
            </div>
            <a href={d.url} target="_blank" rel="noreferrer" className="cbtn cbtn-secondary cbtn-sm">פתח</a>
            <button onClick={() => del(d.id)} style={{ background:'none', border:'none', color:'rgba(90,30,30,0.6)', cursor:'pointer', fontSize:15, flexShrink:0 }}>✕</button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── TAB: INTERVIEWS ───────────────────────────────────────────────────────────
function TabInterviews({ id }: { id: string }) {
  const [items, setItems]   = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm]     = useState({ title:'', content:'', audio_url:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('interviews').select('*').eq('person_id', id).order('created_at', { ascending:false })
    setItems(data || [])
    setLoading(false)
  }
  async function save() {
    if (!form.title) return
    setSaving(true)
    await supabase.from('interviews').insert({ ...form, person_id:id })
    setForm({ title:'', content:'', audio_url:'' })
    setAdding(false); setSaving(false); load()
  }
  async function del(iid: number) {
    if (!confirm('למחוק?')) return
    await supabase.from('interviews').delete().eq('id', iid)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <button onClick={() => setAdding(a => !a)} className="cbtn cbtn-primary" style={{ alignSelf:'flex-start' }}>
        {adding ? '✕ ביטול' : '🎙️ הוסף הקלטה / עדות'}
      </button>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
            <SectionCard style={{ border:'1px solid rgba(201,162,39,0.25)', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <input placeholder="כותרת *" value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} style={inputStyle} />
              <input placeholder="קישור לקובץ שמע (אופציונלי)" value={form.audio_url} onChange={e => setForm(f => ({...f, audio_url:e.target.value}))} style={inputLtrStyle} />
              <textarea placeholder="תמלול / תוכן" value={form.content} onChange={e => setForm(f => ({...f, content:e.target.value}))}
                rows={4} style={{ ...inputStyle, resize:'vertical' }} />
              <button onClick={save} disabled={saving} className="cbtn cbtn-primary" style={{ alignSelf:'flex-start' }}>
                {saving ? 'שומר...' : 'שמור'}
              </button>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 && !adding && <Empty icon="🎙️" text="אין הקלטות עדיין" />}

      {items.map((iv, i) => (
        <motion.div key={iv.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}>
          <SectionCard>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.6rem' }}>
              <span style={{ fontWeight:500, color:'#f0e8d0', fontSize:'0.95rem' }}>🎙️ {iv.title}</span>
              <button onClick={() => del(iv.id)} style={{ background:'none', border:'none', color:'rgba(90,30,30,0.6)', cursor:'pointer', fontSize:14 }}>✕</button>
            </div>
            {iv.audio_url && (
              <audio controls src={iv.audio_url} style={{ width:'100%', marginBottom:'0.6rem', borderRadius:8, height:36 }} />
            )}
            {iv.content && (
              <p style={{ color:'rgba(240,232,208,0.7)', fontSize:'0.88rem', lineHeight:1.75, whiteSpace:'pre-wrap' }}>{iv.content}</p>
            )}
          </SectionCard>
        </motion.div>
      ))}
    </div>
  )
}

// ─── TAB: RELATIONS ────────────────────────────────────────────────────────────
function TabRelations({ id, canEdit, locale }: { id: string; canEdit: boolean; locale: string }) {
  const [relations, setRelations] = useState<Relation[]>([])
  const [people, setPeople]       = useState<{id:number;first_name:string;last_name:string}[]>([])
  const [loading, setLoading]     = useState(true)
  const [selPerson, setSelPerson] = useState('')
  const [relType, setRelType]     = useState('parent')
  const [saving, setSaving]       = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const { data: rels } = await supabase.from('family_relations').select('id,relation_type,related:related_person_id(id,first_name,last_name,photo_url)').eq('person_id', id)
    setRelations((rels || []) as unknown as Relation[])
    const { data: pp } = await supabase.from('people').select('id,first_name,last_name').neq('id', id).order('last_name')
    setPeople(pp || [])
    setLoading(false)
  }
  async function add() {
    if (!selPerson) return
    setSaving(true)
    await supabase.from('family_relations').insert({ person_id:id, related_person_id:selPerson, relation_type:relType })
    setSelPerson(''); setSaving(false); load()
  }
  async function del(rid: number) {
    await supabase.from('family_relations').delete().eq('id', rid)
    load()
  }

  if (loading) return <Spinner />

  const grouped: Record<string, Relation[]> = {}
  for (const r of relations) {
    if (!grouped[r.relation_type]) grouped[r.relation_type] = []
    grouped[r.relation_type].push(r)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
      {canEdit && (
        <SectionCard style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <select value={selPerson} onChange={e => setSelPerson(e.target.value)} style={{ ...inputStyle, flex:'1 1 160px', width:'auto' }}>
            <option value="">בחר אדם...</option>
            {people.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(' ')}</option>)}
          </select>
          <select value={relType} onChange={e => setRelType(e.target.value)} style={{ ...inputStyle, width:'auto', flex:'0 0 auto' }}>
            {Object.entries(REL_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={add} disabled={saving||!selPerson} className="cbtn cbtn-primary" style={{ opacity:selPerson?1:0.4 }}>
            {saving ? '...' : '+ הוסף'}
          </button>
        </SectionCard>
      )}

      {relations.length === 0 && <Empty icon="👨‍👩‍👧" text="אין קשרים משפחתיים עדיין" />}

      {Object.entries(grouped).map(([type, rels]) => (
        <div key={type}>
          <div style={{ fontSize:'0.63rem', color:'rgba(201,162,39,0.4)', letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:'0.6rem' }}>
            {REL_LABEL[type] || type}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {rels.map((r, i) => (
              <motion.a
                key={r.id}
                href={`/${locale}/people/${r.related.id}`}
                className="cperson-card"
                initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:i*0.04, duration:0.35 }}
              >
                {r.related.photo_url
                  ? <img src={r.related.photo_url} className="cavatar" style={{ objectFit:'cover' }} />
                  : <div className="cavatar">👤</div>
                }
                <span className="cperson-name">{r.related.first_name} {r.related.last_name}</span>
                {canEdit && (
                  <button onClick={e => { e.preventDefault(); del(r.id) }}
                    style={{ background:'none', border:'none', color:'rgba(90,30,30,0.6)', cursor:'pointer', fontSize:14, marginRight:'auto' }}>✕</button>
                )}
                <span style={{ color:'rgba(201,162,39,0.25)', fontSize:'0.8rem' }}>←</span>
              </motion.a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── TAB: MIGRATION ────────────────────────────────────────────────────────────
function TabMigration({ id, canEdit }: { id: string; canEdit: boolean }) {
  const [stations, setStations] = useState<Migration[]>([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [form, setForm]         = useState({ country:'', city:'', year_from:'', year_to:'', notes:'' })
  const [saving, setSaving]     = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('migration_stations').select('*').eq('person_id', id).order('year_from', { ascending:true })
    setStations(data || [])
    setLoading(false)
  }
  async function save() {
    if (!form.country && !form.city) return
    setSaving(true)
    await supabase.from('migration_stations').insert({
      person_id:id, country:form.country||null, city:form.city||null,
      year_from:form.year_from ? Number(form.year_from) : null,
      year_to:form.year_to ? Number(form.year_to) : null,
      notes:form.notes||null,
    })
    setForm({ country:'', city:'', year_from:'', year_to:'', notes:'' })
    setAdding(false); setSaving(false); load()
  }
  async function del(sid: number) {
    if (!confirm('למחוק?')) return
    await supabase.from('migration_stations').delete().eq('id', sid)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {canEdit && (
        <button onClick={() => setAdding(a => !a)} className="cbtn cbtn-primary" style={{ alignSelf:'flex-start' }}>
          {adding ? '✕ ביטול' : '+ הוסף תחנה'}
        </button>
      )}

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
            <SectionCard style={{ border:'1px solid rgba(201,162,39,0.25)', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <input placeholder="מדינה" value={form.country} onChange={e => setForm(f => ({...f, country:e.target.value}))} style={inputStyle} />
                <input placeholder="עיר" value={form.city} onChange={e => setForm(f => ({...f, city:e.target.value}))} style={inputStyle} />
                <input placeholder="שנת הגעה" type="number" value={form.year_from} onChange={e => setForm(f => ({...f, year_from:e.target.value}))} style={{ ...inputStyle, direction:'ltr' }} />
                <input placeholder="שנת עזיבה" type="number" value={form.year_to} onChange={e => setForm(f => ({...f, year_to:e.target.value}))} style={{ ...inputStyle, direction:'ltr' }} />
              </div>
              <textarea placeholder="הערות (אופציונלי)" value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))}
                rows={2} style={{ ...inputStyle, resize:'vertical' }} />
              <button onClick={save} disabled={saving} className="cbtn cbtn-primary" style={{ alignSelf:'flex-start' }}>
                {saving ? 'שומר...' : 'שמור תחנה'}
              </button>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {stations.length === 0 && !adding && <Empty icon="🌍" text="אין תחנות נדידה עדיין" />}

      <div className="ctimeline">
        {stations.length > 1 && <div className="ctimeline-line" />}
        {stations.map((st, i) => (
          <motion.div
            key={st.id}
            className="ctimeline-item"
            initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }}
            transition={{ delay:i*0.06, duration:0.4, ease:[0.16,1,0.3,1] }}
          >
            <div className="ctimeline-dot" style={{ background: i===0 ? '#2a4a3a' : i===stations.length-1 ? '#3a2a10' : '#1a2a3a', border:'2px solid var(--c-ink)' }}>
              {i === 0 ? '🏠' : i === stations.length - 1 ? '📍' : '🚂'}
            </div>
            <div className="ctimeline-body">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <span className="ctimeline-title">{[st.city, st.country].filter(Boolean).join(', ')}</span>
                  {(st.year_from || st.year_to) && (
                    <span style={{ marginRight:'0.5rem', fontSize:'0.72rem', color:'rgba(201,162,39,0.4)' }}>
                      {st.year_from||'?'}{st.year_to ? ` – ${st.year_to}` : ''}
                    </span>
                  )}
                </div>
                {canEdit && (
                  <button onClick={() => del(st.id)} style={{ background:'none', border:'none', color:'rgba(90,30,30,0.6)', cursor:'pointer', fontSize:13, flexShrink:0 }}>✕</button>
                )}
              </div>
              {st.notes && <div className="ctimeline-desc">{st.notes}</div>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function PersonProfile() {
  const { id, locale } = useParams() as { id: string; locale: string }
  const router  = useRouter()
  const [person, setPerson]   = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [tab, setTab]         = useState('about')

  useEffect(() => {
    async function init() {
      const session = await getSession()
      if (!session) { router.push(`/${locale}/login`); return }
      const { data: rd } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle()
      setCanEdit(rd?.role === 'admin' || rd?.role === 'editor')
      const { data } = await supabase.from('people')
        .select('id,first_name,last_name,birth_date,birth_place,death_date,death_place,photo_url,bio,family_id,gender')
        .eq('id', id).single()
      setPerson(data)
      setLoading(false)
    }
    init()
  }, [id, router])

  if (loading) return (
    <main dir="rtl" style={{ minHeight:'100vh', background:'var(--c-ink)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner />
    </main>
  )

  if (!person) return (
    <main dir="rtl" style={{ minHeight:'100vh', background:'var(--c-ink)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1rem' }}>
      <p style={{ color:'rgba(184,154,90,0.5)' }}>אדם לא נמצא</p>
      <a href={`/${locale}`} className="cbtn cbtn-secondary cbtn-sm">חזרה</a>
    </main>
  )

  const isDead = !!person.death_date
  const genderAccent = person.gender === 'male' ? 'rgba(42,90,140,0.35)' : person.gender === 'female' ? 'rgba(120,40,80,0.35)' : 'rgba(42,22,8,0.35)'
  const genderBorder = person.gender === 'male' ? 'rgba(60,130,200,0.5)' : person.gender === 'female' ? 'rgba(200,60,120,0.5)' : 'rgba(201,162,39,0.4)'

  return (
    <main dir="rtl" style={{ minHeight:'100vh', background:'var(--c-ink)', color:'var(--c-text)', fontFamily:'var(--font-body)' }}>

      {/* ── TOPBAR ── */}
      <motion.div
        initial={{ opacity:0, y:-16 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.6, ease:[0.16,1,0.3,1] }}
        style={{
          background:'rgba(8,6,4,0.95)', backdropFilter:'blur(16px)',
          borderBottom:'1px solid rgba(42,22,8,0.6)',
          padding:'0.7rem 1.5rem',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          position:'sticky', top:0, zIndex:100,
        }}
      >
        <a href={`/${locale}/people`} style={{ color:'rgba(201,162,39,0.6)', textDecoration:'none', fontSize:'0.82rem', display:'inline-flex', alignItems:'center', gap:'0.3rem' }}>
          → כל האנשים
        </a>
        <div style={{ display:'flex', gap:'0.6rem', alignItems:'center' }}>
          <a href={`/${locale}/people/${id}/tree`} className="cbtn cbtn-ghost cbtn-sm">🌳 עץ</a>
          {canEdit && <a href={`/${locale}/people/${id}/edit`} className="cbtn cbtn-primary cbtn-sm">✏️ עריכה</a>}
        </div>
      </motion.div>

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        transition={{ duration:0.7 }}
        style={{
          background:`linear-gradient(180deg, ${genderAccent} 0%, rgba(8,6,6,0) 100%)`,
          padding:'2rem 1.5rem 0',
          borderBottom:'1px solid rgba(42,22,8,0.5)',
        }}
      >
        <div style={{ maxWidth:780, margin:'0 auto' }}>
          <div style={{ display:'flex', gap:'1.5rem', alignItems:'flex-end', flexWrap:'wrap', paddingBottom:'1.5rem' }}>
            {/* Photo */}
            <motion.div
              initial={{ scale:0.85, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              transition={{ duration:0.6, delay:0.15, ease:[0.34,1.56,0.64,1] }}
              style={{ position:'relative', flexShrink:0 }}
            >
              {person.photo_url ? (
                <img src={person.photo_url} alt={person.first_name}
                  style={{ width:110, height:110, borderRadius:14, objectFit:'cover', border:`3px solid ${genderBorder}`, boxShadow:`0 0 30px ${genderAccent}, 0 4px 20px rgba(0,0,0,0.6)` }} />
              ) : (
                <div style={{ width:110, height:110, borderRadius:14, background:'rgba(26,16,8,0.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, border:`3px solid ${genderBorder}`, boxShadow:`0 0 20px ${genderAccent}` }}>
                  {isDead ? '🕯️' : '👤'}
                </div>
              )}
              {isDead && person.photo_url && (
                <div style={{ position:'absolute', bottom:-6, right:-6, fontSize:18, filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>🕯️</div>
              )}
            </motion.div>

            {/* Name + dates */}
            <div style={{ flex:1, minWidth:200 }}>
              <motion.h1
                initial={{ opacity:0, y:16 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:0.7, delay:0.2, ease:[0.16,1,0.3,1] }}
                style={{ fontFamily:'var(--font-display)', fontSize:clamp('1.6rem','4vw','2.4rem'), margin:0, marginBottom:'0.4rem', lineHeight:1.2 }}
              >
                {person.first_name}{' '}
                <span style={{ color:'var(--c-gold)' }}>{person.last_name}</span>
              </motion.h1>
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay:0.35 }}
                style={{ fontSize:'0.85rem', color:'rgba(240,232,208,0.45)', display:'flex', flexDirection:'column', gap:'0.2rem' }}
              >
                {person.birth_date && (
                  <span>🌱 {formatDate(person.birth_date)}{person.birth_place ? ` · ${person.birth_place}` : ''}</span>
                )}
                {person.death_date && (
                  <span>🕯️ {formatDate(person.death_date)}{person.death_place ? ` · ${person.death_place}` : ''}</span>
                )}
              </motion.div>
            </div>
          </div>

          {/* ── TAB BAR ── */}
          <div className="ctab-bar">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`ctab-btn${tab === t.key ? ' active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── TAB CONTENT ── */}
      <div style={{ maxWidth:780, margin:'0 auto', padding:'1.75rem 1.5rem 4rem' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }}
            transition={{ duration:0.3, ease:[0.16,1,0.3,1] }}
          >
            {tab === 'about'      && <TabAbout      person={person} canEdit={canEdit} id={id} locale={locale} />}
            {tab === 'timeline'   && <TabTimeline   id={id} />}
            {tab === 'gallery'    && <TabGallery    id={id} />}
            {tab === 'documents'  && <TabDocuments  id={id} />}
            {tab === 'interviews' && <TabInterviews id={id} />}
            {tab === 'relations'  && <TabRelations  id={id} canEdit={canEdit} locale={locale} />}
            {tab === 'migration'  && <TabMigration  id={id} canEdit={canEdit} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}

// ─── Tiny util ─────────────────────────────────────────────────────────────────
function clamp(min: string, val: string, max: string) {
  return `clamp(${min}, ${val}, ${max})`
}

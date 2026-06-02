'use client'
import { useEffect, useState, useRef } from 'react'
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

// ─── Helpers ───────────────────────────────────────────────────────────────────
const S = {
  bg:       '#0d0702',
  card:     '#1e1108',
  border:   '#3a2a10',
  gold:     '#c9a227',
  goldSoft: '#b89a5a',
  text:     '#f5e6c8',
  textDim:  '#b89a5a',
  inputBg:  '#150a01',
}

function formatDate(d?: string) {
  if (!d) return null
  try { return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

const TYPE_COLOR: Record<string, string> = { birth:'#4a9e6a', death:'#7a7a7a', marriage:'#c9a227', general:'#5a8ab0', education:'#b07a3a' }
const TYPE_ICON:  Record<string, string> = { birth:'🌱', death:'🕯️', marriage:'💍', general:'📌', education:'📚' }
const TYPE_LABEL: Record<string, string> = { birth:'לידה', death:'פטירה', marriage:'נישואים', general:'כללי', education:'השכלה' }
const REL_LABEL:  Record<string, string> = { parent:'הורה', child:'ילד', spouse:'בן/בת זוג', sibling:'אח/אחות' }

// ─── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { key:'about',     icon:'👤', label:'אודות'      },
  { key:'timeline',  icon:'📅', label:'ציר זמן'    },
  { key:'gallery',   icon:'🖼️', label:'גלריה'      },
  { key:'documents', icon:'📄', label:'מסמכים'     },
  { key:'interviews',icon:'🎙️', label:'הקלטות'     },
  { key:'relations', icon:'👨‍👩‍👧', label:'קשרים'      },
  { key:'migration', icon:'🌍', label:'נדודים'     },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function TabAbout({ person, canEdit, id }: { person: Person; canEdit: boolean; id: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      {/* Bio */}
      {person.bio && (
        <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:12, padding:'1.5rem' }}>
          <div style={{ fontSize:'0.75rem', color:S.gold, fontWeight:'bold', marginBottom:8, letterSpacing:'0.05em' }}>סיפור חיים</div>
          <p style={{ color:S.text, lineHeight:1.8, fontSize:'0.95rem', whiteSpace:'pre-wrap' }}>{person.bio}</p>
        </div>
      )}
      {/* Details grid */}
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:12, padding:'1.5rem' }}>
        <div style={{ fontSize:'0.75rem', color:S.gold, fontWeight:'bold', marginBottom:12, letterSpacing:'0.05em' }}>פרטים</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          {[
            { label:'תאריך לידה', value: formatDate(person.birth_date) },
            { label:'מקום לידה',  value: person.birth_place },
            { label:'תאריך פטירה',value: formatDate(person.death_date) },
            { label:'מקום פטירה', value: person.death_place },
          ].map(r => r.value ? (
            <div key={r.label}>
              <div style={{ fontSize:'0.7rem', color:S.textDim, marginBottom:2 }}>{r.label}</div>
              <div style={{ color:S.text, fontSize:'0.9rem' }}>{r.value}</div>
            </div>
          ) : null)}
        </div>
      </div>
      {canEdit && (
        <a href={`/people/${id}/edit`}
          style={{ display:'inline-block', background:S.gold, color:'#0d0702', padding:'0.55rem 1.25rem', borderRadius:8, textDecoration:'none', fontWeight:'bold', fontSize:'0.88rem', alignSelf:'flex-start' }}>
          ✏️ ערוך פרטים
        </a>
      )}
    </div>
  )
}

function TabTimeline({ id }: { id: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title:'', event_date:'', event_type:'general', description:'' })
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('timeline_events').select('*').eq('person_id', id).order('event_date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title) return
    setSaving(true)
    await supabase.from('timeline_events').insert({ ...form, person_id: id })
    setForm({ title:'', event_date:'', event_type:'general', description:'' })
    setAdding(false)
    setSaving(false)
    load()
  }

  async function del(eid: number) {
    if (!confirm('למחוק?')) return
    await supabase.from('timeline_events').delete().eq('id', eid)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <button onClick={() => setAdding(a => !a)}
        style={{ alignSelf:'flex-start', background:S.gold, color:'#0d0702', border:'none', borderRadius:8, padding:'0.5rem 1.1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem' }}>
        {adding ? '✕ ביטול' : '+ הוסף אירוע'}
      </button>

      {adding && (
        <div style={{ background:S.card, border:`1px solid ${S.gold}`, borderRadius:12, padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <input placeholder="כותרת האירוע *" value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))}
            style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem', direction:'rtl' }} />
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <input type="date" value={form.event_date} onChange={e => setForm(f => ({...f, event_date:e.target.value}))}
              style={{ flex:1, background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem' }} />
            <select value={form.event_type} onChange={e => setForm(f => ({...f, event_type:e.target.value}))}
              style={{ flex:1, background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem' }}>
              {Object.entries(TYPE_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <textarea placeholder="תיאור (אופציונלי)" value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}
            rows={2} style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem', resize:'vertical', direction:'rtl' }} />
          <button onClick={save} disabled={saving}
            style={{ background:S.gold, color:'#0d0702', border:'none', borderRadius:7, padding:'0.55rem 1.1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.88rem', alignSelf:'flex-start' }}>
            {saving ? 'שומר...' : 'שמור אירוע'}
          </button>
        </div>
      )}

      {events.length === 0 && !adding && (
        <Empty icon="📅" text="אין אירועים עדיין" />
      )}

      <div style={{ position:'relative' }}>
        {/* Vertical line */}
        {events.length > 0 && <div style={{ position:'absolute', top:0, bottom:0, right:20, width:2, background:S.border }} />}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {events.map(ev => (
            <div key={ev.id} style={{ display:'flex', gap:'1rem', alignItems:'flex-start' }}>
              <div style={{ width:42, height:42, borderRadius:'50%', background:TYPE_COLOR[ev.event_type] || '#3a2a10', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, zIndex:1, border:`3px solid ${S.bg}` }}>
                {TYPE_ICON[ev.event_type] || '📌'}
              </div>
              <div style={{ flex:1, background:S.card, border:`1px solid ${S.border}`, borderRadius:10, padding:'0.9rem 1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <span style={{ fontWeight:'bold', color:S.text, fontSize:'0.95rem' }}>{ev.title}</span>
                    <span style={{ marginRight:8, fontSize:'0.7rem', background:`${TYPE_COLOR[ev.event_type]}33`, color:TYPE_COLOR[ev.event_type], padding:'1px 7px', borderRadius:10 }}>
                      {TYPE_LABEL[ev.event_type]}
                    </span>
                  </div>
                  <button onClick={() => del(ev.id)} style={{ background:'none', border:'none', color:'#5a2a2a', cursor:'pointer', fontSize:14 }}>✕</button>
                </div>
                {ev.event_date && <div style={{ fontSize:'0.78rem', color:S.textDim, marginTop:3 }}>{formatDate(ev.event_date)}</div>}
                {ev.description && <div style={{ fontSize:'0.85rem', color:S.text, marginTop:6, lineHeight:1.6 }}>{ev.description}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabGallery({ id }: { id: string }) {
  const [photos, setPhotos]     = useState<Photo[]>([])
  const [loading, setLoading]   = useState(true)
  const [caption, setCaption]   = useState('')
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<Photo | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('photos').select('*').eq('person_id', id).order('created_at', { ascending: false })
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
    await supabase.from('photos').insert({ person_id: id, url: urlData.publicUrl, caption })
    setCaption('')
    setUploading(false)
    load()
  }

  async function del(pid: number) {
    if (!confirm('למחוק?')) return
    await supabase.from('photos').delete().eq('id', pid)
    setLightbox(null)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {/* Upload bar */}
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:12, padding:'1rem', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
        <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="כיתוב (אופציונלי)"
          style={{ flex:1, minWidth:160, background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.5rem 0.8rem', color:S.text, fontSize:'0.88rem', direction:'rtl' }} />
        <label style={{ background:S.gold, color:'#0d0702', borderRadius:8, padding:'0.5rem 1.1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem', whiteSpace:'nowrap' }}>
          {uploading ? 'מעלה...' : '📷 בחר תמונה'}
          <input type="file" accept="image/*" onChange={upload} style={{ display:'none' }} disabled={uploading} />
        </label>
      </div>

      {photos.length === 0 && <Empty icon="🖼️" text="אין תמונות עדיין" />}

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'0.75rem' }}>
        {photos.map(p => (
          <div key={p.id} onClick={() => setLightbox(p)} style={{ cursor:'pointer', borderRadius:10, overflow:'hidden', border:`1px solid ${S.border}`, background:S.card, transition:'border-color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = S.gold)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = S.border)}>
            <img src={p.url} alt={p.caption} style={{ width:'100%', height:140, objectFit:'cover', display:'block' }} />
            {p.caption && <div style={{ padding:'0.4rem 0.6rem', fontSize:'0.75rem', color:S.textDim }}>{p.caption}</div>}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position:'fixed', inset:0, background:'#000000cc', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:S.card, borderRadius:14, overflow:'hidden', maxWidth:720, width:'100%', border:`1px solid ${S.border}` }}>
            <img src={lightbox.url} alt={lightbox.caption} style={{ width:'100%', maxHeight:'70vh', objectFit:'contain', display:'block' }} />
            <div style={{ padding:'0.9rem 1.1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:S.textDim, fontSize:'0.88rem' }}>{lightbox.caption}</span>
              <div style={{ display:'flex', gap:'0.6rem' }}>
                <button onClick={() => del(lightbox.id)} style={{ background:'#5a1a1a', border:'none', borderRadius:6, color:'#f5a5a5', padding:'0.4rem 0.9rem', cursor:'pointer', fontSize:'0.82rem' }}>מחק</button>
                <button onClick={() => setLightbox(null)} style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:6, color:S.textDim, padding:'0.4rem 0.9rem', cursor:'pointer', fontSize:'0.82rem' }}>סגור</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabDocuments({ id }: { id: string }) {
  const [docs, setDocs]       = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName]       = useState('')
  const [docType, setDocType] = useState('general')
  const [uploading, setUploading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('documents').select('*').eq('person_id', id).order('created_at', { ascending: false })
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
    await supabase.from('documents').insert({ person_id: id, url: urlData.publicUrl, name: name || file.name, doc_type: docType })
    setName('')
    setUploading(false)
    load()
  }

  async function del(did: number) {
    if (!confirm('למחוק?')) return
    await supabase.from('documents').delete().eq('id', did)
    load()
  }

  const DOC_ICONS: Record<string, string> = { general:'📄', id:'🪪', certificate:'📜', photo:'🖼️', letter:'✉️' }
  const DOC_LABELS: Record<string, string> = { general:'כללי', id:'תעודת זהות', certificate:'תעודה', photo:'תמונה', letter:'מכתב' }

  if (loading) return <Spinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:12, padding:'1rem', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="שם המסמך (אופציונלי)"
          style={{ flex:1, minWidth:150, background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.5rem 0.8rem', color:S.text, fontSize:'0.88rem', direction:'rtl' }} />
        <select value={docType} onChange={e => setDocType(e.target.value)}
          style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.5rem 0.8rem', color:S.text, fontSize:'0.88rem' }}>
          {Object.entries(DOC_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label style={{ background:S.gold, color:'#0d0702', borderRadius:8, padding:'0.5rem 1.1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem', whiteSpace:'nowrap' }}>
          {uploading ? 'מעלה...' : '📎 העלה מסמך'}
          <input type="file" onChange={upload} style={{ display:'none' }} disabled={uploading} />
        </label>
      </div>

      {docs.length === 0 && <Empty icon="📄" text="אין מסמכים עדיין" />}

      <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
        {docs.map(d => (
          <div key={d.id} style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:10, padding:'0.9rem 1rem', display:'flex', alignItems:'center', gap:'0.9rem' }}>
            <span style={{ fontSize:22 }}>{DOC_ICONS[d.doc_type || 'general']}</span>
            <div style={{ flex:1 }}>
              <div style={{ color:S.text, fontWeight:'bold', fontSize:'0.9rem' }}>{d.name}</div>
              <div style={{ fontSize:'0.72rem', color:S.textDim }}>{DOC_LABELS[d.doc_type || 'general']}</div>
            </div>
            <a href={d.url} target="_blank" rel="noreferrer"
              style={{ color:S.gold, textDecoration:'none', fontSize:'0.82rem', border:`1px solid ${S.gold}`, borderRadius:6, padding:'0.3rem 0.7rem' }}>
              פתח
            </a>
            <button onClick={() => del(d.id)} style={{ background:'none', border:'none', color:'#5a2a2a', cursor:'pointer', fontSize:16 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabInterviews({ id }: { id: string }) {
  const [items, setItems]     = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState({ title:'', content:'', audio_url:'' })
  const [saving, setSaving]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('interviews').select('*').eq('person_id', id).order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title) return
    setSaving(true)
    await supabase.from('interviews').insert({ ...form, person_id: id })
    setForm({ title:'', content:'', audio_url:'' })
    setAdding(false)
    setSaving(false)
    load()
  }

  async function del(iid: number) {
    if (!confirm('למחוק?')) return
    await supabase.from('interviews').delete().eq('id', iid)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <button onClick={() => setAdding(a => !a)}
        style={{ alignSelf:'flex-start', background:S.gold, color:'#0d0702', border:'none', borderRadius:8, padding:'0.5rem 1.1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem' }}>
        {adding ? '✕ ביטול' : '🎙️ הוסף הקלטה / עדות'}
      </button>

      {adding && (
        <div style={{ background:S.card, border:`1px solid ${S.gold}`, borderRadius:12, padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <input placeholder="כותרת *" value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))}
            style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem', direction:'rtl' }} />
          <input placeholder="קישור לקובץ שמע (אופציונלי)" value={form.audio_url} onChange={e => setForm(f => ({...f, audio_url:e.target.value}))}
            style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem', direction:'ltr' }} />
          <textarea placeholder="תמלול / תוכן" value={form.content} onChange={e => setForm(f => ({...f, content:e.target.value}))}
            rows={4} style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem', resize:'vertical', direction:'rtl' }} />
          <button onClick={save} disabled={saving}
            style={{ background:S.gold, color:'#0d0702', border:'none', borderRadius:7, padding:'0.55rem 1.1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.88rem', alignSelf:'flex-start' }}>
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      )}

      {items.length === 0 && !adding && <Empty icon="🎙️" text="אין הקלטות עדיין" />}

      {items.map(iv => (
        <div key={iv.id} style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:12, padding:'1.1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontWeight:'bold', color:S.text, fontSize:'0.95rem' }}>🎙️ {iv.title}</span>
            <button onClick={() => del(iv.id)} style={{ background:'none', border:'none', color:'#5a2a2a', cursor:'pointer', fontSize:15 }}>✕</button>
          </div>
          {iv.audio_url && (
            <audio controls src={iv.audio_url} style={{ width:'100%', marginBottom:8, borderRadius:6 }} />
          )}
          {iv.content && <p style={{ color:S.text, fontSize:'0.88rem', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{iv.content}</p>}
        </div>
      ))}
    </div>
  )
}

function TabRelations({ id, canEdit }: { id: string; canEdit: boolean }) {
  const [relations, setRelations] = useState<Relation[]>([])
  const [people, setPeople]       = useState<{id:number; first_name:string; last_name:string}[]>([])
  const [loading, setLoading]     = useState(true)
  const [selPerson, setSelPerson] = useState('')
  const [relType, setRelType]     = useState('parent')
  const [saving, setSaving]       = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: rels } = await supabase
      .from('family_relations')
      .select('id, relation_type, related:related_person_id(id, first_name, last_name, photo_url)')
      .eq('person_id', id)
    setRelations((rels || []) as unknown as Relation[])
    const { data: pp } = await supabase.from('people').select('id, first_name, last_name').neq('id', id).order('last_name')
    setPeople(pp || [])
    setLoading(false)
  }

  async function add() {
    if (!selPerson) return
    setSaving(true)
    await supabase.from('family_relations').insert({ person_id: id, related_person_id: selPerson, relation_type: relType })
    setSelPerson('')
    setSaving(false)
    load()
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
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      {canEdit && (
        <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:12, padding:'1rem', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <select value={selPerson} onChange={e => setSelPerson(e.target.value)}
            style={{ flex:1, minWidth:160, background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.5rem 0.8rem', color:S.text, fontSize:'0.88rem' }}>
            <option value="">בחר אדם...</option>
            {people.map(p => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</option>)}
          </select>
          <select value={relType} onChange={e => setRelType(e.target.value)}
            style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.5rem 0.8rem', color:S.text, fontSize:'0.88rem' }}>
            {Object.entries(REL_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={add} disabled={saving || !selPerson}
            style={{ background:S.gold, color:'#0d0702', border:'none', borderRadius:7, padding:'0.5rem 1.1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem', opacity: selPerson ? 1 : 0.5 }}>
            {saving ? '...' : '+ הוסף'}
          </button>
        </div>
      )}

      {relations.length === 0 && <Empty icon="👨‍👩‍👧" text="אין קשרים משפחתיים עדיין" />}

      {Object.entries(grouped).map(([type, rels]) => (
        <div key={type}>
          <div style={{ fontSize:'0.72rem', color:S.gold, fontWeight:'bold', letterSpacing:'0.05em', marginBottom:8 }}>{REL_LABEL[type] || type}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {rels.map(r => (
              <div key={r.id} style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:10, padding:'0.75rem 1rem', display:'flex', alignItems:'center', gap:'0.9rem' }}>
                {r.related.photo_url
                  ? <img src={r.related.photo_url} style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover', border:`2px solid ${S.gold}`, flexShrink:0 }} />
                  : <div style={{ width:38, height:38, borderRadius:'50%', background:'#2a1a08', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>👤</div>
                }
                <a href={`/people/${r.related.id}`} style={{ flex:1, color:S.text, textDecoration:'none', fontWeight:'bold', fontSize:'0.9rem' }}
                  onMouseEnter={e => (e.currentTarget.style.color = S.gold)}
                  onMouseLeave={e => (e.currentTarget.style.color = S.text)}>
                  {r.related.first_name} {r.related.last_name}
                </a>
                {canEdit && (
                  <button onClick={() => del(r.id)} style={{ background:'none', border:'none', color:'#5a2a2a', cursor:'pointer', fontSize:15 }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TabMigration({ id, canEdit }: { id: string; canEdit: boolean }) {
  const [stations, setStations] = useState<Migration[]>([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [form, setForm]         = useState({ country:'', city:'', year_from:'', year_to:'', notes:'' })
  const [saving, setSaving]     = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('migration_stations').select('*').eq('person_id', id).order('year_from', { ascending: true })
    setStations(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.country && !form.city) return
    setSaving(true)
    await supabase.from('migration_stations').insert({
      person_id: id,
      country: form.country || null,
      city: form.city || null,
      year_from: form.year_from ? Number(form.year_from) : null,
      year_to: form.year_to ? Number(form.year_to) : null,
      notes: form.notes || null,
    })
    setForm({ country:'', city:'', year_from:'', year_to:'', notes:'' })
    setAdding(false)
    setSaving(false)
    load()
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
        <button onClick={() => setAdding(a => !a)}
          style={{ alignSelf:'flex-start', background:S.gold, color:'#0d0702', border:'none', borderRadius:8, padding:'0.5rem 1.1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem' }}>
          {adding ? '✕ ביטול' : '+ הוסף תחנה'}
        </button>
      )}

      {adding && (
        <div style={{ background:S.card, border:`1px solid ${S.gold}`, borderRadius:12, padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <input placeholder="מדינה" value={form.country} onChange={e => setForm(f => ({...f, country:e.target.value}))}
              style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem', direction:'rtl' }} />
            <input placeholder="עיר" value={form.city} onChange={e => setForm(f => ({...f, city:e.target.value}))}
              style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem', direction:'rtl' }} />
            <input placeholder="שנת הגעה" type="number" value={form.year_from} onChange={e => setForm(f => ({...f, year_from:e.target.value}))}
              style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem' }} />
            <input placeholder="שנת עזיבה" type="number" value={form.year_to} onChange={e => setForm(f => ({...f, year_to:e.target.value}))}
              style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem' }} />
          </div>
          <textarea placeholder="הערות (אופציונלי)" value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))}
            rows={2} style={{ background:S.inputBg, border:`1px solid ${S.border}`, borderRadius:7, padding:'0.55rem 0.8rem', color:S.text, fontSize:'0.9rem', resize:'vertical', direction:'rtl' }} />
          <button onClick={save} disabled={saving}
            style={{ background:S.gold, color:'#0d0702', border:'none', borderRadius:7, padding:'0.55rem 1.1rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.88rem', alignSelf:'flex-start' }}>
            {saving ? 'שומר...' : 'שמור תחנה'}
          </button>
        </div>
      )}

      {stations.length === 0 && !adding && <Empty icon="🌍" text="אין תחנות נדידה עדיין" />}

      {/* Timeline of stations */}
      <div style={{ position:'relative' }}>
        {stations.length > 1 && <div style={{ position:'absolute', top:24, bottom:24, right:20, width:2, background:S.border }} />}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {stations.map((st, i) => (
            <div key={st.id} style={{ display:'flex', gap:'1rem', alignItems:'flex-start' }}>
              <div style={{ width:42, height:42, borderRadius:'50%', background:'#1a3a2a', border:`3px solid ${S.gold}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, zIndex:1 }}>
                {i === 0 ? '🏠' : i === stations.length - 1 ? '📍' : '🚂'}
              </div>
              <div style={{ flex:1, background:S.card, border:`1px solid ${S.border}`, borderRadius:10, padding:'0.9rem 1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <span style={{ fontWeight:'bold', color:S.text, fontSize:'0.95rem' }}>
                      {[st.city, st.country].filter(Boolean).join(', ')}
                    </span>
                    {(st.year_from || st.year_to) && (
                      <span style={{ marginRight:8, fontSize:'0.75rem', color:S.textDim }}>
                        {st.year_from || '?'}{st.year_to ? ` – ${st.year_to}` : ''}
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <button onClick={() => del(st.id)} style={{ background:'none', border:'none', color:'#5a2a2a', cursor:'pointer', fontSize:14 }}>✕</button>
                  )}
                </div>
                {st.notes && <div style={{ fontSize:'0.83rem', color:S.textDim, marginTop:5 }}>{st.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Shared micro-components ───────────────────────────────────────────────────
function Spinner() {
  return <div style={{ color:S.textDim, padding:'2rem', textAlign:'center' }}>טוען...</div>
}
function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign:'center', padding:'3rem', color:S.textDim }}>
      <div style={{ fontSize:'2.5rem', marginBottom:12 }}>{icon}</div>
      <p>{text}</p>
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
      if (!session) { router.push('/login'); return }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle()
      setCanEdit(roleData?.role === 'admin' || roleData?.role === 'editor')
      const { data } = await supabase.from('people')
        .select('id,first_name,last_name,birth_date,birth_place,death_date,death_place,photo_url,bio,family_id,gender')
        .eq('id', id).single()
      setPerson(data)
      setLoading(false)
    }
    init()
  }, [id, router])

  if (loading) return (
    <main style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:S.textDim, fontFamily:'Arial' }}>טוען פרופיל...</p>
    </main>
  )

  if (!person) return (
    <main style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:S.textDim, fontFamily:'Arial' }}>אדם לא נמצא</p>
    </main>
  )

  const isDead = !!person.death_date
  const genderColor = person.gender === 'male' ? '#1a3a5a' : person.gender === 'female' ? '#3a1a2a' : '#2a1a08'
  const genderBorder = person.gender === 'male' ? '#2a6a9a' : person.gender === 'female' ? '#8a3060' : S.border

  return (
    <main dir="rtl" style={{ minHeight:'100vh', background:S.bg, color:S.text, fontFamily:'Arial, sans-serif' }}>

      {/* ── Top bar ── */}
      <div style={{ background:'#0a0500', borderBottom:`1px solid ${S.border}`, padding:'0.7rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <a href={`/${locale}/people`} style={{ color:S.gold, textDecoration:'none', fontSize:'0.88rem' }}>→ כל האנשים</a>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <a href={`/people/${id}/tree`} style={{ color:S.textDim, textDecoration:'none', fontSize:'0.82rem' }}>🌳 עץ</a>
          {canEdit && <a href={`/people/${id}/edit`} style={{ color:S.gold, textDecoration:'none', fontSize:'0.82rem' }}>✏️ עריכה</a>}
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{ background:`linear-gradient(180deg, ${genderColor} 0%, ${S.bg} 100%)`, padding:'2rem 1.5rem 0', borderBottom:`1px solid ${S.border}` }}>
        <div style={{ maxWidth:760, margin:'0 auto', display:'flex', gap:'1.5rem', alignItems:'flex-end', flexWrap:'wrap', paddingBottom:'1.5rem' }}>
          {/* Photo */}
          <div style={{ position:'relative', flexShrink:0 }}>
            {person.photo_url
              ? <img src={person.photo_url} alt={person.first_name}
                  style={{ width:110, height:110, borderRadius:14, objectFit:'cover', border:`3px solid ${genderBorder}`, boxShadow:'0 4px 20px #00000066' }} />
              : <div style={{ width:110, height:110, borderRadius:14, background:'#2a1a08', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, border:`3px solid ${genderBorder}` }}>👤</div>
            }
            {isDead && <div style={{ position:'absolute', bottom:-6, right:-6, fontSize:20 }}>🕯️</div>}
          </div>

          {/* Name + dates */}
          <div style={{ flex:1, minWidth:200 }}>
            <h1 style={{ fontSize:'1.8rem', color:S.text, margin:0, marginBottom:4 }}>
              {person.first_name} <span style={{ color:S.gold }}>{person.last_name}</span>
            </h1>
            <div style={{ fontSize:'0.88rem', color:S.textDim, display:'flex', gap:'1rem', flexWrap:'wrap' }}>
              {person.birth_date && <span>🌱 {formatDate(person.birth_date)}{person.birth_place ? ` · ${person.birth_place}` : ''}</span>}
              {person.death_date && <span>🕯️ {formatDate(person.death_date)}{person.death_place ? ` · ${person.death_place}` : ''}</span>}
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ maxWidth:760, margin:'0 auto', display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                background:'none', border:'none', borderBottom:`3px solid ${tab === t.key ? S.gold : 'transparent'}`,
                color: tab === t.key ? S.gold : S.textDim,
                padding:'0.65rem 1rem', cursor:'pointer', fontSize:'0.82rem', fontWeight: tab === t.key ? 'bold' : 'normal',
                whiteSpace:'nowrap', transition:'color .15s',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ maxWidth:760, margin:'0 auto', padding:'1.75rem 1.5rem 4rem' }}>
        {tab === 'about'      && <TabAbout      person={person} canEdit={canEdit} id={id} />}
        {tab === 'timeline'   && <TabTimeline   id={id} />}
        {tab === 'gallery'    && <TabGallery    id={id} />}
        {tab === 'documents'  && <TabDocuments  id={id} />}
        {tab === 'interviews' && <TabInterviews id={id} />}
        {tab === 'relations'  && <TabRelations  id={id} canEdit={canEdit} />}
        {tab === 'migration'  && <TabMigration  id={id} canEdit={canEdit} />}
      </div>
    </main>
  )
}
'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
type Person = {
  id: number; first_name: string; last_name: string
  birth_date?: string; death_date?: string
  birth_place?: string; death_place?: string
  photo_url?: string; bio?: string; gender?: string; family_id?: number
}
type Rel = { person_id: number; related_person_id: number; relation_type: string }

// ─── Check upcoming birthdays ─────────────────────────────────────────────────
function isBirthdaySoon(birth_date?: string): boolean {
  if (!birth_date) return false
  const today = new Date()
  const bday = new Date(birth_date)
  bday.setFullYear(today.getFullYear())
  const diff = Math.ceil((bday.getTime() - today.getTime()) / 86400000)
  return diff >= 0 && diff <= 7
}

// ─── Build Balkan nodes ───────────────────────────────────────────────────────
function buildNodes(people: Person[], rels: Rel[]) {
  const byId = new Map(people.map(p => [p.id, p]))
  const relsByPerson = new Map<number, Rel[]>()
  for (const r of rels) {
    if (!relsByPerson.has(r.person_id)) relsByPerson.set(r.person_id, [])
    relsByPerson.get(r.person_id)!.push(r)
  }

  return people.map(person => {
    const myRels = relsByPerson.get(person.id) || []
    const pids    = myRels.filter(r => r.relation_type === 'spouse').map(r => r.related_person_id)
    const parents = myRels
  .filter(r => r.relation_type === 'parent')
  .map(r => byId.get(r.related_person_id))
  .filter((p): p is Person => p !== undefined)
    const mother  = parents.find(p => p.gender === 'female')
    const father  = parents.find(p => p.gender === 'male') ?? parents.find(p => !mother)

    const born      = person.birth_date?.substring(0, 4) || ''
    const died      = person.death_date?.substring(0, 4) || ''
    const initials  = `${person.first_name?.[0] || ''}${person.last_name?.[0] || ''}`.toUpperCase()
    const hasBday   = isBirthdaySoon(person.birth_date)
    const age       = born && !died ? new Date().getFullYear() - parseInt(born) : null
    const livedAge  = born && died ? parseInt(died) - parseInt(born) : null

    return {
      id: person.id, pids, mid: mother?.id, fid: father?.id,
      name:     `${[person.first_name, person.last_name].filter(Boolean).join(' ')}`,
      born, died, place: person.birth_place || '',
      photo:    person.photo_url || '',
      bio:      person.bio || '',
      gender:   person.gender || 'unknown',
      initials, hasBday,
      ageStr:   livedAge ? `${livedAge} שנה` : age ? `גיל ${age}` : '',
      dates:    [born, died].filter(Boolean).join(' – '),
      tags:     [person.gender === 'male' ? 'male' : person.gender === 'female' ? 'female' : 'unknown'],
    }
  })
}

// ─── Setup beautiful custom template ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setupTemplates(FT: any) {
  const W = 200, H = 96

  const DEFS = `
    <style>
      .ft-name  { font-family:'Heebo',Arial,sans-serif; font-weight:700; direction:rtl; }
      .ft-info  { font-family:'Heebo',Arial,sans-serif; direction:rtl; }
      .ft-place { font-family:'Heebo',Arial,sans-serif; direction:rtl; }
      .ft-age   { font-family:'Heebo',Arial,sans-serif; direction:rtl; }
    </style>
    <clipPath id="ft_av"><circle cx="36" cy="48" r="28"/></clipPath>
    <clipPath id="ft_av_sq"><rect rx="8" x="8" y="20" width="56" height="56"/></clipPath>
  `

  function makeNode(bg: string, border: string, textColor: string, subColor: string) {
    return `
      <rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="${bg}" stroke="${border}" stroke-width="2"/>
      <circle cx="36" cy="48" r="28" fill="${bg}" stroke="${border}" stroke-width="1.5" opacity=".6"/>
      <image clip-path="url(#ft_av)" preserveAspectRatio="xMidYMid slice"
        xlink:href="{val}" x="8" y="20" width="56" height="56"/>
      <text x="38" text-anchor="middle" y="76" class="ft-name" style="font-size:9px;fill:${subColor};opacity:.7">{val}</text>
      <text x="76" y="30" class="ft-name" style="font-size:12.5px;fill:${textColor}" width="118">{val}</text>
      <text x="76" y="47" class="ft-info"  style="font-size:10px;fill:${subColor}"  width="118">{val}</text>
      <text x="76" y="62" class="ft-place" style="font-size:9.5px;fill:${subColor};opacity:.8" width="110">{val}</text>
      <text x="76" y="77" class="ft-age"   style="font-size:9px;fill:${subColor};opacity:.65" width="118">{val}</text>
      <text x="184" y="16" style="font-size:14px">{val}</text>
    `
  }

  function makeTpl(bg: string, border: string, textColor: string, subColor: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tpl: any = Object.assign({}, FT.templates.john)
    tpl.size   = [W, H]
    tpl.defs   = DEFS
    tpl.node   = makeNode(bg, border, textColor, subColor)
    tpl.field_0 = `<text x="76" y="30" class="ft-name"  style="font-size:12.5px;fill:${textColor}" width="118">{val}</text>`
    tpl.field_1 = `<text x="76" y="47" class="ft-info"  style="font-size:10px;fill:${subColor}"  width="118">{val}</text>`
    tpl.field_2 = `<text x="76" y="62" class="ft-place" style="font-size:9.5px;fill:${subColor};opacity:.8" width="110">{val}</text>`
    tpl.field_3 = `<text x="76" y="77" class="ft-age"   style="font-size:9px;fill:${subColor};opacity:.65" width="118">{val}</text>`
    tpl.field_4 = `<text x="184" y="16" style="font-size:14px">{val}</text>`
    tpl.img_0   = `<image clip-path="url(#ft_av)" preserveAspectRatio="xMidYMid slice" xlink:href="{val}" x="8" y="20" width="56" height="56"/>`
    tpl.img_1   = `<text x="38" text-anchor="middle" y="76" class="ft-name" style="font-size:9px;fill:${subColor};opacity:.7">{val}</text>`
    // Link style
    tpl.link    = `<path stroke="#c9a22766" stroke-width="1.8" fill="none" stroke-dasharray="0" d="{d}"/>`
    tpl.partnerLink = `<path stroke="#c9a22744" stroke-width="1.2" fill="none" stroke-dasharray="5,3" d="{d}"/>`
    tpl.miniMap = `<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="#c9a22733" stroke="#c9a227" stroke-width="1"/>`
    // Circle menu button
    tpl.nodeCircleMenuButton = { radius: 22, x: W - 16, y: 14, color: '#c9a22799', stroke: '#c9a22766' }
    return tpl
  }

  // Male — blue tones
  FT.templates.ft_male   = makeTpl('#0d2038', '#2a6a9a', '#d4eeff', '#7ab4d4')
  // Female — rose tones
  FT.templates.ft_female = makeTpl('#280d1e', '#8a3060', '#ffd4e8', '#d4849c')
  // Unknown — warm dark
  FT.templates.ft_unkn   = makeTpl('#1e1108', '#3a2a10', '#f5d98b', '#b89a5a')
}

// ─── Person Popup (view + edit) ───────────────────────────────────────────────
function PersonPopup({ person: initPerson, canEdit, locale, onClose, onSave }: {
  person: Person; canEdit: boolean; locale: string
  onClose: () => void; onSave: (updated: Person) => void
}) {
  const [mode, setMode]     = useState<'view' | 'edit'>('view')
  const [person, setPerson] = useState(initPerson)
  const [form, setForm]     = useState({ ...initPerson })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const name       = `${[person.first_name, person.last_name].filter(Boolean).join(' ')}`
  const genderBg   = person.gender === 'male' ? '#0d2038' : person.gender === 'female' ? '#280d1e' : '#1a0f05'
  const genderBrd  = person.gender === 'male' ? '#2a6a9a' : person.gender === 'female' ? '#8a3060' : '#c9a227'
  const genderText = person.gender === 'male' ? '#d4eeff' : person.gender === 'female' ? '#ffd4e8' : '#f5d98b'

  const fmt = (d?: string) => {
    if (!d) return null
    try { return new Date(d).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' }) } catch { return d }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const path = `people/${person.id}/${Date.now()}-${file.name}`
    await supabase.storage.from('photos').upload(path, file, { upsert: true })
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    setForm(f => ({ ...f, photo_url: urlData.publicUrl }))
    setUploading(false)
  }

  async function save() {
    setSaving(true)
    const { data } = await supabase.from('people').update({
      first_name: form.first_name, last_name: form.last_name,
      birth_date: form.birth_date || null, birth_place: form.birth_place || null,
      death_date: form.death_date || null, death_place: form.death_place || null,
      photo_url: form.photo_url || null, bio: form.bio || null, gender: form.gender || null,
    }).eq('id', person.id).select().single()
    setSaving(false)
    if (data) { setPerson(data); onSave(data); setMode('view') }
  }

  const inp = (field: keyof Person, type = 'text', placeholder = '') => ({
    value: (form[field] as string) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value })),
    type, placeholder,
    style: {
      width: '100%', background: '#0d0702', border: `1px solid ${genderBrd}44`,
      borderRadius: 8, padding: '0.5rem 0.75rem', color: genderText,
      fontSize: '0.88rem', direction: 'rtl' as const, fontFamily: 'Heebo, Arial', boxSizing: 'border-box' as const,
    },
  })

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, background:'#000000bb', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', overflowY:'auto' }}>
      <div dir="rtl" style={{ background: genderBg, border:`2px solid ${genderBrd}`, borderRadius:18, padding:'0', width:'100%', maxWidth:460, position:'relative', boxShadow:'0 16px 60px #000000cc', fontFamily:'Heebo, Arial', overflow:'hidden', maxHeight:'92vh', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ background:`${genderBrd}22`, padding:'1.25rem 1.5rem', borderBottom:`1px solid ${genderBrd}33`, flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
              {mode === 'view' && canEdit && (
                <button onClick={() => setMode('edit')}
                  style={{ background: genderBrd, color: genderText === '#d4eeff' ? '#0d2038' : '#280d1e', border:'none', borderRadius:8, padding:'0.35rem 0.9rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'bold' }}>
                  ✏️ עריכה
                </button>
              )}
              {mode === 'edit' && (
                <>
                  <button onClick={save} disabled={saving}
                    style={{ background:'#c9a227', color:'#0d0702', border:'none', borderRadius:8, padding:'0.35rem 0.9rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'bold', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'שומר...' : '💾 שמור'}
                  </button>
                  <button onClick={() => { setForm({...person}); setMode('view') }}
                    style={{ background:'transparent', color: genderText, border:`1px solid ${genderBrd}44`, borderRadius:8, padding:'0.35rem 0.75rem', cursor:'pointer', fontSize:'0.78rem' }}>
                    ביטול
                  </button>
                </>
              )}
            </div>
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <a href={`/${locale}/people/${person.id}`}
                style={{ color: genderText, textDecoration:'none', fontSize:'0.78rem', border:`1px solid ${genderBrd}44`, borderRadius:8, padding:'0.3rem 0.7rem', opacity:.8 }}>
                פרופיל מלא →
              </a>
              <button onClick={onClose} style={{ background:'none', border:'none', color: genderText, cursor:'pointer', fontSize:'1.2rem', opacity:.7, lineHeight:1 }}>✕</button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY:'auto', flex:1, padding:'1.5rem' }}>

          {/* Photo + name */}
          <div style={{ display:'flex', gap:'1rem', alignItems:'flex-start', marginBottom:'1.25rem' }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              {(mode === 'edit' ? form.photo_url : person.photo_url)
                ? <img src={mode === 'edit' ? form.photo_url : person.photo_url}
                    style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${genderBrd}`, display:'block' }} />
                : <div style={{ width:80, height:80, borderRadius:'50%', background:`${genderBrd}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', border:`2px solid ${genderBrd}44` }}>
                    {person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤'}
                  </div>
              }
              {mode === 'edit' && (
                <label style={{ position:'absolute', bottom:-4, right:-4, background:'#c9a227', width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'12px', border:`2px solid ${genderBg}` }}>
                  {uploading ? '⏳' : '📷'}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:'none' }} />
                </label>
              )}
            </div>
            <div style={{ flex:1 }}>
              {mode === 'view' ? (
                <>
                  <div style={{ fontFamily:'Frank Ruhl Libre, serif', fontSize:'1.3rem', color: genderText, fontWeight:'bold', marginBottom:4 }}>{name}</div>
                  <div style={{ fontSize:'0.75rem', color: genderBrd, marginBottom:2 }}>
                    {person.gender === 'male' ? '♂ גבר' : person.gender === 'female' ? '♀ אישה' : ''}
                  </div>
                  {person.birth_date && <div style={{ fontSize:'0.82rem', color: genderText, opacity:.8 }}>🌱 {fmt(person.birth_date)}{person.birth_place ? ` · ${person.birth_place}` : ''}</div>}
                  {person.death_date && <div style={{ fontSize:'0.82rem', color: genderText, opacity:.6, marginTop:2 }}>🕯️ {fmt(person.death_date)}{person.death_place ? ` · ${person.death_place}` : ''}</div>}
                </>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <input {...inp('first_name', 'text', 'שם פרטי')} style={{ ...inp('first_name').style, flex:1 }} />
                    <input {...inp('last_name', 'text', 'שם משפחה')} style={{ ...inp('last_name').style, flex:1 }} />
                  </div>
                  <select value={form.gender || ''} onChange={e => setForm(f => ({...f, gender: e.target.value}))}
                    style={{ ...inp('gender').style }}>
                    <option value="">מגדר</option>
                    <option value="male">גבר</option>
                    <option value="female">אישה</option>
                    <option value="unknown">לא ידוע</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <hr style={{ border:'none', borderTop:`1px solid ${genderBrd}33`, margin:'0 0 1rem' }} />

          {/* View mode content */}
          {mode === 'view' && (
            <>
              {person.bio && (
                <div style={{ marginBottom:'1rem' }}>
                  <div style={{ fontSize:'0.72rem', color: genderBrd, fontWeight:'bold', letterSpacing:'.05em', marginBottom:6 }}>סיפור חיים</div>
                  <p style={{ color: genderText, opacity:.85, lineHeight:1.7, fontSize:'0.88rem' }}>{person.bio}</p>
                </div>
              )}
              {/* Quick facts */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                {[
                  { label:'ג׳נרציה', val: person.birth_date ? `${new Date().getFullYear() - parseInt(person.birth_date.substring(0,4)) > 50 ? '👴' : '👨'} דור ${Math.ceil((new Date().getFullYear() - parseInt(person.birth_date.substring(0,4))) / 25)}` : null },
                  { label:'מוצא', val: person.birth_place },
                ].filter(r => r.val).map(r => (
                  <div key={r.label} style={{ background:`${genderBrd}11`, borderRadius:8, padding:'0.6rem', border:`1px solid ${genderBrd}22` }}>
                    <div style={{ fontSize:'0.68rem', color: genderBrd, marginBottom:2 }}>{r.label}</div>
                    <div style={{ fontSize:'0.82rem', color: genderText }}>{r.val}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Edit mode form */}
          {mode === 'edit' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                <div>
                  <label style={{ fontSize:'0.7rem', color: genderBrd, display:'block', marginBottom:3 }}>תאריך לידה</label>
                  <input {...inp('birth_date', 'date')} />
                </div>
                <div>
                  <label style={{ fontSize:'0.7rem', color: genderBrd, display:'block', marginBottom:3 }}>מקום לידה</label>
                  <input {...inp('birth_place', 'text', 'עיר, מדינה')} />
                </div>
                <div>
                  <label style={{ fontSize:'0.7rem', color: genderBrd, display:'block', marginBottom:3 }}>תאריך פטירה</label>
                  <input {...inp('death_date', 'date')} />
                </div>
                <div>
                  <label style={{ fontSize:'0.7rem', color: genderBrd, display:'block', marginBottom:3 }}>מקום פטירה</label>
                  <input {...inp('death_place', 'text', 'עיר, מדינה')} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:'0.7rem', color: genderBrd, display:'block', marginBottom:3 }}>סיפור חיים</label>
                <textarea value={form.bio || ''} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={4}
                  style={{ width:'100%', background:'#0d0702', border:`1px solid ${genderBrd}44`, borderRadius:8, padding:'0.55rem 0.75rem', color: genderText, fontSize:'0.88rem', resize:'vertical', fontFamily:'Heebo, Arial', direction:'rtl', boxSizing:'border-box' }}
                  placeholder="סיפור חייו של האדם..." />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Stats panel ──────────────────────────────────────────────────────────────
function StatsPanel({ people, rels }: { people: Person[]; rels: Rel[] }) {
  const total    = people.length
  const males    = people.filter(p => p.gender === 'male').length
  const females  = people.filter(p => p.gender === 'female').length
  const withPhoto = people.filter(p => p.photo_url).length
  const withBio   = people.filter(p => p.bio).length
  const deceased  = people.filter(p => p.death_date).length
  const livingAgePpl = people.filter(p => p.birth_date && !p.death_date)
  const avgAge = livingAgePpl.length > 0
    ? Math.round(livingAgePpl.reduce((s, p) => s + (new Date().getFullYear() - parseInt(p.birth_date!.substring(0,4))), 0) / livingAgePpl.length)
    : 0
  const couples = new Set(rels.filter(r => r.relation_type === 'spouse').map(r => [r.person_id, r.related_person_id].sort().join('-'))).size

  const stats = [
    { label:'סה"כ', val: total, icon:'👨‍👩‍👧' },
    { label:'גברים', val: males, icon:'♂' },
    { label:'נשים', val: females, icon:'♀' },
    { label:'זוגות', val: couples, icon:'💍' },
    { label:'נפטרו', val: deceased, icon:'🕯️' },
    { label:'עם תמונה', val: withPhoto, icon:'📸' },
    { label:'עם סיפור', val: withBio, icon:'📖' },
    { label:'גיל ממוצע', val: avgAge || '?', icon:'🎂' },
  ]

  return (
    <div style={{ padding:'1rem', borderTop:'1px solid #2a1808' }}>
      <div style={{ fontSize:'0.7rem', color:'#c9a227', fontWeight:'bold', letterSpacing:'.05em', marginBottom:'0.6rem' }}>סטטיסטיקות</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.35rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'#150a01', borderRadius:7, padding:'0.4rem 0.6rem', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #2a1808' }}>
            <span style={{ fontSize:'0.72rem', color:'#b89a5a' }}>{s.icon} {s.label}</span>
            <span style={{ fontSize:'0.82rem', color:'#f5d98b', fontWeight:'bold' }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FamilyTreeBalkan({ familyId, locale, canEdit }: {
  familyId?: string; locale: string; canEdit: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treeRef      = useRef<any>(null)
  const [loading, setLoading]     = useState(true)
  const [empty, setEmpty]         = useState(false)
  const [popup, setPopup]         = useState<Person | null>(null)
  const [people, setPeople]       = useState<Person[]>([])
  const [rels, setRels]           = useState<Rel[]>([])
  const [showStats, setShowStats] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const peopleRef = useRef<Map<number, Person>>(new Map())

  const openPopup = useCallback((id: number) => {
    const p = peopleRef.current.get(id)
    if (p) setPopup(p)
  }, [])

  function handleSave(updated: Person) {
    setPeople(prev => prev.map(p => p.id === updated.id ? updated : p))
    peopleRef.current.set(updated.id, updated)
    // Rebuild tree with updated person
    if (treeRef.current) {
      const nodes = buildNodes(
        [...peopleRef.current.values()],
        rels
      )
      treeRef.current.replaceNodeData(updated.id, nodes.find(n => n.id === updated.id))
    }
  }

  useEffect(() => {
    let mounted = true
    async function init() {
      setLoading(true)
      let q = supabase.from('people').select('id,first_name,last_name,birth_date,death_date,birth_place,death_place,photo_url,bio,gender,family_id')
      if (familyId) q = q.eq('family_id', familyId)
      const { data: ppl } = await q
      const pplList: Person[] = ppl || []
      if (!pplList.length) { setEmpty(true); setLoading(false); return }

      setPeople(pplList)
      peopleRef.current = new Map(pplList.map(p => [p.id, p]))

      const ids = pplList.map(p => p.id)
      const { data: relData } = await supabase.from('family_relations').select('person_id,related_person_id,relation_type').in('person_id', ids)
      const relList: Rel[] = relData || []
      setRels(relList)

      if (!mounted || !containerRef.current) return

      const nodes = buildNodes(pplList, relList)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const FT = (await import('@balkangraph/familytree.js')).default as any
      if (!mounted || !containerRef.current) return
      setupTemplates(FT)
      if (treeRef.current) { containerRef.current.innerHTML = '' }

      const tree = new FT(containerRef.current, {
        mode: 'dark',

        // Layout
        orientation:  FT.ORIENTATION.top,
        levelSeparation: 85,
        siblingSeparation: 25,
        subtreeSeparation: 55,
        partnerChildrenSplitSeparation: 30,
        padding: 40,

        // Interaction
        mouseScrool:   FT.action.zoom,
        enableSearch:  true,
        enableTouch:   true,
        enablePan:     true,
        miniMap:       true,
        scaleInitial:  FT.match.boundary,
        scaleMin: 0.04,
        scaleMax: 2.5,

        // Animation
        anim: { func: FT.anim.outBounce, duration: 650 },

        // Background
        background: '#0d0702',

        // Circle menu (right-click on node)
        nodeCircleMenu: {
          viewProfile: { icon: FT.icon.user(24, 24, '#c9a227'), text: 'פרופיל', color: '#1a0f05' },
          editNode:    { icon: FT.icon.edit(24, 24, '#c9a227'), text: 'עריכה', color: '#1a0f05' },
          addSon:      { icon: FT.icon.add(24, 24, '#4a9e6a'), text: 'הוסף בן', color: '#1a0f05' },
          addDaughter: { icon: FT.icon.add(24, 24, '#b8467a'), text: 'הוסף בת', color: '#1a0f05' },
          addFather:   { icon: FT.icon.father(24, 24, '#6a9ed4'), text: 'הוסף אב', color: '#1a0f05' },
          addMother:   { icon: FT.icon.mother(24, 24, '#d46a9e'), text: 'הוסף אם', color: '#1a0f05' },
          addHusband:  { icon: FT.icon.husband(24, 24, '#9eb8d4'), text: 'הוסף בעל', color: '#1a0f05' },
          addWife:     { icon: FT.icon.wife(24, 24, '#d49eb8'), text: 'הוסף אישה', color: '#1a0f05' },
          exportPDF:   { icon: FT.icon.pdf(24, 24, '#e07a5a'), text: 'PDF אישי', color: '#1a0f05' },
        },

        // Context menu (3 dots on card)
        nodeContextMenu: {
          details: { text: 'פרטים' },
          edit:    { text: 'עריכה' },
          remove:  { text: 'הסר' },
        },

        // Built-in edit form (used by Balkan for add new)
        editForm: {
          readOnly:  !canEdit,
          titleBinding: 'name',
          photoBinding: 'photo',
          generateElementsFromFields: false,
          elements: [
            [{ type:'textbox', label:'שם פרטי', binding:'first_name' }, { type:'textbox', label:'שם משפחה', binding:'last_name' }],
            [{ type:'textbox', label:'תאריך לידה', binding:'born' }, { type:'textbox', label:'מקום לידה', binding:'place' }],
            [{ type:'textbox', label:'תאריך פטירה', binding:'died' }],
            [{ type:'textbox', label:'סיפור קצר', binding:'bio' }],
          ],
          buttons: {
            edit:  canEdit ? undefined : null,
            share: null,
            pdf:   { icon: FT.icon.pdf(24,24,'#fff'), text: 'שמור כ-PDF' },
          },
          saveAndCloseBtn: 'שמור',
          cancelBtn: 'ביטול',
        },

        // Nodes binding
        nodeBinding: {
          field_0: 'name',
          field_1: 'dates',
          field_2: 'place',
          field_3: 'ageStr',
          field_4: 'hasBday',
          img_0:   'photo',
          img_1:   'initials',
        },

        nodes: nodes,
        tags: {
          male:    { template: 'ft_male'   },
          female:  { template: 'ft_female' },
          unknown: { template: 'ft_unkn'   },
        },
      })

      // Circle menu handler
      tree.nodeCircleMenuUI.on('click', (_: unknown, args: { nodeId: number; menuItemName: string }) => {
        switch (args.menuItemName) {
          case 'viewProfile':
          case 'editNode':
            openPopup(args.nodeId); break
          case 'addSon':
            tree.addChildNode({ gender: 'male',   mid: args.nodeId }); break
          case 'addDaughter':
            tree.addChildNode({ gender: 'female', mid: args.nodeId }); break
          case 'addFather':
            tree.addParentNode(args.nodeId, 'fid', { gender: 'male'   }); break
          case 'addMother':
            tree.addParentNode(args.nodeId, 'mid', { gender: 'female' }); break
          case 'addHusband':
            tree.addPartnerNode({ gender: 'male',   pids: [args.nodeId] }); break
          case 'addWife':
            tree.addPartnerNode({ gender: 'female', pids: [args.nodeId] }); break
          case 'exportPDF':
            tree.exportPDFProfile({ id: args.nodeId }); break
        }
      })

      // Save to Supabase on update
      tree.on('update', async (_: unknown, args: { updateNodesData: Array<{ id: number; [key: string]: unknown }> }) => {
        for (const nodeData of args.updateNodesData) {
          const { id, first_name, last_name, born, died, place, bio, photo, gender } = nodeData as any
          if (!id) continue
          await supabase.from('people').update({
            first_name: first_name || null, last_name: last_name || null,
            birth_date: born || null, death_date: died || null,
            birth_place: place || null, bio: bio || null,
            photo_url: photo || null, gender: gender || null,
          }).eq('id', id)
        }
      })

      treeRef.current = tree
      setLoading(false)
    }
    init()
    return () => { mounted = false }
  }, [familyId, canEdit, openPopup])

  const toolbar = (
    <div style={{ position:'absolute', bottom:'1.5rem', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'4px', background:'#1a0f05ee', border:'1px solid #2a1808', borderRadius:30, padding:'5px 10px', zIndex:10, backdropFilter:'blur(12px)', flexWrap:'wrap', justifyContent:'center' }}>
      {[
        { label:'🎯 מרכז',    action: () => treeRef.current?.fit() },
        { label:'📂 פתח הכל', action: () => treeRef.current?.expandAll() },
        { label:'🖼️ PNG',     action: () => treeRef.current?.exportPNG({ filename:'family-tree' }) },
        { label:'📄 PDF',     action: () => treeRef.current?.exportPDF({ filename:'family-tree' }) },
        { label:'📊 סטטיסטיקות', action: () => setShowStats(s => !s) },
        { label: fullscreen ? '🗗 חלון' : '🖥️ מסך מלא', action: () => setFullscreen(s => !s) },
      ].map(btn => (
        <button key={btn.label} onClick={btn.action}
          style={{ background:'transparent', border:'none', color:'#c9a227', fontSize:'0.75rem', cursor:'pointer', padding:'4px 9px', borderRadius:20, whiteSpace:'nowrap' }}
          onMouseEnter={e => (e.currentTarget.style.background='#c9a22722')}
          onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
          {btn.label}
        </button>
      ))}
    </div>
  )

  const container = (
    <div style={{ width:'100%', height:'100%', position:'relative', background:'#0d0702', display:'flex', flexDirection:'column' }}>
      {loading && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', color:'#b89a5a', fontFamily:'Heebo, Arial', zIndex:10 }}>
          <div style={{ fontSize:'2.5rem', animation:'spin 2s linear infinite' }}>🌳</div>
          <div>טוען עץ משפחה...</div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {empty && !loading && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', color:'#b89a5a', fontFamily:'Heebo, Arial' }}>
          <div style={{ fontSize:'3rem' }}>🌱</div>
          <p>אין אנשים להצגה</p>
          <a href={`/${locale}/people/new`} style={{ background:'#c9a227', color:'#0d0702', padding:'0.6rem 1.4rem', borderRadius:8, textDecoration:'none', fontWeight:'bold' }}>+ הוסף אדם ראשון</a>
        </div>
      )}

      <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
        <div ref={containerRef} style={{ width:'100%', height:'100%' }} />
        {!loading && !empty && toolbar}
      </div>

      {/* Stats panel */}
      {showStats && people.length > 0 && (
        <div style={{ flexShrink:0, maxHeight:280, overflowY:'auto', borderTop:'1px solid #2a1808', background:'#0a0500' }}>
          <StatsPanel people={people} rels={rels} />
        </div>
      )}

      {/* Legend */}
      {!loading && !empty && (
        <div style={{ position:'absolute', top:'0.75rem', right:'0.75rem', background:'#1a0f05cc', border:'1px solid #2a1808', borderRadius:10, padding:'0.5rem 0.75rem', fontSize:'0.7rem', backdropFilter:'blur(8px)', zIndex:5 }}>
          <div style={{ color:'#2a6a9a', marginBottom:2 }}>■ גבר</div>
          <div style={{ color:'#8a3060', marginBottom:2 }}>■ אישה</div>
          <div style={{ color:'#3a2a10' }}>■ לא ידוע</div>
          <div style={{ color:'#c9a227', marginTop:4 }}>🎂 יום הולדת קרוב</div>
          <div style={{ color:'#5a3a1a', marginTop:2, fontSize:'0.62rem' }}>לחץ ● בפינה לאפשרויות</div>
        </div>
      )}

      {popup && (
        <PersonPopup person={popup} canEdit={canEdit} locale={locale}
          onClose={() => setPopup(null)} onSave={handleSave} />
      )}
    </div>
  )

  if (fullscreen) return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'#0d0702' }}>
      {container}
      <button onClick={() => setFullscreen(false)}
        style={{ position:'absolute', top:'1rem', left:'1rem', background:'#1a0f05', border:'1px solid #c9a22766', color:'#c9a227', padding:'0.4rem 0.8rem', borderRadius:8, cursor:'pointer', fontSize:'0.82rem', zIndex:10 }}>
        🗗 חזור לחלון
      </button>
    </div>
  )

  return container
}
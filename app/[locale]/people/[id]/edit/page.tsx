'use client'
import { useEffect, useState } from 'react'
import { supabase, getSession } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

const LANGUAGES = ['עברית','אידיש','ערבית','רוסית','פולנית','גרמנית','צרפתית','אנגלית','ספרדית','רומנית','הונגרית','יידיש','לדינו','פרסית','אמהרית']
const RELIGIONS = ['יהדות','אורתודוקסי','דתי-לאומי','מסורתי','חילוני','אסלאם','נצרות','אחר']

export default function EditPersonPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [families, setFamilies] = useState<{ id: number; name: string }[]>([])
  const [tab, setTab]           = useState<'basic'|'details'|'more'>('basic')
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    first_name: '', last_name: '', nickname: '', gender: '',
    birth_date: '', birth_place: '', death_date: '', death_place: '',
    family_id: '', photo_url: '', bio: '',
    // New fields
    profession: '', education: '', military_service: '',
    languages: '', religion: '', citizenships: '', hobbies: '',
    contact_phone: '', contact_email: '', medical_notes: '',
    memorial_quote: '', external_links: '',
  })

  useEffect(() => {
    async function init() {
      const session = await getSession()
      if (!session) { router.push('/login'); return }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle()
      if (roleData?.role !== 'admin' && roleData?.role !== 'editor') { router.push(`/people/${id}`); return }
      const [{ data: person }, { data: fams }] = await Promise.all([
        supabase.from('people').select('*').eq('id', id).single(),
        supabase.from('families').select('id, name').order('name'),
      ])
      setFamilies(fams || [])
      if (person) {
        setForm({
          first_name: person.first_name || '', last_name: person.last_name || '',
          nickname: person.nickname || '', gender: person.gender || '',
          birth_date: person.birth_date || '', birth_place: person.birth_place || '',
          death_date: person.death_date || '', death_place: person.death_place || '',
          family_id: person.family_id?.toString() || '', photo_url: person.photo_url || '',
          bio: person.bio || '', profession: person.profession || '',
          education: person.education || '', military_service: person.military_service || '',
          languages: person.languages || '', religion: person.religion || '',
          citizenships: person.citizenships || '', hobbies: person.hobbies || '',
          contact_phone: person.contact_phone || '', contact_email: person.contact_email || '',
          medical_notes: person.medical_notes || '', memorial_quote: person.memorial_quote || '',
          external_links: person.external_links || '',
        })
      }
      setLoading(false)
    }
    init()
  }, [id, router])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const path = `people/${id}/${Date.now()}-${file.name}`
    await supabase.storage.from('photos').upload(path, file, { upsert: true })
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    setForm(f => ({ ...f, photo_url: urlData.publicUrl }))
    setUploading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('people').update({
      ...form,
      family_id: form.family_id ? parseInt(form.family_id) : null,
      birth_date: form.birth_date || null, death_date: form.death_date || null,
    }).eq('id', id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const G = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label style={{ fontSize: '0.72rem', color: '#b89a5a', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
        style={{ width: '100%', background: '#0d0702', border: '1px solid #3a2a10', borderRadius: 8, padding: '0.55rem 0.8rem', color: '#f5e6c8', fontSize: '0.9rem', direction: 'rtl', fontFamily: 'Heebo, Arial', boxSizing: 'border-box' }} />
    </div>
  )

  const T = (label: string, key: keyof typeof form, rows = 3, placeholder = '') => (
    <div>
      <label style={{ fontSize: '0.72rem', color: '#b89a5a', display: 'block', marginBottom: 4 }}>{label}</label>
      <textarea value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} rows={rows} placeholder={placeholder}
        style={{ width: '100%', background: '#0d0702', border: '1px solid #3a2a10', borderRadius: 8, padding: '0.55rem 0.8rem', color: '#f5e6c8', fontSize: '0.9rem', direction: 'rtl', resize: 'vertical', fontFamily: 'Heebo, Arial', boxSizing: 'border-box' }} />
    </div>
  )

  if (loading) return <main style={{ minHeight: '100vh', background: '#0d0702', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#b89a5a', fontFamily: 'Heebo, Arial' }}>טוען...</p></main>

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', color: '#f5e6c8', fontFamily: 'Heebo, Arial, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h1 style={{ fontFamily: 'Frank Ruhl Libre, serif', fontSize: '1.7rem', color: '#f5d98b', margin: 0 }}>✏️ עריכת פרופיל</h1>
          <a href={`/people/${id}`} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.88rem' }}>← חזרה לפרופיל</a>
        </div>
        <hr style={{ border: 'none', height: 1, background: 'linear-gradient(90deg, #c9a227, transparent)', marginBottom: '1.5rem' }} />

        {/* Photo section */}
        <div style={{ background: '#1e1108', border: '1px solid #2a1808', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {form.photo_url
            ? <img src={form.photo_url} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #c9a22766', flexShrink: 0 }} />
            : <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#2a1a08', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, border: '2px solid #3a2a10' }}>👤</div>
          }
          <div>
            <label style={{ background: 'linear-gradient(135deg,#d4af37,#c9a227)', color: '#0d0702', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block', fontSize: '0.88rem' }}>
              {uploading ? '⏳ מעלה...' : '📷 החלף תמונה'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            <div style={{ fontSize: '0.72rem', color: '#3a2a10', marginTop: 6 }}>JPG, PNG, WEBP — מוצג בפרופיל ובעץ</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2a1808', marginBottom: '1.25rem' }}>
          {([['basic','📋 בסיסי'],['details','💼 פרטים'],['more','🔗 נוספות']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ background: 'none', border: 'none', borderBottom: `2px solid ${tab === key ? '#c9a227' : 'transparent'}`, color: tab === key ? '#c9a227' : '#5a3a1a', padding: '0.6rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: tab === key ? 'bold' : 'normal', fontFamily: 'Heebo, Arial' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Basic tab */}
        {tab === 'basic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {G('שם פרטי *', 'first_name')} {G('שם משפחה', 'last_name')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {G('כינוי / שם בפנים', 'nickname', 'text', 'שם לא רשמי...')}
              <div>
                <label style={{ fontSize: '0.72rem', color: '#b89a5a', display: 'block', marginBottom: 4 }}>מגדר</label>
                <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}
                  style={{ width: '100%', background: '#0d0702', border: '1px solid #3a2a10', borderRadius: 8, padding: '0.55rem 0.8rem', color: '#f5e6c8', fontSize: '0.9rem' }}>
                  <option value="">לא מוגדר</option>
                  <option value="male">גבר</option>
                  <option value="female">אישה</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {G('תאריך לידה', 'birth_date', 'date')} {G('מקום לידה', 'birth_place', 'text', 'עיר, מדינה')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {G('תאריך פטירה', 'death_date', 'date')} {G('מקום פטירה', 'death_place', 'text', 'עיר, מדינה')}
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#b89a5a', display: 'block', marginBottom: 4 }}>משפחה</label>
              <select value={form.family_id} onChange={e => setForm(f => ({...f, family_id: e.target.value}))}
                style={{ width: '100%', background: '#0d0702', border: '1px solid #3a2a10', borderRadius: 8, padding: '0.55rem 0.8rem', color: '#f5e6c8', fontSize: '0.9rem' }}>
                <option value="">— ללא משפחה —</option>
                {families.map(f => <option key={f.id} value={f.id}>משפחת {f.name}</option>)}
              </select>
            </div>
            {T('סיפור חיים', 'bio', 5, 'ספר בקצרה על חיי האדם...')}
            {G('ציטוט / זיכרון מייצג', 'memorial_quote', 'text', '"משפט שמזכיר אותם..."')}
          </div>
        )}

        {/* Details tab */}
        {tab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {G('מקצוע / תפקידים', 'profession', 'text', 'רופא, מורה, אדריכל...')}
            {G('השכלה', 'education', 'text', 'תואר, מוסד, שנה...')}
            {G('שירות צבאי', 'military_service', 'text', 'מדינה, יחידה, דרגה, שנים...')}
            <div>
              <label style={{ fontSize: '0.72rem', color: '#b89a5a', display: 'block', marginBottom: 4 }}>דת / זרם</label>
              <select value={form.religion} onChange={e => setForm(f => ({...f, religion: e.target.value}))}
                style={{ width: '100%', background: '#0d0702', border: '1px solid #3a2a10', borderRadius: 8, padding: '0.55rem 0.8rem', color: '#f5e6c8', fontSize: '0.9rem' }}>
                <option value="">— לא מוגדר —</option>
                {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#b89a5a', display: 'block', marginBottom: 6 }}>שפות</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {LANGUAGES.map(lang => (
                  <button key={lang}
                    onClick={() => {
                      const langs = form.languages.split(',').map(s=>s.trim()).filter(Boolean)
                      const idx = langs.indexOf(lang)
                      if (idx >= 0) langs.splice(idx, 1); else langs.push(lang)
                      setForm(f => ({...f, languages: langs.join(', ')}))
                    }}
                    style={{ background: form.languages.includes(lang) ? '#c9a22722' : '#1e1108', border: `1px solid ${form.languages.includes(lang) ? '#c9a227' : '#2a1808'}`, color: form.languages.includes(lang) ? '#c9a227' : '#b89a5a', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', fontSize: '0.78rem' }}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            {G('ארצות אזרחות', 'citizenships', 'text', 'ישראל, פולין, ארה"ב...')}
            {T('תחביבים ותשוקות', 'hobbies', 2, 'מוסיקה, שחמט, ציור...')}
          </div>
        )}

        {/* More tab */}
        {tab === 'more' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: '#1e1108', border: '1px solid #2a1808', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#c9a227', fontWeight: 'bold', marginBottom: '0.75rem' }}>📞 פרטי קשר (לאנשים בחיים)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {G('טלפון', 'contact_phone', 'tel', '050-0000000')}
                {G('מייל', 'contact_email', 'email', 'name@example.com')}
              </div>
            </div>
            <div style={{ background: '#1e1108', border: '1px solid #2a1808', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#c9a227', fontWeight: 'bold', marginBottom: '0.75rem' }}>🔗 קישורים חיצוניים</div>
              {T('קישורים', 'external_links', 2, 'Ancestry: https://...\nMyHeritage: https://...\nYad Vashem: ...')}
            </div>
            <div style={{ background: '#1e1108', border: '1px solid #3a1010', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#c9a227', fontWeight: 'bold', marginBottom: 4 }}>🔒 הערות רפואיות (פרטי)</div>
              <div style={{ fontSize: '0.7rem', color: '#5a3a1a', marginBottom: '0.6rem' }}>מחלות תורשתיות, סיבת פטירה — גלוי רק למנהלים</div>
              {T('הערות רפואיות', 'medical_notes', 2, 'מחלות תורשתיות...')}
            </div>
          </div>
        )}

        {/* Save bar */}
        <div style={{ position: 'sticky', bottom: '1rem', display: 'flex', gap: '0.75rem', marginTop: '1.5rem', alignItems: 'center', background: '#0d0702ee', padding: '0.75rem', borderRadius: 12, border: '1px solid #2a1808', backdropFilter: 'blur(8px)' }}>
          <button onClick={save} disabled={saving}
            style={{ flex: 1, background: 'linear-gradient(135deg,#d4af37,#c9a227)', color: '#0d0702', border: 'none', borderRadius: 10, padding: '0.65rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'שומר...' : '💾 שמור שינויים'}
          </button>
          {saved && <span style={{ color: '#4a9e6a', fontSize: '0.85rem' }}>✓ נשמר!</span>}
          <a href={`/people/${id}`} style={{ background: 'transparent', border: '1px solid #3a2a10', color: '#b89a5a', borderRadius: 10, padding: '0.6rem 1rem', textDecoration: 'none', fontSize: '0.88rem' }}>ביטול</a>
        </div>
      </div>
    </main>
  )
}
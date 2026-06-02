'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Family = {
  id: number; name: string; name_en?: string; description?: string
  origin_country?: string; video_url?: string; image_url?: string
}
type Person = {
  id: number; first_name: string; last_name: string
  birth_date?: string; death_date?: string; birth_place?: string; photo_url?: string
}

export default function FamilyPage() {
  const { id, locale } = useParams() as { id: string; locale: string }
  const router = useRouter()
  const [family, setFamily] = useState<Family | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [stats, setStats] = useState({ photos: 0, documents: 0, events: 0 })
  const [newForm, setNewForm] = useState({ name: '', description: '', origin_country: '' })
  const [saving, setSaving] = useState(false)
  const isNew = id === 'new'

  useEffect(() => {
    async function init() {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).single()
      const role = roleData?.role || 'viewer'
      setCanEdit(role === 'admin' || role === 'editor')

      if (!isNew) {
        const { data: familyData } = await supabase.from('families').select('*').eq('id', id).single()
        setFamily(familyData)
        const { data: peopleData } = await supabase.from('people').select('*').eq('family_id', id).order('last_name')
        setPeople(peopleData || [])

        // סטטיסטיקות
        if (peopleData && peopleData.length > 0) {
          const ids = peopleData.map((p: Person) => p.id)
          const [{ count: photos }, { count: documents }, { count: events }] = await Promise.all([
            supabase.from('photos').select('*', { count: 'exact', head: true }).in('person_id', ids),
            supabase.from('documents').select('*', { count: 'exact', head: true }).in('person_id', ids),
            supabase.from('timeline_events').select('*', { count: 'exact', head: true }).in('person_id', ids),
          ])
          setStats({ photos: photos || 0, documents: documents || 0, events: events || 0 })
        }
      }
      setLoading(false)
    }
    init()
  }, [id])

  async function handleSubmit() {
    if (!newForm.name) { alert('חובה להכניס שם משפחה'); return }
    setSaving(true)
    await supabase.from('families').insert([{ name: newForm.name, description: newForm.description || null, origin_country: newForm.origin_country || null }])
    router.push('/dashboard')
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#1c1008', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#b89a5a' }}>טוען...</p>
    </main>
  )

  if (isNew) return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem' }}>
        <a href={`/${locale}/dashboard`} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ חזרה ללוח בקרה</a>
      </div>
      <div style={{ maxWidth: '560px', margin: '3rem auto', padding: '0 2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#f5d98b', marginBottom: '0.5rem' }}>הוספת משפחה חדשה</h1>
        <div style={{ width: '80px', height: '1px', background: '#c9a227', marginBottom: '2rem' }} />
        <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            { label: 'שם המשפחה *', key: 'name', placeholder: 'לדוגמה: כהן' },
            { label: 'מדינת מוצא', key: 'origin_country', placeholder: 'לדוגמה: פולין' },
            { label: 'תיאור קצר', key: 'description', placeholder: 'כמה מילים על המשפחה...' },
          ].map(field => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#b89a5a', marginBottom: '0.4rem' }}>{field.label}</label>
              <input value={(newForm as any)[field.key]} onChange={e => setNewForm({ ...newForm, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                style={{ width: '100%', background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ background: '#c9a227', color: '#1a0f05', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Arial' }}>
              {saving ? 'שומר...' : 'שמור משפחה'}
            </button>
            <a href={`/${locale}/dashboard`} style={{ border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.65rem 1.25rem', color: '#b89a5a', textDecoration: 'none', fontSize: '1rem' }}>ביטול</a>
          </div>
        </div>
      </div>
    </main>
  )

  if (!family) return (
    <main style={{ minHeight: '100vh', background: '#1c1008', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ color: '#b89a5a' }}>משפחה לא נמצאה</p>
      <a href={`/${locale}/dashboard`} style={{ color: '#c9a227' }}>חזרה ללוח בקרה</a>
    </main>
  )

  // מיון: ילדים חיים בהתחלה, לפי שנת לידה
  const sorted = [...people].sort((a, b) => {
    if (a.death_date && !b.death_date) return 1
    if (!a.death_date && b.death_date) return -1
    return (a.birth_date || '').localeCompare(b.birth_date || '')
  })

  const alive = people.filter(p => !p.death_date).length
  const generations = new Set(people.map(p => p.birth_date?.substring(0, 3))).size

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: '55vh', minHeight: '380px', overflow: 'hidden' }}>
        {family.video_url ? (
          <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
            <source src={family.video_url} type="video/mp4" />
          </video>
        ) : family.image_url ? (
          <img src={family.image_url} alt={family.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0d0702 0%, #1c1008 100%)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)' }} />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href={`/${locale}/dashboard`} style={{ color: '#f5d98b', textDecoration: 'none', fontSize: '0.9rem' }}>→ לוח בקרה</a>
          {canEdit && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href={`/${locale}/families/${id}/edit`} style={{ background: '#c9a227', color: '#1a0f05', padding: '0.4rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>✏️ עריכה</a>
              <a href={`/${locale}/families/${id}/globe-edit`} style={{ background: '#1a0f05', border: '1px solid #4a9e6a', color: '#4ade80', padding: '0.4rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem' }}>🌍 מסעות</a>
              <a href={`/${locale}/families/${id}/tree-edit`} style={{ background: '#1a0f05', border: '1px solid #c9a22766', color: '#c9a227', padding: '0.4rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem' }}>🌳 עריכת עץ</a>
              <a href={`/${locale}/families/${id}/tree`} style={{ background: '#1a0f05', border: '1px solid #5a3a1a', color: '#8b6914', padding: '0.4rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem' }}>👁️ צפה בעץ</a>
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', bottom: '2.5rem', left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
          <div style={{ fontSize: '0.9rem', color: '#f5d98b', letterSpacing: '6px', marginBottom: '0.6rem' }}>❧ ✦ ❧</div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.25rem', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
            משפחת {family.name}
          </h1>
          {family.name_en && <div style={{ fontSize: '1.1rem', color: '#f5d98b', letterSpacing: '2px', marginBottom: '0.4rem' }}>{family.name_en} Family</div>}
          {family.origin_country && <div style={{ fontSize: '0.95rem', color: '#f5d98b' }}>🌍 {family.origin_country}</div>}
          {family.description && <p style={{ fontSize: '0.95rem', color: '#f0e0c0', maxWidth: '480px', margin: '0.75rem auto 0', lineHeight: 1.7, textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>{family.description}</p>}
        </div>
      </div>

      {/* סטטיסטיקות */}
      <div style={{ background: '#0d0702', borderBottom: '1px solid #1a0f05', padding: '1.25rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          {[
            { num: people.length, label: 'בני משפחה' },
            { num: alive, label: 'בחיים' },
            { num: generations, label: 'דורות' },
            { num: stats.photos, label: 'תמונות' },
            { num: stats.documents, label: 'מסמכים' },
            { num: stats.events, label: 'אירועים' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#c9a227' }}>{item.num}</div>
              <div style={{ fontSize: '0.72rem', color: '#6a4a28' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* קישורים מהירים */}
      <div style={{ background: '#0d0702', borderBottom: '1px solid #1a0f05', padding: '0.75rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '🌳', label: 'עץ משפחה', href: `/${locale}/families/${id}/tree` },
            { icon: '🌍', label: 'מפת נדידה', href: `/${locale}/map` },
            { icon: '📅', label: 'ציר זמן', href: `/${locale}/timeline` },
            { icon: '🖼️', label: 'גלריה', href: `/${locale}/gallery` },
            { icon: '📄', label: 'מסמכים', href: `/${locale}/documents` },
            { icon: '📝', label: 'סיפורים', href: `/${locale}/stories` },
            { icon: '📆', label: 'לוח שנה', href: `/${locale}/calendar` },
            { icon: '✡️', label: 'מדור שואה', href: `/${locale}/holocaust` },
            { icon: '🔍', label: 'חיפוש', href: `/${locale}/search` },
          ].map(link => (
            <a key={link.label} href={link.href} style={{ background: '#1a0f05', border: '1px solid #2a1a08', borderRadius: '8px', padding: '0.5rem 1rem', textDecoration: 'none', color: '#b89a5a', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a1a08')}>
              {link.icon} {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* בני המשפחה */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#f5d98b' }}>בני המשפחה ({people.length})</h2>
          {canEdit && (
            <a href={`/${locale}/people/new`} style={{ background: '#c9a227', color: '#1a0f05', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>+ הוסף אדם</a>
          )}
        </div>

        {people.length === 0 && (
          <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#b89a5a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
            <p>עדיין אין אנשים במשפחה זו</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {sorted.map(person => (
            <a key={person.id} href={`/${locale}/people/${person.id}`} style={{
              background: '#2a1a08', border: '1px solid ' + (person.death_date ? '#1a1a1a' : '#3a2a10'),
              borderRadius: '12px', padding: '1.25rem', textDecoration: 'none', color: 'inherit',
              display: 'flex', alignItems: 'center', gap: '1rem', opacity: person.death_date ? 0.7 : 1,
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9a227')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = person.death_date ? '#1a1a1a' : '#3a2a10')}>
              {person.photo_url ? (
                <img src={person.photo_url} alt={person.first_name} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a227', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#3a2a10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>👤</div>
              )}
              <div>
                <div style={{ fontWeight: 'bold', color: '#f5d98b' }}>{[person.first_name, person.last_name].filter(Boolean).join(" ")}</div>
                <div style={{ fontSize: '0.78rem', color: '#8a6a3a', marginTop: '2px' }}>
                  {person.birth_date && person.birth_date.substring(0, 4)}
                  {person.death_date && ' — ' + person.death_date.substring(0, 4)}
                </div>
                {person.birth_place && <div style={{ fontSize: '0.75rem', color: '#5a3a18' }}>{person.birth_place}</div>}
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
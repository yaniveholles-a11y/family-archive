'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Photo = { id: number; url: string; caption?: string; year?: number; tags?: string[] }
type Person = { id: number; first_name: string; last_name: string }

export default function PersonGalleryPage() {
  const { id } = useParams()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [allPeople, setAllPeople] = useState<Person[]>([])
  const [person, setPerson] = useState<any>(null)
  const [caption, setCaption] = useState('')
  const [year, setYear] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<Photo | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [decade, setDecade] = useState('all')
  const [canEdit, setCanEdit] = useState(false)
  const [tagMode, setTagMode] = useState<number | null>(null) // photo id being tagged
  const [photoTags, setPhotoTags] = useState<Record<number, Person[]>>({})

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: userData } = await supabase.auth.getUser()
    if (userData.user) {
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).single()
      setCanEdit(roleData?.role === 'admin' || roleData?.role === 'editor')
    }
    const { data: personData } = await supabase.from('people').select('*').eq('id', id).single()
    setPerson(personData)

    const { data: photosData } = await supabase.from('photos').select('*').eq('person_id', id).order('year', { ascending: false })
    setPhotos(photosData || [])

    // טען תגיות לכל תמונה
    const { data: tagsData } = await supabase
      .from('photo_tags')
      .select('photo_id, person:tagged_person_id(id, first_name, last_name)')
      .in('photo_id', (photosData || []).map((p: Photo) => p.id))

    const tagsMap: Record<number, Person[]> = {}
    for (const tag of tagsData || []) {
  if (!tagsMap[tag.photo_id]) tagsMap[tag.photo_id] = []

  const person = Array.isArray(tag.person)
    ? tag.person[0]
    : tag.person

  if (person) {
    tagsMap[tag.photo_id].push(person)
  }
}

    const { data: peopleData } = await supabase.from('people').select('id, first_name, last_name').order('last_name')
    setAllPeople(peopleData || [])
  }

  async function uploadPhoto(e: any) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = id + '/' + Date.now() + '-' + file.name
    await supabase.storage.from('photos').upload(fileName, file)
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)
    await supabase.from('photos').insert({ person_id: id, url: urlData.publicUrl, caption, year: year ? parseInt(year) : null })
    setCaption(''); setYear('')
    setUploading(false)
    fetchData()
  }

  async function deletePhoto(photoId: number) {
    if (!confirm('למחוק את התמונה?')) return
    await supabase.from('photo_tags').delete().eq('photo_id', photoId)
    await supabase.from('photos').delete().eq('id', photoId)
    setSelected(null); fetchData()
  }

  async function tagPerson(photoId: number, personId: number) {
    const existing = photoTags[photoId] || []
    if (existing.find(p => p.id === personId)) {
      // הסר תיוג
      await supabase.from('photo_tags').delete().eq('photo_id', photoId).eq('tagged_person_id', personId)
    } else {
      // הוסף תיוג
      await supabase.from('photo_tags').insert({ photo_id: photoId, tagged_person_id: personId })
    }
    fetchData()
  }

  function openPhoto(photo: Photo, idx: number) { setSelected(photo); setSelectedIdx(idx) }
  function goNext() { const next = (selectedIdx + 1) % filtered.length; setSelected(filtered[next]); setSelectedIdx(next) }
  function goPrev() { const prev = (selectedIdx - 1 + filtered.length) % filtered.length; setSelected(filtered[prev]); setSelectedIdx(prev) }

  const decades = ['all', '1900', '1910', '1920', '1930', '1940', '1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020']
  const filtered = decade === 'all' ? photos : photos.filter(p => p.year && String(p.year).startsWith(decade.substring(0, 3)))

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={'/people/' + id} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ חזרה לפרופיל</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>{person?.first_name} — גלריה</span>
        <span style={{ color: '#8a6a3a', fontSize: '0.85rem' }}>{photos.length} תמונות</span>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

        {canEdit && (
          <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', color: '#f5d98b', marginBottom: '1rem' }}>העלאת תמונה חדשה</h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="כיתוב (אופציונלי)"
                style={{ flex: 2, minWidth: '160px', background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.9rem' }} />
              <input value={year} onChange={e => setYear(e.target.value)} placeholder="שנה (לדוגמה: 1965)" type="number"
                style={{ flex: 1, minWidth: '120px', background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.9rem' }} />
              <label style={{ background: '#c9a227', color: '#1a0f05', borderRadius: '8px', padding: '0.6rem 1.25rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 }}>
                {uploading ? 'מעלה...' : '+ בחר תמונה'}
                <input type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {/* סינון עשורים */}
        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {decades.map(d => (
              <button key={d} onClick={() => setDecade(d)} style={{
                background: decade === d ? '#c9a227' : '#2a1a08', color: decade === d ? '#0d0702' : '#b89a5a',
                border: '1px solid #3a2a10', borderRadius: '20px', padding: '0.3rem 0.8rem',
                cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Arial',
              }}>{d === 'all' ? 'כל השנים' : `${d}s`}</button>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#b89a5a' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖼️</div>
            <p>אין תמונות עדיין</p>
          </div>
        )}

        {/* Masonry */}
        <div style={{ columns: '4 180px', gap: '0.75rem' }}>
          {filtered.map((photo, idx) => (
            <div key={photo.id} style={{ breakInside: 'avoid', marginBottom: '0.75rem', position: 'relative' }}>
              <div onClick={() => openPhoto(photo, idx)} style={{
                cursor: 'pointer', border: '1px solid #3a2a10', borderRadius: '8px',
                overflow: 'hidden', background: '#2a1a08', transition: 'border-color 0.2s, transform 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a227'; e.currentTarget.style.transform = 'scale(1.01)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a2a10'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                <img src={photo.url} alt={photo.caption || ''} style={{ width: '100%', display: 'block' }} />
                {(photo.caption || photo.year) && (
                  <div style={{ padding: '0.4rem 0.6rem' }}>
                    {photo.caption && <div style={{ fontSize: '0.75rem', color: '#b89a5a' }}>{photo.caption}</div>}
                    {photo.year && <div style={{ fontSize: '0.68rem', color: '#5a3a18' }}>{photo.year}</div>}
                  </div>
                )}
                {/* תגיות */}
                {(photoTags[photo.id] || []).length > 0 && (
                  <div style={{ padding: '0.3rem 0.6rem', borderTop: '1px solid #2a1a08', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {(photoTags[photo.id] || []).map(p => (
                      <span key={p.id} style={{ fontSize: '0.65rem', background: '#1a0f05', border: '1px solid #3a2a10', borderRadius: '10px', padding: '0.1rem 0.4rem', color: '#c9a227' }}>
                        👤 {p.first_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* כפתור תיוג */}
              {canEdit && (
                <button onClick={() => setTagMode(tagMode === photo.id ? null : photo.id)}
                  style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(13,7,2,0.8)', border: '1px solid #c9a227', borderRadius: '6px', color: '#c9a227', padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.65rem', fontFamily: 'Arial' }}>
                  🏷️ תייג
                </button>
              )}

              {/* פאנל תיוג */}
              {tagMode === photo.id && (
                <div style={{ background: '#1a0f05', border: '1px solid #c9a227', borderRadius: '8px', padding: '0.75rem', marginTop: '0.4rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#8a6a3a', marginBottom: '0.5rem' }}>מי מופיע בתמונה?</div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {allPeople.map(p => {
                      const isTagged = (photoTags[photo.id] || []).some(t => t.id === p.id)
                      return (
                        <div key={p.id} onClick={() => tagPerson(photo.id, p.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', borderRadius: '6px', cursor: 'pointer', background: isTagged ? '#2a1a00' : 'transparent', border: '1px solid ' + (isTagged ? '#c9a227' : 'transparent') }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: isTagged ? '#c9a227' : 'transparent', border: '1px solid ' + (isTagged ? '#c9a227' : '#5a3a18'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#0d0702' }}>
                            {isTagged ? '✓' : ''}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: isTagged ? '#f5d98b' : '#b89a5a' }}>{[p.first_name, p.last_name].filter(Boolean).join(" ")}</span>
                        </div>
                      )
                    })}
                  </div>
                  <button onClick={() => setTagMode(null)} style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: '#8a6a3a', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'Arial' }}>סגור</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          {filtered.length > 1 && (
            <button onClick={e => { e.stopPropagation(); goPrev() }} style={{ position: 'absolute', left: '1rem', background: 'rgba(201,162,39,0.2)', border: '1px solid #c9a227', borderRadius: '50%', width: '44px', height: '44px', color: '#c9a227', fontSize: '1.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          )}
          <div onClick={e => e.stopPropagation()} style={{ background: '#1c1008', border: '1px solid #c9a227', borderRadius: '14px', overflow: 'hidden', maxWidth: '860px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            <img src={selected.url} alt={selected.caption || ''} style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block', background: '#0d0702' }} />
            <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {selected.caption && <div style={{ color: '#f5d98b', fontSize: '0.9rem' }}>{selected.caption}</div>}
                {selected.year && <div style={{ color: '#8a6a3a', fontSize: '0.8rem' }}>{selected.year}</div>}
                {/* תגיות בלייטבוקס */}
                {(photoTags[selected.id] || []).length > 0 && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {(photoTags[selected.id] || []).map(p => (
                      <a key={p.id} href={'/people/' + p.id} style={{ fontSize: '0.75rem', background: '#1a0f05', border: '1px solid #3a2a10', borderRadius: '10px', padding: '0.15rem 0.5rem', color: '#c9a227', textDecoration: 'none' }}>
                        👤 {[p.first_name, p.last_name].filter(Boolean).join(" ")}
                      </a>
                    ))}
                  </div>
                )}
                <div style={{ color: '#5a3a18', fontSize: '0.72rem', marginTop: '4px' }}>{selectedIdx + 1} / {filtered.length}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {canEdit && (
                  <button onClick={() => deletePhoto(selected.id)} style={{ background: '#3a0a0a', border: '1px solid #7a1a1a', borderRadius: '6px', color: '#f87171', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Arial' }}>🗑 מחק</button>
                )}
                <button onClick={() => setSelected(null)} style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '6px', color: '#b89a5a', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Arial' }}>סגור ✕</button>
              </div>
            </div>
          </div>
          {filtered.length > 1 && (
            <button onClick={e => { e.stopPropagation(); goNext() }} style={{ position: 'absolute', right: '1rem', background: 'rgba(201,162,39,0.2)', border: '1px solid #c9a227', borderRadius: '50%', width: '44px', height: '44px', color: '#c9a227', fontSize: '1.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          )}
        </div>
      )}
    </main>
  )
}
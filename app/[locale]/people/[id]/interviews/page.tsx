'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Interview = {
  id: number
  title: string
  description?: string
  file_url: string
  file_type: string
  created_at: string
}

export default function InterviewsPage() {
  const { id } = useParams()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [person, setPerson] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [playing, setPlaying] = useState<number | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio'>('all')
  const fileInput = useRef<any>(null)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const { data: personData } = await supabase.from('people').select('*').eq('id', id).single()
    setPerson(personData)

    const { data: interviewsData } = await supabase
      .from('interviews')
      .select('*')
      .eq('person_id', id)
      .order('created_at', { ascending: false })
    setInterviews(interviewsData || [])

    const { data: userData } = await supabase.auth.getUser()
    if (userData.user) {
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).single()
      const role = roleData?.role
      setCanEdit(role === 'admin' || role === 'editor')
    }
  }

  async function handleUpload(e: any) {
    const file = e.target.files[0]
    if (!file) return
    if (!title.trim()) { alert('חובה להכניס כותרת'); return }

    const isVideo = file.type.includes('video')
    const isAudio = file.type.includes('audio')
    if (!isVideo && !isAudio) {
      alert('סוג קובץ לא נתמך. ניתן להעלות: MP4, MOV (וידאו) או MP3, WAV, M4A (שמע)')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = 'interviews/' + id + '-' + Date.now() + '.' + ext

    const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file)
    if (uploadError) { alert('שגיאה בהעלאה: ' + uploadError.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)
    await supabase.from('interviews').insert([{
      person_id: id,
      title: title.trim(),
      description: description.trim() || null,
      file_url: urlData.publicUrl,
      file_type: file.type,
    }])

    setTitle(''); setDescription(''); setShowForm(false); setUploading(false)
    loadData()
  }

  async function handleDelete(interviewId: number) {
    if (!confirm('למחוק את ההקלטה?')) return
    await supabase.from('interviews').delete().eq('id', interviewId)
    setPlaying(null)
    loadData()
  }

  function isVideo(fileType: string) { return fileType.includes('video') }

  function getTypeLabel(fileType: string) {
    if (fileType.includes('video/mp4')) return { label: 'וידאו MP4', icon: '🎬', color: '#5a8ab0' }
    if (fileType.includes('video/quicktime') || fileType.includes('video/mov')) return { label: 'וידאו MOV', icon: '🎬', color: '#5a8ab0' }
    if (fileType.includes('video')) return { label: 'וידאו', icon: '🎬', color: '#5a8ab0' }
    if (fileType.includes('audio/mpeg') || fileType.includes('audio/mp3')) return { label: 'הקלטת MP3', icon: '🎙️', color: '#4a9e6a' }
    if (fileType.includes('audio/wav')) return { label: 'הקלטת WAV', icon: '🎙️', color: '#4a9e6a' }
    if (fileType.includes('audio/m4a') || fileType.includes('audio/mp4')) return { label: 'הקלטת M4A', icon: '🎙️', color: '#4a9e6a' }
    if (fileType.includes('audio')) return { label: 'הקלטת שמע', icon: '🎙️', color: '#4a9e6a' }
    return { label: 'קובץ מדיה', icon: '📽️', color: '#b89a5a' }
  }

  const videoItems = interviews.filter(i => i.file_type.includes('video'))
  const audioItems = interviews.filter(i => i.file_type.includes('audio'))

  const filtered = filterType === 'video' ? videoItems
    : filterType === 'audio' ? audioItems
    : interviews

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={'/people/' + id} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ חזרה לפרופיל</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>{person?.first_name} — הקלטות ומדיה</span>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>

        <h1 style={{ fontSize: '1.8rem', color: '#f5d98b', marginBottom: '0.5rem' }}>הקלטות ומדיה</h1>
        <div style={{ width: '80px', height: '1px', background: '#c9a227', marginBottom: '0.75rem' }} />
        <p style={{ color: '#b89a5a', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          ראיונות, סרטים, סרטונים, הקלטות שמע וכל תוכן מדיה אחר
        </p>

        {/* סטטיסטיקה מהירה */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'הכל', count: interviews.length, icon: '📽️' },
            { key: 'video', label: 'וידאו', count: videoItems.length, icon: '🎬' },
            { key: 'audio', label: 'שמע', count: audioItems.length, icon: '🎙️' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilterType(tab.key as any)}
              style={{
                background: filterType === tab.key ? '#c9a227' : '#2a1a08',
                color: filterType === tab.key ? '#0d0702' : '#b89a5a',
                border: '1px solid ' + (filterType === tab.key ? '#c9a227' : '#3a2a10'),
                borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer',
                fontSize: '0.88rem', fontFamily: 'Arial, sans-serif',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
              {tab.icon} {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* כפתור הוספה */}
        {canEdit && (
          <div style={{ marginBottom: '1.5rem' }}>
            <button onClick={() => setShowForm(!showForm)}
              style={{ background: '#c9a227', color: '#1a0f05', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
              {showForm ? 'ביטול' : '+ העלה הקלטה או סרטון'}
            </button>
          </div>
        )}

        {/* טופס העלאה */}
        {showForm && canEdit && (
          <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ color: '#f5d98b', margin: 0 }}>העלאת קובץ מדיה חדש</h3>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת *"
              style={{ background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.95rem' }} />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="תיאור קצר (אופציונלי)"
              style={{ background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.95rem' }} />
            <div style={{ background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.82rem', color: '#7a5a2a', marginBottom: '0.4rem' }}>סוגי קבצים נתמכים:</div>
              <div style={{ fontSize: '0.82rem', color: '#b89a5a' }}>🎬 וידאו: MP4, MOV</div>
              <div style={{ fontSize: '0.82rem', color: '#b89a5a' }}>🎙️ שמע: MP3, WAV, M4A</div>
            </div>
            <label style={{ background: uploading ? '#5a4a10' : '#2a1a08', border: '1px solid #c9a227', borderRadius: '8px', padding: '0.65rem 1.25rem', cursor: uploading ? 'not-allowed' : 'pointer', color: '#c9a227', fontSize: '0.9rem', display: 'inline-block', width: 'fit-content' }}>
              {uploading ? 'מעלה... (עשוי לקחת זמן)' : '📎 בחר קובץ והעלה'}
              <input ref={fileInput} type="file" accept="video/mp4,video/mov,video/quicktime,audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/x-m4a" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        )}

        {/* רשימה ריקה */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#b89a5a' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
            <p>אין {filterType === 'video' ? 'סרטונים' : filterType === 'audio' ? 'הקלטות שמע' : 'קבצי מדיה'} עדיין</p>
            {canEdit && <p style={{ fontSize: '0.85rem', color: '#5a3a1a', marginTop: '0.5rem' }}>לחץ על "העלה הקלטה או סרטון" כדי להוסיף</p>}
          </div>
        )}

        {/* רשימת קבצים */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filtered.map(interview => {
            const typeInfo = getTypeLabel(interview.file_type)
            return (
              <div key={interview.id} style={{ background: '#2a1a08', border: '1px solid ' + (playing === interview.id ? '#c9a227' : '#3a2a10'), borderRadius: '12px', overflow: 'hidden' }}>

                <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{typeInfo.icon}</span>
                      <span style={{ fontWeight: 'bold', color: '#f5d98b', fontSize: '1rem' }}>{interview.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '1.75rem' }}>
                      <span style={{ fontSize: '0.75rem', background: typeInfo.color + '33', border: '1px solid ' + typeInfo.color, color: typeInfo.color, borderRadius: '20px', padding: '0.15rem 0.6rem' }}>
                        {typeInfo.label}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#5a3a1a' }}>{new Date(interview.created_at).toLocaleDateString('he-IL')}</span>
                    </div>
                    {interview.description && (
                      <p style={{ fontSize: '0.85rem', color: '#b89a5a', margin: '0.4rem 0 0', paddingRight: '1.75rem' }}>{interview.description}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button onClick={() => setPlaying(playing === interview.id ? null : interview.id)}
                      style={{ background: playing === interview.id ? '#3a2a10' : '#c9a227', color: playing === interview.id ? '#c9a227' : '#1a0f05', border: '1px solid ' + (playing === interview.id ? '#c9a227' : 'transparent'), borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {playing === interview.id ? '⏸ סגור' : '▶ הפעל'}
                    </button>
                    <a href={interview.file_url} target="_blank"
                      style={{ background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '6px', padding: '0.4rem 0.9rem', color: '#b89a5a', textDecoration: 'none', fontSize: '0.85rem' }}>
                      ⬇
                    </a>
                    {canEdit && (
                      <button onClick={() => handleDelete(interview.id)}
                        style={{ background: 'transparent', border: '1px solid #5a1a10', borderRadius: '6px', color: '#c05050', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {playing === interview.id && (
                  <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    {isVideo(interview.file_type) ? (
                      <video controls autoPlay style={{ width: '100%', borderRadius: '8px', background: '#000', maxHeight: '400px' }} src={interview.file_url}>
                        הדפדפן שלך אינו תומך בהפעלת וידאו
                      </video>
                    ) : (
                      <audio controls autoPlay style={{ width: '100%', borderRadius: '8px' }} src={interview.file_url}>
                        הדפדפן שלך אינו תומך בהפעלת אודיו
                      </audio>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
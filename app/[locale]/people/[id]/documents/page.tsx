'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

export default function PersonDocuments() {
  const { id } = useParams()
  const [documents, setDocuments] = useState<any[]>([])
  const [person, setPerson] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)
  const fileInput = useRef<any>(null)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const { data: personData } = await supabase.from('people').select('*').eq('id', id).single()
    setPerson(personData)
    const { data: docsData } = await supabase.from('documents').select('*').eq('person_id', id).order('created_at', { ascending: false })
    setDocuments(docsData || [])
  }

  async function handleUpload(e: any) {
    const file = e.target.files[0]
    if (!file) return
    if (!title) { alert('חובה להכניס כותרת'); return }
    setUploading(true)
    const fileName = id + '-' + Date.now() + '.' + file.name.split('.').pop()
    await supabase.storage.from('documents').upload(fileName, file)
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)
    await supabase.from('documents').insert([{ person_id: id, title, description: description || null, file_url: urlData.publicUrl, file_type: file.type }])
    setTitle(''); setDescription(''); setShowForm(false)
    setUploading(false)
    loadData()
  }

  function getFileIcon(fileType: string) {
    if (!fileType) return '📄'
    if (fileType.includes('pdf')) return '📕'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    return '📄'
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#1c1008', color: '#f5e6c8', fontFamily: 'Arial, sans-serif' }}>

      {/* סרגל עליון */}
      <div style={{ background: '#0d0702', borderBottom: '1px solid #8b6914', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={'/people/' + id} style={{ color: '#c9a227', textDecoration: 'none', fontSize: '0.9rem' }}>→ חזרה לפרופיל</a>
        <span style={{ color: '#f5d98b', fontWeight: 'bold' }}>{person?.first_name} — מסמכים</span>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>

        {/* כפתור הוספה */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button onClick={() => setShowForm(!showForm)}
            style={{ background: '#c9a227', color: '#1a0f05', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {showForm ? 'ביטול' : '+ העלה מסמך'}
          </button>
        </div>

        {/* טופס העלאה */}
        {showForm && (
          <div style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת המסמך *"
              style={{ background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.95rem' }} />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="תיאור (אופציונלי)"
              style={{ background: '#1c1008', border: '1px solid #3a2a10', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f5e6c8', fontSize: '0.95rem' }} />
            <label style={{ background: '#2a1a08', border: '1px solid #c9a227', borderRadius: '8px', padding: '0.6rem 1.25rem', cursor: 'pointer', color: '#c9a227', fontSize: '0.9rem', display: 'inline-block', width: 'fit-content' }}>
              {uploading ? 'מעלה...' : '📎 בחר קובץ והעלה'}
              <input ref={fileInput} type="file" style={{ display: 'none' }} onChange={handleUpload} />
            </label>
          </div>
        )}

        {/* רשימת מסמכים */}
        {documents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#b89a5a' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <p>אין מסמכים עדיין</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {documents.map(doc => (
            <div key={doc.id} style={{ background: '#2a1a08', border: '1px solid #3a2a10', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.75rem' }}>{getFileIcon(doc.file_type)}</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#f5d98b' }}>{doc.title}</div>
                  {doc.description && <div style={{ fontSize: '0.8rem', color: '#b89a5a', marginTop: '2px' }}>{doc.description}</div>}
                </div>
              </div>
              <a href={doc.file_url} target="_blank"
                style={{ background: '#1c1008', border: '1px solid #c9a227', color: '#c9a227', padding: '0.4rem 0.9rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem' }}>
                פתח
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
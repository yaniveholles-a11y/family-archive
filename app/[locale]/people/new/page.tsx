'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Family = {
  id: number
  name: string
}

export default function NewPerson({
  params,
}: {
  params: { locale: string }
}) {
  const { locale } = params
  const router = useRouter()

  const [families, setFamilies] = useState<Family[]>([])
  const [canEdit, setCanEdit] = useState<boolean | null>(null)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
    death_date: '',
    death_place: '',
    bio: '',
    family_id: '',
  })

  useEffect(() => {
    async function loadFamilies() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .single()

      const role = roleData?.role
      const allowed = role === 'admin' || role === 'editor'

      setCanEdit(allowed)
      if (!allowed) return

      const { data } = await supabase
        .from('families')
        .select('*')
        .order('name')

      setFamilies(data || [])
    }

    loadFamilies()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.first_name) {
      alert('חובה להכניס שם פרטי')
      return
    }

    const cleanForm = {
      first_name: form.first_name,
      last_name: form.last_name || null,
      birth_date: form.birth_date || null,
      birth_place: form.birth_place || null,
      death_date: form.death_date || null,
      death_place: form.death_place || null,
      bio: form.bio || null,
      family_id: form.family_id ? Number(form.family_id) : null,
    }

    const { error } = await supabase.from('people').insert([cleanForm])

    if (error) {
      alert('שגיאה בשמירה')
    } else {
      router.push(`/${locale}/people`)
    }
  }

  if (canEdit === null) {
    return (
      <main style={styles.center}>
        <p style={styles.text}>בודק הרשאות...</p>
      </main>
    )
  }

  if (canEdit === false) {
    return (
      <main dir="rtl" style={styles.center}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🔒</div>
          <h1 style={styles.title}>אין הרשאה</h1>
          <p style={styles.text}>רק מנהלים ועורכים יכולים להוסיף אנשים</p>
          <a href={`/${locale}/people`} style={styles.link}>
            ← חזרה לרשימה
          </a>
        </div>
      </main>
    )
  }

  return (
    <main dir="rtl" style={styles.page}>
      <div style={styles.topBar}>
        <a href={`/${locale}/people`} style={styles.link}>
          ← חזרה לרשימת האנשים
        </a>
      </div>

      <div style={styles.container}>
        <h1 style={styles.title}>הוספת אדם חדש</h1>

        <div style={styles.card}>
          <label>שייך למשפחה</label>
          <select
            name="family_id"
            value={form.family_id}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">בחר משפחה</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                משפחת {f.name}
              </option>
            ))}
          </select>

          <input
            name="first_name"
            placeholder="שם פרטי *"
            value={form.first_name}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="last_name"
            placeholder="שם משפחה"
            value={form.last_name}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="date"
            name="birth_date"
            value={form.birth_date}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="birth_place"
            placeholder="מקום לידה"
            value={form.birth_place}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="date"
            name="death_date"
            value={form.death_date}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="death_place"
            placeholder="מקום פטירה"
            value={form.death_place}
            onChange={handleChange}
            style={styles.input}
          />

          <textarea
            name="bio"
            placeholder="סיפור חיים"
            value={form.bio}
            onChange={handleChange}
            style={{ ...styles.input, height: 100 }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSubmit} style={styles.button}>
              שמור
            </button>

            <a href={`/${locale}/people`} style={styles.cancel}>
              ביטול
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#1c1008',
    color: '#f5e6c8',
    fontFamily: 'Arial',
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#1c1008',
  },
  container: {
    maxWidth: 600,
    margin: '40px auto',
    padding: 20,
  },
  card: {
    background: '#2a1a08',
    padding: 20,
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #3a2a10',
    background: '#1c1008',
    color: '#f5e6c8',
  },
  button: {
    background: '#c9a227',
    border: 'none',
    padding: 10,
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  cancel: {
    padding: 10,
    border: '1px solid #3a2a10',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#b89a5a',
  },
  title: {
    color: '#f5d98b',
    marginBottom: 10,
  },
  text: {
    color: '#b89a5a',
  },
  link: {
    color: '#c9a227',
    textDecoration: 'none',
  },
  topBar: {
    padding: 20,
    borderBottom: '1px solid #3a2a10',
  },
}
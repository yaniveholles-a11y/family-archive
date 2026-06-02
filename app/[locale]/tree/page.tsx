'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Family = { id: number; name: string; name_en?: string; image_url?: string }

export default function TreeIndexPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // If user belongs to one family, go directly to that tree
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: roleData } = await supabase.from('user_roles').select('family_id').eq('user_id', user.id).maybeSingle()
          if (roleData?.family_id) {
            router.push(`/${locale}/families/${roleData.family_id}/tree`)
            return
          }
        }
      } catch {}

      // Otherwise show family picker
      const { data } = await supabase.from('families').select('id, name, name_en, image_url').order('name')
      setFamilies(data || [])
      setLoading(false)
    }
    load()
  }, [locale])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0702', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 48, color: '#c9a227' }}>✦</motion.div>
    </div>
  )

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #1a0f05, #0d0702)', color: '#f5e6c8', fontFamily: '"Heebo", Arial, sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌳</div>
          <h1 style={{ fontSize: '2rem', fontFamily: '"Playfair Display", serif', color: '#f5d98b', marginBottom: 8 }}>עץ משפחה</h1>
          <p style={{ color: '#8b6914', fontSize: 14, marginBottom: '2.5rem' }}>בחר משפחה כדי לצפות בעץ</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {families.map((f, i) => (
            <motion.a key={f.id} href={`/${locale}/families/${f.id}/tree`}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, borderColor: '#c9a227' }}
              style={{
                background: '#1a0f0566', border: '1px solid #c9a22722', borderRadius: 16,
                padding: '20px', textDecoration: 'none', textAlign: 'center',
                transition: 'all 0.2s',
              }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#2a1a08', margin: '0 auto 10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {f.image_url ? <img src={f.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏛️'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#f5e6c8', marginBottom: 2 }}>{f.name}</div>
              {f.name_en && <div style={{ fontSize: 12, color: '#8b6914' }}>{f.name_en}</div>}
              <div style={{ fontSize: 11, color: '#c9a227', marginTop: 8 }}>צפה בעץ →</div>
            </motion.a>
          ))}
        </div>

        {families.length === 0 && (
          <div style={{ color: '#5a3a1a', padding: '2rem' }}>
            <p>אין משפחות עדיין</p>
            <a href={`/${locale}/families/new`} style={{ color: '#c9a227', textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>+ צור משפחה חדשה</a>
          </div>
        )}
      </div>
    </main>
  )
}

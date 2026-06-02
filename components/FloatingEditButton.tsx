'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function FloatingEditButton({ editPath }: { editPath: string }) {
  const { locale } = useParams() as { locale: string }
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
        setCanEdit(data?.role === 'admin' || data?.role === 'editor')
      } catch {}
    }
    check()
  }, [])

  if (!canEdit) return null

  return (
    <motion.a
      href={`/${locale}/${editPath}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 50,
        background: 'linear-gradient(135deg, #c9a227, #a68520)',
        border: 'none', borderRadius: 14, padding: '12px 20px',
        color: '#0d0702', textDecoration: 'none',
        fontSize: 14, fontWeight: 700,
        fontFamily: '"Heebo", sans-serif',
        boxShadow: '0 4px 20px rgba(201,162,39,0.4), 0 8px 32px #0006',
        display: 'flex', alignItems: 'center', gap: 6,
        cursor: 'pointer',
      }}
    >
      ✏️ עריכה
    </motion.a>
  )
}

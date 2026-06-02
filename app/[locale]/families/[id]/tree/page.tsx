'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import FamilyTree from '@/components/FamilyTree'

export default function FamilyTreePage() {
  const { id, locale } = useParams() as { id: string; locale: string }
  const router = useRouter()
  const [family, setFamily] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      // Load family name
      const { data: familyData } = await supabase
        .from('families').select('name').eq('id', id).single()
      setFamily(familyData)

      // Check edit permissions (optional — don't block view)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: roleData } = await supabase
            .from('user_roles').select('role, family_id')
            .eq('user_id', user.id).maybeSingle()
          if (roleData?.role === 'admin' || roleData?.role === 'editor' || String(roleData?.family_id) === id) {
            setCanEdit(true)
          }
        }
      } catch {}

      setLoading(false)
    }
    init()
  }, [id, locale])

  // GSAP entrance
  useEffect(() => {
    if (!loading && headerRef.current && treeRef.current) {
      const tl = gsap.timeline()
      tl.fromTo(headerRef.current, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
      tl.fromTo(treeRef.current, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, '-=0.3')
    }
  }, [loading])

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #1a0f05, #0d0702)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 48, color: '#c9a227' }}>✦</motion.div>
      </main>
    )
  }

  return (
    <main dir="rtl" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse at 50% 0%, #1a0f05, #0d0702)', overflow: 'hidden' }}>
      {/* Header */}
      <div ref={headerRef} style={{
        background: 'linear-gradient(180deg, #0d0702ee, #0d0702cc)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #c9a22722', padding: '0.6rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0, fontFamily: '"Heebo", Arial, sans-serif', zIndex: 10,
      }}>
        <button onClick={() => router.push(`/${locale}/families/${id}`)} style={{
          background: 'none', border: '1px solid #c9a22733', borderRadius: 8,
          padding: '6px 14px', color: '#c9a227', cursor: 'pointer', fontSize: 13,
        }}>→ חזרה</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, color: '#c9a227' }}>🌳</span>
          <span style={{ color: '#f5e6c8', fontWeight: 600, fontSize: 15, fontFamily: '"Playfair Display", serif' }}>
            עץ משפחת {family?.name || ''}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {canEdit && (
            <a href={`/${locale}/families/${id}/tree-edit`} style={{
              background: 'linear-gradient(135deg, #c9a227, #a68520)', borderRadius: 8, padding: '6px 14px',
              color: '#0d0702', textDecoration: 'none', fontSize: 13, fontWeight: 700,
            }}>✏️ עריכת עץ</a>
          )}
          {canEdit && (
            <a href={`/${locale}/families/${id}/globe-edit`} style={{
              background: 'transparent', border: '1px solid #4a9e6a66', borderRadius: 8,
              padding: '6px 14px', color: '#4ade80', textDecoration: 'none', fontSize: 13,
            }}>🌍 מסעות</a>
          )}
        </div>
      </div>

      {/* Tips */}
      <div style={{
        background: '#0d070299', borderBottom: '1px solid #1a0f05',
        padding: '6px 1.5rem', display: 'flex', gap: '2rem', justifyContent: 'center',
        fontSize: 11, color: '#5a3a1a', fontFamily: '"Heebo", sans-serif', flexShrink: 0,
      }}>
        <span>גרור להזזה</span><span>גלגל לזום</span><span>לחץ על אדם לפרטים</span>
      </div>

      {/* Tree */}
      <div ref={treeRef} style={{ flex: 1, overflow: 'hidden' }}>
        <FamilyTree familyId={id} locale={locale} />
      </div>
    </main>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

const EDIT_SECTIONS = [
  { icon: '🏠', label: 'עמוד הבית', desc: 'עריכת עמוד הכניסה', href: '/', editHref: null },
  { icon: '👥', label: 'אנשים', desc: 'הוספת ועריכת בני משפחה', href: '/people', editHref: '/people/new' },
  { icon: '🌳', label: 'עץ משפחה', desc: 'עריכת קשרים ומבנה העץ', href: '/tree', editHref: null, familySpecific: true, editPath: '/tree-edit' },
  { icon: '🌍', label: 'גלובוס מסעות', desc: 'עריכת תחנות ומסלולים', href: '/map', editHref: null, familySpecific: true, editPath: '/globe-edit' },
  { icon: '🖼️', label: 'גלריה', desc: 'ניהול תמונות ואלבומים', href: '/gallery', editHref: '/gallery-edit' },
  { icon: '📄', label: 'מסמכים', desc: 'העלאת וניהול מסמכים', href: '/documents', editHref: '/documents-edit' },
  { icon: '📅', label: 'ציר זמן', desc: 'הוספת אירועים', href: '/timeline', editHref: '/timeline-edit' },
  { icon: '📝', label: 'סיפורים', desc: 'כתיבת סיפורים ובלוג', href: '/stories', editHref: '/stories-edit' },
  { icon: '📆', label: 'לוח שנה', desc: 'ניהול יארצייטים ואירועים', href: '/calendar', editHref: '/calendar-edit' },
  { icon: '📖', label: 'ספר משפחה', desc: 'עריכת הספר המשפחתי', href: '/book', editHref: '/book-edit' },
  { icon: '✡️', label: 'מדור שואה', desc: 'עריכת תוכן הנצחה', href: '/holocaust', editHref: '/holocaust-edit' },
  { icon: '👤', label: 'ניהול משתמשים', desc: 'הרשאות ומשתמשים', href: '/admin/users', editHref: '/admin/users' },
]

export default function AdminEditPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [families, setFamilies] = useState<any[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push(`/${locale}/login`); return }
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
        setCanEdit(data?.role === 'admin' || data?.role === 'editor')
        const { data: fams } = await supabase.from('families').select('id,name')
        setFamilies(fams || [])
      } catch {}
      setLoading(false)
    }
    check()
  }, [locale])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0702', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 48, color: '#c9a227' }}>✦</motion.div>
    </div>
  )

  if (!canEdit) return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0702', color: '#f5e6c8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: '"Heebo", sans-serif' }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <p style={{ color: '#8b6914' }}>אין לך הרשאת עריכה</p>
      <button onClick={() => router.push(`/${locale}/dashboard`)} style={{ background: '#c9a227', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#0d0702', cursor: 'pointer', fontWeight: 700 }}>חזרה</button>
    </main>
  )

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0d0702, #1a0f05)', color: '#f5e6c8', fontFamily: '"Heebo", Arial, sans-serif' }}>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ background: '#0d0702ee', borderBottom: '1px solid #c9a22722', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push(`/${locale}/dashboard`)} style={{ background: 'none', border: '1px solid #c9a22733', borderRadius: 8, padding: '5px 12px', color: '#c9a227', cursor: 'pointer', fontSize: 13 }}>→ חזרה</button>
            <span style={{ fontSize: 22, color: '#c9a227' }}>✏️</span>
            <h1 style={{ fontSize: '1.4rem', fontFamily: '"Playfair Display", serif', color: '#f5d98b' }}>מרכז עריכה</h1>
          </div>
        </div>
      </motion.div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        {/* Family-specific sections first */}
        {families.length > 0 && (
          <>
            <h2 style={{ fontSize: '1rem', color: '#c9a227', marginBottom: 12, fontWeight: 600, borderBottom: '1px solid #c9a22722', paddingBottom: 8 }}>עריכה לפי משפחה</h2>
            {families.map(fam => (
              <div key={fam.id} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f5e6c8', marginBottom: 8 }}>🏛️ {fam.name}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginRight: 20 }}>
                  <EditBtn href={`/${locale}/families/${fam.id}/edit`} icon="✏️" label="פרטי משפחה" />
                  <EditBtn href={`/${locale}/families/${fam.id}/tree-edit`} icon="🌳" label="עריכת עץ" />
                  <EditBtn href={`/${locale}/families/${fam.id}/globe-edit`} icon="🌍" label="עריכת מסעות" />
                  <EditBtn href={`/${locale}/families/${fam.id}/tree`} icon="👁️" label="צפייה בעץ" />
                </div>
              </div>
            ))}
          </>
        )}

        {/* General sections */}
        <h2 style={{ fontSize: '1rem', color: '#c9a227', marginBottom: 12, marginTop: 24, fontWeight: 600, borderBottom: '1px solid #c9a22722', paddingBottom: 8 }}>עריכה כללית</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {EDIT_SECTIONS.filter(s => !s.familySpecific).map((section, i) => (
            <motion.div key={section.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{section.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f5e6c8', marginBottom: 2 }}>{section.label}</div>
                <div style={{ fontSize: 11, color: '#5a3a1a', marginBottom: 8 }}>{section.desc}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <a href={`/${locale}${section.href}`} style={{ fontSize: 11, color: '#8b6914', textDecoration: 'none', border: '1px solid #2a1a08', borderRadius: 6, padding: '3px 8px' }}>👁️ צפייה</a>
                  {section.editHref && (
                    <a href={`/${locale}${section.editHref}`} style={{ fontSize: 11, color: '#c9a227', textDecoration: 'none', border: '1px solid #c9a22744', borderRadius: 6, padding: '3px 8px' }}>✏️ עריכה</a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create new */}
        <h2 style={{ fontSize: '1rem', color: '#c9a227', marginBottom: 12, marginTop: 24, fontWeight: 600, borderBottom: '1px solid #c9a22722', paddingBottom: 8 }}>יצירה חדשה</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <EditBtn href={`/${locale}/families/new`} icon="🏛️" label="משפחה חדשה" gold />
          <EditBtn href={`/${locale}/people/new`} icon="👤" label="אדם חדש" gold />
          <EditBtn href={`/${locale}/global-tree`} icon="🌐" label="עץ גלובלי" gold />
        </div>
      </div>
    </main>
  )
}

function EditBtn({ href, icon, label, gold }: { href: string; icon: string; label: string; gold?: boolean }) {
  return (
    <a href={href} style={{
      background: gold ? 'linear-gradient(135deg, #c9a22722, #c9a22711)' : '#1a0f0544',
      border: `1px solid ${gold ? '#c9a22755' : '#c9a22722'}`,
      borderRadius: 10, padding: '8px 14px', textDecoration: 'none',
      display: 'flex', alignItems: 'center', gap: 6,
      color: gold ? '#f5d98b' : '#b89a5a', fontSize: 13,
      transition: 'all 0.2s',
    }}>{icon} {label}</a>
  )
}

'use client'
import { motion } from 'framer-motion'

export function Skeleton({ width = '100%', height = 20, radius = 8 }: { width?: string | number; height?: number; radius?: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width, height, borderRadius: radius, background: 'linear-gradient(90deg, #1a0f0544, #c9a22711, #1a0f0544)' }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div style={{ background: '#1a0f0544', border: '1px solid #c9a22715', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton height={12} width="60%" />
      <Skeleton height={10} width="40%" />
      <Skeleton height={40} />
    </div>
  )
}

export function PageSkeleton({ title }: { title?: string }) {
  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0d0702, #1a0f05)', color: '#f5e6c8', fontFamily: '"Heebo", sans-serif' }}>
      <div style={{ background: '#0d0702ee', borderBottom: '1px solid #c9a22722', padding: '2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Skeleton height={28} width="200px" />
          <div style={{ marginTop: 8 }}><Skeleton height={14} width="300px" /></div>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    </main>
  )
}

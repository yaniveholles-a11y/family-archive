'use client'
import { useState } from 'react'
import { Handle, Position } from 'reactflow'

export type PersonNode = {
  id: string
  first_name: string
  last_name: string
  birth_date?: string
  death_date?: string
  photo_url?: string
  family_id?: number
  generation?: number
}

const GENERATION_COLORS = [
  { bg: '#2a1500', border: '#c9a227', text: '#f5d98b' }, // דור 0 — זהב
  { bg: '#1a0a2a', border: '#8b5cf6', text: '#c4b5fd' }, // דור 1 — סגול
  { bg: '#0a1a2a', border: '#2563eb', text: '#93c5fd' }, // דור 2 — כחול
  { bg: '#0a2a1a', border: '#059669', text: '#6ee7b7' }, // דור 3 — ירוק
  { bg: '#2a0a0a', border: '#dc2626', text: '#fca5a5' }, // דור 4 — אדום
  { bg: '#1a1a0a', border: '#ca8a04', text: '#fde047' }, // דור 5+ — צהוב
]

function getGenerationStyle(gen: number) {
  return GENERATION_COLORS[Math.min(gen, GENERATION_COLORS.length - 1)]
}

function getInitials(first: string, last: string) {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()
}

function getBirthYear(date?: string) {
  if (!date) return null
  return date.substring(0, 4)
}

interface TreeNodeProps {
  data: PersonNode & {
    onOpenPopup: (person: PersonNode) => void
  }
}

export default function TreeNode({ data }: TreeNodeProps) {
  const [hovered, setHovered] = useState(false)
  const gen = data.generation || 0
  const style = getGenerationStyle(gen)
  const birthYear = getBirthYear(data.birth_date)
  const deathYear = getBirthYear(data.death_date)
  const years = birthYear
    ? deathYear
      ? `${birthYear} — ${deathYear}`
      : `נולד ${birthYear}`
    : ''

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: style.border, border: 'none', width: 8, height: 8 }}
      />

      <div
        onClick={() => data.onOpenPopup(data)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: style.bg,
          border: `2px solid ${hovered ? '#f5d98b' : style.border}`,
          borderRadius: '12px',
          padding: '10px 14px',
          minWidth: '130px',
          maxWidth: '160px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: hovered ? 'translateY(-2px)' : 'none',
          boxShadow: hovered
            ? `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${style.border}44`
            : `0 2px 8px rgba(0,0,0,0.3)`,
          direction: 'rtl',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
        }}
      >
        {/* תמונה */}
        {data.photo_url ? (
          <img
            src={data.photo_url}
            alt={data.first_name}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${style.border}`,
              margin: '0 auto 8px',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: `${style.border}22`,
            border: `2px solid ${style.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            color: style.border,
          }}>
            {getInitials(data.first_name, data.last_name)}
          </div>
        )}

        {/* שם */}
        <div style={{
          fontWeight: 'bold',
          fontSize: '0.82rem',
          color: style.text,
          marginBottom: '3px',
          lineHeight: 1.3,
        }}>
          {data.first_name} {data.last_name}
        </div>

        {/* שנים */}
        {years && (
          <div style={{
            fontSize: '0.68rem',
            color: `${style.text}99`,
          }}>
            {years}
          </div>
        )}

        {/* תג דור */}
        <div style={{
          marginTop: '6px',
          fontSize: '0.6rem',
          background: `${style.border}22`,
          border: `1px solid ${style.border}44`,
          borderRadius: '4px',
          padding: '1px 6px',
          color: style.border,
          display: 'inline-block',
        }}>
          דור {gen + 1}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: style.border, border: 'none', width: 8, height: 8 }}
      />
    </>
  )
}
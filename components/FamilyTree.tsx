'use client'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Handle, Position,
  type NodeProps, type Edge,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import * as dagre from 'dagre'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { supabase } from '@/lib/supabase'

/* ───────────────── Constants ───────────────── */
const NW = 160
const NH = 200
const EDGE_COLOR = '#c9a227'
const EDGE_COLOR_DIM = '#3a2a1066'
const GLOW_GOLD = '0 0 20px rgba(201,162,39,0.4), 0 0 60px rgba(201,162,39,0.15)'
const GLOW_GOLD_STRONG = '0 0 30px rgba(201,162,39,0.6), 0 0 80px rgba(201,162,39,0.25)'

/* ───────────────── Types ───────────────── */
type Person = {
  id: number; first_name: string; last_name: string
  birth_date?: string; death_date?: string
  birth_place?: string; death_place?: string
  photo_url?: string; bio?: string; family_id?: number
}
type Rel = { person_a_id: number; person_b_id: number; relation_type: string }

/* ───────────────── Dagre Auto Layout ───────────────── */
function getLayoutedElements(
  nodes: any[],
  edges: Edge[],
  allRels: Rel[],
  direction: 'TB' | 'LR' = 'TB'
) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 140,
    edgesep: 40,
    marginx: 50,
    marginy: 50,
  })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NW, height: NH })
  })
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const np = g.node(node.id)
    return {
      ...node,
      position: { x: np.x - NW / 2, y: np.y - NH / 2 },
    }
  })

  // Post-process: place spouses next to each other on same Y level
  const spouseRels = allRels.filter(r =>
    ['spouse', 'engaged', 'partner'].includes(r.relation_type)
  )

  for (const rel of spouseRels) {
    const nodeA = layoutedNodes.find(n => n.id === String(rel.person_a_id))
    const nodeB = layoutedNodes.find(n => n.id === String(rel.person_b_id))
    if (nodeA && nodeB) {
      // Put them on the same Y level
      const avgY = Math.min(nodeA.position.y, nodeB.position.y)
      nodeA.position.y = avgY
      nodeB.position.y = avgY

      // Put them next to each other if they're far apart
      const gap = 20
      const avgX = (nodeA.position.x + nodeB.position.x) / 2
      nodeA.position.x = avgX - NW / 2 - gap / 2
      nodeB.position.x = avgX + NW / 2 + gap / 2
    }
  }

  return { nodes: layoutedNodes, edges }
}

/* ───────────────── Cinematic Person Card ───────────────── */
function PersonCard({ data }: NodeProps) {
  const { person, onOpen, highlighted, dimmed } = data
  const cardRef = useRef<HTMLDivElement>(null)
  const name = `${[person.first_name, person.last_name].filter(Boolean).join(' ')}`
  const birth = person.birth_date?.substring(0, 4)
  const death = person.death_date?.substring(0, 4)
  const isAlive = !person.death_date

  return (
    <>
      <Handle type="target" position={Position.Top}
        style={{ background: 'transparent', width: 12, height: 12, border: `2px solid ${EDGE_COLOR}44`, top: -6 }} />

      <motion.div
        ref={cardRef}
        onClick={() => onOpen(person)}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{
          opacity: dimmed ? 0.25 : 1,
          scale: highlighted ? 1.08 : 1,
          y: 0,
        }}
        whileHover={{ scale: 1.06, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          width: NW,
          background: 'linear-gradient(180deg, #1e140a 0%, #0d0702 100%)',
          border: `1.5px solid ${highlighted ? '#c9a227' : '#2a1a0888'}`,
          borderRadius: 16,
          padding: 0,
          textAlign: 'center',
          cursor: 'pointer',
          fontFamily: '"Playfair Display", "Heebo", serif',
          boxShadow: highlighted ? GLOW_GOLD_STRONG : GLOW_GOLD,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top glow accent */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: 1,
          background: 'linear-gradient(90deg, transparent, #c9a227, transparent)',
        }} />

        {/* Photo */}
        <div style={{
          width: '100%', height: 100,
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #2a1a08, #1a0e04)',
        }}>
          {person.photo_url ? (
            <img src={person.photo_url} alt={name} style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: isAlive ? 'none' : 'grayscale(60%) brightness(0.8)',
            }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(circle at 50% 50%, #2a1a08, #0d0702)',
              fontSize: 36, color: '#c9a22744',
            }}>
              ✦
            </div>
          )}
          {/* Photo gradient overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
            background: 'linear-gradient(transparent, #0d0702)',
          }} />
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 14px' }}>
          <div style={{
            fontWeight: 600, fontSize: 13, color: '#f5e6c8',
            lineHeight: 1.3, marginBottom: 4, wordBreak: 'break-word',
            letterSpacing: '0.02em',
          }}>{name}</div>

          {(birth || death) && (
            <div style={{
              fontSize: 11, color: '#8b6914',
              letterSpacing: '0.08em',
              fontFamily: '"Heebo", sans-serif',
            }}>
              {birth || '?'}{death ? ` — ${death}` : ''}
            </div>
          )}

          {person.birth_place && (
            <div style={{
              fontSize: 10, color: '#5a3a1a',
              marginTop: 4, fontFamily: '"Heebo", sans-serif',
            }}>
              ✦ {person.birth_place}
            </div>
          )}

          {/* Life indicator */}
          <div style={{
            marginTop: 8, display: 'flex', justifyContent: 'center', gap: 3,
          }}>
            {isAlive ? (
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 8px #4ade8066',
              }} />
            ) : (
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#5a3a1a',
              }} />
            )}
          </div>
        </div>
      </motion.div>

      <Handle type="source" position={Position.Bottom}
        style={{ background: 'transparent', width: 12, height: 12, border: `2px solid ${EDGE_COLOR}44`, bottom: -6 }} />
    </>
  )
}

const nodeTypes = { person: PersonCard }

/* ───────────────── Cinematic Popup ───────────────── */
function Popup({ person, canEdit, locale, onClose }: {
  person: Person; canEdit: boolean; locale: string; onClose: () => void
}) {
  const name = `${[person.first_name, person.last_name].filter(Boolean).join(' ')}`
  const fmt = (d?: string) => {
    if (!d) return null
    try { return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) }
    catch { return d }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(12px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          dir="rtl"
          style={{
            background: 'linear-gradient(180deg, #1e140a, #0d0702)',
            border: '1px solid #c9a22766',
            borderRadius: 20, padding: 0, maxWidth: 420, width: '100%',
            position: 'relative',
            boxShadow: GLOW_GOLD_STRONG,
            overflow: 'hidden',
            fontFamily: '"Heebo", Arial, sans-serif',
          }}
        >
          {/* Top gold line */}
          <div style={{
            width: '100%', height: 1,
            background: 'linear-gradient(90deg, transparent, #c9a227, transparent)',
          }} />

          {/* Close button */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            background: '#0d070288', border: '1px solid #3a2a10',
            borderRadius: '50%', width: 32, height: 32,
            color: '#b89a5a', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a227'; e.currentTarget.style.color = '#f5d98b' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a2a10'; e.currentTarget.style.color = '#b89a5a' }}
          >✕</button>

          {/* Hero photo */}
          <div style={{ width: '100%', height: 180, position: 'relative', overflow: 'hidden' }}>
            {person.photo_url ? (
              <img src={person.photo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'radial-gradient(circle at 50% 50%, #2a1a08, #0d0702)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 60, color: '#c9a22722',
              }}>✦</div>
            )}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
              background: 'linear-gradient(transparent, #0d0702)',
            }} />
          </div>

          {/* Content */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{
              fontWeight: 700, fontSize: 22, color: '#f5e6c8',
              marginBottom: 6, marginTop: -20, position: 'relative',
              fontFamily: '"Playfair Display", serif',
              letterSpacing: '0.02em',
            }}>{name}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {person.birth_date && (
                <div style={{ fontSize: 13, color: '#b89a5a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#4ade80' }}>●</span> {fmt(person.birth_date)}{person.birth_place ? ` · ${person.birth_place}` : ''}
                </div>
              )}
              {person.death_date && (
                <div style={{ fontSize: 13, color: '#6a5a40', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#5a3a1a' }}>●</span> {fmt(person.death_date)}{person.death_place ? ` · ${person.death_place}` : ''}
                </div>
              )}
            </div>

            {person.bio && (
              <>
                <div style={{
                  width: 60, height: 1, margin: '0 auto 12px',
                  background: 'linear-gradient(90deg, transparent, #c9a22744, transparent)',
                }} />
                <div style={{
                  fontSize: 13, color: '#c8b08a', lineHeight: 1.8,
                  maxHeight: 120, overflowY: 'auto',
                  fontFamily: '"Heebo", sans-serif',
                }}>{person.bio}</div>
              </>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex', gap: 8, marginTop: 20,
            }}>
              <a href={`/${locale}/people/${person.id}`} style={{
                flex: 1,
                background: 'linear-gradient(135deg, #c9a227, #a68520)',
                color: '#0d0702', padding: '10px 16px', borderRadius: 10,
                textDecoration: 'none', textAlign: 'center',
                fontWeight: 700, fontSize: 14,
                fontFamily: '"Heebo", sans-serif',
                transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(201,162,39,0.3)',
              }}>פרופיל מלא →</a>

              {canEdit && (
                <a href={`/${locale}/people/${person.id}/edit`} style={{
                  background: 'transparent',
                  border: '1px solid #c9a22766',
                  color: '#c9a227', padding: '10px 14px', borderRadius: 10,
                  textDecoration: 'none', fontSize: 14,
                  fontFamily: '"Heebo", sans-serif',
                  transition: 'all 0.2s',
                }}>✏️</a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ───────────────── Time Slider ───────────────── */
function TimeSlider({ decades, value, onChange }: {
  decades: number[]; value: number; onChange: (v: number) => void
}) {
  if (decades.length < 2) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        background: 'linear-gradient(180deg, #1e140aee, #0d0702ee)',
        backdropFilter: 'blur(16px)',
        border: '1px solid #c9a22733',
        borderRadius: 16, padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        zIndex: 20, minWidth: 300,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        fontFamily: '"Heebo", sans-serif',
      }}
    >
      <span style={{ fontSize: 11, color: '#8b6914', whiteSpace: 'nowrap' }}>
        {decades[0]}s
      </span>
      <input
        type="range"
        min={0}
        max={decades.length - 1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          flex: 1, accentColor: '#c9a227',
          cursor: 'pointer',
        }}
      />
      <span style={{ fontSize: 11, color: '#8b6914', whiteSpace: 'nowrap' }}>
        {decades[decades.length - 1]}s
      </span>
      <span style={{
        fontSize: 13, color: '#f5d98b', fontWeight: 600,
        minWidth: 50, textAlign: 'center',
      }}>
        {decades[value]}
      </span>
    </motion.div>
  )
}

/* ───────────────── Main Component ───────────────── */
function FamilyTreeInner({ familyId, locale }: { familyId?: string; locale: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [allPeople, setAllPeople] = useState<Person[]>([])
  const [allRels, setAllRels] = useState<Rel[]>([])
  const [popup, setPopup] = useState<Person | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [timeIndex, setTimeIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const openPopup = useCallback((person: Person) => setPopup(person), [])

  // Compute decades from birth dates
  const decades = useMemo(() => {
    const years = allPeople
      .map(p => p.birth_date ? parseInt(p.birth_date.substring(0, 4)) : null)
      .filter(Boolean) as number[]
    if (years.length === 0) return []
    const min = Math.floor(Math.min(...years) / 10) * 10
    const max = Math.floor(Math.max(...years) / 10) * 10
    const result: number[] = []
    for (let d = min; d <= max; d += 10) result.push(d)
    result.push(max + 10) // "all" 
    return result
  }, [allPeople])

  // Find connected person IDs for hover highlight
  const connectedIds = useMemo(() => {
    if (!hoveredId) return new Set<string>()
    const connected = new Set<string>([hoveredId])
    allRels.forEach(r => {
      if (String(r.person_a_id) === hoveredId) connected.add(String(r.person_b_id))
      if (String(r.person_b_id) === hoveredId) connected.add(String(r.person_a_id))
    })
    return connected
  }, [hoveredId, allRels])

  // Check role
  useEffect(() => {
    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle()
      setCanEdit(data?.role === 'admin' || data?.role === 'editor')
    }
    checkRole()
  }, [])

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true)
      let peopleQuery = supabase
        .from('people')
        .select('id, first_name, last_name, birth_date, death_date, birth_place, death_place, photo_url, bio, family_id')
      if (familyId) peopleQuery = peopleQuery.eq('family_id', familyId)
      const { data: ppl } = await peopleQuery
      const people: Person[] = ppl || []

      if (people.length === 0) { setNodes([]); setEdges([]); setLoading(false); return }

      const ids = people.map(p => p.id)
      const { data: relDataA } = await supabase
        .from('tree_relationships')
        .select('person_a_id, person_b_id, relation_type')
        .in('person_a_id', ids)
      const { data: relDataB } = await supabase
        .from('tree_relationships')
        .select('person_a_id, person_b_id, relation_type')
        .in('person_b_id', ids)
      
      // Merge and deduplicate
      const relMap = new Map<string, Rel>()
      for (const r of [...(relDataA || []), ...(relDataB || [])]) {
        const key = `${r.person_a_id}-${r.person_b_id}-${r.relation_type}`
        relMap.set(key, r)
      }
      const rels: Rel[] = Array.from(relMap.values())

      setAllPeople(people)
      setAllRels(rels)
      setTimeIndex(decades.length > 0 ? decades.length - 1 : 0)
      setLoading(false)
    }
    load()
  }, [familyId])

  // Build graph when data or time changes
  useEffect(() => {
    if (allPeople.length === 0) return

    // Filter by time if slider isn't at max
    const isAllTime = timeIndex >= decades.length - 1
    const cutoffDecade = decades[timeIndex] || 9999
    const filteredPeople = isAllTime
      ? allPeople
      : allPeople.filter(p => {
          const year = p.birth_date ? parseInt(p.birth_date.substring(0, 4)) : 0
          return year <= cutoffDecade + 9
        })

    const filteredIds = new Set(filteredPeople.map(p => p.id))

    // Build edges — separate hierarchical (for dagre) from visual-only
    const hierarchicalEdges: Edge[] = []
    const visualOnlyEdges: Edge[] = []
    const edgeSeen = new Set<string>()

    for (const r of allRels) {
      if (!filteredIds.has(r.person_a_id) || !filteredIds.has(r.person_b_id)) continue

      // Parent→child: parent is SOURCE (top), child is TARGET (bottom)
      if (['parent','grandparent','adopted_parent','foster_parent','step_parent','godparent','guardian','mentor'].includes(r.relation_type)) {
        const edgeId = `pc-${r.person_a_id}-${r.person_b_id}`
        if (!edgeSeen.has(edgeId)) {
          edgeSeen.add(edgeId)
          hierarchicalEdges.push({
            id: edgeId,
            source: String(r.person_a_id),
            target: String(r.person_b_id),
            type: 'smoothstep',
            animated: false,
            
            style: { stroke: EDGE_COLOR + '88', strokeWidth: 2 },
          })
        }
      }
      // Child→parent: reverse — child mentions parent, so parent=source, child=target
      if (['child','grandchild','adopted_child','foster_child','step_child','godchild','ward','student'].includes(r.relation_type)) {
        const edgeId = `pc-${r.person_b_id}-${r.person_a_id}`
        if (!edgeSeen.has(edgeId)) {
          edgeSeen.add(edgeId)
          hierarchicalEdges.push({
            id: edgeId,
            source: String(r.person_b_id),
            target: String(r.person_a_id),
            type: 'smoothstep',
            animated: false,
            
            style: { stroke: EDGE_COLOR + '88', strokeWidth: 2 },
          })
        }
      }
      // Spouse/partner — visual only, NOT in dagre (so they stay on same level)
      if (['spouse','engaged','partner'].includes(r.relation_type)) {
        const key = [r.person_a_id, r.person_b_id].sort().join('-')
        if (!edgeSeen.has(key)) {
          edgeSeen.add(key)
          visualOnlyEdges.push({
            id: `sp-${key}`,
            source: String(r.person_a_id),
            target: String(r.person_b_id),
            type: 'straight',
            label: r.relation_type === 'spouse' ? 'נשואים' : r.relation_type === 'engaged' ? 'מאורסים' : 'בני זוג',
            labelStyle: { fontSize: 9, fill: '#8b691488', fontFamily: 'Heebo, sans-serif' },
            labelBgStyle: { fill: '#0d0702', fillOpacity: 0.85 },
            labelBgPadding: [3, 6] as [number, number],
            labelBgBorderRadius: 4,
            style: { stroke: '#c9a22733', strokeWidth: 1.5 },
          })
        }
      }
      // Ex/widowed — visual only
      if (['ex_spouse','widowed'].includes(r.relation_type)) {
        const key = [r.person_a_id, r.person_b_id].sort().join('-') + '-ex'
        if (!edgeSeen.has(key)) {
          edgeSeen.add(key)
          visualOnlyEdges.push({
            id: `ex-${key}`,
            source: String(r.person_a_id),
            target: String(r.person_b_id),
            type: 'straight',
            label: r.relation_type === 'widowed' ? 'אלמנות' : 'גרושים',
            labelStyle: { fontSize: 8, fill: '#5a3a1a44', fontFamily: 'Heebo, sans-serif' },
            labelBgStyle: { fill: '#0d0702', fillOpacity: 0.8 },
            labelBgPadding: [2, 5] as [number, number],
            labelBgBorderRadius: 3,
            style: { stroke: '#5a3a1a22', strokeWidth: 1, strokeDasharray: '3 6' },
          })
        }
      }
      // Siblings — visual only (NOT in dagre — they should be on same level)
      if (['sibling','twin','half_sibling','step_sibling','cousin'].includes(r.relation_type)) {
        const key = [r.person_a_id, r.person_b_id].sort().join('-') + '-sib'
        if (!edgeSeen.has(key)) {
          edgeSeen.add(key)
          visualOnlyEdges.push({
            id: `sib-${key}`,
            source: String(r.person_a_id),
            target: String(r.person_b_id),
            type: 'straight',
            label: r.relation_type === 'twin' ? 'תאומים' : r.relation_type === 'half_sibling' ? 'חורגים' : 'אחים',
            labelStyle: { fontSize: 8, fill: '#60a5fa55', fontFamily: 'Heebo, sans-serif' },
            labelBgStyle: { fill: '#0d0702', fillOpacity: 0.8 },
            labelBgPadding: [2, 5] as [number, number],
            labelBgBorderRadius: 3,
            style: { stroke: '#60a5fa22', strokeWidth: 1, strokeDasharray: '4 4' },
          })
        }
      }
    }

    // Build nodes
    const rfNodes = filteredPeople.map(p => ({
      id: String(p.id),
      type: 'person' as const,
      position: { x: 0, y: 0 },
      data: {
        person: p,
        onOpen: openPopup,
        highlighted: hoveredId ? connectedIds.has(String(p.id)) : false,
        dimmed: hoveredId ? !connectedIds.has(String(p.id)) : false,
      },
    }))

    // Apply dagre layout — ONLY with hierarchical edges, then adjust spouses
    const { nodes: layoutedNodes } = getLayoutedElements(rfNodes, hierarchicalEdges, allRels, 'TB')

    // Combine all edges for display
    const allEdges = [...hierarchicalEdges, ...visualOnlyEdges]

    setNodes(layoutedNodes)
    setEdges(allEdges)
  }, [allPeople, allRels, timeIndex, decades, hoveredId, connectedIds, openPopup])

  // GSAP entrance animation
  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.2, ease: 'power2.out' }
      )
    }
  }, [loading])

  // Hover highlight: update edges
  useEffect(() => {
    if (!hoveredId) {
      setEdges(eds => eds.map(e => ({
        ...e,
        style: {
          ...e.style,
          stroke: e.id.startsWith('sp-') ? '#c9a22744' : EDGE_COLOR + '88',
          strokeWidth: e.id.startsWith('sp-') ? 1.5 : 2,
          opacity: 1,
        },
      })))
      return
    }

    setEdges(eds => eds.map(e => {
      const isConnected = connectedIds.has(e.source) && connectedIds.has(e.target)
      return {
        ...e,
        style: {
          ...e.style,
          stroke: isConnected ? '#c9a227' : EDGE_COLOR_DIM,
          strokeWidth: isConnected ? 3 : 1,
          opacity: isConnected ? 1 : 0.15,
        },
      }
    }))
  }, [hoveredId, connectedIds])

  if (loading) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 16,
      fontFamily: '"Heebo", Arial, sans-serif',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: 40, color: '#c9a227' }}
      >✦</motion.div>
      <span style={{ color: '#8b6914', fontSize: 14 }}>טוען עץ משפחה...</span>
    </div>
  )

  if (nodes.length === 0) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 16,
      fontFamily: '"Heebo", Arial, sans-serif',
    }}>
      <div style={{ fontSize: 48, color: '#c9a22733' }}>✦</div>
      <p style={{ color: '#8b6914', fontSize: 14 }}>אין אנשים להצגה</p>
      <a href={`/${locale}/people/new`} style={{
        background: 'linear-gradient(135deg, #c9a227, #a68520)',
        color: '#0d0702', padding: '10px 20px', borderRadius: 10,
        textDecoration: 'none', fontWeight: 700, fontSize: 14,
        boxShadow: '0 4px 20px rgba(201,162,39,0.3)',
      }}>+ הוסף אדם</a>
    </div>
  )

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onMouseLeave={() => setHoveredId(null)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeMouseEnter={(_, node) => setHoveredId(node.id)}
        onNodeMouseLeave={() => setHoveredId(null)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={2}
        style={{ background: 'transparent' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1a0f0522" gap={30} size={1} />
        <Controls
          style={{
            background: '#1e140aee',
            border: '1px solid #c9a22733',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            const p = n.data?.person
            return p?.death_date ? '#5a3a1a' : '#c9a227'
          }}
          maskColor="#0d070299"
          style={{
            background: '#1e140a',
            border: '1px solid #c9a22733',
            borderRadius: 12,
          }}
        />
      </ReactFlow>

      {/* Time Travel Slider */}
      <TimeSlider
        decades={decades}
        value={timeIndex}
        onChange={setTimeIndex}
      />

      {/* Person Popup */}
      {popup && (
        <Popup
          person={popup}
          canEdit={canEdit}
          locale={locale}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}

/* ───────────────── Wrapper with Provider ───────────────── */
export default function FamilyTree(props: { familyId?: string; locale: string }) {
  return (
    <ReactFlowProvider>
      <FamilyTreeInner {...props} />
    </ReactFlowProvider>
  )
}

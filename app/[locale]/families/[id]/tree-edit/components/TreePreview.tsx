'use client'
import { useEffect, useMemo } from 'react'
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, Handle, Position, ReactFlowProvider, type NodeProps } from 'reactflow'
import 'reactflow/dist/style.css'
import * as dagre from 'dagre'
import type { TreePerson, TreeRelation, TreeSettings } from '../page'

const NW = 150; const NH = 185

function layout(nodes: any[], edges: any[], direction: string = 'TB', relations: any[] = []) {
  const g = new dagre.graphlib.Graph(); g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction === 'bottom-up' ? 'BT' : 'TB', nodesep: 80, ranksep: 140 })
  nodes.forEach(n => g.setNode(n.id, { width: NW, height: NH }))
  edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)
  const layouted = nodes.map(n => { const p = g.node(n.id); return { ...n, position: { x: p.x - NW/2, y: p.y - NH/2 } } })

  // Post-process: place spouses next to each other
  const spouseRels = relations.filter(r => ['spouse','engaged','partner'].includes(r.relation_type))
  for (const rel of spouseRels) {
    const a = layouted.find(n => n.id === String(rel.person_a_id))
    const b = layouted.find(n => n.id === String(rel.person_b_id))
    if (a && b) {
      const avgY = Math.min(a.position.y, b.position.y)
      a.position.y = avgY; b.position.y = avgY
      const avgX = (a.position.x + b.position.x) / 2
      a.position.x = avgX - NW/2 - 10; b.position.x = avgX + NW/2 + 10
    }
  }
  return { nodes: layouted, edges }
}

function PersonNode({ data }: NodeProps) {
  const p = data.person as TreePerson
  const name = `${p.first_name} ${p.last_name || ''}`
  const year = p.birth_date?.substring(0,4) || ''
  const deathYear = p.death_date?.substring(0,4)
  const gc = p.gender === 'male' ? '#378ADD' : p.gender === 'female' ? '#D4537E' : '#c9a227'
  const isAlive = p.is_alive || (!p.death_date && year)

  return (<>
    <Handle type="target" position={Position.Top} style={{ background: 'transparent', width: 10, height: 10, border: `2px solid ${gc}44`, top: -5 }} />
    <div style={{
      width: NW,
      background: 'linear-gradient(180deg,#1e140aee,#0d0702ee)',
      backdropFilter: 'blur(8px)',
      border: `1.5px solid ${data.highlighted ? gc : '#2a1a0866'}`,
      borderRadius: 16, textAlign: 'center', cursor: 'pointer', overflow: 'hidden',
      boxShadow: data.highlighted ? `0 0 25px ${gc}44, 0 8px 30px #00000066` : '0 4px 20px #00000044',
      transition: 'all 0.3s',
    }}>
      {/* Top accent line */}
      <div style={{ width: '100%', height: 2, background: `linear-gradient(90deg, transparent, ${gc}, transparent)` }} />

      {/* Photo */}
      <div style={{ height: 85, background: `linear-gradient(180deg,${gc}15,#0d0702)`, position: 'relative', overflow: 'hidden' }}>
        {p.photo_url
          ? <img src={p.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, filter: deathYear ? 'grayscale(50%) brightness(0.85)' : 'none' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: `${gc}33` }}>
              {p.gender === 'male' ? '👨' : p.gender === 'female' ? '👩' : '✦'}
            </div>
        }
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 35, background: 'linear-gradient(transparent,#0d0702ee)' }} />
        {/* Gender dot */}
        <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: gc, boxShadow: `0 0 6px ${gc}88` }} />
      </div>

      {/* Info */}
      <div style={{ padding: '8px 10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#f5e6c8', lineHeight: 1.25, marginBottom: 3, fontFamily: '"Playfair Display", serif', letterSpacing: '0.02em' }}>{name}</div>
        {(year || deathYear) && (
          <div style={{ fontSize: 10, color: '#8b6914', letterSpacing: '0.05em' }}>
            {p.birth_is_approximate ? '~' : ''}{year}{deathYear ? ` — ${p.death_is_approximate ? '~' : ''}${deathYear}` : ''}
          </div>
        )}
        {p.birth_place && <div style={{ fontSize: 9, color: '#5a3a1a', marginTop: 3 }}>✦ {p.birth_place}</div>}
        {p.profession && <div style={{ fontSize: 9, color: '#3a2a10', marginTop: 1 }}>💼 {p.profession}</div>}
        {/* Life indicator */}
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isAlive ? '#4ade80' : '#5a3a1a',
            boxShadow: isAlive ? '0 0 8px #4ade8066' : 'none',
          }} />
        </div>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', width: 10, height: 10, border: `2px solid ${gc}44`, bottom: -5 }} />
  </>)
}
const nodeTypes = { person: PersonNode }

function TreeInner({ people, relations, settings, search, centerId, locale }: {
  people: TreePerson[]; relations: TreeRelation[]; settings: TreeSettings | null
  search: string; centerId: number | null; locale: string
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (people.length === 0) return
    const q = search.toLowerCase()
    const rfNodes = people.map(p => ({
      id: String(p.id), type: 'person' as const, position: { x: 0, y: 0 },
      data: { person: p, highlighted: centerId === p.id || (q && `${[p.first_name, p.last_name].filter(Boolean).join(' ')}`.toLowerCase().includes(q)) },
    }))

    const s = settings || {} as TreeSettings
    const bloodColor = s.blood_line_color || '#c9a227'
    const spouseColor = s.spouse_line_color || '#8b6914'

    const hierarchicalEdges: any[] = []
    const visualEdges: any[] = []
    const edgeSeen = new Set<string>()

    relations.forEach(r => {
      const key = `${r.person_a_id}-${r.person_b_id}-${r.relation_type}`
      if (edgeSeen.has(key)) return
      edgeSeen.add(key)

      // Parent→child — hierarchical (for dagre)
      if (['parent','grandparent','adopted_parent','foster_parent','step_parent'].includes(r.relation_type)) {
        hierarchicalEdges.push({
          id: r.id, source: String(r.person_a_id), target: String(r.person_b_id),
          type: 'smoothstep', animated: false, 
          style: { stroke: bloodColor + '88', strokeWidth: s.blood_line_width || 2 },
        })
      } else if (['child','grandchild','adopted_child','foster_child','step_child'].includes(r.relation_type)) {
        hierarchicalEdges.push({
          id: r.id, source: String(r.person_b_id), target: String(r.person_a_id),
          type: 'smoothstep', animated: false, 
          style: { stroke: bloodColor + '88', strokeWidth: s.blood_line_width || 2 },
        })
      // All other types — visual only (NOT in dagre)
      } else if (['spouse','engaged','partner'].includes(r.relation_type)) {
        visualEdges.push({
          id: r.id, source: String(r.person_a_id), target: String(r.person_b_id),
          type: 'straight',
          label: r.relation_type === 'spouse' ? 'נשואים' : r.relation_type === 'engaged' ? 'מאורסים' : 'בני זוג',
          labelStyle: { fontSize: 9, fill: '#8b6914', fontFamily: 'Heebo, sans-serif' },
          labelBgStyle: { fill: '#0d0702ee', fillOpacity: 0.9 },
          labelBgPadding: [4, 6],
          labelBgBorderRadius: 4,
          style: { stroke: spouseColor + '33', strokeWidth: s.spouse_line_width || 1.5 },
        })
      } else if (['ex_spouse','widowed'].includes(r.relation_type)) {
        visualEdges.push({
          id: r.id, source: String(r.person_a_id), target: String(r.person_b_id),
          type: 'straight',
          style: { stroke: '#5a3a1a44', strokeWidth: 1, strokeDasharray: '3 5' },
        })
      } else if (['sibling','twin','half_sibling','step_sibling','cousin'].includes(r.relation_type)) {
        visualEdges.push({
          id: r.id, source: String(r.person_a_id), target: String(r.person_b_id),
          type: 'straight',
          label: 'אחים',
          labelStyle: { fontSize: 9, fill: '#60a5fa88', fontFamily: 'Heebo, sans-serif' },
          labelBgStyle: { fill: '#0d0702ee', fillOpacity: 0.9 },
          labelBgPadding: [4, 6],
          labelBgBorderRadius: 4,
          style: { stroke: '#60a5fa22', strokeWidth: 1, strokeDasharray: '4 4' },
        })
      }
    })

    // Layout with ONLY hierarchical edges
    const { nodes: ln } = layout(rfNodes, hierarchicalEdges, s.tree_direction, relations)
    setNodes(ln)
    setEdges([...hierarchicalEdges, ...visualEdges])
  }, [people, relations, search, centerId, settings])

  if (people.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48, color: '#c9a22722' }}>🌳</div>
      <div style={{ color: '#5a3a1a', fontSize: 14 }}>אין אנשים בעץ עדיין</div>
    </div>
  )

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Tree background pattern */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 50% 100%, #1a120833 0%, transparent 60%),
          radial-gradient(ellipse at 50% 0%, #0a0d1a 0%, #0d0702 100%)
        `,
      }}>
        {/* Decorative tree trunk */}
        <svg style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', opacity: 0.04, width: 600, height: 400 }} viewBox="0 0 600 400">
          <path d="M300 400 L300 200 Q300 150 270 120 Q240 90 220 60 Q200 30 210 0" stroke="#c9a227" strokeWidth="8" fill="none" />
          <path d="M300 200 Q330 170 360 140 Q390 110 380 60" stroke="#c9a227" strokeWidth="5" fill="none" />
          <path d="M300 250 Q260 220 230 200 Q200 180 180 140" stroke="#c9a227" strokeWidth="5" fill="none" />
          <path d="M300 280 Q340 260 370 240 Q400 220 420 180" stroke="#c9a227" strokeWidth="4" fill="none" />
          <path d="M300 300 Q270 290 240 270 Q210 250 190 220" stroke="#c9a227" strokeWidth="4" fill="none" />
          {/* Leaves */}
          <circle cx="210" cy="55" r="25" fill="#c9a227" opacity="0.3" />
          <circle cx="380" cy="55" r="20" fill="#c9a227" opacity="0.25" />
          <circle cx="175" cy="135" r="22" fill="#c9a227" opacity="0.2" />
          <circle cx="425" cy="175" r="18" fill="#c9a227" opacity="0.2" />
          <circle cx="185" cy="215" r="20" fill="#c9a227" opacity="0.15" />
          <circle cx="260" cy="90" r="18" fill="#c9a227" opacity="0.25" />
        </svg>

        {/* Corner ornaments */}
        <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 24, color: '#c9a22708' }}>❧</div>
        <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 24, color: '#c9a22708', transform: 'scaleX(-1)' }}>❧</div>
        <div style={{ position: 'absolute', bottom: 16, right: 16, fontSize: 24, color: '#c9a22708', transform: 'scaleY(-1)' }}>❧</div>
        <div style={{ position: 'absolute', bottom: 16, left: 16, fontSize: 24, color: '#c9a22708', transform: 'scale(-1)' }}>❧</div>
      </div>

      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }}
        minZoom={0.03} maxZoom={2.5} style={{ background: 'transparent' }} proOptions={{ hideAttribution: true }}>
        <Background color="#c9a22708" gap={40} size={1} />
        <Controls style={{ background: '#1e140aee', border: '1px solid #c9a22733', borderRadius: 12, boxShadow: '0 4px 20px #0006' }} />
        <MiniMap
          nodeColor={(n) => {
            const p = n.data?.person; if (!p) return '#c9a227'
            return p.gender === 'male' ? '#378ADD' : p.gender === 'female' ? '#D4537E' : '#c9a227'
          }}
          maskColor="#0d070299"
          style={{ background: '#1e140a', border: '1px solid #c9a22733', borderRadius: 12 }}
        />
      </ReactFlow>
    </div>
  )
}

export default function TreePreview(props: any) {
  return <ReactFlowProvider><TreeInner {...props} /></ReactFlowProvider>
}

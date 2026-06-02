/**
 * Advanced Tree Layout — ELK.js integration
 * 
 * Eclipse Layout Kernel for complex family trees.
 * Better than dagre for multi-generational trees with multiple spouses.
 */
import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js'

const elk = new ELK()

interface LayoutNode {
  id: string
  width: number
  height: number
}

interface LayoutEdge {
  id: string
  source: string
  target: string
}

interface LayoutResult {
  nodes: Map<string, { x: number; y: number }>
  edges: Map<string, { points: Array<{ x: number; y: number }> }>
}

/** Compute layout for a family tree */
export async function computeElkLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options?: {
    direction?: 'DOWN' | 'UP' | 'RIGHT' | 'LEFT'
    spacing?: number
    layerSpacing?: number
  }
): Promise<LayoutResult> {
  const direction = options?.direction || 'DOWN'
  const spacing = options?.spacing || 60
  const layerSpacing = options?.layerSpacing || 120

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.spacing.nodeNode': String(spacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
      'elk.partitioning.activate': 'true',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    },
    children: nodes.map(n => ({
      id: n.id,
      width: n.width,
      height: n.height,
    })),
    edges: edges.map(e => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })) as ElkExtendedEdge[],
  }

  const layouted = await elk.layout(graph)

  const nodePositions = new Map<string, { x: number; y: number }>()
  layouted.children?.forEach(child => {
    nodePositions.set(child.id, {
      x: child.x || 0,
      y: child.y || 0,
    })
  })

  const edgePoints = new Map<string, { points: Array<{ x: number; y: number }> }>()
  layouted.edges?.forEach((edge: any) => {
    const sections = edge.sections || []
    const points: Array<{ x: number; y: number }> = []
    sections.forEach((section: any) => {
      if (section.startPoint) points.push(section.startPoint)
      if (section.bendPoints) points.push(...section.bendPoints)
      if (section.endPoint) points.push(section.endPoint)
    })
    edgePoints.set(edge.id, { points })
  })

  return { nodes: nodePositions, edges: edgePoints }
}

/** Compare dagre vs elkjs layouts and pick the one with less overlap */
export function pickBestLayout(
  dagreResult: Map<string, { x: number; y: number }>,
  elkResult: Map<string, { x: number; y: number }>,
  nodeWidth: number,
  nodeHeight: number
): 'dagre' | 'elk' {
  const countOverlaps = (positions: Map<string, { x: number; y: number }>) => {
    let overlaps = 0
    const entries = [...positions.entries()]
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i][1]
        const b = entries[j][1]
        if (
          Math.abs(a.x - b.x) < nodeWidth &&
          Math.abs(a.y - b.y) < nodeHeight
        ) {
          overlaps++
        }
      }
    }
    return overlaps
  }

  const dagreOverlaps = countOverlaps(dagreResult)
  const elkOverlaps = countOverlaps(elkResult)

  return elkOverlaps <= dagreOverlaps ? 'elk' : 'dagre'
}

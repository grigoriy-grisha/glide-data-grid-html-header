import type { CanvasPortalHoverDetail } from '../../../../lib/canvas'

export interface GripData {
  cellId: string
}

const GRIP_NODE_ID_PATTERN = /^(.+)-grip$/

export function parseGripNodeId(detail: CanvasPortalHoverDetail): GripData | null {
  if (!detail.nodeId) return null
  const match = detail.nodeId.match(GRIP_NODE_ID_PATTERN)
  return match ? { cellId: match[1] } : null
}



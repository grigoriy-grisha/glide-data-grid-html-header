import type { CanvasPortalHoverDetail } from '../../../../lib/canvas'

export type SortDirection = 'asc' | 'desc' | undefined

export interface SortButtonData {
  columnId: string
}

const SORT_NODE_ID_PATTERN = /^cell-\d+-\d+-sort:(.+)$/

export function parseSortNodeId(detail: CanvasPortalHoverDetail): SortButtonData | null {
  if (!detail.nodeId) return null
  const match = detail.nodeId.match(SORT_NODE_ID_PATTERN)
  return match ? { columnId: match[1] } : null
}

export function getNextSortDirection(
  sortColumn: string | undefined,
  columnId: string,
  currentDirection: SortDirection
): SortDirection {
  if (sortColumn !== columnId) return 'asc'
  if (currentDirection === 'asc') return 'desc'
  if (currentDirection === 'desc') return undefined
  return 'asc'
}

export function isColumnSorted(sortColumn: string | undefined, columnId: string): boolean {
  return sortColumn === columnId
}

export function isDefaultSortState(sortColumn: string | undefined, columnId: string, sortDirection: SortDirection): boolean {
  return !isColumnSorted(sortColumn, columnId) || !sortDirection
}






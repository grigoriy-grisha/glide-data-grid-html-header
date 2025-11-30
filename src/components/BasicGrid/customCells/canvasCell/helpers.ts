import type { CellIndices, HoverState, Point, RectBounds } from './types'

export const RELATIVE_COORD_TOLERANCE = 1

// Reusable objects to avoid allocations in hot paths
const _tempIndices: CellIndices = { colIndex: -1, rowIndex: -1 }
const _tempPoint: Point = { x: 0, y: 0 }

export function getCellIndices(argsAny: Record<string, any>): CellIndices {
  const location = argsAny.location
  if (Array.isArray(location) && location.length >= 2) {
    _tempIndices.colIndex = location[0] ?? -1
    _tempIndices.rowIndex = location[1] ?? -1
    return _tempIndices
  }

  const col = argsAny.col
  const row = argsAny.row
  if (typeof col === 'number' && typeof row === 'number') {
    _tempIndices.colIndex = col
    _tempIndices.rowIndex = row
    return _tempIndices
  }

  const colIndex = argsAny.colIndex
  const rowIndex = argsAny.rowIndex
  if (typeof colIndex === 'number' && typeof rowIndex === 'number') {
    _tempIndices.colIndex = colIndex
    _tempIndices.rowIndex = rowIndex
    return _tempIndices
  }

  _tempIndices.colIndex = -1
  _tempIndices.rowIndex = -1
  return _tempIndices
}

export function buildCellId(indices: CellIndices, rect: RectBounds): string {
  const col = indices.colIndex
  const row = indices.rowIndex
  if (col >= 0 && row >= 0) {
    return col + '-' + row
  }
  return rect.x + '-' + rect.y + '-' + rect.width + '-' + rect.height
}

export function resolveClickPoint(argsAny: Record<string, any>): Point | null {
  // Check posX/posY first (most common)
  const posX = argsAny.posX
  const posY = argsAny.posY
  if (typeof posX === 'number' && typeof posY === 'number' && posX === posX && posY === posY) {
    _tempPoint.x = posX
    _tempPoint.y = posY
    return _tempPoint
  }

  // Check x/y
  const x = argsAny.x
  const y = argsAny.y
  if (typeof x === 'number' && typeof y === 'number' && x === x && y === y) {
    _tempPoint.x = x
    _tempPoint.y = y
    return _tempPoint
  }

  // Check location array
  const location = argsAny.location
  if (Array.isArray(location) && location.length >= 2) {
    const locX = location[0]
    const locY = location[1]
    if (typeof locX === 'number' && typeof locY === 'number') {
      _tempPoint.x = locX
      _tempPoint.y = locY
      return _tempPoint
    }
  }

  return null
}

export function toRelativePoint(point: Point, rect: RectBounds): Point {
  const px = point.x
  const py = point.y
  const rx = rect.x
  const ry = rect.y
  
  // Inline isPointInArea check
  if (px >= rx && px <= rx + rect.width && py >= ry && py <= ry + rect.height) {
    _tempPoint.x = px - rx
    _tempPoint.y = py - ry
    return _tempPoint
  }

  return point
}

export function normalizeHoverPoint(
  hoverX: number | undefined,
  hoverY: number | undefined,
  rect: RectBounds
): Point | undefined {
  if (typeof hoverX !== 'number' || typeof hoverY !== 'number') {
    return undefined
  }

  const w = rect.width
  const h = rect.height
  const rx = rect.x
  const ry = rect.y

  // Check relative coords first (more common case)
  if (hoverX >= -1 && hoverX <= w + 1 && hoverY >= -1 && hoverY <= h + 1) {
    _tempPoint.x = hoverX
    _tempPoint.y = hoverY
    return _tempPoint
  }

  // Check absolute coords
  if (hoverX >= rx - 1 && hoverX <= rx + w + 1 && hoverY >= ry - 1 && hoverY <= ry + h + 1) {
    _tempPoint.x = hoverX - rx
    _tempPoint.y = hoverY - ry
    return _tempPoint
  }

  return undefined
}

export function isPointInArea(
  x: number,
  y: number,
  area: { x: number; y: number; width: number; height: number }
): boolean {
  const ax = area.x
  const ay = area.y
  return x >= ax && x <= ax + area.width && y >= ay && y <= ay + area.height
}

export function isHoveringBounds(hovered: HoverState, bounds: RectBounds): boolean {
  if (typeof hovered === 'object' && hovered) {
    const hoverX = hovered.hoverX
    const hoverY = hovered.hoverY
    const rectX = hovered.rectX
    const rectY = hovered.rectY
    
    if (
      typeof hoverX === 'number' &&
      typeof hoverY === 'number' &&
      typeof rectX === 'number' &&
      typeof rectY === 'number'
    ) {
      // Inline point-in-area check to avoid object allocation
      const relX = bounds.x - rectX
      const relY = bounds.y - rectY
      return hoverX >= relX && hoverX <= relX + bounds.width && 
             hoverY >= relY && hoverY <= relY + bounds.height
    }
  }

  return Boolean(hovered)
}


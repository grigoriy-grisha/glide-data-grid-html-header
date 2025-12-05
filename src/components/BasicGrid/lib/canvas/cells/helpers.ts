import type { CellIndices, HoverState, Point, RectBounds } from './types'

export const RELATIVE_COORD_TOLERANCE = 1

const INVALID_INDEX = -1
const DEFAULT_COORD = 0

const _tempIndices: CellIndices = { colIndex: INVALID_INDEX, rowIndex: INVALID_INDEX }
const _tempPoint: Point = { x: DEFAULT_COORD, y: DEFAULT_COORD }

const MIN_LOCATION_ARRAY_LENGTH = 2

export function getCellIndices(argsAny: Record<string, any>): CellIndices {
  const location = argsAny.location
  if (Array.isArray(location) && location.length >= MIN_LOCATION_ARRAY_LENGTH) {
    _tempIndices.colIndex = location[0] ?? INVALID_INDEX
    _tempIndices.rowIndex = location[1] ?? INVALID_INDEX
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

  _tempIndices.colIndex = INVALID_INDEX
  _tempIndices.rowIndex = INVALID_INDEX
  return _tempIndices
}

const ID_SEPARATOR = '-'
const MIN_VALID_INDEX = 0

export function buildCellId(indices: CellIndices, rect: RectBounds): string {
  const { colIndex, rowIndex } = indices
  if (colIndex >= MIN_VALID_INDEX && rowIndex >= MIN_VALID_INDEX) {
    return `${colIndex}${ID_SEPARATOR}${rowIndex}`
  }
  return `${rect.x}${ID_SEPARATOR}${rect.y}${ID_SEPARATOR}${rect.width}${ID_SEPARATOR}${rect.height}`
}

export function resolveClickPoint(argsAny: Record<string, any>): Point | null {
  const posX = argsAny.posX
  const posY = argsAny.posY
  if (typeof posX === 'number' && typeof posY === 'number' && posX === posX && posY === posY) {
    _tempPoint.x = posX
    _tempPoint.y = posY
    return _tempPoint
  }

  const x = argsAny.x
  const y = argsAny.y
  if (typeof x === 'number' && typeof y === 'number' && x === x && y === y) {
    _tempPoint.x = x
    _tempPoint.y = y
    return _tempPoint
  }

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

  if (hoverX >= -1 && hoverX <= w + 1 && hoverY >= -1 && hoverY <= h + 1) {
    _tempPoint.x = hoverX
    _tempPoint.y = hoverY
    return _tempPoint
  }

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
      const relX = bounds.x - rectX
      const relY = bounds.y - rectY
      return hoverX >= relX && hoverX <= relX + bounds.width && 
             hoverY >= relY && hoverY <= relY + bounds.height
    }
  }

  return Boolean(hovered)
}


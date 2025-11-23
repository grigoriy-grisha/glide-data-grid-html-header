import type { CellIndices, HoverState, Point, RectBounds } from './types'

export const RELATIVE_COORD_TOLERANCE = 1

export function getCellIndices(argsAny: Record<string, any>): CellIndices {
  if (Array.isArray(argsAny.location) && argsAny.location.length >= 2) {
    return {
      colIndex: argsAny.location[0] ?? -1,
      rowIndex: argsAny.location[1] ?? -1,
    }
  }

  if (typeof argsAny.col === 'number' && typeof argsAny.row === 'number') {
    return { colIndex: argsAny.col, rowIndex: argsAny.row }
  }

  if (typeof argsAny.colIndex === 'number' && typeof argsAny.rowIndex === 'number') {
    return { colIndex: argsAny.colIndex, rowIndex: argsAny.rowIndex }
  }

  return { colIndex: -1, rowIndex: -1 }
}

export function buildCellId(indices: CellIndices, rect: RectBounds): string {
  if (indices.colIndex >= 0 && indices.rowIndex >= 0) {
    return `${indices.colIndex}-${indices.rowIndex}`
  }

  return `${rect.x}-${rect.y}-${rect.width}-${rect.height}`
}

export function resolveClickPoint(argsAny: Record<string, any>): Point | null {
  const candidates: Array<Point | null> = [
    typeof argsAny.posX === 'number' && typeof argsAny.posY === 'number'
      ? { x: argsAny.posX, y: argsAny.posY }
      : null,
    typeof argsAny.x === 'number' && typeof argsAny.y === 'number'
      ? { x: argsAny.x, y: argsAny.y }
      : null,
  ]

  for (const candidate of candidates) {
    if (candidate && !Number.isNaN(candidate.x) && !Number.isNaN(candidate.y)) {
      return candidate
    }
  }

  if (Array.isArray(argsAny.location) && argsAny.location.length >= 2) {
    const [locX, locY] = argsAny.location
    if (typeof locX === 'number' && typeof locY === 'number') {
      return { x: locX, y: locY }
    }
  }

  return null
}

export function toRelativePoint(point: Point, rect: RectBounds): Point {
  if (isPointInArea(point.x, point.y, rect)) {
    return {
      x: point.x - rect.x,
      y: point.y - rect.y,
    }
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

  const isRelativeCoords =
    hoverX >= -RELATIVE_COORD_TOLERANCE &&
    hoverX <= rect.width + RELATIVE_COORD_TOLERANCE &&
    hoverY >= -RELATIVE_COORD_TOLERANCE &&
    hoverY <= rect.height + RELATIVE_COORD_TOLERANCE

  const isAbsoluteCoords =
    hoverX >= rect.x - RELATIVE_COORD_TOLERANCE &&
    hoverX <= rect.x + rect.width + RELATIVE_COORD_TOLERANCE &&
    hoverY >= rect.y - RELATIVE_COORD_TOLERANCE &&
    hoverY <= rect.y + rect.height + RELATIVE_COORD_TOLERANCE

  if (isRelativeCoords) {
    return { x: hoverX, y: hoverY }
  }

  if (isAbsoluteCoords) {
    return { x: hoverX - rect.x, y: hoverY - rect.y }
  }

  return undefined
}

export function isPointInArea(
  x: number,
  y: number,
  area: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    x >= area.x &&
    x <= area.x + area.width &&
    y >= area.y &&
    y <= area.y + area.height
  )
}

export function isHoveringBounds(hovered: HoverState, bounds: RectBounds): boolean {
  if (typeof hovered === 'object' && hovered) {
    const { hoverX, hoverY, rectX, rectY } = hovered
    if (
      typeof hoverX === 'number' &&
      typeof hoverY === 'number' &&
      typeof rectX === 'number' &&
      typeof rectY === 'number'
    ) {
      const relativeRect = {
        x: bounds.x - rectX,
        y: bounds.y - rectY,
        width: bounds.width,
        height: bounds.height,
      }
      return isPointInArea(hoverX, hoverY, relativeRect)
    }
  }

  return Boolean(hovered)
}


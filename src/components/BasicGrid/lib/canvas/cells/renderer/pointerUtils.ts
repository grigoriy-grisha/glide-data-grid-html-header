import type { CanvasRenderArgs, RectBounds } from '../types'
import type { RelativePoint } from './types'
import { POINTER_CANDIDATE_KEYS, RELATIVE_COORD_TOLERANCE } from './constants'

/**
 * Extract relative pointer position from render args.
 * Tries multiple candidate key pairs and normalizes to cell-relative coordinates.
 */
export function getRelativePointerPosition(
  argsAny: CanvasRenderArgs,
  rect: RectBounds
): RelativePoint | undefined {
  for (const [keyX, keyY] of POINTER_CANDIDATE_KEYS) {
    const x = argsAny[keyX]
    const y = argsAny[keyY]
    
    if (typeof x === 'number' && typeof y === 'number' && !Number.isNaN(x) && !Number.isNaN(y)) {
      if (isAbsoluteCoords(x, y, rect)) {
        return { x: x - rect.x, y: y - rect.y }
      }
      if (isRelativeCoords(x, y, rect)) {
        return { x, y }
      }
    }
  }
  return undefined
}

/**
 * Check if coordinates are absolute (within cell bounds in canvas space)
 */
export function isAbsoluteCoords(x: number, y: number, rect: RectBounds): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  )
}

/**
 * Check if coordinates are relative (within cell dimensions with tolerance)
 */
export function isRelativeCoords(x: number, y: number, rect: RectBounds): boolean {
  return (
    x >= -RELATIVE_COORD_TOLERANCE &&
    x <= rect.width + RELATIVE_COORD_TOLERANCE &&
    y >= -RELATIVE_COORD_TOLERANCE &&
    y <= rect.height + RELATIVE_COORD_TOLERANCE
  )
}



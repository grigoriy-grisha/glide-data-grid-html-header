import type { CanvasCellData, CanvasRenderArgs, CanvasRenderResult, RectBounds } from '../types'
import type { RendererDrawArgs, RelativePoint, CursorType } from './types'
import { DEFAULT_CURSOR, LEGACY_HOVER_CURSOR } from './constants'
import { isPointInArea } from '../helpers'
import { getHoverState, updateHoverState } from '../state'
import { CellCanvasRoot } from '../CellCanvasRoot'

/**
 * Handle hover interactions with CellCanvasRoot.
 * Dispatches pointer events and updates cursor based on hovered elements.
 */
export function handleCanvasRootHover(
  canvasRoot: CanvasRenderResult['canvasRoot'] | undefined,
  relativeHover: RelativePoint | undefined,
  argsAny: CanvasRenderArgs,
  args: RendererDrawArgs
): void {
  if (!(canvasRoot instanceof CellCanvasRoot)) {
    return
  }

  if (relativeHover) {
    // Dispatch pointer event if native event is available
    if (argsAny.event) {
      const nativeEvent = 'nativeEvent' in argsAny.event 
        ? argsAny.event.nativeEvent 
        : argsAny.event
      canvasRoot.dispatchPointerEvent('mousemove', relativeHover.x, relativeHover.y, nativeEvent)
    }
    
    // Always compute and apply cursor when hovering
    const cursor = canvasRoot.computeCursor(relativeHover.x, relativeHover.y)
    if (cursor && cursor !== DEFAULT_CURSOR) {
      args.overrideCursor?.(cursor as CursorType)
    }
  } else {
    canvasRoot.handleMouseLeave()
    canvasRoot.forcePortalHide()
  }
}

/**
 * Update hover state tracking and apply legacy hover cursor.
 * Manages transition between hovered and non-hovered states.
 */
export function updateHoverStateIfNeeded(
  cellData: CanvasCellData,
  relativeHover: RelativePoint | undefined,
  hoveredAreas: RectBounds[],
  canvasRoot: CanvasRenderResult['canvasRoot'] | undefined,
  args: RendererDrawArgs
): void {
  const isHovered = Boolean(
    relativeHover && hoveredAreas.some((area) => isPointInArea(relativeHover.x, relativeHover.y, area))
  )

  const prevHovered = getHoverState(cellData) ?? false
  const nextHovered = Boolean(relativeHover)
  
  if (nextHovered !== prevHovered) {
    updateHoverState(cellData, nextHovered)
  }

  // Apply legacy hover cursor for non-canvas-root hover areas
  if (isHovered && !canvasRoot) {
    args.overrideCursor?.(LEGACY_HOVER_CURSOR)
  }
}



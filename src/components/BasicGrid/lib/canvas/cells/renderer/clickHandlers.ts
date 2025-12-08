import type { CanvasCell, CanvasRenderResult, RectBounds } from '../types'
import type { RendererClickArgs } from './types'
import { isPointInArea, toRelativePoint } from '../helpers'
import { retrieveRenderData } from '../state'
import { CellCanvasRoot } from '../CellCanvasRoot'

type RenderData = ReturnType<typeof retrieveRenderData>
type RelativePoint = ReturnType<typeof toRelativePoint>
type CellIndices = { colIndex: number; rowIndex: number }

/**
 * Handle click on CellCanvasRoot elements.
 * Dispatches pointer event to the canvas root for internal handling.
 */
export function handleCanvasRootClick(
  renderData: RenderData,
  relativePoint: RelativePoint,
  event: MouseEvent | React.MouseEvent | undefined
): boolean {
  if (renderData?.canvasRoot instanceof CellCanvasRoot) {
    // Normalize React.MouseEvent to native MouseEvent if available
    const nativeEvent = event
      ? ('nativeEvent' in event ? event.nativeEvent : event)
      : undefined
    return renderData.canvasRoot.dispatchPointerEvent(
      'click',
      relativePoint.x,
      relativePoint.y,
      nativeEvent
    )
  }
  return false
}

/**
 * Handle clicks on registered click handler areas.
 * Iterates through click handlers and invokes the first matching one.
 */
export function handleClickHandlers(
  renderData: RenderData,
  relativePoint: RelativePoint
): boolean {
  if (renderData?.clickHandlers && Array.isArray(renderData.clickHandlers)) {
    for (const { area, handler } of renderData.clickHandlers) {
      if (isPointInArea(relativePoint.x, relativePoint.y, area)) {
        handler()
        return true
      }
    }
  }
  return false
}

/**
 * Handle cell-level onClick callback.
 * Invokes the cell's onClick handler if defined.
 */
export function handleCellClick(
  cell: CanvasCell,
  relativePoint: RelativePoint,
  rect: RectBounds,
  args: RendererClickArgs,
  indices: CellIndices,
  renderData: RenderData
): CanvasCell | undefined {
  const { onClick } = cell.data
  if (!onClick) {
    return undefined
  }

  const row = args.row ?? args.rowData
  if (onClick(relativePoint.x, relativePoint.y, rect, row, indices.rowIndex, renderData ?? undefined)) {
    return cell
  }
  return undefined
}



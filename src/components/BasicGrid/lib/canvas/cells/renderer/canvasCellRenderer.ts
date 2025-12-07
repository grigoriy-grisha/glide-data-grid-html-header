import { GridCellKind } from '@glideapps/glide-data-grid'
import type { CanvasCell, CanvasCellData, CanvasRenderArgs } from '../types'
import { CANVAS_CELL_KIND } from '../types'
import {
  buildCellId,
  getCellIndices,
  normalizeHoverPoint,
  resolveClickPoint,
  toRelativePoint,
} from '../helpers'
import { retrieveRenderData, storeRenderData } from '../state'
import type { CanvasCellRendererConfig, RendererClickArgs, RendererDrawArgs } from './types'
import { getRelativePointerPosition } from './pointerUtils'
import { handleCanvasRootClick, handleClickHandlers, handleCellClick } from './clickHandlers'
import { handleCanvasRootHover, updateHoverStateIfNeeded } from './hoverHandlers'

/**
 * Canvas cell renderer for glide-data-grid.
 * 
 * Handles rendering and interaction for custom canvas-based cells:
 * - Custom drawing via render function
 * - Click handling with support for CellCanvasRoot and click areas
 * - Hover state tracking and cursor management
 * - Pointer event dispatching
 */
export const canvasCellRenderer: CanvasCellRendererConfig = {
  kind: GridCellKind.Custom,
  
  isMatch: (cell): cell is CanvasCell => {
    return (cell.data as CanvasCellData | undefined)?.kind === CANVAS_CELL_KIND
  },
  
  needsHover: true,
  needsHoverPosition: true,

  onClick: (args: RendererClickArgs): CanvasCell | undefined => {
    const cell = args.cell as CanvasCell
    const rect = args.bounds

    const clickPoint = resolveClickPoint(args)
    if (!clickPoint) {
      return undefined
    }

    const relativePoint = toRelativePoint(clickPoint, rect)
    const indices = getCellIndices(args)
    const cellId = buildCellId(indices, rect)
    const renderData = retrieveRenderData(cellId, cell)

    // Try CellCanvasRoot click handling first
    if (handleCanvasRootClick(renderData, relativePoint, args.event)) {
      return cell
    }

    // Try registered click handlers
    if (handleClickHandlers(renderData, relativePoint)) {
      return cell
    }

    // Fall back to cell-level onClick
    return handleCellClick(cell, relativePoint, rect, args, indices, renderData)
  },

  draw: (args: RendererDrawArgs, cell: CanvasCell): void => {
    const { ctx, rect, theme } = args
    const { render } = cell.data

    const indices = getCellIndices(args)
    const cellId = buildCellId(indices, rect)
    
    const renderArgs: CanvasRenderArgs = {
      hoverX: args.hoverX,
      hoverY: args.hoverY,
      row: args.row,
      rowData: args.rowData,
      event: args.event,
    }
    
    const relativeHover =
      normalizeHoverPoint(args.hoverX, args.hoverY, rect) ??
      getRelativePointerPosition(renderArgs, rect)

    ctx.save()

    const previousRenderData = retrieveRenderData(cellId, cell)
    const renderResult = render(ctx, rect, theme, relativeHover?.x, relativeHover?.y, {
      ...renderArgs,
      canvasRoot: previousRenderData?.canvasRoot,
    })
    const hoveredAreas = renderResult?.hoveredAreas ?? []

    storeRenderData(cellId, cell, renderResult)

    const canvasRoot = renderResult?.canvasRoot ?? previousRenderData?.canvasRoot
    handleCanvasRootHover(canvasRoot, relativeHover, renderArgs, args)
    updateHoverStateIfNeeded(cell.data, relativeHover, hoveredAreas, canvasRoot, args)

    ctx.restore()
  },

  onPaste: () => undefined,
}


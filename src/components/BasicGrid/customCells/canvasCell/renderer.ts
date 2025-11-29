import { GridCellKind, type CustomRenderer } from '@glideapps/glide-data-grid'

import type { CanvasCell } from './types'
import { CANVAS_CELL_KIND } from './types'
import { buildCellId, getCellIndices, normalizeHoverPoint, resolveClickPoint, toRelativePoint, isPointInArea } from './helpers'
import { retrieveRenderData, storeRenderData, updateHoverState } from './state'
import { CellCanvasRoot } from './CellCanvasRoot'
import type { RectBounds } from './types'

const POINTER_CANDIDATE_KEYS: Array<['hoverX' | 'mouseX' | 'pointerX' | 'posX' | 'x', 'hoverY' | 'mouseY' | 'pointerY' | 'posY' | 'y']> = [
  ['hoverX', 'hoverY'],
  ['mouseX', 'mouseY'],
  ['pointerX', 'pointerY'],
  ['posX', 'posY'],
  ['x', 'y'],
]

function getRelativePointerPosition(argsAny: Record<string, any>, rect: RectBounds) {
  for (const [keyX, keyY] of POINTER_CANDIDATE_KEYS) {
    const x = argsAny[keyX]
    const y = argsAny[keyY]
    if (typeof x === 'number' && typeof y === 'number' && !Number.isNaN(x) && !Number.isNaN(y)) {
      // Determine whether coords are already relative or absolute by checking bounds
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return { x: x - rect.x, y: y - rect.y }
      }
      if (x >= -5 && x <= rect.width + 5 && y >= -5 && y <= rect.height + 5) {
        return { x, y }
      }
    }
  }
  return undefined
}

export const canvasCellRenderer: CustomRenderer<CanvasCell> = {
  kind: GridCellKind.Custom,
  isMatch: (cell): cell is CanvasCell => (cell.data as any)?.kind === CANVAS_CELL_KIND,
  needsHover: true,
  needsHoverPosition: true,
  onClick: (args) => {
    const cell = args.cell as CanvasCell
    const rect = args.bounds
    const argsAny = args as any

    const clickPoint = resolveClickPoint(argsAny)
    if (!clickPoint) {
      return undefined
    }

    const relativePoint = toRelativePoint(clickPoint, rect)
    const indices = getCellIndices(argsAny)
    const cellId = buildCellId(indices, rect)
    const renderData = retrieveRenderData(cellId, cell)

    if (renderData?.canvasRoot instanceof CellCanvasRoot) {
      const handled = renderData.canvasRoot.dispatchPointerEvent('click', relativePoint.x, relativePoint.y, argsAny.event)
      if (handled) {
        return cell
      }
    }

    if (renderData?.clickHandlers && Array.isArray(renderData.clickHandlers)) {
      for (const { area, handler } of renderData.clickHandlers) {
        if (isPointInArea(relativePoint.x, relativePoint.y, area)) {
          handler()
          return cell
        }
      }
    }

    const { onClick } = cell.data
    if (onClick) {
      let row: any = undefined
      if (argsAny.row !== undefined) {
        row = argsAny.row
      } else if (argsAny.rowData !== undefined) {
        row = argsAny.rowData
      }

      if (onClick(relativePoint.x, relativePoint.y, rect, row, indices.rowIndex, renderData)) {
        return cell
      }
    }

    return undefined
  },
  draw: (args, cell) => {
    const { ctx, rect, theme } = args
    const argsAny = args as any
    const { render } = cell.data

    const indices = getCellIndices(argsAny)
    const cellId = buildCellId(indices, rect)
    const relativeHover =
      normalizeHoverPoint(argsAny.hoverX, argsAny.hoverY, rect) ?? getRelativePointerPosition(argsAny, rect)

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.clip()

    const renderResult = render(ctx, rect, theme, relativeHover?.x, relativeHover?.y)
    const hoveredAreas = renderResult?.hoveredAreas ?? []

    storeRenderData(cellId, cell, renderResult)

    if (renderResult?.canvasRoot instanceof CellCanvasRoot) {
      if (relativeHover) {
        renderResult.canvasRoot.dispatchPointerEvent('mousemove', relativeHover.x, relativeHover.y, argsAny.event)
      } else {
        renderResult.canvasRoot.handleMouseLeave()
      }
    }

    const isHovered =
      Boolean(relativeHover && hoveredAreas.some((area) => isPointInArea(relativeHover.x, relativeHover.y, area)))

    updateHoverState(cell.data, Boolean(relativeHover))

    if (isHovered) {
      args.overrideCursor?.('pointer')
    }

    ctx.restore()
  },
  onPaste: () => undefined,
}


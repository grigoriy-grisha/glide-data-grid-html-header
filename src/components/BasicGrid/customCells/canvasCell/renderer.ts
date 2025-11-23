import { GridCellKind, type CustomRenderer } from '@glideapps/glide-data-grid'

import type { CanvasCell } from './types'
import { CANVAS_CELL_KIND } from './types'
import { buildCellId, getCellIndices, normalizeHoverPoint, resolveClickPoint, toRelativePoint, isPointInArea } from './helpers'
import { retrieveRenderData, storeRenderData, updateHoverState } from './state'

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
    const relativeHover = normalizeHoverPoint(argsAny.hoverX, argsAny.hoverY, rect)

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.clip()

    const renderResult = render(ctx, rect, theme, relativeHover?.x, relativeHover?.y)
    const hoveredAreas = renderResult?.hoveredAreas ?? []

    storeRenderData(cellId, cell, renderResult)

    const isHovered =
      !!relativeHover &&
      hoveredAreas.some((area) => isPointInArea(relativeHover.x, relativeHover.y, area))

    updateHoverState(cell.data, isHovered)

    if (isHovered) {
      args.overrideCursor?.('pointer')
    }

    ctx.restore()
  },
  onPaste: () => undefined,
}


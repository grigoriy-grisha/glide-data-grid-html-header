import { GridCellKind, type CustomCell } from '@glideapps/glide-data-grid'

import type { CanvasCell, CanvasCellData, CanvasRenderResult, RectBounds } from './types'
import { CANVAS_CELL_KIND } from './types'

export function createCanvasCell(
  render: (
    ctx: CanvasRenderingContext2D,
    rect: RectBounds,
    theme: any,
    hoverX: number | undefined,
    hoverY: number | undefined
  ) => CanvasRenderResult,
  onClick?: (
    x: number,
    y: number,
    rect: RectBounds,
    row?: any,
    rowIndex?: number,
    renderData?: any
  ) => boolean,
  copyData?: string
): CanvasCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    readonly: true,
    copyData: copyData ?? '',
    data: {
      kind: CANVAS_CELL_KIND,
      render: render as CanvasCellData['render'],
      onClick: onClick as CanvasCellData['onClick'],
    },
  }
}

export function isCanvasCell(cell: CustomCell | undefined): cell is CanvasCell {
  return Boolean(cell && cell.kind === GridCellKind.Custom && (cell.data as CanvasCellData)?.kind === CANVAS_CELL_KIND)
}


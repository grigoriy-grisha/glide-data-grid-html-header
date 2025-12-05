import type { CanvasCell, CanvasCellData, CanvasRenderResult, RectBounds } from './types'
import { CANVAS_CELL_KIND } from './types'

export function createCanvasCell(
  render: (
    ctx: CanvasRenderingContext2D,
    rect: RectBounds,
    theme: any,
    hoverX: number | undefined,
    hoverY: number | undefined,
    args?: any
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
    kind: 'custom' as any,
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

export function isCanvasCell(cell: any): cell is CanvasCell {
  return Boolean(cell && cell.kind === 'custom' && (cell.data as CanvasCellData)?.kind === CANVAS_CELL_KIND)
}


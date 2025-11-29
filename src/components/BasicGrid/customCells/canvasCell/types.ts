import type { CustomCell } from '@glideapps/glide-data-grid'
import type { CellCanvasRoot } from './CellCanvasRoot'

export const CANVAS_CELL_KIND = 'canvas-cell'

export type RectBounds = { x: number; y: number; width: number; height: number }
export type Point = { x: number; y: number }
export type CellIndices = { colIndex: number; rowIndex: number }
export type HoverMeta = { hoverX?: number; hoverY?: number; rectX: number; rectY: number }
export type HoverState = boolean | HoverMeta
export type RenderClickHandler = { area: RectBounds; handler: () => void }

export type CanvasRenderResult = {
  hoveredAreas?: RectBounds[]
  clickHandlers?: RenderClickHandler[]
  preferredHeight?: number
  [key: string]: any
  canvasRoot?: CellCanvasRoot
}

export interface CanvasCellData {
  kind: typeof CANVAS_CELL_KIND
  render: (
    ctx: CanvasRenderingContext2D,
    rect: RectBounds,
    theme: any,
    hoverX: number | undefined,
    hoverY: number | undefined
  ) => CanvasRenderResult
  onClick?: (
    x: number,
    y: number,
    rect: RectBounds,
    row?: any,
    rowIndex?: number,
    renderData?: any
  ) => boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  copyData?: string
  renderData?: any
}

export type CanvasCell = CustomCell<CanvasCellData>


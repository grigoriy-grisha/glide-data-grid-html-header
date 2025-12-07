import { GridCellKind } from '@glideapps/glide-data-grid'
import type { CellCanvasRoot } from './CellCanvasRoot'
import type { GridTheme } from '../../../types'

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
  canvasRoot?: CellCanvasRoot
}

/** Arguments passed to render function from the grid renderer */
export interface CanvasRenderArgs {
  canvasRoot?: CellCanvasRoot
  row?: Record<string, unknown>
  rowData?: Record<string, unknown>
  event?: MouseEvent | React.MouseEvent
  hoverX?: number
  hoverY?: number
  mouseX?: number
  mouseY?: number
  pointerX?: number
  pointerY?: number
  posX?: number
  posY?: number
  x?: number
  y?: number
  // Animation support from DrawArgs
  frameTime?: number
  requestAnimationFrame?: () => void
  drawState?: [unknown, (state: unknown) => void]
}

export interface CanvasCellData {
  kind: typeof CANVAS_CELL_KIND
  render: (
    ctx: CanvasRenderingContext2D,
    rect: RectBounds,
    theme: GridTheme,
    hoverX: number | undefined,
    hoverY: number | undefined,
    args?: CanvasRenderArgs
  ) => CanvasRenderResult
  onClick?: (
    x: number,
    y: number,
    rect: RectBounds,
    row?: Record<string, unknown>,
    rowIndex?: number,
    renderData?: CanvasRenderResult
  ) => boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  copyData?: string
  renderData?: CanvasRenderResult
}

export interface CanvasCell {
  kind: typeof GridCellKind.Custom
  allowOverlay: boolean
  readonly: boolean
  copyData: string
  data: CanvasCellData
}


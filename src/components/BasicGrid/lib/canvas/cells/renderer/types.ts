import type { CanvasCell, RectBounds } from '../types'
import type { GridTheme } from '../../../../types'
import { GridCellKind } from '@glideapps/glide-data-grid'

// Pointer key types for coordinate extraction
export type PointerKeyX = 'hoverX' | 'mouseX' | 'pointerX' | 'posX' | 'x'
export type PointerKeyY = 'hoverY' | 'mouseY' | 'pointerY' | 'posY' | 'y'
export type PointerKeyPair = [PointerKeyX, PointerKeyY]

/** Relative point coordinates */
export interface RelativePoint {
  x: number
  y: number
}

/** Draw arguments passed from glide-data-grid renderer */
export interface RendererDrawArgs {
  ctx: CanvasRenderingContext2D
  rect: RectBounds
  theme: GridTheme
  cell: CanvasCell
  bounds: RectBounds
  overrideCursor?: (cursor: CursorType) => void
  hoverX?: number
  hoverY?: number
  row?: Record<string, unknown>
  rowData?: Record<string, unknown>
  event?: MouseEvent | React.MouseEvent
}

/** Click arguments passed from glide-data-grid renderer */
export interface RendererClickArgs {
  cell: CanvasCell
  bounds: RectBounds
  posX?: number
  posY?: number
  x?: number
  y?: number
  location?: [number, number]
  event?: MouseEvent | React.MouseEvent
  row?: Record<string, unknown>
  rowData?: Record<string, unknown>
}

/** Cursor types supported by the renderer */
export type CursorType =
  | 'default'
  | 'pointer'
  | 'text'
  | 'move'
  | 'grab'
  | 'grabbing'
  | 'not-allowed'
  | 'crosshair'

/** Canvas cell renderer configuration interface */
export interface CanvasCellRendererConfig {
  kind: typeof GridCellKind.Custom
  isMatch: (cell: { data?: { kind?: string } }) => cell is CanvasCell
  needsHover: boolean
  needsHoverPosition: boolean
  onClick: (args: RendererClickArgs) => CanvasCell | undefined
  draw: (args: RendererDrawArgs, cell: CanvasCell) => void
  onPaste: () => undefined
}


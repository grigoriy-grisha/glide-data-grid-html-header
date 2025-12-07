import { GridCellKind } from '@glideapps/glide-data-grid'
import type { CanvasCell, CanvasCellData, CanvasRenderResult, RectBounds, CanvasRenderArgs } from './types'
import type { GridTheme } from '../../../types'
import { CANVAS_CELL_KIND } from './types'
import {
  buildCellId,
  getCellIndices,
  isPointInArea,
  normalizeHoverPoint,
  resolveClickPoint,
  toRelativePoint
} from './helpers'
import { getHoverState, retrieveRenderData, storeRenderData, updateHoverState } from './state'
import { CellCanvasRoot } from './CellCanvasRoot'

const RELATIVE_COORD_TOLERANCE = 5

type PointerKeyX = 'hoverX' | 'mouseX' | 'pointerX' | 'posX' | 'x'
type PointerKeyY = 'hoverY' | 'mouseY' | 'pointerY' | 'posY' | 'y'
type PointerKeyPair = [PointerKeyX, PointerKeyY]

const POINTER_CANDIDATE_KEYS: PointerKeyPair[] = [
  ['hoverX', 'hoverY'],
  ['mouseX', 'mouseY'],
  ['pointerX', 'pointerY'],
  ['posX', 'posY'],
  ['x', 'y'],
]

/** Draw arguments passed from glide-data-grid renderer */
interface RendererDrawArgs {
  ctx: CanvasRenderingContext2D
  rect: RectBounds
  theme: GridTheme
  cell: CanvasCell
  bounds: RectBounds
  overrideCursor?: (cursor: 'default' | 'pointer' | 'text' | 'move' | 'grab' | 'grabbing' | 'not-allowed' | 'crosshair') => void
  hoverX?: number
  hoverY?: number
  row?: Record<string, unknown>
  rowData?: Record<string, unknown>
  event?: MouseEvent | React.MouseEvent
}

/** Click arguments passed from glide-data-grid renderer */
interface RendererClickArgs {
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

function getRelativePointerPosition(argsAny: CanvasRenderArgs, rect: RectBounds) {
  for (const [keyX, keyY] of POINTER_CANDIDATE_KEYS) {
    const x = argsAny[keyX]
    const y = argsAny[keyY]
    if (typeof x === 'number' && typeof y === 'number' && !Number.isNaN(x) && !Number.isNaN(y)) {
      if (isAbsoluteCoords(x, y, rect)) {
        return { x: x - rect.x, y: y - rect.y }
      }
      if (isRelativeCoords(x, y, rect)) {
        return { x, y }
      }
    }
  }
  return undefined
}

function isAbsoluteCoords(x: number, y: number, rect: RectBounds): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

function isRelativeCoords(x: number, y: number, rect: RectBounds): boolean {
  return x >= -RELATIVE_COORD_TOLERANCE && x <= rect.width + RELATIVE_COORD_TOLERANCE &&
         y >= -RELATIVE_COORD_TOLERANCE && y <= rect.height + RELATIVE_COORD_TOLERANCE
}

export interface CanvasCellRendererConfig {
  kind: typeof GridCellKind.Custom
  isMatch: (cell: { data?: { kind?: string } }) => cell is CanvasCell
  needsHover: boolean
  needsHoverPosition: boolean
  onClick: (args: RendererClickArgs) => CanvasCell | undefined
  draw: (args: RendererDrawArgs, cell: CanvasCell) => void
  onPaste: () => undefined
}

export const canvasCellRenderer: CanvasCellRendererConfig = {
  kind: GridCellKind.Custom,
  isMatch: (cell): cell is CanvasCell => (cell.data as CanvasCellData | undefined)?.kind === CANVAS_CELL_KIND,
  needsHover: true,
  needsHoverPosition: true,
  onClick: (args: RendererClickArgs) => {
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

    if (handleCanvasRootClick(renderData, relativePoint, args.event)) {
      return cell
    }

    if (handleClickHandlers(renderData, relativePoint)) {
      return cell
    }

    return handleCellClick(cell, relativePoint, rect, args, indices, renderData)
  },
  draw: (args: RendererDrawArgs, cell: CanvasCell) => {
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
      normalizeHoverPoint(args.hoverX, args.hoverY, rect) ?? getRelativePointerPosition(renderArgs, rect)

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

const DEFAULT_CURSOR = 'default'
const LEGACY_HOVER_CURSOR = 'pointer'

function handleCanvasRootClick(
  renderData: ReturnType<typeof retrieveRenderData>,
  relativePoint: ReturnType<typeof toRelativePoint>,
  event: MouseEvent | React.MouseEvent | undefined
): boolean {
  if (renderData?.canvasRoot instanceof CellCanvasRoot && event) {
    // Normalize React.MouseEvent to native MouseEvent if needed
    const nativeEvent = 'nativeEvent' in event ? event.nativeEvent : event
    const handled = renderData.canvasRoot.dispatchPointerEvent('click', relativePoint.x, relativePoint.y, nativeEvent)
    return handled
  }
  return false
}

function handleClickHandlers(
  renderData: ReturnType<typeof retrieveRenderData>,
  relativePoint: ReturnType<typeof toRelativePoint>
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

function handleCellClick(
  cell: CanvasCell,
  relativePoint: ReturnType<typeof toRelativePoint>,
  rect: RectBounds,
  args: RendererClickArgs,
  indices: ReturnType<typeof getCellIndices>,
  renderData: ReturnType<typeof retrieveRenderData>
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

function handleCanvasRootHover(
  canvasRoot: CanvasRenderResult['canvasRoot'] | undefined,
  relativeHover: ReturnType<typeof getRelativePointerPosition>,
  argsAny: CanvasRenderArgs,
  args: RendererDrawArgs
): void {
  if (!(canvasRoot instanceof CellCanvasRoot)) {
    return
  }

  if (relativeHover && argsAny.event) {
    // Normalize React.MouseEvent to native MouseEvent if needed
    const nativeEvent = 'nativeEvent' in argsAny.event ? argsAny.event.nativeEvent : argsAny.event
    canvasRoot.dispatchPointerEvent('mousemove', relativeHover.x, relativeHover.y, nativeEvent)
    const cursor = canvasRoot.computeCursor(relativeHover.x, relativeHover.y)
    if (cursor && cursor !== DEFAULT_CURSOR) {
      args.overrideCursor?.(cursor as 'pointer' | 'text' | 'move' | 'grab' | 'grabbing' | 'not-allowed' | 'crosshair')
    }
  } else {
    canvasRoot.handleMouseLeave()
    canvasRoot.forcePortalHide()
  }
}

function updateHoverStateIfNeeded(
  cellData: CanvasCellData,
  relativeHover: ReturnType<typeof getRelativePointerPosition>,
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

  if (isHovered && !canvasRoot) {
    args.overrideCursor?.(LEGACY_HOVER_CURSOR)
  }
}


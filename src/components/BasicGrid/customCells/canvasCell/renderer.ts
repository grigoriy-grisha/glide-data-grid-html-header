import {type CustomRenderer, GridCellKind} from '@glideapps/glide-data-grid'

import type {CanvasCell, CanvasRenderResult, RectBounds} from './types'
import {CANVAS_CELL_KIND} from './types'
import {
  buildCellId,
  getCellIndices,
  isPointInArea,
  normalizeHoverPoint,
  resolveClickPoint,
  toRelativePoint
} from './helpers'
import {getHoverState, retrieveRenderData, storeRenderData, updateHoverState} from './state'
import {CellCanvasRoot} from './CellCanvasRoot'

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

function getRelativePointerPosition(argsAny: Record<string, any>, rect: RectBounds) {
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

    if (handleCanvasRootClick(renderData, relativePoint, argsAny.event)) {
      return cell
    }

    if (handleClickHandlers(renderData, relativePoint)) {
      return cell
    }

    return handleCellClick(cell, relativePoint, rect, argsAny, indices, renderData)
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

    const previousRenderData = retrieveRenderData(cellId, cell)
    const renderResult = render(ctx, rect, theme, relativeHover?.x, relativeHover?.y, {
      ...argsAny,
      canvasRoot: previousRenderData?.canvasRoot,
    })
    const hoveredAreas = renderResult?.hoveredAreas ?? []

    storeRenderData(cellId, cell, renderResult)

    const canvasRoot = renderResult?.canvasRoot ?? previousRenderData?.canvasRoot
    handleCanvasRootHover(canvasRoot, relativeHover, argsAny, args)

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
  event: any
): boolean {
  if (renderData?.canvasRoot instanceof CellCanvasRoot) {
    const handled = renderData.canvasRoot.dispatchPointerEvent('click', relativePoint.x, relativePoint.y, event)
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
  argsAny: any,
  indices: ReturnType<typeof getCellIndices>,
  renderData: ReturnType<typeof retrieveRenderData>
) {
  const { onClick } = cell.data
  if (!onClick) {
    return undefined
  }

  const row = argsAny.row ?? argsAny.rowData
  if (onClick(relativePoint.x, relativePoint.y, rect, row, indices.rowIndex, renderData)) {
    return cell
  }
  return undefined
}

function handleCanvasRootHover(
  canvasRoot: CanvasRenderResult['canvasRoot'] | undefined,
  relativeHover: ReturnType<typeof getRelativePointerPosition>,
  argsAny: any,
  args: any
): void {
  if (!(canvasRoot instanceof CellCanvasRoot)) {
    return
  }

  if (relativeHover) {
    canvasRoot.dispatchPointerEvent('mousemove', relativeHover.x, relativeHover.y, argsAny.event)
    const cursor = canvasRoot.computeCursor(relativeHover.x, relativeHover.y)
    if (cursor && cursor !== DEFAULT_CURSOR) {
      args.overrideCursor?.(cursor as Parameters<NonNullable<typeof args.overrideCursor>>[0])
    }
  } else {
    canvasRoot.handleMouseLeave()
    canvasRoot.forcePortalHide()
  }
}

function updateHoverStateIfNeeded(
  cellData: any,
  relativeHover: ReturnType<typeof getRelativePointerPosition>,
  hoveredAreas: RectBounds[],
  canvasRoot: CanvasRenderResult['canvasRoot'] | undefined,
  args: any
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


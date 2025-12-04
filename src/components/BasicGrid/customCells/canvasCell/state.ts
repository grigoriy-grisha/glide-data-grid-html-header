import type { CanvasCell, CanvasCellData, CanvasRenderResult } from './types'
import { CellCanvasRoot } from './CellCanvasRoot'

const hoverStateMap = new WeakMap<CanvasCellData, { hovered: boolean }>()
const renderDataMap = new Map<string, CanvasRenderResult>()

export function storeRenderData(
  cellId: string,
  cell: CanvasCell,
  renderResult?: CanvasRenderResult
): CanvasRenderResult {
  const renderData = { ...(renderResult ?? {}) }
  delete (renderData as { hoveredAreas?: unknown }).hoveredAreas
  renderDataMap.set(cellId, renderData)
  cell.data.renderData = renderData
  return renderData
}

export function retrieveRenderData(cellId: string, cell: CanvasCell): CanvasRenderResult | undefined {
  return cell.data.renderData ?? renderDataMap.get(cellId)
}

export function updateHoverState(cellData: CanvasCellData, isHovered: boolean): void {
  const wasHovered = hoverStateMap.get(cellData)?.hovered ?? false
  if (wasHovered === isHovered) {
    return
  }

  hoverStateMap.set(cellData, { hovered: isHovered })

  if (isHovered) {
    cellData.onMouseEnter?.()
  } else {
    // cellData.onMouseLeave?.()
    const renderData = cellData.renderData
    if (renderData?.canvasRoot instanceof CellCanvasRoot) {
      renderData.canvasRoot.forcePortalHide()
    }
  }
}

export function getHoverState(cellData: CanvasCellData): boolean | undefined {
  return hoverStateMap.get(cellData)?.hovered
}


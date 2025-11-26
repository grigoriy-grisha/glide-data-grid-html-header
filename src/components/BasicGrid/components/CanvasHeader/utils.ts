import type { GridHeaderCell } from '../../models/GridHeaderCell'

export function sortHeaderCells(cells: GridHeaderCell[]): GridHeaderCell[] {
  return [...cells].sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level
    }
    return a.startIndex - b.startIndex
  })
}

export function roundCoordinates(x: number, y: number, width: number, height: number) {
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  }
}

export function isCellHovered(
  mousePosition: { x: number; y: number } | null,
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  colSpan: number
): boolean {
  if (mousePosition === null || colSpan === 0) {
    return false
  }

  return (
    mousePosition.x >= cellX &&
    mousePosition.x < cellX + cellWidth &&
    mousePosition.y >= cellY &&
    mousePosition.y < cellY + cellHeight
  )
}


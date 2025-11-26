import type { GridHeaderCell } from '../../models/GridHeaderCell'

export interface HoverState {
  cell: GridHeaderCell | null
  x: number
  y: number
}

export interface CellBounds {
  x: number
  y: number
  width: number
  height: number
}

export function getCellAtPosition(
  x: number,
  y: number,
  headerCells: GridHeaderCell[],
  columnPositions: number[],
  columnWidths: number[],
  headerRowHeight: number
): GridHeaderCell | null {
  for (const cell of headerCells) {
    const startX = columnPositions[cell.startIndex] ?? 0
    const totalWidth = cell.getSpanWidth(columnWidths)
    const levelY = cell.level * headerRowHeight
    const cellHeight = cell.rowSpan * headerRowHeight

    if (
      x >= startX &&
      x <= startX + totalWidth &&
      y >= levelY &&
      y <= levelY + cellHeight
    ) {
      return cell
    }
  }

  return null
}

export function isCellHoverable(cell: GridHeaderCell | null): boolean {
  if (!cell) {
    return false
  }
  return cell.colSpan > 0
}


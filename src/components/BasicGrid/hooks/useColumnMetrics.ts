import { useMemo } from 'react'

import type { GridColumn } from '../models/GridColumn'

export function useColumnMetrics<RowType extends Record<string, unknown>>(
  normalizedColumns: GridColumn<RowType>[],
  containerWidth: number,
  rowMarkerWidth: number,
  columnWidthOverrides?: Record<string, number>
) {
  const columnWidths = useMemo(() => {
    if (normalizedColumns.length === 0) {
      return []
    }

    // Get base widths: use override if exists, otherwise use baseWidth
    const base = normalizedColumns.map((column) => 
      columnWidthOverrides?.[column.id] ?? column.baseWidth
    )
    const baseTotal = base.reduce((sum, width) => sum + width, 0)
    const available = Math.max(containerWidth - rowMarkerWidth, baseTotal)
    const extra = available - baseTotal

    if (extra <= 0) {
      return base
    }

    // Only columns WITHOUT overrides participate in grow distribution
    const totalGrow = normalizedColumns.reduce((sum, column) => {
      const hasOverride = columnWidthOverrides?.[column.id] !== undefined
      return sum + (hasOverride ? 0 : column.grow)
    }, 0)

    if (totalGrow <= 0) {
      return base
    }

    return base.map((width, index) => {
      const column = normalizedColumns[index]
      const hasOverride = columnWidthOverrides?.[column.id] !== undefined
      // Columns with overrides keep their fixed width, others grow
      if (hasOverride) {
        return width
      }
      const grow = column.grow
      return width + extra * (grow / totalGrow)
    })
  }, [columnWidthOverrides, containerWidth, normalizedColumns, rowMarkerWidth])

  const dataAreaWidth = useMemo(() => columnWidths.reduce((sum, width) => sum + width, 0), [columnWidths])
  const columnPositions = useMemo(() => {
    const positions: number[] = []
    let current = 0
    for (const width of columnWidths) {
      positions.push(current)
      current += width
    }
    return positions
  }, [columnWidths])

  return { columnWidths, columnPositions, dataAreaWidth }
}


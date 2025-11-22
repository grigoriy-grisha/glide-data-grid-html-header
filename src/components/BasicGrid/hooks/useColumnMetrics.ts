import { useMemo } from 'react'

import type { GridColumn } from '../models/GridColumn'

export function useColumnMetrics<RowType extends Record<string, unknown>>(
  normalizedColumns: GridColumn<RowType>[],
  containerWidth: number,
  rowMarkerWidth: number
) {
  const columnWidths = useMemo(() => {
    if (normalizedColumns.length === 0) {
      return []
    }

    const base = normalizedColumns.map((column) => column.baseWidth)
    const baseTotal = base.reduce((sum, width) => sum + width, 0)
    const available = Math.max(containerWidth - rowMarkerWidth, baseTotal)
    const extra = available - baseTotal

    if (extra <= 0) {
      return base
    }

    const totalGrow = normalizedColumns.reduce((sum, column) => sum + column.grow, 0)

    if (totalGrow <= 0) {
      return base
    }

    return base.map((width, index) => {
      const grow = normalizedColumns[index].grow
      return width + extra * (grow / totalGrow)
    })
  }, [containerWidth, normalizedColumns, rowMarkerWidth])

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


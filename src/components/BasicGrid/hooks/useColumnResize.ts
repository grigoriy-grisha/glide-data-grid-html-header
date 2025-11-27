import { useCallback } from 'react'
import type React from 'react'

import type { GridColumn } from '../models/GridColumn'

interface UseColumnResizeOptions<RowType extends Record<string, unknown>> {
  columns: GridColumn<RowType>[]
  getColumnWidth: (columnIndex: number) => number
  setColumnWidths: (updates: Array<{ columnId: string; width: number }>) => void
  clearColumnWidths: (columnIds: string[]) => void
  onResizeStart?: (columnIndex: number) => void
  onResizeProgress?: (updates: Array<{ columnId: string; width: number }>) => void
  onResizeEnd?: (updates: Array<{ columnId: string; width: number }>) => void
}

type ColumnRangeEntry<RowType extends Record<string, unknown>> = {
  column: GridColumn<RowType>
  columnIndex: number
  minWidth: number
}

export function useColumnResize<RowType extends Record<string, unknown>>({
  columns,
  getColumnWidth,
  setColumnWidths,
  clearColumnWidths,
  onResizeStart,
  onResizeProgress,
  onResizeEnd,
}: UseColumnResizeOptions<RowType>) {
  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, startIndex: number, span = 1) => {
      event.preventDefault()
      event.stopPropagation()

      if (columns.length === 0) {
        return
      }
      
      onResizeStart?.(startIndex)

      const safeStart = Math.max(0, Math.min(startIndex, columns.length - 1))
      const safeSpan = Math.max(1, Math.min(span, columns.length - safeStart))
      const columnRange: ColumnRangeEntry<RowType>[] = []
      for (let offset = 0; offset < safeSpan; offset++) {
        const column = columns[safeStart + offset]
        if (!column) {
          continue
        }
        columnRange.push({
          column,
          columnIndex: safeStart + offset,
          minWidth: column.minWidth,
        })
      }

      if (columnRange.length === 0) {
        return
      }

      const startWidths = columnRange.map((item) => getColumnWidth(item.columnIndex))
      const startTotalWidth = startWidths.reduce((sum, width) => sum + width, 0)
      const minTotalWidth = columnRange.reduce((sum, item) => sum + item.minWidth, 0)
      const startX = event.clientX
      const previousUserSelect = document.body.style.userSelect
      const previousCursor = document.body.style.cursor

      const calculateWidths = (delta: number) => {
        if (columnRange.length === 1) {
          const width = Math.max(columnRange[0].minWidth, Math.round(startWidths[0] + delta))
          return [width]
        }

        const desiredTotal = Math.max(minTotalWidth, startTotalWidth + delta)
        let remainingTotal = desiredTotal
        let remainingStart = startTotalWidth
        let remainingMin = minTotalWidth

        const widths: number[] = []

        for (let i = 0; i < columnRange.length; i++) {
          const { minWidth } = columnRange[i]
          if (i === columnRange.length - 1) {
            widths.push(Math.max(minWidth, Math.round(remainingTotal)))
            break
          }

          const startWidth = startWidths[i]
          const ratio =
            remainingStart > 0
              ? startWidth / remainingStart
              : 1 / (columnRange.length - i)
          const proposed = startWidth + delta * ratio
          const maxAvailable = remainingTotal - (remainingMin - minWidth)
          const width = Math.max(
            minWidth,
            Math.min(Math.round(proposed), Math.round(maxAvailable))
          )

          widths.push(width)
          remainingTotal -= width
          remainingStart -= startWidth
          remainingMin -= minWidth
        }

        return widths
      }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX
        const nextWidths = calculateWidths(delta)
        
        const updates = columnRange.map((item, index) => ({
            columnId: item.column.id,
            width: nextWidths[index],
        }))

        if (onResizeProgress) {
            onResizeProgress(updates)
        } else {
            setColumnWidths(updates)
        }
      }

      const handleMouseUp = (upEvent: MouseEvent) => {
        // Calculate final widths one last time to ensure consistency
        const delta = upEvent.clientX - startX
        const nextWidths = calculateWidths(delta)
        
        const updates = columnRange.map((item, index) => ({
            columnId: item.column.id,
            width: nextWidths[index],
        }))

        if (onResizeEnd) {
            onResizeEnd(updates)
        } else if (!onResizeProgress) {
             // If no custom progress handler, we already updated via setColumnWidths in mousemove.
             // But good to ensure final state is set if needed, though setColumnWidths is state setter.
        }
        
        cleanup()
      }

      const cleanup = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = previousUserSelect
        document.body.style.cursor = previousCursor
      }

      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [columns, getColumnWidth, setColumnWidths]
  )

  const handleResizeDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, startIndex: number, span = 1) => {
      event.stopPropagation()
      event.preventDefault()

      if (columns.length === 0) {
        return
      }

      const safeStart = Math.max(0, Math.min(startIndex, columns.length - 1))
      const safeSpan = Math.max(1, Math.min(span, columns.length - safeStart))
      const columnRange: string[] = []
      for (let offset = 0; offset < safeSpan; offset++) {
        const column = columns[safeStart + offset]
        if (column) {
          columnRange.push(column.id)
        }
      }

      clearColumnWidths(columnRange)
    },
    [clearColumnWidths, columns]
  )

  return { handleResizeMouseDown, handleResizeDoubleClick }
}


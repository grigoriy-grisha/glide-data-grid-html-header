import { useCallback, useMemo, useState } from 'react'

import type { BasicGridColumn } from '../types'
import {
  DEFAULT_MIN_COLUMN_WIDTH,
  DEFAULT_ROW_MARKER_WIDTH,
  SELECTION_COLUMN_ID,
} from '../constants'
import { useNormalizedColumnsData } from './useNormalizedColumnsData'
import { useColumnOrdering } from './useColumnOrdering'
import { useColumnMetrics } from './useColumnMetrics'
import type { GridColumn } from '../models/GridColumn'
import type { GridHeaderCell } from '../models/GridHeaderCell'
import type { GridColumnCollection } from '../models/GridColumnCollection'

interface UseGridColumnsControllerParams<RowType extends Record<string, unknown>> {
  columns: BasicGridColumn<RowType>[]
  enableRowSelection: boolean
  rowMarkerWidth?: number
  showRowMarkers?: boolean
  containerWidth: number
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
}

export interface GridColumnsController<RowType extends Record<string, unknown>> {
  columnCollection: GridColumnCollection<RowType>
  orderedColumns: GridColumn<RowType>[]
  headerCells: GridHeaderCell[]
  levelCount: number
  markerWidth: number
  columnWidths: number[]
  columnPositions: number[]
  dataAreaWidth: number
  selectionColumnId: string
  getColumnWidth: (index: number) => number
  setColumnWidths: (updates: Array<{ columnId: string; width: number }>) => void
  clearColumnWidths: (columnIds: string[]) => void
  reorderColumns: (sourceIndex: number, targetBoundary: number) => void
}

export function useGridColumnsController<RowType extends Record<string, unknown>>({
  columns,
  enableRowSelection,
  rowMarkerWidth = DEFAULT_ROW_MARKER_WIDTH,
  showRowMarkers = true,
  containerWidth,
  columnOrder,
  onColumnOrderChange,
}: UseGridColumnsControllerParams<RowType>): GridColumnsController<RowType> {
  const markerWidth = showRowMarkers ? rowMarkerWidth : 0

  const columnsWithSelection = useMemo(() => {
    if (!enableRowSelection) {
      return columns
    }

    const selectionColumn: BasicGridColumn<RowType> = {
      id: SELECTION_COLUMN_ID,
      dataType: 'string',
      title: '',
      width: Math.max(36, rowMarkerWidth),
      minWidth: Math.max(36, rowMarkerWidth),
      sortable: false,
      headerContent: null,
      valueGetter: () => null,
    }

    return [selectionColumn, ...columns]
  }, [columns, enableRowSelection, rowMarkerWidth])

  const { columnCollection } = useNormalizedColumnsData(columnsWithSelection)

  const { orderedColumns, headerCells, levelCount, reorderColumns } = useColumnOrdering({
    columns: columnCollection.leafColumns,
    columnOrder,
    onColumnOrderChange,
  })

  const [columnWidthOverrides, setColumnWidthOverrides] = useState<Record<string, number>>({})

  const { columnWidths, columnPositions, dataAreaWidth } = useColumnMetrics(
    orderedColumns,
    containerWidth,
    markerWidth,
    columnWidthOverrides
  )

  const setColumnWidths = useCallback((updates: Array<{ columnId: string; width: number }>) => {
    if (updates.length === 0) {
      return
    }
    setColumnWidthOverrides((prev) => {
      let changed = false
      let next = prev
      for (const { columnId, width } of updates) {
        if (next[columnId] !== width) {
          if (!changed) {
            next = { ...next }
          }
          next[columnId] = width
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [])

  const clearColumnWidths = useCallback((columnIds: string[]) => {
    if (columnIds.length === 0) {
      return
    }
    setColumnWidthOverrides((prev) => {
      let changed = false
      let next = prev
      for (const columnId of columnIds) {
        if (columnId in next) {
          if (!changed) {
            next = { ...next }
          }
          delete next[columnId]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [])

  const getColumnWidth = useCallback(
    (index: number) => columnWidths[index] ?? orderedColumns[index]?.baseWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
    [columnWidths, orderedColumns]
  )

  return {
    columnCollection,
    orderedColumns,
    headerCells,
    levelCount,
    markerWidth,
    columnWidths,
    columnPositions,
    dataAreaWidth,
    selectionColumnId: SELECTION_COLUMN_ID,
    getColumnWidth,
    setColumnWidths,
    clearColumnWidths,
    reorderColumns,
  }
}



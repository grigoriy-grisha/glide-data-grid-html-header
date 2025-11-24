import { useCallback, useEffect, useMemo, useState } from 'react'

import type { SortDirection, GridSortModel } from '../types'
import type { GridColumn } from '../models/GridColumn'

interface GridSortingOptions {
  disabled?: boolean
  sortModel?: GridSortModel | null
  onSortChange?: (model: GridSortModel | null) => void
}

export function useGridSorting<RowType extends Record<string, unknown>>(
  rows: RowType[],
  normalizedColumns: GridColumn<RowType>[],
  options?: GridSortingOptions
) {
  const disabled = options?.disabled ?? false
  const externalSortModel = options?.sortModel
  const onSortChange = options?.onSortChange

  const [internalSortState, setInternalSortState] = useState<GridSortModel | null>(null)
  const [gridRows, setGridRows] = useState<RowType[]>(() => rows)

  // Use external state if provided, otherwise internal
  const sortState = externalSortModel !== undefined ? externalSortModel : internalSortState

  const sortedColumnIndex = useMemo(() => {
    if (!sortState) {
      return -1
    }
    return normalizedColumns.findIndex((column) => column.id === sortState.columnId)
  }, [normalizedColumns, sortState])

  useEffect(() => {
    if (sortState && sortedColumnIndex === -1) {
      if (onSortChange) {
        onSortChange(null)
      } else {
        setInternalSortState(null)
      }
    }
  }, [sortState, sortedColumnIndex, onSortChange])

  const sortData = useCallback(
    (rowsToSort: RowType[], columnIndex: number, direction: SortDirection) => {
      const column = normalizedColumns[columnIndex]
      if (!column || column.sortable === false) {
        return rowsToSort
      }

      return column.sortRows(rowsToSort, direction)
    },
    [normalizedColumns]
  )

  useEffect(() => {
    if (disabled) {
      setGridRows(rows)
      return
    }

    // If we have external sorting (onSortChange is present), we assume the parent handles sorting the data
    // So we just return the rows as is (or maybe the parent passes sorted rows)
    // BUT, if the user only passed onSortChange but NOT sortModel, it's a bit ambiguous.
    // Usually external sorting means both are controlled.
    // Let's assume if onSortChange is provided, we DON'T sort internally.
    if (onSortChange) {
      setGridRows(rows)
      return
    }

    if (sortState && sortedColumnIndex >= 0) {
      setGridRows(sortData(rows, sortedColumnIndex, sortState.direction))
      return
    }

    setGridRows(rows)
  }, [rows, sortData, sortState, sortedColumnIndex, disabled, onSortChange])

  useEffect(() => {
    if (disabled && sortState) {
      if (onSortChange) {
        onSortChange(null)
      } else {
        setInternalSortState(null)
      }
    }
  }, [disabled, sortState, onSortChange])

  const handleColumnSort = useCallback(
    (columnIndex: number) => {
      if (disabled) {
        return
      }

      const column = normalizedColumns[columnIndex]
      if (!column || column.sortable === false) {
        return
      }

      const isSameColumn = sortState?.columnId === column.id
      const nextDirection: SortDirection = isSameColumn && sortState?.direction === 'asc' ? 'desc' : 'asc'
      const nextSortModel: GridSortModel = { columnId: column.id ?? '', direction: nextDirection }

      if (onSortChange) {
        onSortChange(nextSortModel)
      } else {
        setInternalSortState(nextSortModel)
        // We still need to update rows for internal sorting immediately for better UX if possible,
        // but the effect will handle it.
      }
    },
    [disabled, normalizedColumns, sortState, onSortChange]
  )

  return { gridRows, sortState, handleColumnSort }
}


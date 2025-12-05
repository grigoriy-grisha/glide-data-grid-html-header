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
  const sortState = externalSortModel !== undefined ? externalSortModel : internalSortState

  const sortedColumnIndex = useMemo(() => {
    if (!sortState) {
      return -1
    }
    return normalizedColumns.findIndex((column) => column.id === sortState.columnId)
  }, [normalizedColumns, sortState])

  const clearSortState = useCallback(() => {
    if (onSortChange) {
      onSortChange(null)
      return
    }
    setInternalSortState(null)
  }, [onSortChange])

  useEffect(() => {
    if (sortState && sortedColumnIndex === -1) {
      clearSortState()
    }
  }, [clearSortState, sortState, sortedColumnIndex])

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
    if (disabled && sortState) {
      clearSortState()
    }
  }, [clearSortState, disabled, sortState])

  const shouldDelegateSorting = Boolean(onSortChange)
  const gridRows = useMemo(() => {
    if (disabled || shouldDelegateSorting) {
      return rows
    }
    if (sortState && sortedColumnIndex >= 0) {
      return sortData(rows, sortedColumnIndex, sortState.direction)
    }
    return rows
  }, [disabled, rows, shouldDelegateSorting, sortData, sortState, sortedColumnIndex])

  const applySortModel = useCallback(
    (model: GridSortModel | null) => {
      if (onSortChange) {
        onSortChange(model)
        return
      }
      setInternalSortState(model)
    },
    [onSortChange]
  )

  const handleColumnSort = useCallback(
    (columnIndex: number, direction?: SortDirection | null) => {
      if (disabled) {
        return
      }

      const column = normalizedColumns[columnIndex]
      if (!column || column.sortable === false) {
        return
      }

      const isSameColumn = sortState?.columnId === column.id

      let nextDirection: SortDirection | undefined
      if (direction !== undefined) {
        nextDirection = direction ?? undefined
      } else {
        nextDirection = isSameColumn && sortState?.direction === 'asc' ? 'desc' : 'asc'
      }

      if (nextDirection === undefined) {
        applySortModel(null)
        return
      }

      const nextSortModel: GridSortModel = { columnId: column.id ?? '', direction: nextDirection }
      applySortModel(nextSortModel)
    },
    [applySortModel, disabled, normalizedColumns, sortState]
  )

  return { gridRows, sortState, handleColumnSort }
}


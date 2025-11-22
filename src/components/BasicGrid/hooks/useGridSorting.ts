import { useCallback, useEffect, useMemo, useState } from 'react'

import type { SortDirection } from '../types'
import type { GridColumn } from '../models/GridColumn'

interface GridSortingOptions {
  disabled?: boolean
}

export function useGridSorting<RowType extends Record<string, unknown>>(
  rows: RowType[],
  normalizedColumns: GridColumn<RowType>[],
  options?: GridSortingOptions
) {
  const disabled = options?.disabled ?? false
  const [sortState, setSortState] = useState<{ columnId: string; direction: SortDirection } | null>(null)
  const [gridRows, setGridRows] = useState<RowType[]>(() => rows)

  const sortedColumnIndex = useMemo(() => {
    if (!sortState) {
      return -1
    }
    return normalizedColumns.findIndex((column) => column.id === sortState.columnId)
  }, [normalizedColumns, sortState])

  useEffect(() => {
    if (sortState && sortedColumnIndex === -1) {
      setSortState(null)
    }
  }, [sortState, sortedColumnIndex])

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

    if (sortState && sortedColumnIndex >= 0) {
      setGridRows(sortData(rows, sortedColumnIndex, sortState.direction))
      return
    }

    setGridRows(rows)
  }, [rows, sortData, sortState, sortedColumnIndex, disabled])

  useEffect(() => {
    if (disabled && sortState) {
      setSortState(null)
    }
  }, [disabled, sortState])

  const handleColumnSort = useCallback(
    (columnIndex: number) => {
      if (disabled) {
        return
      }

      const column = normalizedColumns[columnIndex]
      if (!column || column.sortable === false) {
        return
      }

      setSortState((prevState) => {
        const isSameColumn = prevState?.columnId === column.id
        const nextDirection: SortDirection = isSameColumn && prevState?.direction === 'asc' ? 'desc' : 'asc'

        setGridRows((prevRows) => sortData(prevRows, columnIndex, nextDirection))

        return { columnId: column.id, direction: nextDirection }
      })
    },
    [disabled, normalizedColumns, sortData]
  )

  return { gridRows, sortState, handleColumnSort }
}


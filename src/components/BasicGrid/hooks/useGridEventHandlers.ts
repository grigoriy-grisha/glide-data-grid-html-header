import { useCallback } from 'react'
import type { CellClickedEventArgs, DataEditorProps, Item } from '@glideapps/glide-data-grid'
import type { GridColumn } from '../models/GridColumn'

interface UseGridEventHandlersParams<RowType extends Record<string, unknown>> {
  orderedColumns: GridColumn<RowType>[]
  rowSelectionEnabled: boolean
  selectionColumnId: string | undefined
  toggleRowSelection: (rowIndex: number) => void
  treeEnabled: boolean
  treeColumnId: string | undefined
  clearSelection: () => void
  handleColumnSort: (columnIndex: number, direction?: 'asc' | 'desc' | null) => void
}

export function useGridEventHandlers<RowType extends Record<string, unknown>>({
  orderedColumns,
  rowSelectionEnabled,
  selectionColumnId,
  toggleRowSelection,
  treeEnabled,
  treeColumnId,
  clearSelection,
  handleColumnSort,
}: UseGridEventHandlersParams<RowType>) {
  const handleCellClicked = useCallback(
    (cell: Item, event?: CellClickedEventArgs) => {
      const [colIndex, rowIndex] = cell
      const column = orderedColumns[colIndex]
      if (!column) {
        return
      }

      if (rowSelectionEnabled && column.id === selectionColumnId) {
        event?.preventDefault?.()
        toggleRowSelection(rowIndex)
        return
      }

      if (treeEnabled && treeColumnId && column.id === treeColumnId) {
        return
      }

      if (treeEnabled) {
        clearSelection()
      }
    },
    [
      clearSelection,
      orderedColumns,
      rowSelectionEnabled,
      selectionColumnId,
      toggleRowSelection,
      treeColumnId,
      treeEnabled,
    ],
  )

  const handleHeaderSort = useCallback(
    (columnId: string, direction: 'asc' | 'desc' | undefined) => {
      const index = orderedColumns.findIndex((c) => c.id === columnId)
      if (index >= 0) {
        handleColumnSort(index, direction ?? null)
      }
    },
    [orderedColumns, handleColumnSort],
  )

  const handleDataEditorHeaderClick = useCallback<NonNullable<DataEditorProps['onHeaderClicked']>>(
    (columnIndex, _event) => {
      handleColumnSort(columnIndex)
    },
    [handleColumnSort],
  )

  return {
    handleCellClicked,
    handleHeaderSort,
    handleDataEditorHeaderClick,
  }
}


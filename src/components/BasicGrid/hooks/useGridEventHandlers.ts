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
  // Column selection
  selectedColumns?: Set<number>
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
  selectedColumns,
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

      // Clear column selection when clicking on a cell outside selected columns
      // or when clicking on any cell without Ctrl key
      if (selectedColumns && selectedColumns.size > 0) {
        const isCtrlPressed = event?.ctrlKey || event?.metaKey
        const isInSelectedColumn = selectedColumns.has(colIndex)
        
        if (!isCtrlPressed && !isInSelectedColumn) {
          // Click outside selected columns without Ctrl - clear selection
          clearSelection()
        }
      } else if (treeEnabled) {
        // Legacy behavior for tree mode
        clearSelection()
      }
    },
    [
      clearSelection,
      orderedColumns,
      rowSelectionEnabled,
      selectedColumns,
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

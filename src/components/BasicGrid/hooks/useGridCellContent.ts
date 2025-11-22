import { useCallback } from 'react'
import { GridCellKind, type GridCell, type Item } from '@glideapps/glide-data-grid'

import { createSelectCell } from '../customCells/selectCell'
import { GridCellState } from '../models/GridCellState'
import type { GridColumn } from '../models/GridColumn'

const EMPTY_TEXT_CELL: GridCell = {
  kind: GridCellKind.Text,
  data: '',
  displayData: '',
  allowOverlay: false,
}

interface UseGridCellContentParams<RowType extends Record<string, unknown>> {
  orderedColumns: GridColumn<RowType>[]
  gridRows: RowType[]
  rowSelectionEnabled: boolean
  getRowSelectable?: (row: RowType) => boolean
  getSelectionStateForRow: (rowIndex: number) => 'all' | 'partial' | 'none'
  editable: boolean
  decorateCell: (cell: GridCell, columnId: string | undefined, rowIndex: number) => GridCell
  selectionColumnId: string
}

export function useGridCellContent<RowType extends Record<string, unknown>>({
  orderedColumns,
  gridRows,
  rowSelectionEnabled,
  getRowSelectable,
  getSelectionStateForRow,
  editable,
  decorateCell,
  selectionColumnId,
}: UseGridCellContentParams<RowType>) {
  return useCallback(
    (cell: Item): GridCell => {
      const [col, row] = cell
      const column = orderedColumns[col]
      const dataRow = gridRows[row]

      if (!column || !dataRow) {
        return EMPTY_TEXT_CELL
      }

      if (rowSelectionEnabled && column.id === selectionColumnId) {
        if (getRowSelectable && !getRowSelectable(dataRow)) {
          return EMPTY_TEXT_CELL
        }
        const selectionState = getSelectionStateForRow(row)
        const data = selectionState === 'all' ? true : selectionState === 'partial' ? undefined : false
        return {
          kind: GridCellKind.Boolean,
          data,
          allowOverlay: false,
          readonly: false,
          themeOverride: {
            textMedium: '#5c9dff',
            textDark: '#1e88e5',
            accentColor: '#1e88e5',
            textLight: '#4ea4ff',
            bgCell: '#e8f1ff',
          },
        }
      }

      const cellState = new GridCellState(column, dataRow)
      const baseCell = cellState.toGridCell()

      if (column.isSelect() && editable) {
        const options = column.getSelectOptions(dataRow)
        if (options && options.length > 0) {
          const rawValue = column.getValue(dataRow)
          const stringValue = rawValue == null ? '' : String(rawValue)
          return createSelectCell(stringValue, options, column.getSelectPlaceholder())
        }
      }

      const decoratedCell = decorateCell(baseCell, column.id, row)
      const canEdit =
        editable &&
        column.getAccessorPath() &&
        (decoratedCell.kind === GridCellKind.Text || decoratedCell.kind === GridCellKind.Number)

      if (canEdit) {
        const allowOverlay = decoratedCell.allowOverlay ?? false
        const activationBehavior = decoratedCell.activationBehaviorOverride
        const isReadonly = decoratedCell.readonly ?? true

        if (!allowOverlay || activationBehavior !== 'single-click' || isReadonly) {
          return {
            ...decoratedCell,
            allowOverlay: true,
            activationBehaviorOverride: 'single-click',
            readonly: false,
          }
        }
      }

      return decoratedCell
    },
    [
      decorateCell,
      editable,
      getRowSelectable,
      getSelectionStateForRow,
      gridRows,
      orderedColumns,
      rowSelectionEnabled,
      selectionColumnId,
    ]
  )
}


import { useCallback } from 'react'
import { GridCellKind, type EditableGridCell, type Item } from '@glideapps/glide-data-grid'

import type { BasicGridProps } from '../types'
import { isSelectCell } from '../customCells/selectCell'
import type { GridColumn } from '../models/GridColumn'

type TextEditableCell = Extract<EditableGridCell, { kind: GridCellKind.Text }>
type NumberEditableCell = Extract<EditableGridCell, { kind: GridCellKind.Number }>

interface UseCellEditingParams<RowType extends Record<string, unknown>> {
  editable: boolean
  orderedColumns: GridColumn<RowType>[]
  gridRows: RowType[]
  onCellChange?: BasicGridProps<RowType>['onCellChange']
}

export function useCellEditing<RowType extends Record<string, unknown>>({
  editable,
  orderedColumns,
  gridRows,
  onCellChange,
}: UseCellEditingParams<RowType>) {
  return useCallback(
    (cell: Item, newValue: EditableGridCell) => {
      if (!editable) {
        return
      }

      const [col, row] = cell
      const column = orderedColumns[col]
      const dataRow = gridRows[row]
      const accessorPath = column?.getAccessorPath()
      if (!column || !dataRow || !accessorPath) {
        return
      }

      const previousValue = column.getValue(dataRow)
      let nextRawValue: unknown
      let nextValueDisplay = ''

      if (newValue.kind === GridCellKind.Text) {
        const { data } = newValue as TextEditableCell
        nextRawValue = typeof data === 'string' ? data : ''
        nextValueDisplay = typeof nextRawValue === 'string' ? nextRawValue : ''
      } else if (newValue.kind === GridCellKind.Number) {
        const { data } = newValue as NumberEditableCell
        nextRawValue = data ?? null
        nextValueDisplay =
          typeof data === 'number' && Number.isFinite(data) ? String(data) : data == null ? '' : String(data)
      } else if (newValue.kind === GridCellKind.Custom && isSelectCell(newValue)) {
        nextRawValue = newValue.data.value
        nextValueDisplay = newValue.data.displayValue ?? ''
      } else {
        return
      }

      if (Object.is(previousValue, nextRawValue)) {
        return
      }

      onCellChange?.({
        columnId: column.id,
        accessorPath,
        rowIndex: row,
        row: dataRow,
        previousValue,
        nextValue: nextValueDisplay,
        nextRawValue,
      })
    },
    [editable, gridRows, onCellChange, orderedColumns]
  )
}


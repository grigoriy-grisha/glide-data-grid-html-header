import { useCallback } from 'react'
import { GridCellKind, type GridCell, type Item } from '@glideapps/glide-data-grid'

import { createSelectCell } from '../customCells/selectCell'
import { createButtonCell } from '../customCells/buttonCell'
import { createCanvasCell } from '../customCells/canvasCell'
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

      if (column.isButton()) {
        const buttonOptions = column.getButtonOptions()
        if (buttonOptions) {
          const label =
            typeof buttonOptions.label === 'function'
              ? buttonOptions.label(dataRow)
              : buttonOptions.label ?? 'Кнопка'
          const disabled =
            typeof buttonOptions.disabled === 'function'
              ? buttonOptions.disabled(dataRow)
              : buttonOptions.disabled ?? false
          const onClick = buttonOptions.onClick
            ? () => {
                buttonOptions.onClick?.(dataRow, row)
              }
            : undefined
          const onMouseEnter = buttonOptions.onMouseEnter
            ? () => {
                buttonOptions.onMouseEnter?.(dataRow, row)
              }
            : undefined
          const onMouseLeave = buttonOptions.onMouseLeave
            ? () => {
                buttonOptions.onMouseLeave?.(dataRow, row)
              }
            : undefined
          const onMouseDown = buttonOptions.onMouseDown
            ? () => {
                buttonOptions.onMouseDown?.(dataRow, row)
              }
            : undefined
          const onMouseUp = buttonOptions.onMouseUp
            ? () => {
                buttonOptions.onMouseUp?.(dataRow, row)
              }
            : undefined

          const buttonCell = createButtonCell(label, onClick, buttonOptions.variant ?? 'primary', disabled)
          // Добавляем обработчики событий
          if (onMouseEnter) buttonCell.data.onMouseEnter = onMouseEnter
          if (onMouseLeave) buttonCell.data.onMouseLeave = onMouseLeave
          if (onMouseDown) buttonCell.data.onMouseDown = onMouseDown
          if (onMouseUp) buttonCell.data.onMouseUp = onMouseUp

          return buttonCell
        }
      }

      if (column.isCanvas()) {
        const canvasOptions = column.getCanvasOptions()
        if (canvasOptions) {
          const render = (ctx: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }, theme: any, hoverX: number | undefined, hoverY: number | undefined) => {
            return canvasOptions.render(ctx, rect, theme, hoverX, hoverY, dataRow, row)
          }
          
          const onClick = canvasOptions.onClick
            ? (x: number, y: number, rect: { x: number; y: number; width: number; height: number }, renderData?: any) => {
                return canvasOptions.onClick?.(x, y, rect, dataRow, row, renderData) ?? false
              }
            : undefined
          
          const onMouseEnter = canvasOptions.onMouseEnter
            ? () => {
                canvasOptions.onMouseEnter?.(dataRow, row)
              }
            : undefined
          
          const onMouseLeave = canvasOptions.onMouseLeave
            ? () => {
                canvasOptions.onMouseLeave?.(dataRow, row)
              }
            : undefined

          const copyData = typeof canvasOptions.copyData === 'function'
            ? canvasOptions.copyData(dataRow)
            : canvasOptions.copyData

          const canvasCell = createCanvasCell(render, onClick, copyData)
          if (onMouseEnter) canvasCell.data.onMouseEnter = onMouseEnter
          if (onMouseLeave) canvasCell.data.onMouseLeave = onMouseLeave

          return canvasCell
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


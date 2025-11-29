import { useCallback, useMemo } from 'react'
import { GridCellKind, type GridCell, type Item } from '@glideapps/glide-data-grid'

import { createSelectCell } from '../customCells/selectCell'
import { createButtonCell } from '../customCells/buttonCell'
import { createCanvasCell } from '../customCells/canvasCell/index'
import { GridCellState } from '../models/GridCellState'
import type { GridColumn } from '../models/GridColumn'
import { CellCanvasRoot } from '../customCells/canvasCell/CellCanvasRoot'

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
  summaryRows?: RowType[]
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
  summaryRows,
}: UseGridCellContentParams<RowType>) {
  // Cache for button/canvas cell handlers to avoid recreation
  const cellHandlerCache = useMemo(() => new WeakMap<RowType, Map<string, any>>(), [])

  const getCachedHandler = useCallback(
    (row: RowType, handlerKey: string, handlerFactory: () => any) => {
      let rowCache = cellHandlerCache.get(row)
      if (!rowCache) {
        rowCache = new Map()
        cellHandlerCache.set(row, rowCache)
      }

      if (!rowCache.has(handlerKey)) {
        rowCache.set(handlerKey, handlerFactory())
      }

      return rowCache.get(handlerKey)
    },
    [cellHandlerCache]
  )

  return useCallback(
    (cell: Item): GridCell => {
      const [col, row] = cell
      const column = orderedColumns[col]

      const isSummaryRow = row >= gridRows.length
      const dataRow = isSummaryRow && summaryRows
        ? summaryRows[row - gridRows.length]
        : gridRows[row]

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

      if (isSummaryRow) {
        return {
          ...baseCell,
          themeOverride: {
            textDark: '#2c3e50',
            baseFontStyle: '600 13px',
            bgCell: '#f8f9fa',
          },
          readonly: true,
        } as GridCell
      }

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

          // Cache handlers to avoid recreation
          const onClick = buttonOptions.onClick
            ? getCachedHandler(dataRow, `button-click-${col}`, () =>
              () => buttonOptions.onClick?.(dataRow, row)
            )
            : undefined
          const onMouseEnter = buttonOptions.onMouseEnter
            ? getCachedHandler(dataRow, `button-mouseenter-${col}`, () =>
              () => buttonOptions.onMouseEnter?.(dataRow, row)
            )
            : undefined
          const onMouseLeave = buttonOptions.onMouseLeave
            ? getCachedHandler(dataRow, `button-mouseleave-${col}`, () =>
              () => buttonOptions.onMouseLeave?.(dataRow, row)
            )
            : undefined
          const onMouseDown = buttonOptions.onMouseDown
            ? getCachedHandler(dataRow, `button-mousedown-${col}`, () =>
              () => buttonOptions.onMouseDown?.(dataRow, row)
            )
            : undefined
          const onMouseUp = buttonOptions.onMouseUp
            ? getCachedHandler(dataRow, `button-mouseup-${col}`, () =>
              () => buttonOptions.onMouseUp?.(dataRow, row)
            )
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

      const renderCellContent = column.getRenderCellContent()
      if (renderCellContent) {
        let cellCanvasRoot: CellCanvasRoot | null = null
        const render = (
          ctx: CanvasRenderingContext2D,
          rect: { x: number; y: number; width: number; height: number },
          _theme: any,
          _hoverX: number | undefined,
          _hoverY: number | undefined
        ) => {
          const node = renderCellContent(dataRow, row, rect)
          if (!node) {
            return {}
          }

          if (!cellCanvasRoot) {
            cellCanvasRoot = new CellCanvasRoot(node)
          } else {
            cellCanvasRoot.setRootNode(node)
          }

          const hoverPos = _hoverX !== undefined && _hoverY !== undefined ? { x: _hoverX, y: _hoverY } : undefined
          cellCanvasRoot.rootNode.style = { width: rect.width }

          cellCanvasRoot.render(ctx, rect, hoverPos)
 
          return {
            canvasRoot: cellCanvasRoot,
          }
        }

        return createCanvasCell(render)
      }

      if (column.isCanvas()) {
        const canvasOptions = column.getCanvasOptions()
        if (canvasOptions) {
          const render = (ctx: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }, theme: any, hoverX: number | undefined, hoverY: number | undefined) => {
            return canvasOptions.render(ctx, rect, theme, hoverX, hoverY, dataRow, row)
          }

          const onClick = canvasOptions.onClick
            ? getCachedHandler(dataRow, `canvas-click-${col}`, () =>
              (x: number, y: number, rect: { x: number; y: number; width: number; height: number }, renderData?: any) => {
                return canvasOptions.onClick?.(x, y, rect, dataRow, row, renderData) ?? false
              }
            )
            : undefined

          const onMouseEnter = canvasOptions.onMouseEnter
            ? getCachedHandler(dataRow, `canvas-mouseenter-${col}`, () =>
              () => canvasOptions.onMouseEnter?.(dataRow, row)
            )
            : undefined

          const onMouseLeave = canvasOptions.onMouseLeave
            ? getCachedHandler(dataRow, `canvas-mouseleave-${col}`, () =>
              () => canvasOptions.onMouseLeave?.(dataRow, row)
            )
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
      getCachedHandler,
      getRowSelectable,
      getSelectionStateForRow,
      gridRows,
      orderedColumns,
      rowSelectionEnabled,
      selectionColumnId,
      summaryRows,
    ]
  )
}


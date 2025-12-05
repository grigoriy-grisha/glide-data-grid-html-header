import { useCallback, useMemo } from 'react'
import { GridCellKind, type GridCell, type Item } from '@glideapps/glide-data-grid'

import { createSelectCell } from '../customCells/selectCell'
import { createButtonCell } from '../customCells/buttonCell'
import { createCanvasCell } from '../customCells/canvasCell/index'
import { GridCellState } from '../models/GridCellState'
import type { GridColumn } from '../models/GridColumn'
import type { GridTreeNode } from '../models/GridTree'
import { CellCanvasRoot } from '../customCells/canvasCell/CellCanvasRoot'
import { buildCanvasTree } from '../components/CanvasHeader/CanvasComponents'
import { createTreeViewCanvasCell } from '../factories/createTreeViewCanvasCell'

const EMPTY_TEXT_CELL: GridCell = {
  kind: GridCellKind.Text,
  data: '',
  displayData: '',
  allowOverlay: false,
}

type CanvasCacheKey = string | number | boolean | null

interface CanvasCellCacheEntry {
  cacheKey: CanvasCacheKey
  canvasRoot: CellCanvasRoot
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
  treeEnabled?: boolean
  nodesByRowIndex?: GridTreeNode<RowType>[]
  treeColumnId?: string
  onTreeToggle?: (rowIndex: number) => void
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
  treeEnabled,
  nodesByRowIndex,
  treeColumnId,
  onTreeToggle,
}: UseGridCellContentParams<RowType>) {
  const cellHandlerCache = useMemo(() => new WeakMap<RowType, Map<string, any>>(), [])
  const canvasCellCache = useMemo(() => new WeakMap<RowType, Map<string, CanvasCellCacheEntry>>(), [])

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
          const resolveButtonValue = <Value,>(
            value: Value | ((row: RowType) => Value) | undefined,
            fallback: Value
          ): Value => {
            if (typeof value === 'function') {
              return (value as (row: RowType) => Value)(dataRow)
            }
            return value ?? fallback
          }

          const label = resolveButtonValue(buttonOptions.label, 'Кнопка')
          const disabled = resolveButtonValue(buttonOptions.disabled, false)
          const buildHandler = (
            suffix: string,
            handler?: (row: RowType, rowIndex: number) => void
          ) =>
            handler
              ? getCachedHandler(dataRow, `button-${suffix}-${col}`, () => () => handler(dataRow, row))
              : undefined

          const buttonCell = createButtonCell(
            label,
            buildHandler('click', buttonOptions.onClick),
            buttonOptions.variant ?? 'primary',
            disabled
          )

          const handlerMap = {
            onMouseEnter: buildHandler('mouseenter', buttonOptions.onMouseEnter),
            onMouseLeave: buildHandler('mouseleave', buttonOptions.onMouseLeave),
            onMouseDown: buildHandler('mousedown', buttonOptions.onMouseDown),
            onMouseUp: buildHandler('mouseup', buttonOptions.onMouseUp),
          } as const

          (Object.keys(handlerMap) as Array<keyof typeof handlerMap>).forEach((key) => {
            const handler = handlerMap[key]
            if (handler) {
              buttonCell.data[key] = handler
            }
          })

          return buttonCell
        }
      }

      const renderCellContent = column.getRenderCellContent()

      let canvasBounds: DOMRect | null = null

      if (renderCellContent) {
        const canvasOptions = column.getCanvasOptions()
        let cellCanvasRoot: CellCanvasRoot | null = null
        const cellPortalOriginId = `cell-${col}-${row}`
        const render = (
          ctx: CanvasRenderingContext2D,
          rect: { x: number; y: number; width: number; height: number },
          _theme: any,
          _hoverX: number | undefined,
          _hoverY: number | undefined,
          renderArgs?: { canvasRoot?: CellCanvasRoot }
        ) => {
          const cacheKeyValue = canvasOptions?.getCacheKey?.(dataRow, row)
          const isCacheable = cacheKeyValue !== undefined && cacheKeyValue !== null
          const columnCacheId = column.id
          let rowCache: Map<string, CanvasCellCacheEntry> | undefined
          let cachedEntry: CanvasCellCacheEntry | undefined

          if (isCacheable) {
            rowCache = canvasCellCache.get(dataRow)
            if (!rowCache) {
              rowCache = new Map()
              canvasCellCache.set(dataRow, rowCache)
            }
            const existing = rowCache.get(columnCacheId)
            if (existing && existing.cacheKey === cacheKeyValue) {
              cachedEntry = existing
            }
          }

          let canvasRootInstance: CellCanvasRoot | null =
            cachedEntry?.canvasRoot ??
            (renderArgs?.canvasRoot instanceof CellCanvasRoot ? renderArgs.canvasRoot : cellCanvasRoot)

          let rebuilt = false

          if (!cachedEntry) {
            const jsxElement = renderCellContent(dataRow, row)
            if (!jsxElement) {
              if (isCacheable && rowCache) {
                rowCache.delete(columnCacheId)
              }
              return {}
            }

            const node = buildCanvasTree(jsxElement, `cell-${col}-${row}`)

            if (!canvasRootInstance) {
              canvasRootInstance = new CellCanvasRoot(node, cellPortalOriginId)
            } else {
              canvasRootInstance.setRootNode(node)
              canvasRootInstance.setOriginId(cellPortalOriginId)
            }

            if (isCacheable && rowCache && canvasRootInstance) {
              const entry: CanvasCellCacheEntry = {
                cacheKey: cacheKeyValue as CanvasCacheKey,
                canvasRoot: canvasRootInstance,
              }
              rowCache.set(columnCacheId, entry)
              cachedEntry = entry
            } else {
              cellCanvasRoot = canvasRootInstance
            }
            rebuilt = true
          } else {
            canvasRootInstance = cachedEntry.canvasRoot
          }

          if (!canvasRootInstance) {
            return {}
          }

          const hoverPos = _hoverX !== undefined && _hoverY !== undefined ? { x: _hoverX, y: _hoverY } : undefined
          canvasRootInstance.rootNode.style = { width: rect.width, height: rect.height }

          if (!canvasBounds) {
            canvasBounds = ctx.canvas.getBoundingClientRect()
          }

          const absoluteBounds = {
            x: canvasBounds.left + rect.x,
            y: canvasBounds.top + rect.y,
            width: rect.width,
            height: rect.height,
          }
          canvasRootInstance.render(ctx, rect, hoverPos, absoluteBounds)

          if (!isCacheable || rebuilt) {
            cellCanvasRoot = canvasRootInstance
          }

          return {
            canvasRoot: canvasRootInstance,
          }
        }

        if (treeEnabled && nodesByRowIndex && treeColumnId && column.id === treeColumnId) {
          const node = nodesByRowIndex?.[row]
          if (node) {
            const wrappedRenderContent = renderCellContent ? (r: RowType) => renderCellContent(r, row) : undefined
            return createTreeViewCanvasCell(
              '',
              node,
              () => onTreeToggle?.(row),
              wrappedRenderContent,
              dataRow
            )
          }
        }

        return createCanvasCell(render)
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


import { useCallback, useMemo } from 'react'
import { GridCellKind, type GridCell, type Item } from '@glideapps/glide-data-grid'

import { createCanvasCell, CellCanvasRoot } from '../lib/canvas'
import { buildCanvasTree } from '../lib/canvas'
import type { CanvasRenderResult } from '../lib/canvas/cells/types'
import { GridCellState } from '../models/GridCellState'
import type { GridColumn } from '../models/GridColumn'
import type { GridTreeNode } from '../models/GridTree'
import type { GridTheme } from '../types'
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
  const canvasCellCache = useMemo(() => new WeakMap<RowType, Map<string, CanvasCellCacheEntry>>(), [])

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

      const renderCellContent = column.renderCellContent

      let canvasBounds: DOMRect | null = null

      if (renderCellContent) {
        const canvasOptions = column.canvasOptions
        let cellCanvasRoot: CellCanvasRoot | null = null
        const cellPortalOriginId = `cell-${col}-${row}`
        const render = (
          ctx: CanvasRenderingContext2D,
          rect: { x: number; y: number; width: number; height: number },
          _theme: GridTheme,
          _hoverX: number | undefined,
          _hoverY: number | undefined,
          renderArgs?: { canvasRoot?: CellCanvasRoot }
        ): CanvasRenderResult => {
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
        column.accessorPath &&
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
      canvasCellCache,
      decorateCell,
      editable,
      getRowSelectable,
      getSelectionStateForRow,
      gridRows,
      nodesByRowIndex,
      onTreeToggle,
      orderedColumns,
      rowSelectionEnabled,
      selectionColumnId,
      summaryRows,
      treeColumnId,
      treeEnabled,
    ]
  )
}

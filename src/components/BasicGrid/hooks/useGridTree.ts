import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GridCell, CustomRenderer } from '@glideapps/glide-data-grid'

import type { BasicGridTreeOptions } from '../types'
import { GridTree, type GridTreeNode, areSetsEqual } from '../models/GridTree'
import { treeViewCellRenderer, createTreeViewCell } from '../customCells/treeViewCell'
import { getGridCellDisplayText } from '../utils/gridCell'

interface UseGridTreeParams<RowType extends Record<string, unknown>> {
  rows: RowType[]
  treeOptions?: BasicGridTreeOptions<RowType>
  defaultTreeColumnId?: string
}

interface UseGridTreeResult<RowType extends Record<string, unknown>> {
  treeEnabled: boolean
  treeColumnId?: string
  displayRows: RowType[]
  nodesByRowIndex?: GridTreeNode<RowType>[]
  customRenderers?: readonly CustomRenderer<any>[]
  decorateCell: (cell: GridCell, columnId: string | undefined, rowIndex: number) => GridCell
  toggleRowByIndex: (rowIndex: number) => void
}

export function useGridTree<RowType extends Record<string, unknown>>({
  rows,
  treeOptions,
  defaultTreeColumnId,
}: UseGridTreeParams<RowType>): UseGridTreeResult<RowType> {
  const treeModel = useMemo(() => {
    return treeOptions ? new GridTree<RowType>(treeOptions) : null
  }, [treeOptions])

  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(() =>
    treeModel ? treeModel.buildInitialExpandedState(rows) : new Set()
  )
  const initializationRef = useRef(Boolean(treeOptions))
  const previousRowsRef = useRef<RowType[] | null>(rows)

  useEffect(() => {
    const rowsChanged = previousRowsRef.current !== rows
    if (rowsChanged) {
      previousRowsRef.current = rows
      initializationRef.current = false
    }

    if (!treeModel) {
      if (expandedRowIds.size > 0) {
        setExpandedRowIds(new Set())
      }
      initializationRef.current = false
      return
    }

    if (!initializationRef.current) {
      const defaults = treeModel.buildInitialExpandedState(rows)
      setExpandedRowIds((prev) => (areSetsEqual(prev, defaults) ? prev : defaults))
      initializationRef.current = true
    }
  }, [rows, treeModel, expandedRowIds])

  const snapshot = useMemo(() => {
    if (!treeModel) {
      return null
    }
    return treeModel.compute(rows, expandedRowIds)
  }, [rows, treeModel, expandedRowIds])

  const treeEnabled = Boolean(treeModel) && Boolean(snapshot?.hasTreeData)
  const treeColumnId = treeOptions?.treeColumnId ?? defaultTreeColumnId
  const nodesByRowIndex = treeEnabled ? snapshot?.nodes ?? [] : undefined
  const displayRows = treeEnabled ? snapshot?.visibleRows ?? rows : rows
  const customRenderers: readonly CustomRenderer<any>[] | undefined = treeEnabled
    ? [treeViewCellRenderer]
    : undefined

  const toggleRow = useCallback((rowId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
  }, [])

  const toggleRowByIndex = useCallback(
    (rowIndex: number) => {
      if (!nodesByRowIndex) {
        return
      }
      const node = nodesByRowIndex[rowIndex]
      if (node?.hasChildren) {
        toggleRow(node.rowId)
      }
    },
    [nodesByRowIndex, toggleRow]
  )

  const decorateCell = useCallback(
    (cell: GridCell, columnId: string | undefined, rowIndex: number): GridCell => {
      if (!treeEnabled || !nodesByRowIndex || !treeColumnId || columnId !== treeColumnId) {
        return cell
      }

      const node = nodesByRowIndex[rowIndex]
      if (!node) {
        return cell
      }

      const text = getGridCellDisplayText(cell)
      return createTreeViewCell(text, node)
    },
    [nodesByRowIndex, treeColumnId, treeEnabled]
  )

  return {
    treeEnabled,
    treeColumnId,
    displayRows,
    nodesByRowIndex,
    customRenderers,
    decorateCell,
    toggleRowByIndex,
  }
}



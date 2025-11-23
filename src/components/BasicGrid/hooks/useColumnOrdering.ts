import { useCallback, useEffect, useMemo, useState } from 'react'

import type { GridColumn } from '../models/GridColumn'
import { GridColumnCollection } from '../models/GridColumnCollection'

interface UseColumnOrderingOptions<RowType extends Record<string, unknown>> {
  columns: GridColumn<RowType>[]
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
}

const moveItem = (list: string[], fromIndex: number, targetBoundary: number) => {
  if (fromIndex < 0 || fromIndex >= list.length) {
    return list
  }
  if (targetBoundary < 0 || targetBoundary > list.length) {
    return list
  }
  if (targetBoundary === fromIndex || targetBoundary === fromIndex + 1) {
    return list
  }

  const next = [...list]
  const [removed] = next.splice(fromIndex, 1)
  const insertionIndex = fromIndex < targetBoundary ? targetBoundary - 1 : targetBoundary
  const clampedIndex = Math.max(0, Math.min(insertionIndex, next.length))
  next.splice(clampedIndex, 0, removed)
  return next
}

const mergeOrder = (preferred: string[], fallback: string[]) => {
  const fallbackSet = new Set(fallback)
  const uniquePreferred = preferred.filter((id) => fallbackSet.has(id))
  const missing = fallback.filter((id) => !uniquePreferred.includes(id))
  return [...uniquePreferred, ...missing]
}

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) {
    return false
  }
  return a.every((value, index) => value === b[index])
}

export function useColumnOrdering<RowType extends Record<string, unknown>>({
  columns,
  columnOrder,
  onColumnOrderChange,
}: UseColumnOrderingOptions<RowType>) {
  const columnIds = useMemo(() => columns.map((column) => column.id), [columns])
  const [internalOrder, setInternalOrder] = useState<string[]>(columnIds)

  useEffect(() => {
    setInternalOrder((prev) => {
      if (arraysEqual(prev, columnIds)) {
        return prev
      }
      return columnIds
    })
  }, [columnIds])

  const preferredOrder = columnOrder ?? internalOrder
  const effectiveOrder = useMemo(() => mergeOrder(preferredOrder, columnIds), [preferredOrder, columnIds])

  const columnMap = useMemo(() => {
    return new Map(columns.map((column) => [column.id, column]))
  }, [columns])

  const orderedColumns = useMemo(() => {
    return effectiveOrder.map((id) => columnMap.get(id)).filter((column): column is GridColumn<RowType> => Boolean(column))
  }, [columnMap, effectiveOrder])

  console.log(orderedColumns)
  const headerLayout = useMemo(() => {
    return GridColumnCollection.buildHeaderLayout(orderedColumns)
  }, [orderedColumns])

  const applyOrder = useCallback(
    (nextOrder: string[]) => {
      if (!columnOrder) {
        setInternalOrder(nextOrder)
      }
      onColumnOrderChange?.(nextOrder)
    },
    [columnOrder, onColumnOrderChange]
  )

  const reorderColumns = useCallback(
    (fromIndex: number, targetBoundary: number) => {
      const nextOrder = moveItem(effectiveOrder, fromIndex, targetBoundary)
      if (arraysEqual(nextOrder, effectiveOrder)) {
        return
      }
      applyOrder(nextOrder)
    },
    [applyOrder, effectiveOrder]
  )

  return {
    orderedColumns,
    headerCells: headerLayout.cells,
    levelCount: headerLayout.levelCount,
    columnOrder: effectiveOrder,
    reorderColumns,
  }
}


import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  const columnIdsRef = useRef<string[]>([])
  const previousColumnIdsSetRef = useRef<Set<string>>(new Set())
  const isInitialMountRef = useRef(true)

  const columnIds = useMemo(() => {

    const ids = columns.map((column) => column.id).filter((id): id is string => Boolean(id))
    columnIdsRef.current = ids
    return ids
  }, [columns])

  const [internalOrder, setInternalOrder] = useState<string[]>(() => {
    const ids = columns.map((column) => column.id).filter((id): id is string => Boolean(id))
    previousColumnIdsSetRef.current = new Set(ids)
    return ids
  })

  // Обновляем internalOrder только если изменился набор колонок (добавились/удалились)
  // но сохраняем пользовательский порядок, если набор колонок не изменился
  useEffect(() => {
    if (columnIds.length === 0) {
      return
    }

    const previousIdsSet = previousColumnIdsSetRef.current
    const newIdsSet = new Set(columnIds)

    // Проверяем, изменился ли набор колонок (не порядок, а сам набор)
    const setsEqual = previousIdsSet.size === newIdsSet.size &&
                      [...previousIdsSet].every(id => newIdsSet.has(id))

    if (!setsEqual || isInitialMountRef.current) {
      // При первой инициализации или когда изменился набор колонок
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false
        previousColumnIdsSetRef.current = newIdsSet
        return // Не обновляем, так как уже установлено в useState
      }

      // Объединяем: сохраняем порядок из internalOrder для существующих колонок,
      // добавляем новые колонки в конец
      const newColumns = columnIds.filter(id => !previousIdsSet.has(id))

      if (newColumns.length > 0) {
        // Если добавились новые колонки, добавляем их в конец
        setInternalOrder((prev) => {
          const preserved = prev.filter(id => newIdsSet.has(id))
          return [...preserved, ...newColumns]
        })
      } else {
        // Если только удалились колонки, просто фильтруем
        setInternalOrder((prev) => prev.filter(id => newIdsSet.has(id)))
      }

      previousColumnIdsSetRef.current = newIdsSet
    }
  }, [columnIds])

  const preferredOrder = columnOrder ?? internalOrder
  const effectiveOrder = useMemo(() => {
    return mergeOrder(preferredOrder, columnIds)
  }, [preferredOrder, columnIds])

  const columnMap = useMemo(() => {
    const map = new Map<string, GridColumn<RowType>>()
    for (const column of columns) {
      if (column.id) {
        map.set(column.id, column)
      }
    }
    return map
  }, [columns])

  const orderedColumns = useMemo(() => {
    return effectiveOrder.map((id) => columnMap.get(id)).filter((column): column is GridColumn<RowType> => Boolean(column))
  }, [effectiveOrder, columnMap])

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
      const currentOrder = effectiveOrder
      const nextOrder = moveItem(currentOrder, fromIndex, targetBoundary)
      if (arraysEqual(nextOrder, currentOrder)) {
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


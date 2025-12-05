import { useCallback, useEffect, useRef } from 'react'
import type React from 'react'
import type { GridColumn } from '../models/GridColumn'

const BINARY_SEARCH_THRESHOLD = 20
const binarySearchTarget = (dataX: number, positions: number[], widths: number[], length: number) => {
  let left = 0
  let right = length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const start = positions[mid] ?? 0
    const width = widths[mid] ?? 0
    const midpoint = start + width / 2

    if (dataX < midpoint) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }

  return left
}

const linearSearchTarget = (dataX: number, positions: number[], widths: number[], length: number) => {
  for (let i = 0; i < length; i++) {
    const start = positions[i] ?? 0
    const width = widths[i] ?? 0
    const midpoint = start + width / 2
    if (dataX < midpoint) {
      return i
    }
  }
  return length
}

const collectAffectedIndices = (
  sourceIndex: number,
  targetIndex: number,
  previousTarget: number | null,
  columnCount: number
) => {
  const affected = new Set<number>()
  affected.add(sourceIndex)

  if (previousTarget !== null && previousTarget !== targetIndex) {
    affected.add(previousTarget)
    if (previousTarget > 0) {
      affected.add(previousTarget - 1)
    }
    if (previousTarget < columnCount) {
      affected.add(previousTarget + 1)
    }
  }

  if (targetIndex !== sourceIndex) {
    affected.add(targetIndex)
    if (targetIndex > 0) {
      affected.add(targetIndex - 1)
    }
    if (targetIndex < columnCount) {
      affected.add(targetIndex + 1)
    }
  }

  return affected
}

interface DragState {
  sourceIndex: number
  targetIndex: number
}

interface UseColumnReorderDragParams<RowType extends Record<string, unknown>> {
  enableColumnReorder: boolean
  orderedColumns: GridColumn<RowType>[]
  columnPositions: number[]
  columnWidths: number[]
  headerInnerRef: React.RefObject<HTMLDivElement>
  dataAreaWidth: number
  reorderColumns: (sourceIndex: number, targetIndex: number) => void
}

export function useColumnReorderDrag<RowType extends Record<string, unknown>>({
  enableColumnReorder,
  orderedColumns,
  columnPositions,
  columnWidths,
  headerInnerRef,
  dataAreaWidth,
  reorderColumns,
}: UseColumnReorderDragParams<RowType>) {
  const dragStateRef = useRef<DragState | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const headerCellsRef = useRef<Map<number, HTMLElement>>(new Map())
  const previousClassesRef = useRef<Map<number, Set<string>>>(new Map())
  const previousTargetRef = useRef<number | null>(null)

  const getDataX = useCallback(
    (clientX: number) => {
      const headerInner = headerInnerRef.current
      if (!headerInner) {
        return 0
      }
      const rect = headerInner.getBoundingClientRect()
      const relativeX = clientX - rect.left
      return Math.max(0, Math.min(relativeX, dataAreaWidth))
    },
    [dataAreaWidth, headerInnerRef]
  )

  const getTargetIndex = useCallback(
    (dataX: number) => {
      const length = orderedColumns.length
      if (length === 0) {
        return 0
      }

      if (length > BINARY_SEARCH_THRESHOLD) {
        return binarySearchTarget(dataX, columnPositions, columnWidths, length)
      }

      return linearSearchTarget(dataX, columnPositions, columnWidths, length)
    },
    [columnPositions, columnWidths, orderedColumns.length]
  )

  const resetDragClasses = useCallback(() => {
    const cells = headerCellsRef.current
    const previousClasses = previousClassesRef.current
    previousClasses.forEach((classNames, columnIndex) => {
      const element = cells.get(columnIndex)
      if (!element) {
        return
      }
      classNames.forEach((className) => element.classList.remove(className))
    })
    previousClasses.clear()
    previousTargetRef.current = null
  }, [])

  const updateDragClasses = useCallback(() => {
    const dragState = dragStateRef.current
    const cells = headerCellsRef.current
    const previousClasses = previousClassesRef.current

    if (!dragState) {
      resetDragClasses()
      return
    }

    const { sourceIndex, targetIndex } = dragState
    const previousTarget = previousTargetRef.current
    const hasDropTarget = targetIndex !== sourceIndex
    const affectedIndices = collectAffectedIndices(
      sourceIndex,
      targetIndex,
      previousTarget,
      orderedColumns.length
    )

    previousTargetRef.current = targetIndex

    affectedIndices.forEach((columnIndex) => {
      const element = cells.get(columnIndex)
      if (!element) {
        return
      }

      const isDragging = columnIndex === sourceIndex
      const dropBefore = hasDropTarget && targetIndex === columnIndex
      const dropAfter = hasDropTarget && targetIndex === columnIndex + 1
      const showDropIndicator = dropBefore || dropAfter
      const isGhosted = hasDropTarget && !isDragging

      const nextClasses = new Set<string>()
      if (isDragging) nextClasses.add('basic-grid-header-cell--dragging')
      if (dropBefore) nextClasses.add('basic-grid-header-cell--drop-before')
      if (dropAfter) nextClasses.add('basic-grid-header-cell--drop-after')
      if (showDropIndicator) nextClasses.add('basic-grid-header-cell--drop-indicator')
      if (isGhosted) nextClasses.add('basic-grid-header-cell--drag-placeholder')

      const prevClasses = previousClasses.get(columnIndex) ?? new Set<string>()

      prevClasses.forEach((className) => {
        if (!nextClasses.has(className)) {
          element.classList.remove(className)
        }
      })

      nextClasses.forEach((className) => {
        if (!prevClasses.has(className)) {
          element.classList.add(className)
        }
      })

      if (nextClasses.size > 0) {
        previousClasses.set(columnIndex, nextClasses)
      } else {
        previousClasses.delete(columnIndex)
      }
    })
  }, [orderedColumns.length, resetDragClasses])

  const cleanup = useCallback(() => {
    cleanupRef.current?.()
    cleanupRef.current = null
  }, [])

  const handleHeaderDragStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, columnIndex: number) => {
      if (!enableColumnReorder || event.button !== 0) {
        return
      }
      event.preventDefault()
      cleanup()

      dragStateRef.current = { sourceIndex: columnIndex, targetIndex: columnIndex }
      previousTargetRef.current = columnIndex
      updateDragClasses()

      const previousUserSelect = document.body.style.userSelect

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStateRef.current) {
          return
        }

        const nextDataX = getDataX(moveEvent.clientX)
        const nextTarget = getTargetIndex(nextDataX)

        if (dragStateRef.current.targetIndex !== nextTarget) {
          dragStateRef.current.targetIndex = nextTarget
          updateDragClasses()
        }
      }

      const handleMouseUp = () => {
        const dragState = dragStateRef.current
        if (dragState) {
          reorderColumns(dragState.sourceIndex, dragState.targetIndex)
        }
        dragStateRef.current = null
        previousTargetRef.current = null
        updateDragClasses()
        cleanup()
      }

      const removeListeners = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = previousUserSelect
      }

      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp)
      cleanupRef.current = removeListeners
    },
    [cleanup, enableColumnReorder, getDataX, getTargetIndex, reorderColumns, updateDragClasses]
  )

  const registerHeaderCell = useCallback((columnIndex: number, element: HTMLElement | null) => {
    if (element) {
      headerCellsRef.current.set(columnIndex, element)
    } else {
      headerCellsRef.current.delete(columnIndex)
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return { handleHeaderDragStart, registerHeaderCell }
}


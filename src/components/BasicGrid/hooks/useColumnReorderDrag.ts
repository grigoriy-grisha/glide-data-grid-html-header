import { useCallback, useEffect, useRef } from 'react'
import type React from 'react'
import type { GridColumn } from '../models/GridColumn'

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
  const rafRef = useRef<number | null>(null)
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

      // Бинарный поиск для больших массивов
      if (length > 20) {
        let left = 0
        let right = length - 1

        while (left <= right) {
          const mid = Math.floor((left + right) / 2)
          const start = columnPositions[mid] ?? 0
          const width = columnWidths[mid] ?? 0
          const midpoint = start + width / 2

          if (dataX < midpoint) {
            right = mid - 1
          } else {
            left = mid + 1
          }
        }
        return left
      }

      // Линейный поиск для малых массивов (быстрее из-за меньших накладных расходов)
      for (let i = 0; i < length; i++) {
        const start = columnPositions[i] ?? 0
        const width = columnWidths[i] ?? 0
        const midpoint = start + width / 2
        if (dataX < midpoint) {
          return i
        }
      }
      return length
    },
    [columnPositions, columnWidths, orderedColumns.length]
  )

  const updateDragClasses = useCallback(() => {
    const dragState = dragStateRef.current
    const cells = headerCellsRef.current
    const previousClasses = previousClassesRef.current

    if (!dragState) {
      // Очистка всех drag-классов при завершении перетаскивания
      const dragClasses = [
        'basic-grid-header-cell--dragging',
        'basic-grid-header-cell--drop-before',
        'basic-grid-header-cell--drop-after',
        'basic-grid-header-cell--drop-indicator',
        'basic-grid-header-cell--drag-placeholder',
      ]

      // Очищаем только те ячейки, у которых были drag-классы
      previousClasses.forEach((prevClasses, columnIndex) => {
        const element = cells.get(columnIndex)
        if (element && prevClasses) {
          dragClasses.forEach((className) => {
            if (prevClasses.has(className)) {
              element.classList.remove(className)
            }
          })
        }
      })
      previousClasses.clear()
      previousTargetRef.current = null
      return
    }

    const sourceIndex = dragState.sourceIndex
    const targetIndex = dragState.targetIndex
    const previousTarget = previousTargetRef.current
    const hasDropTarget = targetIndex !== sourceIndex

    // Обновляем только затронутые ячейки: источник, предыдущий target, новый target и соседние
    const affectedIndices = new Set<number>()

    // Источник всегда обновляется
    affectedIndices.add(sourceIndex)

    // Предыдущий target и его соседи (нужно очистить)
    if (previousTarget !== null && previousTarget !== targetIndex) {
      affectedIndices.add(previousTarget)
      if (previousTarget > 0) {
        affectedIndices.add(previousTarget - 1)
      }
      if (previousTarget < orderedColumns.length) {
        affectedIndices.add(previousTarget + 1)
      }
    }

    // Новый target и соседние
    if (hasDropTarget) {
      affectedIndices.add(targetIndex)
      if (targetIndex > 0) {
        affectedIndices.add(targetIndex - 1)
      }
      if (targetIndex < orderedColumns.length) {
        affectedIndices.add(targetIndex + 1)
      }
    }

    // Сохраняем текущий target для следующего обновления
    previousTargetRef.current = targetIndex

    // Обновляем только затронутые ячейки
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

      const newClasses = new Set<string>()
      if (isDragging) newClasses.add('basic-grid-header-cell--dragging')
      if (dropBefore) newClasses.add('basic-grid-header-cell--drop-before')
      if (dropAfter) newClasses.add('basic-grid-header-cell--drop-after')
      if (showDropIndicator) newClasses.add('basic-grid-header-cell--drop-indicator')
      if (isGhosted) newClasses.add('basic-grid-header-cell--drag-placeholder')

      const prevClasses = previousClasses.get(columnIndex) || new Set<string>()

      // Удаляем классы, которые были, но больше не нужны
      prevClasses.forEach((className) => {
        if (!newClasses.has(className)) {
          element.classList.remove(className)
        }
      })

      // Добавляем новые классы
      newClasses.forEach((className) => {
        if (!prevClasses.has(className)) {
          element.classList.add(className)
        }
      })

      // Сохраняем текущее состояние
      if (newClasses.size > 0) {
        previousClasses.set(columnIndex, newClasses)
      } else {
        previousClasses.delete(columnIndex)
      }
    })
  }, [orderedColumns.length])

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
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

          if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = null
              updateDragClasses()
            })
          }
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


import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [dragState, setDragState] = useState<DragState | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const hasActiveDrag = dragState != null

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
      if (orderedColumns.length === 0) {
        return 0
      }
      for (let i = 0; i < orderedColumns.length; i++) {
        const start = columnPositions[i] ?? 0
        const width = columnWidths[i] ?? 0
        const midpoint = start + width / 2
        if (dataX < midpoint) {
          return i
        }
      }
      return orderedColumns.length
    },
    [columnPositions, columnWidths, orderedColumns.length]
  )

  const cleanup = useCallback(() => {
    cleanupRef.current?.()
  }, [])

  const handleHeaderDragStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, columnIndex: number) => {
      if (!enableColumnReorder || event.button !== 0) {
        return
      }
      event.preventDefault()
      cleanup()

      setDragState({ sourceIndex: columnIndex, targetIndex: columnIndex })

      const previousUserSelect = document.body.style.userSelect

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const nextDataX = getDataX(moveEvent.clientX)
        const nextTarget = getTargetIndex(nextDataX)
        setDragState((prev) => (prev ? { ...prev, targetIndex: nextTarget } : prev))
      }

      const handleMouseUp = () => {
        setDragState((prev) => {
          if (prev) {
            reorderColumns(prev.sourceIndex, prev.targetIndex)
          }
          return null
        })
        cleanup()
      }

      const removeListeners = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = previousUserSelect
        cleanupRef.current = null
      }

      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      cleanupRef.current = removeListeners
    },
    [cleanup, enableColumnReorder, getDataX, getTargetIndex, reorderColumns]
  )

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return { dragState, hasActiveDrag, handleHeaderDragStart }
}


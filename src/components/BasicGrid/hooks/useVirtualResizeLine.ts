import { useCallback, useMemo, useState } from 'react'

interface VirtualResizeState {
  x: number
  columnIndex: number
}

interface ColumnResizeUpdate {
  columnId: string
  width: number
}

interface UseVirtualResizeLineParams {
  scrollLeft: number
  markerWidth: number
  effectiveDataViewportWidth: number
  columnPositions: number[]
  orderedColumns: Array<{ id: string }>
  setColumnWidths: (updates: ColumnResizeUpdate[]) => void
  onColumnResize?: (resizes: ColumnResizeUpdate[]) => void
}

export function useVirtualResizeLine({
  scrollLeft,
  markerWidth,
  effectiveDataViewportWidth,
  columnPositions,
  orderedColumns,
  setColumnWidths,
  onColumnResize,
}: UseVirtualResizeLineParams) {
  const [virtualResizeState, setVirtualResizeState] = useState<VirtualResizeState | null>(null)

  const virtualResizeLineStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!virtualResizeState) {
      return { display: 'none' }
    }

    const relativeX = virtualResizeState.x - scrollLeft + markerWidth
    const isVisible = relativeX >= 0 && relativeX <= effectiveDataViewportWidth + markerWidth

    return {
      left: `${relativeX}px`,
      display: isVisible ? 'block' : 'none',
    }
  }, [effectiveDataViewportWidth, markerWidth, scrollLeft, virtualResizeState])

  const handleVirtualResizeChange = useCallback((x: number | null, columnIndex: number | null) => {
    if (x !== null && columnIndex !== null) {
      setVirtualResizeState({ x, columnIndex })
    } else {
      setVirtualResizeState(null)
    }
  }, [])

  const handleResizeProgress = useCallback(
    (updates: Array<{ columnId: string; width: number }>) => {
      if (updates.length === 0) {
        return
      }

      const firstColId = updates[0].columnId
      const firstIndex = orderedColumns.findIndex((c) => c.id === firstColId)
      if (firstIndex === -1) {
        return
      }

      const startX = columnPositions[firstIndex] ?? 0
      const totalWidth = updates.reduce((sum, u) => sum + u.width, 0)

      setVirtualResizeState({
        x: startX + totalWidth,
        columnIndex: firstIndex,
      })
    },
    [columnPositions, orderedColumns],
  )

  const handleResizeEnd = useCallback(
    (updates: Array<{ columnId: string; width: number }>) => {
      setColumnWidths(updates)
      setVirtualResizeState(null)
      onColumnResize?.(updates)
    },
    [setColumnWidths, onColumnResize],
  )

  return {
    virtualResizeState,
    virtualResizeLineStyle,
    handleVirtualResizeChange,
    handleResizeProgress,
    handleResizeEnd,
  }
}


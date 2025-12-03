import { useCallback, useLayoutEffect, useEffect, useMemo, useState, type RefObject } from 'react'
import type { DataEditorRef } from '@glideapps/glide-data-grid'

interface UseRowOverlayParams<RowType> {
  gridRows: RowType[]
  orderedColumnsLength: number
  renderRowOverlay?: (row: RowType, rowIndex: number) => React.ReactNode
  rowOverlayRowId?: string | number | null
  getRowId?: (row: RowType, rowIndex: number) => string | number
  gridBodyRef: RefObject<HTMLDivElement>
  dataEditorRef: RefObject<DataEditorRef>
  overlayRef: RefObject<HTMLDivElement>
}

interface UseRowOverlayResult<RowType> {
  overlayRow: RowType | null
  overlayRowIndex: number
  overlayContent: React.ReactNode | null
  overlayPosition: { top: number } | null
  overlayPaddingBottom: number
  updateOverlayPosition: () => void
}

export function useRowOverlay<RowType>({
  gridRows,
  orderedColumnsLength,
  renderRowOverlay,
  rowOverlayRowId,
  getRowId,
  gridBodyRef,
  dataEditorRef,
  overlayRef,
}: UseRowOverlayParams<RowType>): UseRowOverlayResult<RowType> {
  const [overlayPosition, setOverlayPosition] = useState<{ top: number } | null>(null)
  const [overlayPaddingBottom, setOverlayPaddingBottom] = useState(0)

  const resolveRowId = useCallback(
    (row: RowType, index: number) => {
      if (getRowId) {
        return getRowId(row, index)
      }
      const candidate = (row as Record<string, unknown> | undefined)?.['id']
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        return candidate
      }
      return index
    },
    [getRowId]
  )

  const overlayRowIndex = useMemo(() => {
    if (!renderRowOverlay || rowOverlayRowId == null) {
      return -1
    }
    return gridRows.findIndex((row, index) => resolveRowId(row, index) === rowOverlayRowId)
  }, [gridRows, renderRowOverlay, resolveRowId, rowOverlayRowId])

  const overlayRow = overlayRowIndex >= 0 ? gridRows[overlayRowIndex] : null

  const overlayContent = useMemo(() => {
    if (!overlayRow || overlayRowIndex < 0 || !renderRowOverlay) {
      return null
    }
    return renderRowOverlay(overlayRow, overlayRowIndex)
  }, [overlayRow, overlayRowIndex, renderRowOverlay])

  const updateOverlayPosition = useCallback(() => {
    if (!overlayRow || overlayRowIndex < 0 || !gridBodyRef.current || !dataEditorRef.current) {
      setOverlayPosition(null)
      return
    }
    if (orderedColumnsLength === 0) {
      setOverlayPosition(null)
      return
    }
    const bounds = dataEditorRef.current.getBounds(0, overlayRowIndex)
    if (!bounds) {
      setOverlayPosition(null)
      return
    }
    const bodyRect = gridBodyRef.current.getBoundingClientRect()
    const nextTop = bounds.y - bodyRect.top + bounds.height
    setOverlayPosition((prev) => {
      if (prev && Math.abs(prev.top - nextTop) < 0.5) {
        return prev
      }
      return { top: nextTop }
    })
  }, [overlayRow, overlayRowIndex, orderedColumnsLength, gridBodyRef, dataEditorRef])

  useLayoutEffect(() => {
    if (!overlayRow || !overlayContent) {
      setOverlayPosition(null)
      if (overlayPaddingBottom !== 0) {
        setOverlayPaddingBottom(0)
      }
      return
    }
    updateOverlayPosition()
  }, [overlayRow, overlayContent, overlayPaddingBottom, updateOverlayPosition])

  useEffect(() => {
    if (!overlayRow) {
      return
    }
    const handleResize = () => updateOverlayPosition()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [overlayRow, updateOverlayPosition])

  useLayoutEffect(() => {
    if (!overlayRow || !overlayPosition || !gridBodyRef.current) {
      if (overlayPaddingBottom !== 0) {
        setOverlayPaddingBottom(0)
      }
      return
    }
    const overlayHeight = overlayRef.current?.offsetHeight ?? 0
    if (overlayHeight === 0) {
      return
    }
    const currentPadding = overlayPaddingBottom
    const body = gridBodyRef.current
    const baseBodyHeight = body.clientHeight - currentPadding
    const overflow = overlayPosition.top + overlayHeight + 16 - baseBodyHeight
    const nextPadding = overflow > 0 ? overflow : 0
    if (Math.abs(nextPadding - currentPadding) > 0.5) {
      setOverlayPaddingBottom(nextPadding)
    }
  }, [overlayPaddingBottom, overlayPosition, overlayRow, gridBodyRef, overlayRef])

  return {
    overlayRow,
    overlayRowIndex,
    overlayContent,
    overlayPosition,
    overlayPaddingBottom,
    updateOverlayPosition,
  }
}


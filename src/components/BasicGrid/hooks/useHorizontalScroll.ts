import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Rectangle } from '@glideapps/glide-data-grid'

interface HorizontalScrollOptions {
  dataAreaWidth: number
  rowMarkerWidth: number
  containerWidth: number
  columnPositions: number[]
}

export function useHorizontalScroll({
  dataAreaWidth,
  rowMarkerWidth,
  containerWidth,
  columnPositions,
}: HorizontalScrollOptions) {
  const scrollLeftRef = useRef(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const viewportWidth = useMemo(() => {
    return Math.max(rowMarkerWidth + 260, Math.min(rowMarkerWidth + dataAreaWidth, containerWidth))
  }, [containerWidth, dataAreaWidth, rowMarkerWidth])

  const dataViewportWidth = Math.max(0, viewportWidth - rowMarkerWidth)
  const maxScrollLeft = useMemo(
    () => Math.max(0, dataAreaWidth - dataViewportWidth),
    [dataAreaWidth, dataViewportWidth]
  )

  const clampScrollLeft = useCallback(
    (value: number) => {
      if (value >= maxScrollLeft) {
        return value
      }
      return Math.max(0, Math.min(value, maxScrollLeft))
    },
    [maxScrollLeft]
  )

  const applyScrollLeft = useCallback(
    (value: number) => {
      const clampedValue = clampScrollLeft(value)
      scrollLeftRef.current = clampedValue
      setScrollLeft((prev) => (Object.is(prev, clampedValue) ? prev : clampedValue))
    },
    [clampScrollLeft]
  )

  useEffect(() => {
    applyScrollLeft(scrollLeftRef.current)
  }, [applyScrollLeft])

  const getScrollLeftFromRegion = useCallback(
    (range?: Rectangle, txValue?: number) => {
      if (!range || columnPositions.length === 0) {
        return 0
      }

      const safeIndex = Math.min(columnPositions.length - 1, Math.max(0, Math.floor(range.x)))
      const baseOffset = columnPositions[safeIndex] ?? 0
      const translation = typeof txValue === 'number' ? txValue : 0
      const rawScrollLeft = baseOffset - translation

      return clampScrollLeft(rawScrollLeft)
    },
    [clampScrollLeft, columnPositions]
  )

  const handleVisibleRegionChanged = useCallback(
    (range: Rectangle, tx = 0) => {
      const nextScrollLeft = getScrollLeftFromRegion(range, tx)
      applyScrollLeft(nextScrollLeft)
    },
    [applyScrollLeft, getScrollLeftFromRegion]
  )

  return { scrollLeft, handleVisibleRegionChanged, viewportWidth, dataViewportWidth }
}


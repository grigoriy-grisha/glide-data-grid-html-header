import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import type React from 'react'
import type { Rectangle } from '@glideapps/glide-data-grid'

interface HorizontalScrollOptions {
  dataAreaWidth: number
  rowMarkerWidth: number
  containerWidth: number
  columnPositions: number[]
  headerElementRef: React.RefObject<HTMLDivElement>
}

export function useHorizontalScroll({
  dataAreaWidth,
  rowMarkerWidth,
  containerWidth,
  columnPositions,
  headerElementRef,
}: HorizontalScrollOptions) {
  const scrollLeftRef = useRef(0)

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

  const applyScrollLeftToDOM = useCallback(
    (value: number) => {
      const clampedValue = clampScrollLeft(value)
      scrollLeftRef.current = clampedValue

      if (headerElementRef.current) {
        headerElementRef.current.style.transform = `translateX(-${clampedValue}px)`
      }
    },
    [clampScrollLeft, headerElementRef]
  )

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
      applyScrollLeftToDOM(nextScrollLeft)
    },
    [applyScrollLeftToDOM, getScrollLeftFromRegion]
  )

  useLayoutEffect(() => {
    if (headerElementRef.current && scrollLeftRef.current === 0) {
      headerElementRef.current.style.transform = 'translateX(0px)'
    }
  }, [headerElementRef])

  return { handleVisibleRegionChanged, viewportWidth, dataViewportWidth }
}

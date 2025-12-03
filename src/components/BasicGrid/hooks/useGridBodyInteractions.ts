import { useCallback, useMemo } from 'react'
import type React from 'react'
import type { DataEditorProps } from '@glideapps/glide-data-grid'

interface UseGridBodyInteractionsOptions {
  estimatedRowHeight: number
  stickyHeaderEnabled: boolean
  overlayPaddingBottom: number
  overlayRow: unknown
  overlayContent: unknown
  handleVisibleRegionChanged: NonNullable<DataEditorProps['onVisibleRegionChanged']>
  updateOverlayPosition: () => void
  handleVirtualScroll: (offset: number) => void
  updateStickyMetrics: () => void
}

export function useGridBodyInteractions({
  estimatedRowHeight,
  stickyHeaderEnabled,
  overlayPaddingBottom,
  overlayRow,
  overlayContent,
  handleVisibleRegionChanged,
  updateOverlayPosition,
  handleVirtualScroll,
  updateStickyMetrics,
}: UseGridBodyInteractionsOptions) {
  const handleVisibleRegionChangedWithOverlay = useCallback<NonNullable<DataEditorProps['onVisibleRegionChanged']>>(
    (range, tx = 0, ty = 0, extras) => {
      handleVisibleRegionChanged(range, tx, ty, extras)

      if (overlayRow && overlayContent) {
        requestAnimationFrame(() => updateOverlayPosition())
      }

      if (stickyHeaderEnabled) {
        requestAnimationFrame(() => updateStickyMetrics())
      }

      const visibleRow = Math.max(0, range?.y ?? 0)
      const approxPixelOffset = visibleRow * estimatedRowHeight + Math.max(0, ty ?? 0)
      handleVirtualScroll(approxPixelOffset)
    },
    [
      estimatedRowHeight,
      handleVisibleRegionChanged,
      handleVirtualScroll,
      overlayContent,
      overlayRow,
      stickyHeaderEnabled,
      updateOverlayPosition,
      updateStickyMetrics,
    ]
  )

  const gridBodyStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (overlayPaddingBottom <= 0) {
      return undefined
    }
    return { paddingBottom: overlayPaddingBottom }
  }, [overlayPaddingBottom])

  return {
    handleVisibleRegionChangedWithOverlay,
    gridBodyStyle,
  }
}


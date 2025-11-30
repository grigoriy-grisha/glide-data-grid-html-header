import { useCallback, useMemo } from 'react'
import type React from 'react'
import type { DataEditorProps } from '@glideapps/glide-data-grid'

interface UseGridBodyInteractionsOptions {
  estimatedRowHeight: number
  headerHeightPx: number
  stickyHeaderEnabled: boolean
  stickyBodyStyle?: React.CSSProperties
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
  stickyBodyStyle,
  overlayPaddingBottom,
  overlayRow,
  overlayContent,
  handleVisibleRegionChanged,
  updateOverlayPosition,
  handleVirtualScroll,
  updateStickyMetrics,
}: UseGridBodyInteractionsOptions) {
  const handleVisibleRegionChangedWithOverlay = useCallback<NonNullable<DataEditorProps['onVisibleRegionChanged']>>(
    (range, tx = 0, ty = 0, _extras) => {
      handleVisibleRegionChanged(range, tx, ty, _extras)

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
    const hasPadding = overlayPaddingBottom > 0

    if (!hasPadding && !stickyBodyStyle) {
      return undefined
    }

    return {
      ...(stickyBodyStyle ?? {}),
      ...(hasPadding ? { paddingBottom: overlayPaddingBottom } : undefined),
    }
  }, [overlayPaddingBottom, stickyBodyStyle])

  return {
    handleVisibleRegionChangedWithOverlay,
    gridBodyStyle,
  }
}


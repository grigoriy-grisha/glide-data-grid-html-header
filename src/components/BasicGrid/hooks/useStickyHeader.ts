import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface UseStickyHeaderParams {
  enabled: boolean
  gridRef: React.RefObject<HTMLDivElement>
  headerHeight: number
}

interface UseStickyHeaderResult {
  headerLayerStyle: React.CSSProperties | undefined
  handleVirtualScroll: (approximateOffset: number) => void
  updateStickyMetrics: () => void
  isSticky: boolean
  virtualOffset: number
}

interface StickyState {
  isSticky: boolean
  width: number
  left: number
  translateY: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STICKY_TOP_OFFSET = 0
const STICKY_Z_INDEX = 30
const SNAP_THRESHOLD = 8
const VIRTUAL_SNAP_THRESHOLD = 1
const SCROLLABLE_OVERFLOW_RE = /(auto|scroll)/i

const INITIAL_STICKY_STATE: StickyState = {
  isSticky: false,
  width: 0,
  left: 0,
  translateY: 0,
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getScrollableAncestors(node: HTMLElement): (HTMLElement | Window)[] {
  const ancestors: (HTMLElement | Window)[] = []
  let el: HTMLElement | null = node.parentElement

  while (el) {
    const { overflowY, overflow } = getComputedStyle(el)
    if (SCROLLABLE_OVERFLOW_RE.test(overflowY || overflow) && el.scrollHeight > el.clientHeight) {
      ancestors.push(el)
    }
    el = el.parentElement
  }

  ancestors.push(window)
  return ancestors
}

function clampVirtualOffset(value: number, max: number): number {
  if (value < VIRTUAL_SNAP_THRESHOLD) return 0
  if (max - value < VIRTUAL_SNAP_THRESHOLD) return max
  return Math.max(0, Math.min(max, value))
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useStickyHeader({
  enabled,
  gridRef,
  headerHeight,
}: UseStickyHeaderParams): UseStickyHeaderResult {
  const [stickyState, setStickyState] = useState<StickyState>(INITIAL_STICKY_STATE)
  const [virtualOffset, setVirtualOffset] = useState(0)

  const lastStickyRef = useRef<StickyState>(INITIAL_STICKY_STATE)
  const lastVirtualRef = useRef(0)

  // ─────────────────────────────────────────────────────────────────────────
  // Sticky metrics (page scroll)
  // ─────────────────────────────────────────────────────────────────────────

  const updateStickyMetrics = useCallback(() => {
    const grid = gridRef.current
    if (!enabled || !grid || headerHeight <= 0) {
      if (lastStickyRef.current.isSticky) {
        lastStickyRef.current = INITIAL_STICKY_STATE
        setStickyState(INITIAL_STICKY_STATE)
      }
      return
    }

    const rect = grid.getBoundingClientRect()
    const shouldStick = rect.top <= STICKY_TOP_OFFSET && rect.bottom > STICKY_TOP_OFFSET

    if (!shouldStick) {
      if (lastStickyRef.current.isSticky) {
        lastStickyRef.current = INITIAL_STICKY_STATE
        setStickyState(INITIAL_STICKY_STATE)
      }
      return
    }

    const translateY = Math.min(0, rect.bottom - (STICKY_TOP_OFFSET + headerHeight))
    const prev = lastStickyRef.current

    // Skip if no significant change
    if (
      prev.isSticky &&
      prev.width === rect.width &&
      prev.left === rect.left &&
      Math.abs(prev.translateY - translateY) <= SNAP_THRESHOLD
    ) {
      return
    }

    const next: StickyState = {
      isSticky: true,
      width: rect.width,
      left: rect.left,
      translateY,
    }
    lastStickyRef.current = next
    setStickyState(next)
  }, [enabled, gridRef, headerHeight])

  // ─────────────────────────────────────────────────────────────────────────
  // Virtual scroll (grid internal scroll, sticky disabled)
  // ─────────────────────────────────────────────────────────────────────────

  const handleVirtualScroll = useCallback(
    (offset: number) => {
      // Reset when sticky is enabled or invalid headerHeight
      if (enabled || headerHeight <= 0) {
        if (lastVirtualRef.current !== 0) {
          lastVirtualRef.current = 0
          setVirtualOffset(0)
        }
        return
      }

      const clamped = clampVirtualOffset(offset, headerHeight)

      // Skip if no significant change
      if (Math.abs(clamped - lastVirtualRef.current) < VIRTUAL_SNAP_THRESHOLD) {
        return
      }

      lastVirtualRef.current = clamped
      setVirtualOffset(clamped)
    },
    [enabled, headerHeight]
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Scroll listeners (sticky mode only)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) {
      if (lastStickyRef.current.isSticky) {
        lastStickyRef.current = INITIAL_STICKY_STATE
        setStickyState(INITIAL_STICKY_STATE)
      }
      return
    }

    const node = gridRef.current
    if (!node) return

    const targets = getScrollableAncestors(node)

    const onScroll = () => {
      updateStickyMetrics()
    }

    updateStickyMetrics()

    const opts: AddEventListenerOptions = { passive: true }
    targets.forEach((t) => t.addEventListener('scroll', onScroll, opts))
    window.addEventListener('resize', onScroll, opts)

    return () => {
      targets.forEach((t) => t.removeEventListener('scroll', onScroll))
      window.removeEventListener('resize', onScroll)
    }
  }, [enabled, gridRef, updateStickyMetrics])

  // ─────────────────────────────────────────────────────────────────────────
  // Resize observer (sticky mode only)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || typeof ResizeObserver === 'undefined') return

    const node = gridRef.current
    if (!node) return

    const observer = new ResizeObserver(() => {
      updateStickyMetrics()
    })
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [enabled, gridRef, updateStickyMetrics])

  // ─────────────────────────────────────────────────────────────────────────
  // Computed style
  // ─────────────────────────────────────────────────────────────────────────

  const headerLayerStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!enabled || !stickyState.isSticky) return undefined

    const style: React.CSSProperties = {
      position: 'fixed',
      top: STICKY_TOP_OFFSET,
      left: stickyState.left,
      width: stickyState.width,
      zIndex: STICKY_Z_INDEX,
    }

    if (stickyState.translateY !== 0) {
      style.transform = `translateY(${stickyState.translateY}px)`
    }

    return style
  }, [enabled, stickyState])

  return {
    headerLayerStyle,
    handleVirtualScroll,
    updateStickyMetrics,
    isSticky: stickyState.isSticky,
    virtualOffset,
  }
}

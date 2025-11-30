import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'

interface StickyHeaderState {
  isSticky: boolean
  width: number
  left: number
  translateY: number
}

const createStickyHeaderState = (): StickyHeaderState => ({
  isSticky: false,
  width: 0,
  left: 0,
  translateY: 0,
})

const SCROLLABLE_OVERFLOW = /(auto|scroll)/i
const STICKY_TOP_OFFSET = 0
const STICKY_Z_INDEX = 30
// Коэффициент сглаживания: 1.0 = мгновенно, меньше = плавнее
const DEFAULT_SCROLL_SMOOTHING = 1.0

const getScrollableAncestors = (node: HTMLElement | null): (HTMLElement | Window)[] => {
  if (typeof window === 'undefined') {
    return []
  }

  const ancestors: (HTMLElement | Window)[] = []
  let parent: HTMLElement | null = node?.parentElement ?? null

  while (parent) {
    const style = window.getComputedStyle(parent)
    const overflowY = style.overflowY || style.overflow
    const canScroll = SCROLLABLE_OVERFLOW.test(overflowY)
    if (canScroll && parent.scrollHeight > parent.clientHeight) {
      ancestors.push(parent)
    }
    parent = parent.parentElement
  }

  ancestors.push(window)
  return ancestors
}

interface UseStickyHeaderParams {
  enabled: boolean
  gridRef: React.RefObject<HTMLDivElement>
  headerHeight: number
}

export function useStickyHeader({
  enabled,
  gridRef,
  headerHeight,
}: UseStickyHeaderParams) {
  const [stickyState, setStickyState] = useState<StickyHeaderState>(() => createStickyHeaderState())
  const [virtualOffset, setVirtualOffset] = useState(0)

  const resetStickyState = useCallback(() => {
    setStickyState((prev) => (prev.isSticky ? createStickyHeaderState() : prev))
  }, [])

  const updateStickyMetrics = useCallback(() => {
    if (!enabled || !gridRef.current) {
      resetStickyState()
      return
    }

    if (headerHeight <= 0) {
      resetStickyState()
      return
    }

    const gridRect = gridRef.current.getBoundingClientRect()
    const shouldStick = gridRect.top <= STICKY_TOP_OFFSET && gridRect.bottom > STICKY_TOP_OFFSET

    if (!shouldStick) {
      resetStickyState()
      return
    }

    const translateY = Math.min(0, gridRect.bottom - (STICKY_TOP_OFFSET + headerHeight))
    const width = gridRect.width
    const left = gridRect.left

    setStickyState((prev) => {
      if (prev.isSticky && prev.width === width && prev.left === left && prev.translateY === translateY) {
        return prev
      }
      return {
        isSticky: true,
        width,
        left,
        translateY,
      }
    })
  }, [enabled, gridRef, headerHeight, resetStickyState])

  useEffect(() => {
    if (!enabled) {
      resetStickyState()
      setVirtualOffset(0)
      return
    }

    const node = gridRef.current
    if (!node) {
      return
    }

    const targets = getScrollableAncestors(node)
    const handleScroll = () => updateStickyMetrics()
    handleScroll()

    const scrollOptions: AddEventListenerOptions = { passive: true }
    targets.forEach((target) => target.addEventListener('scroll', handleScroll, scrollOptions))

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleScroll)
    }

    return () => {
      targets.forEach((target) => target.removeEventListener('scroll', handleScroll))
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleScroll)
      }
    }
  }, [enabled, gridRef, resetStickyState, updateStickyMetrics])

  useEffect(() => {
    if (!enabled || typeof ResizeObserver === 'undefined') {
      return
    }
    const node = gridRef.current
    if (!node) {
      return
    }
    const observer = new ResizeObserver(() => updateStickyMetrics())
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [enabled, gridRef, updateStickyMetrics])

  const handleVirtualScroll = useCallback(
    (approximateOffset: number) => {
      if (enabled) {
        setVirtualOffset(0)
        return
      }

      if (headerHeight <= 0) {
        setVirtualOffset(0)
        return
      }

      const clamped = Math.max(0, Math.min(headerHeight, approximateOffset))
      setVirtualOffset((prev) => {
        if (clamped < 0.5) {
          return 0
        }
        if (headerHeight - clamped < 0.5) {
          return headerHeight
        }

        const diff = clamped - prev
        if (Math.abs(diff) < 0.35) {
          return clamped
        }
        return prev + diff * DEFAULT_SCROLL_SMOOTHING
      })
    },
    [enabled, headerHeight]
  )

  // Стили для слоя хедера:
  // - Когда sticky выключен: хедер сдвигается вверх на virtualOffset внутри shell'а
  // - Когда sticky включен: хедер фиксируется при прокрутке страницы
  const headerLayerStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!enabled && virtualOffset === 0) {
      return undefined
    }

    if (!enabled) {
      // Хедер сдвигается вверх внутри shell-контейнера
      // Shell обрезает его через overflow: hidden
      return {
        transform: `translateY(-${virtualOffset}px)`,
      }
    }

    if (!stickyState.isSticky) {
      return undefined
    }

    const style: React.CSSProperties = {
      position: 'fixed',
      top: `${STICKY_TOP_OFFSET}px`,
      left: `${stickyState.left}px`,
      width: `${stickyState.width}px`,
      zIndex: STICKY_Z_INDEX,
    }

    if (stickyState.translateY !== 0) {
      style.transform = `translateY(${stickyState.translateY}px)`
    }

    return style
  }, [enabled, stickyState.isSticky, stickyState.left, stickyState.translateY, stickyState.width, virtualOffset])

  // Стили для тела таблицы - больше не нужны при сворачивании хедера,
  // т.к. shell уменьшается и тело автоматически поднимается
  const bodyStyle = useMemo<React.CSSProperties | undefined>(() => {
    // При сворачивающемся хедере стили для body не нужны
    return undefined
  }, [])

  // Стиль для shell-контейнера хедера:
  // При сворачивании хедера уменьшаем высоту shell'а,
  // чтобы тело таблицы поднималось вслед за хедером
  const headerShellStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (enabled || virtualOffset === 0) {
      return undefined
    }
    // Уменьшаем высоту shell'а на величину сворачивания
    // overflow: hidden обрезает часть хедера, которая вышла за пределы
    return {
      height: headerHeight - virtualOffset,
      minHeight: 0,
      overflow: 'hidden',
    }
  }, [enabled, headerHeight, virtualOffset])

  return {
    headerLayerStyle,
    bodyStyle,
    headerShellStyle,
    handleVirtualScroll,
    updateStickyMetrics,
    isSticky: stickyState.isSticky,
    virtualOffset,
  }
}


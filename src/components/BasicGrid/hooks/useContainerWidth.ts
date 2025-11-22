import { useEffect, useState } from 'react'
import type React from 'react'

export function useContainerWidth(containerRef: React.RefObject<HTMLDivElement>) {
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.max(480, window.innerWidth - 80)
    }
    return 900
  })

  useEffect(() => {
    const parent = containerRef.current?.parentElement
    if (!parent || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) {
        setContainerWidth(Math.max(480, width))
      }
    })

    observer.observe(parent)
    return () => observer.disconnect()
  }, [containerRef])

  return containerWidth
}


import { useCallback, useEffect, useRef } from 'react'
import { CanvasRoot } from '../core/CanvasRoot'
import { CanvasAbsoluteContainer } from '../core/CanvasAbsoluteContainer'

interface UseCanvasLifecycleProps {
  width: number
  height: number
  canvasHeaderRef?: React.RefObject<HTMLCanvasElement>
  isActive?: boolean
}

export const useCanvasLifecycle = ({ width, height, canvasHeaderRef, isActive = true }: UseCanvasLifecycleProps) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = canvasHeaderRef || internalCanvasRef
  const rootRef = useRef<CanvasRoot | null>(null)
  const rafRef = useRef<number | null>(null)

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const renderLoop = useCallback(() => {
    if (!rootRef.current) {
      return
    }
    rootRef.current.render()
    rafRef.current = requestAnimationFrame(renderLoop)
  }, [])

  // Initialize CanvasRoot and Render Loop
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1

    // Set initial size
    canvas.width = width * dpr
    canvas.height = height * dpr

    const rootContainer = new CanvasAbsoluteContainer('root')
    const root = new CanvasRoot(canvas, rootContainer)
    rootRef.current = root
    return () => {
      stopLoop()
      rootRef.current = null
    }
  }, [stopLoop])

  useEffect(() => {
    if (!rootRef.current) {
      stopLoop()
      return
    }
    stopLoop()
    if (!isActive) {
      return
    }
    renderLoop()
    return () => {
      stopLoop()
    }
  }, [isActive, renderLoop, stopLoop])

  // Handle size updates
  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return

    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
    }
  }, [width, height])

  return {
    canvasRef,
    rootRef
  }
}


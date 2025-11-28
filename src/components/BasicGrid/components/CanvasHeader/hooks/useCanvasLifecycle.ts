import { useEffect, useRef } from 'react'
import { CanvasRoot } from '../core/CanvasRoot'
import { CanvasAbsoluteContainer } from '../core/CanvasAbsoluteContainer'

interface UseCanvasLifecycleProps {
  width: number
  height: number
  canvasHeaderRef?: React.RefObject<HTMLCanvasElement>
}

export const useCanvasLifecycle = ({ width, height, canvasHeaderRef }: UseCanvasLifecycleProps) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = canvasHeaderRef || internalCanvasRef
  const rootRef = useRef<CanvasRoot | null>(null)

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

    let rafId: number
    const loop = () => {
      root.render()
      rafId = requestAnimationFrame(loop)
    }
    loop()

    console.log({root})
    return () => cancelAnimationFrame(rafId)
  }, [])

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


import { useCallback, useEffect, useRef, useState } from 'react'
import { CanvasRoot, CanvasAbsoluteContainer } from '../../../lib/canvas'

interface UseCanvasLifecycleProps {
  width: number
  height: number
  canvasHeaderRef?: React.RefObject<HTMLCanvasElement>
  isActive?: boolean
}

export const useCanvasLifecycle = ({
  width,
  height,
  canvasHeaderRef,
  isActive = true,
}: UseCanvasLifecycleProps) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = canvasHeaderRef ?? internalCanvasRef
  const rootRef = useRef<CanvasRoot | null>(null)
  const rafRef = useRef<number | null>(null)
  const [rootReady, setRootReady] = useState(false)
  const sizeRef = useRef({ width, height })

  sizeRef.current = { width, height }

  const syncCanvasSize = useCallback((canvas: HTMLCanvasElement, w: number, h: number) => {
    const dpr = window.devicePixelRatio || 1
    const nextWidth = w * dpr
    const nextHeight = h * dpr

    if (canvas.width !== nextWidth) {
      canvas.width = nextWidth
    }
    if (canvas.height !== nextHeight) {
      canvas.height = nextHeight
    }
  }, [])

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { width: currentWidth, height: currentHeight } = sizeRef.current
    syncCanvasSize(canvas, currentWidth, currentHeight)

    const root = new CanvasRoot(canvas, new CanvasAbsoluteContainer('root'))
    root.onCursorChange = (cursor) => {
      canvas.style.cursor = cursor
    }

    rootRef.current = root
    setRootReady(true)
    return () => {
      stopLoop()
      rootRef.current = null
      setRootReady(false)
    }
  }, [canvasRef, stopLoop, syncCanvasSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    syncCanvasSize(canvas, width, height)
  }, [canvasRef, height, syncCanvasSize, width])

  useEffect(() => {
    if (!rootReady || !rootRef.current) {
      stopLoop()
      return
    }
    stopLoop()
    if (!isActive) {
      return
    }
    renderLoop()
    return stopLoop
  }, [isActive, renderLoop, rootReady, stopLoop])

  return {
    canvasRef,
    rootRef,
  }
}


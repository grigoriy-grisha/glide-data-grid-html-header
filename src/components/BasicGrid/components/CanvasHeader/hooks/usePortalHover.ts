import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  subscribeToCanvasPortalHover, 
  subscribeToPortalHoverLock,
  type CanvasPortalHoverDetail,
  type CanvasPortalSource 
} from '../../../lib/canvas'

export interface PortalHoverState<T = unknown> {
  visible: boolean
  leaving: boolean
  x: number
  y: number
  width: number
  height: number
  nodeId: string | null
  data: T | null
}

export interface UsePortalHoverOptions<T = unknown> {
  source?: CanvasPortalSource
  filter: (detail: CanvasPortalHoverDetail) => T | null
  leaveAnimationDuration?: number
}

const DEFAULT_LEAVE_DURATION = 200

function createInitialState<T>(): PortalHoverState<T> {
  return {
    visible: false,
    leaving: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    nodeId: null,
    data: null,
  }
}

export function usePortalHover<T = unknown>(
  options: UsePortalHoverOptions<T>
): PortalHoverState<T> {
  const { source, filter, leaveAnimationDuration = DEFAULT_LEAVE_DURATION } = options
  
  const [state, setState] = useState<PortalHoverState<T>>(createInitialState)
  const leaveTimeoutRef = useRef<number | null>(null)
  const initialStateRef = useRef(createInitialState<T>())
  const lockedRef = useRef(false)

  const clearLeaveTimeout = useCallback(() => {
    if (leaveTimeoutRef.current !== null) {
      window.clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }, [])

  const hideImmediately = useCallback(() => {
    clearLeaveTimeout()
    setState(initialStateRef.current)
  }, [clearLeaveTimeout])
 
  useEffect(() => {
    const unsubscribeHover = subscribeToCanvasPortalHover((detail: CanvasPortalHoverDetail) => {
      if (source && detail.source !== source) return
      if (lockedRef.current) return

      if (!detail.visible) {
        setState((prev) => {
          if (!prev.visible || prev.leaving) return prev
          
          clearLeaveTimeout()
          
          leaveTimeoutRef.current = window.setTimeout(() => {
            setState(initialStateRef.current)
            leaveTimeoutRef.current = null
          }, leaveAnimationDuration)
          
          return { ...prev, leaving: true }
        })
        return
      }

      const data = filter(detail)
      if (data === null) return

      clearLeaveTimeout()

      setState({
        visible: true,
        leaving: false,
        x: detail.x,
        y: detail.y,
        width: detail.width,
        height: detail.height,
        nodeId: detail.nodeId ?? null,
        data,
      })
    })

    const unsubscribeLock = subscribeToPortalHoverLock((locked: boolean) => {
      lockedRef.current = locked
      if (locked) {
        hideImmediately()
      }
    })

    return () => {
      unsubscribeHover()
      unsubscribeLock()
      clearLeaveTimeout()
    }
  }, [source, filter, leaveAnimationDuration, clearLeaveTimeout, hideImmediately])

  return state
}


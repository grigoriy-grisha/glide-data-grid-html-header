import type { CanvasNode } from '../core/CanvasNode'

export const CANVAS_PORTAL_EVENT = 'basic-grid-canvas-portal-hover'

export type CanvasPortalSource = 'header' | 'cell'

export interface CanvasPortalHoverDetail {
  visible: boolean
  x: number
  y: number
  width: number
  height: number
  node?: CanvasNode | null
  nodeId?: string
  source?: CanvasPortalSource
  originId?: string
}

export function dispatchCanvasPortalHover(detail: CanvasPortalHoverDetail) {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(new CustomEvent<CanvasPortalHoverDetail>(CANVAS_PORTAL_EVENT, { detail }))
}

export type CanvasPortalHoverListener = (detail: CanvasPortalHoverDetail) => void

export function subscribeToCanvasPortalHover(listener: CanvasPortalHoverListener) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<CanvasPortalHoverDetail>
    if (!customEvent.detail) {
      return
    }
    listener(customEvent.detail)
  }

  window.addEventListener(CANVAS_PORTAL_EVENT, handler as EventListener)
  return () => {
    window.removeEventListener(CANVAS_PORTAL_EVENT, handler as EventListener)
  }
}

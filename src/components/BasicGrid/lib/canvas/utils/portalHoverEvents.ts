import type { CanvasNode } from '../core/CanvasNode'

export const CANVAS_PORTAL_EVENT = 'basic-grid-canvas-portal-hover'

const HIDE_DEBOUNCE_MS = 400

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

const hideTimeouts = new Map<string, number>()

function getSourceKey(source?: CanvasPortalSource, originId?: string): string {
  return `${source ?? 'default'}:${originId ?? 'default'}`
}

function dispatchEvent(detail: CanvasPortalHoverDetail): void {
  window.dispatchEvent(new CustomEvent<CanvasPortalHoverDetail>(CANVAS_PORTAL_EVENT, { detail }))
}

export function dispatchCanvasPortalHover(detail: CanvasPortalHoverDetail) {
  if (typeof window === 'undefined') {
    return
  }

  const key = getSourceKey(detail.source, detail.originId)

  // Cancel any pending hide for this source
  const existingTimeout = hideTimeouts.get(key)
  if (existingTimeout !== undefined) {
    window.clearTimeout(existingTimeout)
    hideTimeouts.delete(key)
  }

  // If showing, dispatch immediately
  if (detail.visible) {
    dispatchEvent(detail)
    return
  }

  // If hiding, debounce
  const timeoutId = window.setTimeout(() => {
    hideTimeouts.delete(key)
    dispatchEvent(detail)
  }, HIDE_DEBOUNCE_MS)

  hideTimeouts.set(key, timeoutId)
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

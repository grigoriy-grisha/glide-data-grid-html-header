import type { CanvasNode } from '../core/CanvasNode'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

export type CanvasPortalHoverListener = (detail: CanvasPortalHoverDetail) => void

export const CANVAS_PORTAL_EVENT = 'basic-grid-canvas-portal-hover'
const HIDE_DEBOUNCE_MS = 400

const hideTimeouts = new Map<string, number>()

function getSourceKey(source?: CanvasPortalSource, originId?: string): string {
  return `${source ?? 'default'}:${originId ?? 'default'}`
}

function dispatchEvent(detail: CanvasPortalHoverDetail): void {
  window.dispatchEvent(new CustomEvent<CanvasPortalHoverDetail>(CANVAS_PORTAL_EVENT, { detail }))
}

function cancelPendingHide(key: string): void {
  const existingTimeout = hideTimeouts.get(key)
  if (existingTimeout !== undefined) {
    window.clearTimeout(existingTimeout)
    hideTimeouts.delete(key)
  }
}

function scheduleHide(key: string, detail: CanvasPortalHoverDetail): void {
  const timeoutId = window.setTimeout(() => {
    hideTimeouts.delete(key)
    dispatchEvent(detail)
  }, HIDE_DEBOUNCE_MS)
  hideTimeouts.set(key, timeoutId)
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function dispatchCanvasPortalHover(detail: CanvasPortalHoverDetail): void {
  if (typeof window === 'undefined') return

  const key = getSourceKey(detail.source, detail.originId)
  cancelPendingHide(key)

  if (detail.visible) {
    dispatchEvent(detail)
  } else {
    scheduleHide(key, detail)
  }
}

export function subscribeToCanvasPortalHover(listener: CanvasPortalHoverListener): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<CanvasPortalHoverDetail>
    if (customEvent.detail) {
      listener(customEvent.detail)
    }
  }

  window.addEventListener(CANVAS_PORTAL_EVENT, handler as EventListener)
  
  return () => {
    window.removeEventListener(CANVAS_PORTAL_EVENT, handler as EventListener)
  }
}

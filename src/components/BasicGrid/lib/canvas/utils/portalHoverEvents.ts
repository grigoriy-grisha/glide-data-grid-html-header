import type { CanvasNode } from '../core/CanvasNode'

// ─────────────────────────────────────────────────────────────────────────────
// Interaction Lock (pauses portal hover during drag/resize)
// ─────────────────────────────────────────────────────────────────────────────

let interactionLockCount = 0
type InteractionLockListener = (locked: boolean) => void
const lockListeners = new Set<InteractionLockListener>()

export function lockPortalHover(): () => void {
  interactionLockCount++
  if (interactionLockCount === 1) {
    lockListeners.forEach((listener) => listener(true))
  }
  
  let released = false
  return () => {
    if (released) return
    released = true
    interactionLockCount--
    if (interactionLockCount === 0) {
      lockListeners.forEach((listener) => listener(false))
    }
  }
}

export function isPortalHoverLocked(): boolean {
  return interactionLockCount > 0
}

export function subscribeToPortalHoverLock(listener: InteractionLockListener): () => void {
  lockListeners.add(listener)
  return () => {
    lockListeners.delete(listener)
  }
}

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

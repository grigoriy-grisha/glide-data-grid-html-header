import React from 'react'
import { subscribeToCanvasPortalHover, type CanvasPortalSource, type CanvasPortalHoverDetail } from '../../../lib/canvas'

const PORTAL_ROOT_ID = 'basic-grid-canvas-portal-root'
const PORTAL_CLASS_NAME = 'canvas-header-portal-overlay'
const DEFAULT_SOURCE: CanvasPortalSource = 'header'
const HIDDEN_OPACITY = '0'
const VISIBLE_OPACITY = '1'

let portalElement: HTMLDivElement | null = null
let portalRefCount = 0

function ensurePortalElement(): HTMLDivElement | null {
  if (portalElement || typeof document === 'undefined') {
    return portalElement
  }

  portalElement = document.createElement('div')
  portalElement.id = PORTAL_ROOT_ID
  // portalElement.className = PORTAL_CLASS_NAME
  document.body.appendChild(portalElement)
  return portalElement
}

function hidePortalElement(element: HTMLDivElement): void {
  element.style.opacity = HIDDEN_OPACITY
}

function showPortalElement(element: HTMLDivElement, detail: CanvasPortalHoverDetail): void {
  element.style.opacity = VISIBLE_OPACITY
  element.style.left = `${detail.x}px`
  element.style.top = `${detail.y}px`
  element.style.width = `${Math.max(0, detail.width)}px`
  element.style.height = `${Math.max(0, detail.height)}px`
}

function shouldHidePortal(
  detail: CanvasPortalHoverDetail,
  activeSource: CanvasPortalSource | null,
  activeOrigin: string | null
): boolean {
  if (detail.visible) {
    return false
  }

  const source = detail.source ?? DEFAULT_SOURCE
  const matchesSource = activeSource === source
  const matchesOrigin = detail.originId === undefined || detail.originId === activeOrigin

  return matchesSource && matchesOrigin
}

function cleanupPortalElement(element: HTMLDivElement): void {
  portalRefCount = Math.max(0, portalRefCount - 1)

  if (portalRefCount === 0) {
    element.remove()
    portalElement = null
  } else {
    hidePortalElement(element)
  }
}

export const CanvasPortalOverlay: React.FC = React.memo(() => {
  const activeSourceRef = React.useRef<CanvasPortalSource | null>(null)
  const activeOriginRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    const element = ensurePortalElement()
    if (!element) {
      return
    }

    portalRefCount += 1

    const unsubscribe = subscribeToCanvasPortalHover((detail) => {
      console.debug('[PortalOverlay]', detail)
      const source = detail.source ?? DEFAULT_SOURCE

      if (shouldHidePortal(detail, activeSourceRef.current, activeOriginRef.current)) {
        hidePortalElement(element)
        activeSourceRef.current = null
        activeOriginRef.current = null
        return
      }

      if (!detail.visible) {
        return
      }

      activeSourceRef.current = source
      activeOriginRef.current = detail.originId ?? null
      showPortalElement(element, detail)
    })

    return () => {
      unsubscribe()
      
      if (portalElement === element) {
        cleanupPortalElement(element)
        activeSourceRef.current = null
        activeOriginRef.current = null
      }
    }
  }, [])

  return null
})

CanvasPortalOverlay.displayName = 'CanvasPortalOverlay'


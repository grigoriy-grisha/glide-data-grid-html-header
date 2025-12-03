import React from 'react'

import { subscribeToCanvasPortalHover, type CanvasPortalSource } from '../utils/portalHoverEvents'

const PORTAL_ROOT_ID = 'basic-grid-canvas-portal-root'

let portalElement: HTMLDivElement | null = null
let portalRefCount = 0

function ensurePortalElement(): HTMLDivElement | null {
  if (portalElement || typeof document === 'undefined') {
    return portalElement
  }

  portalElement = document.createElement('div')
  portalElement.id = PORTAL_ROOT_ID
  portalElement.className = 'canvas-header-portal-overlay'
  document.body.appendChild(portalElement)
  return portalElement
}

export const CanvasPortalOverlay: React.FC = () => {
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
      const source = detail.source ?? 'header'

      if (!detail.visible) {
        if (
          activeSourceRef.current === source &&
          (detail.originId === undefined || detail.originId === activeOriginRef.current)
        ) {
          element.style.opacity = '0'
          activeSourceRef.current = null
          activeOriginRef.current = null
        }
        return
      }

      activeSourceRef.current = source
      activeOriginRef.current = detail.originId ?? null
      element.style.opacity = '1'
      element.style.left = `${detail.x}px`
      element.style.top = `${detail.y}px`
      element.style.width = `${Math.max(0, detail.width)}px`
      element.style.height = `${Math.max(0, detail.height)}px`
    })

    return () => {
      unsubscribe()
      portalRefCount = Math.max(0, portalRefCount - 1)

      if (portalElement === element) {
        if (portalRefCount === 0) {
          element.remove()
          portalElement = null
        } else {
          element.style.opacity = '0'
          activeSourceRef.current = null
          activeOriginRef.current = null
        }
      }
    }
  }, [])

  return null
}


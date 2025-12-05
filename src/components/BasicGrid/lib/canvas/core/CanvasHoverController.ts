import type { CanvasEvent, CanvasNode, Rect } from './CanvasNode'
import type { CanvasPortalHoverDetail, CanvasPortalSource } from '../utils/portalHoverEvents'

export interface CanvasHoverControllerOptions {
  onCursorChange?: (cursor: string) => void
  onPortalTargetChange?: (target: CanvasNode | null, baseEvent: CanvasEvent | null) => void
  portalHoverDispatch?: (detail: CanvasPortalHoverDetail) => void
  portalSource?: CanvasPortalSource
}

export class CanvasHoverController {
  private hoveredNode: CanvasNode | null = null
  private activePortalNode: { id: string; rect: Rect } | null = null
  private currentCursor = 'default'
  private bounds: Rect | null = null

  constructor(private readonly options: CanvasHoverControllerOptions = {}) {}

  setAbsoluteBounds(bounds: Rect | null) {
    this.bounds = bounds ? { ...bounds } : null
  }

  handlePointerMove(hits: CanvasNode[], baseEvent: CanvasEvent | null) {
    this.transitionHover(hits[0], baseEvent)
    this.updateCursor(hits)
  }

  handlePointerLeave() {
    this.transitionHover(undefined, null)
    this.updateCursor([])
  }

  handlePortalReset() {
    if (this.activePortalNode) {
      this.dispatchPortalHover({
        visible: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        originId: this.activePortalNode.id,
        source: this.options.portalSource,
      })
    }
    this.activePortalNode = null
  }

  computeCursor(relativeX: number, relativeY: number, rootNode: CanvasNode): string {
    const hits = rootNode.hitTest(relativeX, relativeY)
    for (const node of hits) {
      const cursor = node.style?.cursor
      if (cursor) {
        return cursor
      }
    }
    return 'default'
  }

  getCurrentCursor(): string {
    return this.currentCursor
  }

  private transitionHover(target: CanvasNode | undefined, baseEvent: CanvasEvent | null) {
    if (this.hoveredNode === target) {
      this.updatePortalHover(target, baseEvent)
      return
    }

    if (this.hoveredNode) {
      this.hoveredNode.onMouseLeave(this.buildEvent('mouseleave', this.hoveredNode, baseEvent))
    }

    if (target) {
      target.onMouseEnter(this.buildEvent('mouseenter', target, baseEvent))
    }

    this.hoveredNode = target ?? null
    this.updatePortalHover(target, baseEvent)
  }

  private buildEvent(type: CanvasEvent['type'], node: CanvasNode, baseEvent: CanvasEvent | null): CanvasEvent {
    if (baseEvent) {
      return {
        ...baseEvent,
        type,
        target: node,
        currentTarget: node,
      }
    }

    return {
      type,
      x: 0,
      y: 0,
      originalEvent: {} as MouseEvent,
      stopPropagation: () => {},
      preventDefault: () => {},
      target: node,
      currentTarget: node,
    }
  }

  private updateCursor(hits: CanvasNode[]) {
    let newCursor = 'default'

    for (const node of hits) {
      const cursor = node.style?.cursor
      if (cursor) {
        newCursor = cursor
        break
      }
    }

    if (newCursor !== this.currentCursor) {
      this.currentCursor = newCursor
      this.options.onCursorChange?.(newCursor)
    }
  }

  private findPortalTarget(node: CanvasNode | undefined): CanvasNode | null {
    let current: CanvasNode | null | undefined = node
    while (current) {
      if (current.portalHoverEnabled) {
        return current
      }
      current = current.parent
    }
    return null
  }

  private updatePortalHover(target: CanvasNode | undefined, baseEvent: CanvasEvent | null = null) {
    const portalTarget = this.findPortalTarget(target)
    const rect = portalTarget ? { ...portalTarget.rect } : null
    const previousActive = this.activePortalNode
    const next = portalTarget && rect ? { id: portalTarget.id, rect } : null

    if (portalTarget && previousActive?.id === portalTarget.id) {
      this.options.onPortalTargetChange?.(portalTarget, baseEvent)
      return
    }

    this.activePortalNode = next
    this.options.onPortalTargetChange?.(portalTarget ?? null, baseEvent)

    if (!this.options.portalHoverDispatch) {
      return
    }

    if (portalTarget && rect && this.bounds) {
      this.dispatchPortalHover({
        visible: true,
        x: this.bounds.x + rect.x,
        y: this.bounds.y + rect.y,
        width: rect.width,
        height: rect.height,
        nodeId: portalTarget.id,
        originId: portalTarget.id,
        source: this.options.portalSource,
      })
    } else if (previousActive) {
      this.dispatchPortalHover({
        visible: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        originId: previousActive.id,
        source: this.options.portalSource,
      })
    }
  }

  private dispatchPortalHover(detail: CanvasPortalHoverDetail) {
    this.options.portalHoverDispatch?.(detail)
  }
}

import type { CanvasEvent, CanvasNode, Rect } from './CanvasNode'
import type { CanvasPortalHoverDetail, CanvasPortalSource } from '../utils/portalHoverEvents'

export interface CanvasHoverControllerOptions {
  onCursorChange?: (cursor: string) => void
  /**
   * Called when the active portal-enabled target changes. Consumers can use this
   * to perform custom positioning logic (header canvas).
   */
  onPortalTargetChange?: (target: CanvasNode | null, baseEvent: CanvasEvent | null) => void
  /**
   * Optional dispatcher used when the controller should emit portal overlay
   * events directly (cells rendered inside Glide data grid).
   */
  portalHoverDispatch?: (detail: CanvasPortalHoverDetail) => void
  portalSource?: CanvasPortalSource
}

export class CanvasHoverController {
  private hoveredNode: CanvasNode | null = null
  private activePortalNode: { id: string; rect: Rect } | null = null
  private currentCursor: string = 'default'
  private bounds: Rect | null = null

  constructor(private readonly options: CanvasHoverControllerOptions = {}) {}

  setAbsoluteBounds(bounds: Rect | null) {
    this.bounds = bounds ? { ...bounds } : null
  }

  handlePointerMove(hits: CanvasNode[], baseEvent: CanvasEvent | null) {
    this.handleHoverTransition(hits[0], baseEvent)
    this.updateCursor(hits)
  }

  handlePointerLeave() {
    this.handleHoverTransition(undefined, null)
    this.updateCursor([])
  }

  handlePortalReset() {
    if (this.activePortalNode && this.options.portalHoverDispatch) {
      this.options.portalHoverDispatch({
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

  private handleHoverTransition(target: CanvasNode | undefined, baseEvent: CanvasEvent | null) {
    if (this.hoveredNode === target) {
      this.updatePortalHover(target)
      return
    }

    const buildEvent = (type: CanvasEvent['type'], node: CanvasNode): CanvasEvent => {
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

    if (this.hoveredNode) {
      const leaveEvent = buildEvent('mouseleave', this.hoveredNode)
      this.hoveredNode.onMouseLeave(leaveEvent)
    }

    if (target) {
      const enterEvent = buildEvent('mouseenter', target)
      target.onMouseEnter(enterEvent)
    }

    this.hoveredNode = target ?? null
    this.updatePortalHover(target, baseEvent)
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

    if (portalTarget && this.activePortalNode?.id === portalTarget.id) {
      this.options.onPortalTargetChange?.(portalTarget, baseEvent)
      return
    }

    const previousActive = this.activePortalNode
    this.activePortalNode = portalTarget && rect ? { id: portalTarget.id, rect } : null

    this.options.onPortalTargetChange?.(portalTarget ?? null, baseEvent)

    if (!this.options.portalHoverDispatch) {
      return
    }

    if (portalTarget && rect && this.bounds) {
      this.options.portalHoverDispatch({
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
      this.options.portalHoverDispatch({
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
}


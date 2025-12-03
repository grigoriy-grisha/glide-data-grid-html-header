import { CanvasNode, type CanvasEvent, type Rect } from '../../components/CanvasHeader/core/CanvasNode'
import { CanvasContainer } from '../../components/CanvasHeader/core/CanvasContainer'
import { DrawBatcher } from '../../components/CanvasHeader/core/DrawBatcher'
import { dispatchCanvasPortalHover } from '../../components/CanvasHeader/utils/portalHoverEvents'

type PointerEventType = CanvasEvent['type']

export class CellCanvasRoot {
  rootNode: CanvasNode
  private bounds: Rect | null = null
  private hoveredNode: CanvasNode | null = null
  private currentCursor: string = 'default'
  private activePortalNode: { id: string; rect: Rect } | null = null

  /** Draw batcher for optimized rendering */
  private batcher: DrawBatcher = new DrawBatcher()

  /** Callback fired when cursor should change based on hovered element */
  onCursorChange?: (cursor: string) => void

  constructor(node: CanvasNode, _originId?: string) {
    this.rootNode = node
  }

  setRootNode(node: CanvasNode) {
    this.rootNode = node
  }

  setOriginId(_originId: string) {
    // no-op kept for API compatibility
  }

  render(
    ctx: CanvasRenderingContext2D,
    rect: Rect,
    hoverPos?: { x: number; y: number },
    absoluteBounds?: Rect
  ) {
    this.bounds = { ...(absoluteBounds ?? rect) }

    ctx.save()
    ctx.translate(rect.x, rect.y)

    this.prepareRootNode(ctx, rect)

    if (hoverPos) {
      this.dispatchPointerEvent('mousemove', hoverPos.x, hoverPos.y)
    } else {
      this.handleMouseLeave()
    }

    // Batched rendering: collect commands, then flush
    this.batcher.clear()
    this.rootNode.paint(this.batcher, ctx)
    this.batcher.flush(ctx)

    ctx.restore()
  }

  dispatchPointerEvent(type: PointerEventType, x: number, y: number, nativeEvent?: MouseEvent): boolean {
    if (!this.bounds) {
      return false
    }

    const localX = x
    const localY = y
    const hits = this.rootNode.hitTest(localX, localY)
    let stopped = false
    const canvasEvent: CanvasEvent = {
      type,
      x: localX,
      y: localY,
      originalEvent: nativeEvent ?? ({} as MouseEvent),
      target: hits[0],
      stopPropagation: () => {
        stopped = true
      },
      preventDefault: () => {
        nativeEvent?.preventDefault()
      },
    }

    if (type === 'mousemove') {
      this.handleHoverTransition(hits[0], hits.length > 0 ? canvasEvent : null)
    }

    if (hits.length === 0) {
      if (type === 'mousemove') {
        this.updateCursor([])
      }
      return false
    }

    for (const node of hits) {
      if (stopped) {
        break
      }
      const nodeEvent = { ...canvasEvent, currentTarget: node }
      switch (type) {
        case 'click':
          node.onClick(nodeEvent)
          break
        case 'mousedown':
          node.onMouseDown(nodeEvent)
          break
        case 'mouseup':
          node.onMouseUp(nodeEvent)
          break
        case 'dblclick':
          node.onDoubleClick(nodeEvent)
          break
        case 'mousemove':
          node.onMouseMove(nodeEvent)
          break
        case 'mouseenter':
          node.onMouseEnter(nodeEvent)
          break
        case 'mouseleave':
          node.onMouseLeave(nodeEvent)
          break
      }
    }

    if (type === 'mousemove') {
      this.updateCursor(hits)
    }

    return stopped
  }

  handleMouseLeave() {
    this.handleHoverTransition(undefined, null)
    this.updateCursor([])
  }

  private prepareRootNode(ctx: CanvasRenderingContext2D, rect: Rect) {
    this.rootNode.rect.x = 0
    this.rootNode.rect.y = 0
    this.rootNode.rect.width = rect.width
    this.rootNode.rect.height = rect.height

    if (this.rootNode instanceof CanvasContainer) {
      this.rootNode.performLayout(ctx)
    } else {
      this.rootNode.measure(ctx)
    }
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
    this.updatePortalHover(target)
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
      this.onCursorChange?.(newCursor)
    }
  }

  getCurrentCursor(): string {
    return this.currentCursor
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

  private updatePortalHover(target: CanvasNode | undefined) {
    const portalTarget = this.findPortalTarget(target)
    const portalTargetId = portalTarget?.id ?? null
    const rect = portalTarget ? { ...portalTarget.rect } : null

    if (portalTargetId && this.activePortalNode?.id === portalTargetId) {
      return
    }

    const previousActive = this.activePortalNode
    this.activePortalNode = portalTargetId && rect ? { id: portalTargetId, rect } : null

    if (portalTarget && rect && this.bounds) {
      dispatchCanvasPortalHover({
        visible: true,
        x: this.bounds.x + rect.x,
        y: this.bounds.y + rect.y,
        width: rect.width,
        height: rect.height,
        nodeId: portalTarget.id,
        originId: portalTarget.id,
        source: 'cell',
      })
    } else if (previousActive && previousActive.id) {
      dispatchCanvasPortalHover({
        visible: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        originId: previousActive.id,
        source: 'cell',
      })
    }
  }

  computeCursor(relativeX: number, relativeY: number): string {
    const hits = this.rootNode.hitTest(relativeX, relativeY)

    for (const node of hits) {
      const cursor = node.style?.cursor
      if (cursor) {
        return cursor
      }
    }

    return 'default'
  }

  forcePortalHide() {
    if (!this.activePortalNode) {
      return
    }
    dispatchCanvasPortalHover({
      visible: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      originId: this.activePortalNode.id,
      source: 'cell',
    })
    this.activePortalNode = null
  }
}

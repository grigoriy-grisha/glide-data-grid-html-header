import { CanvasNode, type CanvasEvent, type Rect } from '../../components/CanvasHeader/core/CanvasNode'
import { CanvasContainer } from '../../components/CanvasHeader/core/CanvasContainer'
import { DrawBatcher } from '../../components/CanvasHeader/core/DrawBatcher'
import { dispatchCanvasPortalHover } from '../../components/CanvasHeader/utils/portalHoverEvents'
import { CanvasHoverController } from '../../components/CanvasHeader/core/CanvasHoverController'

type PointerEventType = CanvasEvent['type']

export class CellCanvasRoot {
  rootNode: CanvasNode
  private bounds: Rect | null = null
  private hoverController: CanvasHoverController

  /** Draw batcher for optimized rendering */
  private batcher: DrawBatcher = new DrawBatcher()

  /** Callback fired when cursor should change based on hovered element */
  onCursorChange?: (cursor: string) => void

  constructor(node: CanvasNode, _originId?: string) {
    this.rootNode = node
    this.hoverController = new CanvasHoverController({
      onCursorChange: (cursor) => this.onCursorChange?.(cursor),
      portalHoverDispatch: dispatchCanvasPortalHover,
      portalSource: 'cell',
    })
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
    this.hoverController.setAbsoluteBounds(this.bounds)

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

    if (hits.length === 0) {
      if (type === 'mousemove') {
        this.hoverController.handlePointerMove([], null)
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
      this.hoverController.handlePointerMove(hits, canvasEvent)
    }

    return stopped
  }

  handleMouseLeave() {
    this.hoverController.handlePointerLeave()
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

  computeCursor(relativeX: number, relativeY: number): string {
    return this.hoverController.computeCursor(relativeX, relativeY, this.rootNode)
  }

  getCurrentCursor(): string {
    return this.hoverController.getCurrentCursor()
  }

  forcePortalHide() {
    this.hoverController.handlePortalReset()
  }
}

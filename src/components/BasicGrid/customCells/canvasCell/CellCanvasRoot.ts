import { CanvasNode, type CanvasEvent, type Rect } from '../../components/CanvasHeader/core/CanvasNode'
import { CanvasContainer } from '../../components/CanvasHeader/core/CanvasContainer'
import { DrawBatcher } from '../../components/CanvasHeader/core/DrawBatcher'
import { dispatchCanvasPortalHover } from '../../components/CanvasHeader/utils/portalHoverEvents'
import { CanvasHoverController } from '../../components/CanvasHeader/core/CanvasHoverController'

const PORTAL_SOURCE = 'cell' as const

type PointerEventType = CanvasEvent['type']

export class CellCanvasRoot {
  rootNode: CanvasNode
  private bounds: Rect | null = null
  private hoverController: CanvasHoverController
  private batcher: DrawBatcher = new DrawBatcher()
  onCursorChange?: (cursor: string) => void

  constructor(node: CanvasNode, _originId?: string) {
    this.rootNode = node
    this.hoverController = new CanvasHoverController({
      onCursorChange: (cursor) => this.onCursorChange?.(cursor),
      portalHoverDispatch: dispatchCanvasPortalHover,
      portalSource: PORTAL_SOURCE,
    })
  }

  setRootNode(node: CanvasNode): void {
    this.rootNode = node
  }

  setOriginId(_originId: string): void {
  }

  render(
    ctx: CanvasRenderingContext2D,
    rect: Rect,
    hoverPos?: { x: number; y: number },
    absoluteBounds?: Rect
  ): void {
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

    this.batcher.clear()
    this.rootNode.paint(this.batcher, ctx)
    this.batcher.flush(ctx)

    ctx.restore()
  }

  dispatchPointerEvent(type: PointerEventType, x: number, y: number, nativeEvent?: MouseEvent): boolean {
    if (!this.bounds) {
      return false
    }

    const hits = this.rootNode.hitTest(x, y)
    let stopped = false
    
    const canvasEvent: CanvasEvent = {
      type,
      x,
      y,
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

    this.dispatchEventToNodes(hits, canvasEvent, type)

    if (type === 'mousemove') {
      this.hoverController.handlePointerMove(hits, canvasEvent)
    }

    return stopped
  }

  private dispatchEventToNodes(hits: CanvasNode[], canvasEvent: CanvasEvent, type: PointerEventType): void {
    let stopped = false
    const stopPropagation = () => { stopped = true }
    const eventWithStop = { ...canvasEvent, stopPropagation }

    for (const node of hits) {
      if (stopped) {
        break
      }
      const nodeEvent = { ...eventWithStop, currentTarget: node }
      this.invokeNodeHandler(node, type, nodeEvent)
    }
  }

  private invokeNodeHandler(node: CanvasNode, type: PointerEventType, event: CanvasEvent): void {
    switch (type) {
      case 'click':
        node.onClick(event)
        break
      case 'mousedown':
        node.onMouseDown(event)
        break
      case 'mouseup':
        node.onMouseUp(event)
        break
      case 'dblclick':
        node.onDoubleClick(event)
        break
      case 'mousemove':
        node.onMouseMove(event)
        break
      case 'mouseenter':
        node.onMouseEnter(event)
        break
      case 'mouseleave':
        node.onMouseLeave(event)
        break
    }
  }

  handleMouseLeave(): void {
    this.hoverController.handlePointerLeave()
  }

  private prepareRootNode(ctx: CanvasRenderingContext2D, rect: Rect): void {
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

  forcePortalHide(): void {
    this.hoverController.handlePortalReset()
  }
}

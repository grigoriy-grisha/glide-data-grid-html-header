import { CanvasNode, type CanvasEvent, type Rect } from '../../components/CanvasHeader/core/CanvasNode'
import { CanvasContainer } from '../../components/CanvasHeader/core/CanvasContainer'

type PointerEventType = CanvasEvent['type']

export class CellCanvasRoot {
  private rootNode: CanvasNode
  private bounds: Rect | null = null
  private hoveredNode: CanvasNode | null = null

  constructor(node: CanvasNode) {
    this.rootNode = node
  }

  setRootNode(node: CanvasNode) {
    this.rootNode = node
  }

  render(ctx: CanvasRenderingContext2D, rect: Rect, hoverPos?: { x: number; y: number }) {
    this.bounds = { ...rect }

    ctx.save()
    ctx.translate(rect.x, rect.y)

    this.prepareRootNode(ctx, rect)

    if (hoverPos) {
      this.dispatchPointerEvent('mousemove', hoverPos.x, hoverPos.y)
    } else {
      this.handleMouseLeave()
    }

    this.rootNode.paint(ctx)

    ctx.restore()
  }

  dispatchPointerEvent(type: PointerEventType, x: number, y: number, nativeEvent?: MouseEvent): boolean {
    if (!this.bounds) {
      return false
    }

    const localX = x
    const localY = y
    const hits = this.rootNode.hitTest(localX, localY)
    if (hits.length === 0) {
      if (type === 'mousemove') {
        this.handleHoverTransition(undefined)
      }
      return false
    }

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

    for (const node of hits) {
      if (stopped) {
        break
      }
      switch (type) {
        case 'click':
          node.onClick(canvasEvent)
          break
        case 'mousedown':
          node.onMouseDown(canvasEvent)
          break
        case 'mouseup':
          node.onMouseUp(canvasEvent)
          break
        case 'dblclick':
          node.onDoubleClick(canvasEvent)
          break
        case 'mousemove':
          node.onMouseMove(canvasEvent)
          break
        case 'mouseenter':
          node.onMouseEnter(canvasEvent)
          break
        case 'mouseleave':
          node.onMouseLeave(canvasEvent)
          break
      }
    }

    if (type === 'mousemove') {
      this.handleHoverTransition(hits[0])
    }

    return true
  }

  handleMouseLeave() {
    this.handleHoverTransition(undefined)
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

  private handleHoverTransition(target: CanvasNode | undefined) {
    if (this.hoveredNode === target) {
      return
    }

    if (this.hoveredNode) {
      const leaveEvent = {
        type: 'mouseleave' as const,
        x: 0,
        y: 0,
        originalEvent: {} as MouseEvent,
        stopPropagation: () => {},
        preventDefault: () => {},
        target: this.hoveredNode,
      }
      this.hoveredNode.onMouseLeave(leaveEvent)
    }

    if (target) {
      const enterEvent = {
        type: 'mouseenter' as const,
        x: 0,
        y: 0,
        originalEvent: {} as MouseEvent,
        stopPropagation: () => {},
        preventDefault: () => {},
        target,
      }
      target.onMouseEnter(enterEvent)
    }

    this.hoveredNode = target ?? null
  }
}


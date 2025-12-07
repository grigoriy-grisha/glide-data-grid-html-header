import { CanvasNode, CanvasEvent } from './CanvasNode'
import { CanvasContainer } from './CanvasContainer'
import { DrawBatcher } from './DrawBatcher'
import { CanvasHoverController } from './CanvasHoverController'

export class CanvasRoot {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    rootNode: CanvasNode
    private hoverController: CanvasHoverController
    private eventHandlers: Map<string, (event: MouseEvent) => void> = new Map()

    private batcher: DrawBatcher = new DrawBatcher()
    onCursorChange?: (cursor: string) => void
    onPortalHoverTargetChange?: (node: CanvasNode | null, event: CanvasEvent | null) => void

    constructor(canvas: HTMLCanvasElement, rootNode: CanvasNode) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d', {alpha: false})!
        this.rootNode = rootNode

        this.hoverController = new CanvasHoverController({
            onCursorChange: (cursor) => this.onCursorChange?.(cursor),
            onPortalTargetChange: (node, event) => this.onPortalHoverTargetChange?.(node, event),
        })

        this.setupEvents()
    }

    private setupEvents() {
        const types = ['click', 'mousedown', 'mouseup', 'mousemove', 'dblclick'] as const
        types.forEach(type => {
            const handler = (event: MouseEvent) => this.dispatchPointerEvent(event, type)
            this.eventHandlers.set(type, handler)
            this.canvas.addEventListener(type, handler as EventListener)
        })
    }

    destroy() {
        this.eventHandlers.forEach((handler, type) => {
            this.canvas.removeEventListener(type, handler as EventListener)
        })
        this.eventHandlers.clear()
    }

    private dispatchPointerEvent(e: MouseEvent, type: CanvasEvent['type']) {
        const { x, y } = this.getEventCoords(e)
        const hits = this.rootNode.hitTest(x, y)
        const target = hits[0]

        let stopped = false
        const canvasEvent: CanvasEvent = {
            type,
            x,
            y,
            originalEvent: e,
            target,
            stopPropagation: () => { stopped = true },
            preventDefault: () => e.preventDefault()
        }

        this.bubbleEvent(hits, canvasEvent, type, () => stopped)
        if (type === 'mousemove') {
            this.dispatchMouseMove(hits, canvasEvent, () => stopped)
            this.hoverController.handlePointerMove(hits, canvasEvent)
        }
    }

    private getEventCoords(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    private bubbleEvent(
        hits: CanvasNode[],
        event: CanvasEvent,
        type: CanvasEvent['type'],
        isStopped: () => boolean,
    ) {
        if (hits.length === 0) {
            return
        }

        this.dispatchToNodes(
            hits,
            event,
            (node, nodeEvent) => this.invokePointerHandler(node, type, nodeEvent),
            isStopped,
        )
    }

    private dispatchMouseMove(
        hits: CanvasNode[],
        event: CanvasEvent,
        isStopped: () => boolean,
    ) {
        this.dispatchToNodes(hits, event, (node, nodeEvent) => node.onMouseMove(nodeEvent), isStopped)
    }

    private dispatchToNodes(
        hits: CanvasNode[],
        event: CanvasEvent,
        handler: (node: CanvasNode, nodeEvent: CanvasEvent) => void,
        isStopped: () => boolean,
    ) {
        for (const node of hits) {
            if (isStopped()) {
                break
            }
            handler(node, { ...event, currentTarget: node })
        }
    }

    private invokePointerHandler(node: CanvasNode, type: CanvasEvent['type'], event: CanvasEvent) {
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
        }
    }

    render() {
        const dpr = window.devicePixelRatio || 1
        const rect = this.canvas.getBoundingClientRect()

        this.clearCanvas()
        this.applyResolutionScale(dpr)
        this.updateRootRect(rect)
        this.layoutRoot()

        this.batcher.clear()
        this.rootNode.paint(this.batcher, this.ctx)
        this.batcher.flush(this.ctx)
    }

    private clearCanvas() {
        this.ctx.fillStyle = '#ffffff'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    private applyResolutionScale(dpr: number) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0)
        this.ctx.scale(dpr, dpr)
    }

    private updateRootRect(rect: DOMRect) {
        this.rootNode.rect.width = rect.width
        this.rootNode.rect.height = rect.height
        this.rootNode.rect.x = 0
        this.rootNode.rect.y = 0
    }

    private layoutRoot() {
        if (this.rootNode instanceof CanvasContainer) {
            this.rootNode.performLayout(this.ctx)
        } else {
            this.rootNode.measure(this.ctx)
        }
    }
}

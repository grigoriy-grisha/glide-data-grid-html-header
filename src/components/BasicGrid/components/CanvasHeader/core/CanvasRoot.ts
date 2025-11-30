import { CanvasNode, CanvasEvent } from './CanvasNode';
import { CanvasContainer } from './CanvasContainer';

export class CanvasRoot {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    rootNode: CanvasNode; // Changed from CanvasContainer to CanvasNode to support generic roots
    hoveredNode: CanvasNode | null = null;

    constructor(canvas: HTMLCanvasElement, rootNode: CanvasNode) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.rootNode = rootNode;

        this.setupEvents();
    }

    private setupEvents() {
        const types: CanvasEvent['type'][] = ['click', 'mousedown', 'mouseup', 'mousemove', 'dblclick'];
        types.forEach(type => {
            this.canvas.addEventListener(type, (event) => this.dispatchPointerEvent(event, type));
        });
    }

    private dispatchPointerEvent(e: MouseEvent, type: CanvasEvent['type']) {
        if (type === "click") {
            console.log({e})
        }
        const { x, y } = this.getEventCoords(e);
        const hits = this.rootNode.hitTest(x, y);
        const target = hits[0];

        let stopped = false;
        const canvasEvent: CanvasEvent = {
            type,
            x,
            y,
            originalEvent: e,
            target,
            stopPropagation: () => { stopped = true; },
            preventDefault: () => e.preventDefault()
        };

        this.bubbleEvent(hits, canvasEvent, type, () => stopped);
        if (type === 'mousemove') {
            this.handleHoverTransition(target, canvasEvent);
            this.dispatchMouseMove(hits, canvasEvent, () => stopped);
        }
    }

    private getEventCoords(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    private bubbleEvent(
        hits: CanvasNode[],
        event: CanvasEvent,
        type: CanvasEvent['type'],
        isStopped: () => boolean,
    ) {
        if (hits.length === 0) {
            return;
        }

        for (const node of hits) {
            if (isStopped()) {
                break;
            }

            switch (type) {
                case 'click':
                    node.onClick(event);
                    break;
                case 'mousedown':
                    node.onMouseDown(event);
                    break;
                case 'mouseup':
                    node.onMouseUp(event);
                    break;
                case 'dblclick':
                    node.onDoubleClick(event);
                    break;
            }
        }
    }

    private dispatchMouseMove(
        hits: CanvasNode[],
        event: CanvasEvent,
        isStopped: () => boolean,
    ) {
        for (const node of hits) {
            if (isStopped()) {
                break;
            }
            node.onMouseMove(event);
        }
    }

    private handleHoverTransition(target: CanvasNode | undefined, baseEvent: CanvasEvent) {
        if (this.hoveredNode === target) {
            return;
        }

        if (this.hoveredNode) {
            const leaveEvent = { ...baseEvent, type: 'mouseleave' as const };
            this.hoveredNode.onMouseLeave(leaveEvent);
        }

        if (target) {
            const enterEvent = { ...baseEvent, type: 'mouseenter' as const };
            target.onMouseEnter(enterEvent);
        }

        this.hoveredNode = target ?? null;
    }

    render() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.clearCanvas();
        this.applyResolutionScale(dpr);
        this.updateRootRect(rect);
        this.layoutRoot();
        this.rootNode.paint(this.ctx);
    }

    private clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private applyResolutionScale(dpr: number) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }

    private updateRootRect(rect: DOMRect) {
        this.rootNode.rect.width = rect.width;
        this.rootNode.rect.height = rect.height;
        this.rootNode.rect.x = 0;
        this.rootNode.rect.y = 0;
    }

    private layoutRoot() {
        if (this.rootNode instanceof CanvasContainer) {
            this.rootNode.performLayout(this.ctx);
        } else {
            this.rootNode.measure(this.ctx);
        }
    }
}

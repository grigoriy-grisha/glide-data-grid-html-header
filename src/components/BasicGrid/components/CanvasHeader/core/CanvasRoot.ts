import { CanvasNode, CanvasEvent } from './CanvasNode';
import { CanvasContainer } from './CanvasContainer';
import { DrawBatcher } from './DrawBatcher';

export class CanvasRoot {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    rootNode: CanvasNode;
    hoveredNode: CanvasNode | null = null;
    private currentCursor: string = 'default';

    /** Draw batcher for optimized rendering */
    private batcher: DrawBatcher = new DrawBatcher();

    /** Callback fired when cursor should change based on hovered element */
    onCursorChange?: (cursor: string) => void;

    constructor(canvas: HTMLCanvasElement, rootNode: CanvasNode) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', {alpha: false})!;
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
            this.updateCursor(hits);
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

            // Set currentTarget to the node handling the event
            const nodeEvent: CanvasEvent = { ...event, currentTarget: node };

            switch (type) {
                case 'click':
                    node.onClick.bind(node)(nodeEvent);
                    break;
                case 'mousedown':
                    node.onMouseDown.bind(node)(nodeEvent);
                    break;
                case 'mouseup':
                    node.onMouseUp.bind(node)(nodeEvent);
                    break;
                case 'dblclick':
                    node.onDoubleClick.bind(node)(nodeEvent);
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
            // Set currentTarget to the node handling the event
            const nodeEvent: CanvasEvent = { ...event, currentTarget: node };
            node.onMouseMove.bind(node)(nodeEvent);
        }
    }

    private handleHoverTransition(target: CanvasNode | undefined, baseEvent: CanvasEvent) {
        if (this.hoveredNode === target) {
            return;
        }

        if (this.hoveredNode) {
            const leaveEvent: CanvasEvent = { 
                ...baseEvent, 
                type: 'mouseleave' as const,
                target: this.hoveredNode,
                currentTarget: this.hoveredNode
            };
            this.hoveredNode.onMouseLeave.bind(this.hoveredNode)(leaveEvent);
        }

        if (target) {
            const enterEvent: CanvasEvent = { 
                ...baseEvent, 
                type: 'mouseenter' as const,
                target: target,
                currentTarget: target
            };
            target.onMouseEnter.bind(target)(enterEvent);
        }

        this.hoveredNode = target ?? null;
    }

    private updateCursor(hits: CanvasNode[]) {
        // Find first element with a cursor set (traverse from deepest to root)
        let newCursor = 'default';
        for (const node of hits) {
            const cursor = node.style?.cursor;
            if (cursor) {
                newCursor = cursor;
                break;
            }
        }

        if (newCursor !== this.currentCursor) {
            this.currentCursor = newCursor;
            this.onCursorChange?.(newCursor);
        }
    }

    render() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.clearCanvas();
        this.applyResolutionScale(dpr);
        this.updateRootRect(rect);
        this.layoutRoot();

        // Batched rendering: collect commands, then flush
        this.batcher.clear();
        this.rootNode.paint(this.batcher, this.ctx);
        this.batcher.flush(this.ctx);
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

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
        const getEventCoords = (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            // dpr is not needed for logical coords if rects are in logical coords
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const dispatchEvent = (e: MouseEvent, type: CanvasEvent['type']) => {
            const { x, y } = getEventCoords(e);

            // Get all hits (leaf -> root)
            const hits = this.rootNode.hitTest(x, y);
            const target = hits.length > 0 ? hits[0] : undefined;

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

            // Bubbling phase: target -> parent -> root
            if (hits.length > 0) {
                for (const node of hits) {
                    if (stopped) break;
                    switch (type) {
                        case 'click': node.onClick(canvasEvent); break;
                        case 'mousedown': node.onMouseDown(canvasEvent); break;
                        case 'mouseup': node.onMouseUp(canvasEvent); break;
                        case 'dblclick': node.onDoubleClick(canvasEvent); break;
                    }
                }
            }

            // Special handling for hover (mousemove)
            if (type === 'mousemove') {
                if (this.hoveredNode !== target) {
                     if (this.hoveredNode) {
                         const leaveEvent = { ...canvasEvent, type: 'mouseleave' as const };
                         this.hoveredNode.onMouseLeave(leaveEvent);
                     }
                     
                     if (target) {
                         const enterEvent = { ...canvasEvent, type: 'mouseenter' as const };
                         target.onMouseEnter(enterEvent);
                     }
                     
                     this.hoveredNode = target || null;
                }

                // Dispatch mousemove
                 for (const node of hits) {
                    if (stopped) break;
                    node.onMouseMove(canvasEvent);
                }
            }
        };

        this.canvas.addEventListener('click', (e) => dispatchEvent(e, 'click'));
        this.canvas.addEventListener('mousedown', (e) => dispatchEvent(e, 'mousedown'));
        this.canvas.addEventListener('mouseup', (e) => dispatchEvent(e, 'mouseup'));
        this.canvas.addEventListener('mousemove', (e) => dispatchEvent(e, 'mousemove'));
        this.canvas.addEventListener('dblclick', (e) => dispatchEvent(e, 'dblclick'));
    }

    render() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        // Clear
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Setup scaling
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);

        // Update root size
        this.rootNode.rect.width = rect.width;
        this.rootNode.rect.height = rect.height;
        this.rootNode.rect.x = 0;
        this.rootNode.rect.y = 0;

        // Layout & Paint
        if (this.rootNode instanceof CanvasContainer) {
            this.rootNode.performLayout(this.ctx);
        } else {
             this.rootNode.measure(this.ctx);
        }
        
        this.rootNode.paint(this.ctx);
    }
}

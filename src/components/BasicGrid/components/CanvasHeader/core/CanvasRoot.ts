import { CanvasNode, CanvasEvent } from './CanvasNode';
import { CanvasContainer } from './CanvasContainer';

export class CanvasRoot {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    rootNode: CanvasContainer;

    private hoveredNode: CanvasNode | null = null;

    constructor(canvas: HTMLCanvasElement, rootNode: CanvasContainer) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error("Could not get 2d context");
        this.ctx = ctx;
        this.rootNode = rootNode;

        this.setupEvents();
    }

    render() {
        // 1. Update root rect
        const dpr = window.devicePixelRatio || 1;
        this.rootNode.rect = {
            x: 0,
            y: 0,
            width: this.canvas.width / dpr,
            height: this.canvas.height / dpr
        };

        // 2. Layout
        this.rootNode.performLayout(this.ctx);

        // 3. Paint
        this.ctx.save();
        this.ctx.scale(dpr, dpr);
        this.ctx.clearRect(0, 0, this.rootNode.rect.width, this.rootNode.rect.height);
        this.rootNode.paint(this.ctx);
        this.ctx.restore();
    }

    private setupEvents() {
        const getEventCoords = (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const getPath = (node: CanvasNode | null): CanvasNode[] => {
            const path: CanvasNode[] = [];
            let curr = node;
            while (curr) {
                path.unshift(curr);
                curr = curr.parent;
            }
            return path;
        };

        const dispatchEvent = (e: MouseEvent, type: CanvasEvent['type']) => {
            const { x, y } = getEventCoords(e);
            const target = this.rootNode.hitTest(x, y);

            let stopped = false;
            const canvasEvent: CanvasEvent = {
                type,
                x,
                y,
                originalEvent: e,
                target: target || undefined,
                stopPropagation: () => { stopped = true; },
                preventDefault: () => e.preventDefault(),
            };

            if (target && type !== 'mousemove') { // Mousemove handled separately for hover
                let node: CanvasNode | null = target;
                while (node && !stopped) {
                    switch (type) {
                        case 'click': node.onClick(canvasEvent); break;
                        case 'mousedown': node.onMouseDown(canvasEvent); break;
                        case 'mouseup': node.onMouseUp(canvasEvent); break;
                        case 'dblclick': node.onDoubleClick(canvasEvent); break;
                    }
                    node = node.parent;
                }
            }

            // Handle hover (mouseenter/mouseleave)
            if (type === 'mousemove') {
                if (this.hoveredNode !== target) {
                    const oldPath = getPath(this.hoveredNode);
                    const newPath = getPath(target);

                    // Find common ancestor index
                    let commonAncestorIndex = 0;
                    while (
                        commonAncestorIndex < oldPath.length &&
                        commonAncestorIndex < newPath.length &&
                        oldPath[commonAncestorIndex] === newPath[commonAncestorIndex]
                    ) {
                        commonAncestorIndex++;
                    }

                    // Fire mouseleave on old path (reverse order, from leaf to ancestor)
                    for (let i = oldPath.length - 1; i >= commonAncestorIndex; i--) {
                        oldPath[i].onMouseLeave({ ...canvasEvent, type: 'mouseleave', target: oldPath[i] });
                    }

                    // Fire mouseenter on new path (from ancestor to leaf)
                    for (let i = commonAncestorIndex; i < newPath.length; i++) {
                        newPath[i].onMouseEnter({ ...canvasEvent, type: 'mouseenter', target: newPath[i] });
                    }

                    this.hoveredNode = target || null;
                }

                // Also dispatch mousemove
                if (target) {
                    let node: CanvasNode | null = target;
                    while (node && !stopped) {
                        node.onMouseMove(canvasEvent);
                        node = node.parent;
                    }
                }
            }
        };

        this.canvas.addEventListener('click', e => dispatchEvent(e, 'click'));
        this.canvas.addEventListener('mousedown', e => dispatchEvent(e, 'mousedown'));
        this.canvas.addEventListener('mouseup', e => dispatchEvent(e, 'mouseup'));
        this.canvas.addEventListener('mousemove', e => dispatchEvent(e, 'mousemove'));
        this.canvas.addEventListener('dblclick', e => dispatchEvent(e, 'dblclick'));
        this.canvas.addEventListener('mouseleave', e => {
            if (this.hoveredNode) {
                const { x, y } = getEventCoords(e);
                const path = getPath(this.hoveredNode);
                // Fire mouseleave on all
                for (let i = path.length - 1; i >= 0; i--) {
                    path[i].onMouseLeave({
                        type: 'mouseleave',
                        x, y,
                        originalEvent: e,
                        target: path[i],
                        stopPropagation: () => { },
                        preventDefault: () => { }
                    });
                }
                this.hoveredNode = null;
            }
        });
    }
}

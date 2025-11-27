import { FlexStyle } from '../../../miniflex/types';

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CanvasEvent {
    type: 'click' | 'mousedown' | 'mouseup' | 'mousemove' | 'mouseenter' | 'mouseleave' | 'dblclick';
    x: number;
    y: number;
    originalEvent: MouseEvent | React.MouseEvent;
    target?: CanvasNode;
    stopPropagation: () => void;
    preventDefault: () => void;
}

export abstract class CanvasNode {
    id: string;
    parent: CanvasNode | null = null;
    children: CanvasNode[] = [];
    rect: Rect = { x: 0, y: 0, width: 0, height: 0 };

    // Style for flex layout
    style: Partial<FlexStyle> = {
        flexGrow: 0,
        flexShrink: 1,
        flexBasis: 0,
        alignSelf: 'auto',
    };

    backgroundColor: string = 'transparent';

    constructor(id: string) {
        this.id = id;
    }

    addChild(child: CanvasNode) {
        child.parent = this;
        this.children.push(child);
    }

    removeChild(child: CanvasNode) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    // Calculate size requirements and update rect size
    abstract measure(ctx: CanvasRenderingContext2D): void;

    // Draw the component
    abstract paint(ctx: CanvasRenderingContext2D): void;

    // Hit test
    hitTest(x: number, y: number): CanvasNode | null {
        if (x >= this.rect.x && x <= this.rect.x + this.rect.width &&
            y >= this.rect.y && y <= this.rect.y + this.rect.height) {
            // Check children in reverse order (top to bottom)
            for (let i = this.children.length - 1; i >= 0; i--) {
                const hit = this.children[i].hitTest(x, y);
                if (hit) return hit;
            }
            return this;
        }
        return null;
    }

    // Event handlers
    onClick(event: CanvasEvent) { }
    onMouseDown(event: CanvasEvent) { }
    onMouseUp(event: CanvasEvent) { }
    onMouseEnter(event: CanvasEvent) { }
    onMouseLeave(event: CanvasEvent) { }
    onMouseMove(event: CanvasEvent) { }
    onDoubleClick(event: CanvasEvent) { }
}

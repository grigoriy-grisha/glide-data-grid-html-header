import {FlexStyle} from '../../../miniflex/types';

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
    debugColor = 'magenta';
    id: string;
    parent: CanvasNode | null = null;
    children: CanvasNode[] = [];
    rect: Rect = {x: 0, y: 0, width: 0, height: 0};

    // Style for flex layout
    style: Partial<FlexStyle> = {
        flexGrow: 0,
        flexShrink: 1,
        flexBasis: 0,
        alignSelf: 'auto',
    };

    static DEBUG = false;
    backgroundColor: string = 'transparent';
    borderColor: string = 'transparent';
    borderWidth: number = 0;

    constructor(id: string) {
        this.id = id;
    }

    addChild(child: CanvasNode) {
        child.parent = this;
        this.children.push(child);
    }

    addChildStart(child: CanvasNode) {
        child.parent = this;
        this.children.unshift(child);
    }

    removeChild(child: CanvasNode) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    abstract measure(ctx: CanvasRenderingContext2D): void;

    paint(ctx: CanvasRenderingContext2D) {
        this.onPaint(ctx);
        if (CanvasNode.DEBUG) {
            ctx.save();
            ctx.strokeStyle = this.debugColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
            ctx.restore();
        }
    }

    abstract onPaint(ctx: CanvasRenderingContext2D): void;

    hitTest(x: number, y: number): CanvasNode[] {
        const hits: CanvasNode[] = [];

        if (x >= this.rect.x && x <= this.rect.x + this.rect.width &&
            y >= this.rect.y && y <= this.rect.y + this.rect.height) {

            for (let i = this.children.length - 1; i >= 0; i--) {
                const childHits = this.children[i].hitTest(x, y);
                if (childHits.length > 0) {
                    hits.push(...childHits);
                }
            }

            hits.push(this);
        }

        return hits;
    }

    requestLayout() {
        if (this.parent) {
            this.parent.requestLayout();
        }
    }

    requestPaint() {
        if (this.parent) {
            this.parent.requestPaint();
        }
    }


    // Event handlers
    onClick(event: CanvasEvent) {
    }

    onMouseDown(event: CanvasEvent) {
    }

    onMouseUp(event: CanvasEvent) {
    }

    onMouseEnter(event: CanvasEvent) {
    }

    onMouseLeave(event: CanvasEvent) {
    }

    onMouseMove(event: CanvasEvent) {
    }

    onDoubleClick(event: CanvasEvent) {
    }
}

import {FlexStyle} from '../../../miniflex/types';

export type DimensionValue = number | '100%';

export type CanvasFlexStyle = Omit<Partial<FlexStyle>, 'width' | 'height'> & {
    width?: DimensionValue;
    height?: DimensionValue;
};

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

    // Cached intrinsic size from last measure
    protected _intrinsicWidth = 0;
    protected _intrinsicHeight = 0;

    // Dirty flags for layout optimization
    protected _layoutDirty = true;
    protected _measureDirty = true;

    // Style for flex layout
    private _style: CanvasFlexStyle = {
        flexGrow: 0,
        flexShrink: 1,
        flexBasis: 0,
        alignSelf: 'auto',
    };

    get style(): CanvasFlexStyle {
        return this._style;
    }

    set style(value: CanvasFlexStyle) {
        this._style = value;
        this.markLayoutDirty();
    }

    static DEBUG = false;
    backgroundColor: string = 'transparent';
    borderColor: string = 'transparent';
    borderWidth: number = 0;

    constructor(id: string) {
        this.id = id;
    }

    // Dirty flag management
    markLayoutDirty() {
        if (!this._layoutDirty) {
            this._layoutDirty = true;
            this.parent?.markLayoutDirty();
        }
    }

    markMeasureDirty() {
        if (!this._measureDirty) {
            this._measureDirty = true;
            this.markLayoutDirty();
        }
    }

    isLayoutDirty(): boolean {
        return this._layoutDirty;
    }

    isMeasureDirty(): boolean {
        return this._measureDirty;
    }

    protected clearLayoutDirty() {
        this._layoutDirty = false;
    }

    protected clearMeasureDirty() {
        this._measureDirty = false;
    }

    addChild(child: CanvasNode) {
        child.parent = this;
        this.children.push(child);
        this.markLayoutDirty();
    }

    addChildStart(child: CanvasNode) {
        child.parent = this;
        this.children.unshift(child);
        this.markLayoutDirty();
    }

    removeChild(child: CanvasNode) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            this.markLayoutDirty();
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
    onClick(_event: CanvasEvent) {
    }

    onMouseDown(_event: CanvasEvent) {
    }

    onMouseUp(_event: CanvasEvent) {
    }

    onMouseEnter(_event: CanvasEvent) {
    }

    onMouseLeave(_event: CanvasEvent) {
    }

    onMouseMove(_event: CanvasEvent) {
    }

    onDoubleClick(_event: CanvasEvent) {
    }
}

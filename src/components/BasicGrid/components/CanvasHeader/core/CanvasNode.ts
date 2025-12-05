import {FlexStyle} from '../../../miniflex/types';
import { DrawBatcher } from './DrawBatcher';

export type DimensionValue = number | '100%';

export type CanvasFlexStyle = Omit<Partial<FlexStyle>, 'width' | 'height'> & {
    width?: DimensionValue;
    height?: DimensionValue;
    cursor?: string;
    marginRight?: number;
};

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CanvasEvent<T extends CanvasNode = CanvasNode> {
    type: 'click' | 'mousedown' | 'mouseup' | 'mousemove' | 'mouseenter' | 'mouseleave' | 'dblclick';
    x: number;
    y: number;
    originalEvent: MouseEvent | React.MouseEvent;
    target?: CanvasNode;
    currentTarget?: T;
    stopPropagation: () => void;
    preventDefault: () => void;
}

export abstract class CanvasNode {
    debugColor = 'magenta';
    id: string;
    parent: CanvasNode | null = null;
    children: CanvasNode[] = [];
    rect: Rect = {x: 0, y: 0, width: 0, height: 0};
    zIndex: number = 0;

    protected _intrinsicWidth = 0;
    protected _intrinsicHeight = 0;

    protected _layoutDirty = true;
    protected _measureDirty = true;

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

    portalHoverEnabled = false;

    constructor(id: string) {
        this.id = id;
    }

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
        this.attachChild(child, (list, node) => list.push(node));
    }

    addChildStart(child: CanvasNode) {
        this.attachChild(child, (list, node) => list.unshift(node));
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

    paint(batcher: DrawBatcher, ctx: CanvasRenderingContext2D): void {
        const prevZ = batcher.getZIndex();
        batcher.setZIndex(prevZ + this.zIndex);

        this.onPaint(batcher, ctx);

        if (CanvasNode.DEBUG) {
            batcher.strokeRect(
                this.rect.x,
                this.rect.y,
                this.rect.width,
                this.rect.height,
                this.debugColor,
                1
            );
        }
        
        batcher.setZIndex(prevZ);
    }

    abstract onPaint(batcher: DrawBatcher, ctx: CanvasRenderingContext2D): void;

    hitTest(x: number, y: number): CanvasNode[] {
        const hits: CanvasNode[] = [];

        if (this.containsPoint(x, y)) {
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
    onClick(_event: CanvasEvent<any>) {
    }

    onMouseDown(_event: CanvasEvent<any>) {
    }

    onMouseUp(_event: CanvasEvent<any>) {
    }

    onMouseEnter(_event: CanvasEvent<any>) {
    }

    onMouseLeave(_event: CanvasEvent<any>) {
    }

    onMouseMove(_event: CanvasEvent<any>) {
    }

    onDoubleClick(_event: CanvasEvent<any>) {
    }

    private attachChild(child: CanvasNode, insert: (list: CanvasNode[], node: CanvasNode) => void) {
        child.parent = this;
        insert(this.children, child);
        this.markLayoutDirty();
    }

    private containsPoint(x: number, y: number): boolean {
        return (
            x >= this.rect.x &&
            x <= this.rect.x + this.rect.width &&
            y >= this.rect.y &&
            y <= this.rect.y + this.rect.height
        );
    }
}

import { CanvasContainer } from './CanvasContainer';
import { DrawBatcher } from './DrawBatcher';

interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

const EMPTY_BOUNDS: Bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
};

const expandBoundsWithChild = (bounds: Bounds, child: CanvasContainer['children'][number]): Bounds => ({
    minX: Math.min(bounds.minX, child.rect.x),
    minY: Math.min(bounds.minY, child.rect.y),
    maxX: Math.max(bounds.maxX, child.rect.x + child.rect.width),
    maxY: Math.max(bounds.maxY, child.rect.y + child.rect.height),
});

const isEmptyBounds = (bounds: Bounds) =>
    bounds.minX === Infinity || bounds.maxX === -Infinity;

export class CanvasAbsoluteContainer extends CanvasContainer {
    performLayout(ctx: CanvasRenderingContext2D) {
        const bounds = this.layoutChildren(ctx);
        if (!bounds) {
            this.clearLayoutDirty();
            return;
        }

        this.expandToFitBounds(bounds);
        this.clearLayoutDirty();
    }

    private layoutChildren(ctx: CanvasRenderingContext2D): Bounds | null {
        let bounds = { ...EMPTY_BOUNDS };

        this.children.forEach(child => {
            if (child instanceof CanvasContainer) {
                child.performLayout(ctx);
            } else {
                child.measure(ctx);
            }

            bounds = expandBoundsWithChild(bounds, child);
        });

        return isEmptyBounds(bounds) ? null : bounds;
    }

    private expandToFitBounds(bounds: Bounds) {
        const requiredWidth = bounds.maxX - this.rect.x;
        const requiredHeight = bounds.maxY - this.rect.y;

        if (requiredWidth > this.rect.width) {
            this.rect.width = requiredWidth;
        }

        if (requiredHeight > this.rect.height) {
            this.rect.height = requiredHeight;
        }
    }

    onPaint(batcher: DrawBatcher, ctx: CanvasRenderingContext2D) {
        // Draw background
        if (this.backgroundColor && this.backgroundColor !== 'transparent') {
            batcher.fillRect(
                this.rect.x,
                this.rect.y,
                this.rect.width,
                this.rect.height,
                this.backgroundColor
            );
        }

        // Draw border
        if (this.borderWidth > 0 && this.borderColor && this.borderColor !== 'transparent') {
            batcher.strokeRect(
                this.rect.x + this.borderWidth / 2,
                this.rect.y + this.borderWidth / 2,
                this.rect.width - this.borderWidth,
                this.rect.height - this.borderWidth,
                this.borderColor,
                this.borderWidth
            );
        }

        // Paint children
        super.onPaint(batcher, ctx);
    }
}

import { CanvasLeaf } from '../core/CanvasLeaf';
import { DrawBatcher } from '../core/DrawBatcher';

const TRANSPARENT = "transparent";

export class CanvasRect extends CanvasLeaf {
    color: string = TRANSPARENT;
    borderColor: string = TRANSPARENT;
    borderWidth: number = 0;

    constructor(id: string, color: string = TRANSPARENT) {
        super(id);
        this.color = color;
    }

    measure(_ctx: CanvasRenderingContext2D) {
        // Rect has no intrinsic size; layout drives dimensions.
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
        if (this.color !== TRANSPARENT) {
            batcher.fillRect(
                this.rect.x,
                this.rect.y,
                this.rect.width,
                this.rect.height,
                this.color
            );
        }

        if (this.borderWidth > 0 && this.borderColor !== TRANSPARENT) {
            batcher.strokeRect(
                this.rect.x + this.borderWidth / 2,
                this.rect.y + this.borderWidth / 2,
                this.rect.width - this.borderWidth,
                this.rect.height - this.borderWidth,
                this.borderColor,
                this.borderWidth
            );
        }
    }
}

import { CanvasLeaf } from '../core/CanvasLeaf';
import { DrawBatcher } from '../core/DrawBatcher';

const TRANSPARENT = "transparent";
const DEFAULT_BORDER_WIDTH = 0;

export class CanvasRect extends CanvasLeaf {
    color: string = TRANSPARENT;
    borderColor: string = TRANSPARENT;
    borderWidth: number = DEFAULT_BORDER_WIDTH;

    constructor(id: string, color: string = TRANSPARENT) {
        super(id);
        this.color = color;
    }

    measure(_ctx: CanvasRenderingContext2D) {
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect;

        if (this.color !== TRANSPARENT) {
            batcher.fillRect(x, y, width, height, this.color);
        }

        if (this.borderWidth > 0 && this.borderColor !== TRANSPARENT) {
            const halfBorder = this.borderWidth / 2;
            batcher.strokeRect(
                x + halfBorder,
                y + halfBorder,
                width - this.borderWidth,
                height - this.borderWidth,
                this.borderColor,
                this.borderWidth
            );
        }
    }
}

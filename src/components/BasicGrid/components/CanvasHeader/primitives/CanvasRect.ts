import { CanvasLeaf } from '../core/CanvasLeaf';

export class CanvasRect extends CanvasLeaf {
    color: string = "transparent";
    borderColor: string = "transparent";
    borderWidth: number = 0;

    constructor(id: string, color: string = "transparent") {
        super(id);
        this.color = color;
    }

    measure(ctx: CanvasRenderingContext2D) {
        // Rect doesn't have intrinsic size
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        if (this.color !== "transparent") {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
        }

        if (this.borderWidth > 0 && this.borderColor !== "transparent") {
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = this.borderWidth;
            // Draw border inside? or center?
            // Standard is center usually, but let's do inside for easier layout
            ctx.strokeRect(
                this.rect.x + this.borderWidth / 2,
                this.rect.y + this.borderWidth / 2,
                this.rect.width - this.borderWidth,
                this.rect.height - this.borderWidth
            );
        }
    }
}

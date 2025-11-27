import { CanvasLeaf } from '../core/CanvasLeaf';

export class CanvasText extends CanvasLeaf {
    text: string;
    font: string = "14px sans-serif";
    color: string = "black";

    constructor(id: string, text: string) {
        super(id);
        this.text = text;
    }

    measure(ctx: CanvasRenderingContext2D) {
        ctx.font = this.font;
        const metrics = ctx.measureText(this.text);
        this.rect.width = metrics.width;
        // Simple height estimation, can be improved
        const fontSizeMatch = this.font.match(/(\d+)px/);
        this.rect.height = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 14;
    }

    paint(ctx: CanvasRenderingContext2D) {
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textBaseline = "middle"; // Important for consistent positioning
        ctx.fillText(this.text, this.rect.x, this.rect.y + this.rect.height / 2);
    }
}

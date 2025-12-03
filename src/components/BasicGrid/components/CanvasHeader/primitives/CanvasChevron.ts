import { CanvasLeaf } from "../core/CanvasLeaf";
import { DrawBatcher } from "../core/DrawBatcher";

export class CanvasChevron extends CanvasLeaf {
    rotation: number = 0; // 0 to 1
    color: string = "black";

    constructor(id: string, options: { rotation?: number, color?: string } = {}) {
        super(id);
        this.rotation = options.rotation ?? 0;
        this.color = options.color ?? "black";
        // Fixed size for chevron
        this.rect.width = 16;
        this.rect.height = 16;
    }

    measure(_ctx: CanvasRenderingContext2D) {
        // Fixed size, no measurement needed
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
         const { x, y, width, height } = this.rect;
         const cx = x + width / 2;
         const cy = y + height / 2;
         const color = this.color;
         const rotation = this.rotation * Math.PI / 2;

         batcher.custom(ctx => {
             ctx.save();
             ctx.translate(cx, cy);
             ctx.rotate(rotation);
             ctx.strokeStyle = color;
             ctx.lineWidth = 1.8;
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             
             ctx.beginPath();
             ctx.moveTo(-3.5, -4.25);
             ctx.lineTo(2.75, 0);
             ctx.lineTo(-3.5, 4.25);
             ctx.stroke();
             
             ctx.restore();
         });
    }
}


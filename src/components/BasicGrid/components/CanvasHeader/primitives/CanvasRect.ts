import { CanvasLeaf } from '../core/CanvasLeaf';

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

    onPaint(ctx: CanvasRenderingContext2D) {
        if (hasVisibleFill(this.color)) {
            drawFill(ctx, this.rect.x, this.rect.y, this.rect.width, this.rect.height, this.color);
        }

        if (hasVisibleBorder(this.borderWidth, this.borderColor)) {
            drawBorder(
                ctx,
                this.rect.x,
                this.rect.y,
                this.rect.width,
                this.rect.height,
                this.borderWidth,
                this.borderColor,
            );
        }
    }
}

const hasVisibleFill = (color: string) => color !== TRANSPARENT;

const hasVisibleBorder = (width: number, color: string) =>
    width > 0 && color !== TRANSPARENT;

const drawFill = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
};

const drawBorder = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    borderWidth: number,
    color: string,
) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(
        x + borderWidth / 2,
        y + borderWidth / 2,
        width - borderWidth,
        height - borderWidth,
    );
};

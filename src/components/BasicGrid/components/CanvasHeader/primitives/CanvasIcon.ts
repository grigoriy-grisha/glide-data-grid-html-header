import { ButtonIcon, drawIcon } from '../../../customCells/canvasCell/buttons';
import { CanvasLeaf } from "../core/CanvasLeaf.ts";

const TRANSPARENT = 'transparent';

export class CanvasIcon extends CanvasLeaf {
    icon: ButtonIcon;
    size: number;
    color?: string;

    constructor(id: string, icon: ButtonIcon, options?: { size?: number, color?: string }) {
        super(id);
        this.icon = icon;
        this.size = options?.size ?? 16;
        this.color = options?.color;
    }

    measure(_ctx: CanvasRenderingContext2D) {
        this.rect.width = this.size;
        this.rect.height = this.size;
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        drawBackgroundIfNeeded(ctx, this.backgroundColor, this.rect.x, this.rect.y, this.rect.width, this.rect.height);
        drawIcon(ctx, this.icon, this.rect.x, this.rect.y, this.size, this.color);
    }
}

const drawBackgroundIfNeeded = (
    ctx: CanvasRenderingContext2D,
    color: string,
    x: number,
    y: number,
    width: number,
    height: number,
) => {
    if (!color || color === TRANSPARENT) {
        return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
};


import {ButtonIcon, drawIcon} from '../../../customCells/canvasCell/buttons';
import {CanvasNode} from "../core/CanvasNode.ts";
import {CanvasLeaf} from "../core/CanvasLeaf.ts";

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

    paint(ctx: CanvasRenderingContext2D) {
        // Draw background if set
        if (this.backgroundColor && this.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
        }

        drawIcon(ctx, this.icon, this.rect.x, this.rect.y, this.size, this.color);
    }
}

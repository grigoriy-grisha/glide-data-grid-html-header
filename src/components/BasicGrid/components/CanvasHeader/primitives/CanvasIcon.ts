import { drawIcon, preloadIconSprites } from '../../../customCells/canvasCell/buttons';
import type { ButtonIcon } from '../../../customCells/canvasCell/iconSprites';
import { CanvasLeaf } from "../core/CanvasLeaf";
import { DrawBatcher } from "../core/DrawBatcher";

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
        if (this.icon) {
            void (preloadIconSprites(this.icon, { size: this.size, color: this.color }).catch(
                () => undefined,
            ));
        }
    }

    measure(_ctx: CanvasRenderingContext2D) {
        this.rect.width = this.size;
        this.rect.height = this.size;
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect;
        
        // Background
        if (this.backgroundColor && this.backgroundColor !== TRANSPARENT) {
            batcher.fillRect(x, y, width, height, this.backgroundColor);
        }
        
        // Icon
        drawIcon(batcher, this.icon, x, y, this.size, this.color);
    }
}

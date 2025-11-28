import { ButtonIcon, drawIconButton, BUTTON_PADDING_Y, ICON_SIZE_ADJUSTMENT } from '../../../customCells/canvasCell/buttons';
import { CanvasNode } from "../core/CanvasNode.ts";
import { CanvasLeaf } from "../core/CanvasLeaf.ts";

export class CanvasIconButton extends CanvasLeaf {
    icon: ButtonIcon;
    size: number | 'auto';
    variant: 'primary' | 'secondary' | 'danger';
    disabled: boolean;
    isHovered: boolean = false;

    constructor(id: string, icon: ButtonIcon, options?: {
        size?: number | 'auto',
        variant?: 'primary' | 'secondary' | 'danger',
        disabled?: boolean,
        onClick?: () => void
    }) {
        super(id);
        this.icon = icon;
        this.size = options?.size ?? 'auto';
        this.variant = options?.variant ?? 'primary';
        this.disabled = options?.disabled ?? false;
        if (options?.onClick) {
            this.onClick = () => options.onClick!();
        }
    }

    measure(ctx: CanvasRenderingContext2D) {
        // Base height/size
        const height = typeof this.size === 'number' ? this.size : 28;
        this.rect.height = height;

        if (this.size === 'auto') {
            const paddingX = 0;
            const paddingY = BUTTON_PADDING_Y;
            // Match logic in drawIconButton
            const iconSize = Math.min(height - paddingY * 2 - ICON_SIZE_ADJUSTMENT, 20);
            this.rect.width = iconSize + paddingX * 2;
        } else {
            this.rect.width = this.size;
        }
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        drawIconButton(
            ctx,
            this.rect.x,
            this.rect.y,
            this.size,
            this.rect.height,
            this.icon,
            {
                accentColor: '#1e88e5',
                accentLight: 'rgba(30, 136, 229, 0.16)',
                bgCell: '#ffffff',
                borderColor: '#e0e0e0',
                textLight: '#9e9e9e'
            },
            this.variant,
            this.disabled,
            this.isHovered
        );
    }

    onMouseEnter() {
        this.isHovered = true;
    }

    onMouseLeave() {
        this.isHovered = false;
    }

    hitTest(x: number, y: number): CanvasNode[] {
        const paddingX = 0;
        const paddingY = BUTTON_PADDING_Y;
        const iconSize = Math.min(this.rect.height - paddingY * 2 - ICON_SIZE_ADJUSTMENT, 20);

        let actualSize: number;
        if (this.size === 'auto') {
            actualSize = iconSize + paddingX * 2;
        } else {
            actualSize = this.size;
        }

        const buttonX = this.rect.x + paddingX;
        const buttonY = this.rect.y + paddingY;
        const buttonWidth = actualSize - paddingX * 2;
        const buttonHeight = this.rect.height - paddingY * 2;

        if (x >= buttonX && x <= buttonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            return [this];
        }

        return [];
    }
}

import {ButtonIcon, drawIconButton} from '../../../customCells/canvasCell/buttons';
import {CanvasNode} from "../core/CanvasNode.ts";

export class CanvasIconButton extends CanvasNode {
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
        // Base size for icon button
        const baseSize = typeof this.size === 'number' ? this.size : 28;
        this.rect.width = baseSize;
        this.rect.height = baseSize;
    }

    paint(ctx: CanvasRenderingContext2D) {
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
}

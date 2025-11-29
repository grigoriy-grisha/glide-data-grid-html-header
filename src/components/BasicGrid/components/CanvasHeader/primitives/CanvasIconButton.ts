import { drawIconButton, BUTTON_PADDING_Y, ICON_SIZE_ADJUSTMENT } from '../../../customCells/canvasCell/buttons';
import type { ButtonIcon } from '../../../customCells/canvasCell/iconSprites';
import { CanvasNode } from "../core/CanvasNode.ts";
import { CanvasLeaf } from "../core/CanvasLeaf.ts";

const DEFAULT_HEIGHT = 28;

const BUTTON_THEME = {
    accentColor: '#1e88e5',
    accentLight: 'rgba(30, 136, 229, 0.16)',
    bgCell: '#ffffff',
    borderColor: '#e0e0e0',
    textLight: '#9e9e9e',
};

interface ButtonMetrics {
    height: number;
    width: number;
    paddingX: number;
    paddingY: number;
    iconSize: number;
}

export class CanvasIconButton extends CanvasLeaf {
    icon: ButtonIcon;
    size: number | 'auto';
    variant: 'primary' | 'secondary' | 'danger';
    disabled: boolean;
    isHovered: boolean = false;

    constructor(
        id: string,
        icon: ButtonIcon,
        options?: {
            size?: number | 'auto',
            variant?: 'primary' | 'secondary' | 'danger',
            disabled?: boolean,
            onClick?: () => void
        },
    ) {
        super(id);
        this.icon = icon;
        this.size = options?.size ?? 'auto';
        this.variant = options?.variant ?? 'primary';
        this.disabled = options?.disabled ?? false;
        if (options?.onClick) {
            this.onClick = () => options.onClick!();
        }
    }

    measure(_ctx: CanvasRenderingContext2D) {
        const metrics = resolveButtonMetrics(this.size);
        this.rect.height = metrics.height;
        this.rect.width = metrics.width;
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        drawIconButton(
            ctx,
            this.rect.x,
            this.rect.y,
            this.rect.width,
            this.rect.height,
            this.icon,
            BUTTON_THEME,
            this.variant,
            this.disabled,
            this.isHovered,
        );
    }

    onMouseEnter() {
        this.isHovered = true;
    }

    onMouseLeave() {
        this.isHovered = false;
    }

    hitTest(x: number, y: number): CanvasNode[] {
        const metrics = resolveButtonMetrics(this.size, this.rect.height);
        const bounds = getInteractiveBounds(this.rect.x, this.rect.y, metrics);

        if (
            x >= bounds.x &&
            x <= bounds.x + bounds.width &&
            y >= bounds.y &&
            y <= bounds.y + bounds.height
        ) {
            return [this];
        }

        return [];
    }
}

const resolveButtonMetrics = (size: number | 'auto', currentHeight?: number): ButtonMetrics => {
    const height = typeof size === 'number' ? size : currentHeight ?? DEFAULT_HEIGHT;
    const paddingX = 0;
    const paddingY = BUTTON_PADDING_Y;
    const iconSize = Math.min(height - paddingY * 2 - ICON_SIZE_ADJUSTMENT, 20);
    const width = typeof size === 'number' ? size : iconSize + paddingX * 2;

    return { height, width, paddingX, paddingY, iconSize };
};

const getInteractiveBounds = (
    x: number,
    y: number,
    metrics: ButtonMetrics,
) => {
    const buttonX = x + metrics.paddingX;
    const buttonY = y + metrics.paddingY;
    const buttonWidth = metrics.width - metrics.paddingX * 2;
    const buttonHeight = metrics.height - metrics.paddingY * 2;

    return { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
};

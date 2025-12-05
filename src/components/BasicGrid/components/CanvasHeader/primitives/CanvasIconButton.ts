import { drawIconButton, BUTTON_PADDING_Y, ICON_SIZE_ADJUSTMENT } from '../../../customCells/canvasCell/buttons';
import type { ButtonIcon } from '../../../customCells/canvasCell/iconSprites';
import { CanvasNode, CanvasEvent, CanvasFlexStyle } from "../core/CanvasNode";
import { CanvasLeaf } from "../core/CanvasLeaf";
import { DrawBatcher } from "../core/DrawBatcher";

const DEFAULT_HEIGHT = 28;
const DEFAULT_VARIANT = 'primary' as const;
const DEFAULT_CURSOR = 'pointer';
const MAX_ICON_SIZE = 20;

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

export interface CanvasIconButtonOptions {
    size?: number | 'auto';
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    onClick?: (event: CanvasEvent) => void;
}

export class CanvasIconButton extends CanvasLeaf {
    icon: ButtonIcon;
    size: number | 'auto';
    variant: 'primary' | 'secondary' | 'danger';
    disabled: boolean;
    isHovered: boolean = false;

    constructor(id: string, icon: ButtonIcon, options?: CanvasIconButtonOptions) {
        super(id);
        this.icon = icon;
        this.size = options?.size ?? 'auto';
        this.variant = options?.variant ?? DEFAULT_VARIANT;
        this.disabled = options?.disabled ?? false;
        super.style = { ...super.style, cursor: DEFAULT_CURSOR };
        if (options?.onClick) {
            this.onClick = (event) => options.onClick!(event);
        }
    }

    override set style(value: CanvasFlexStyle) {
        super.style = { ...super.style, cursor: DEFAULT_CURSOR, ...value };
    }

    override get style(): CanvasFlexStyle {
        const baseStyle = super.style;
        if (!baseStyle.cursor) {
            baseStyle.cursor = DEFAULT_CURSOR;
        }
        return baseStyle;
    }

    measure(_ctx: CanvasRenderingContext2D) {
        const metrics = resolveButtonMetrics(this.size);
        this.rect.height = metrics.height;
        this.rect.width = metrics.width;
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect;
        drawIconButton(
            batcher,
            x,
            y,
            width,
            height,
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

        if (isPointInBounds(x, y, bounds)) {
            return [this];
        }

        return [];
    }
}

function resolveButtonMetrics(size: number | 'auto', currentHeight?: number): ButtonMetrics {
    const height = typeof size === 'number' ? size : currentHeight ?? DEFAULT_HEIGHT;
    const paddingX = 0;
    const paddingY = BUTTON_PADDING_Y;
    const iconSize = Math.min(height - paddingY * 2 - ICON_SIZE_ADJUSTMENT, MAX_ICON_SIZE);
    const width = typeof size === 'number' ? size : iconSize + paddingX * 2;

    return { height, width, paddingX, paddingY, iconSize };
}

function getInteractiveBounds(x: number, y: number, metrics: ButtonMetrics) {
    return {
        x: x + metrics.paddingX,
        y: y + metrics.paddingY,
        width: metrics.width - metrics.paddingX * 2,
        height: metrics.height - metrics.paddingY * 2,
    };
}

function isPointInBounds(x: number, y: number, bounds: { x: number; y: number; width: number; height: number }): boolean {
    return (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
    );
}

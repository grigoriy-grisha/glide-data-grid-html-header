import { drawButton } from '../../../customCells/canvasCell/buttons';
import { CanvasLeaf } from "../core/CanvasLeaf";
import { CanvasEvent, CanvasFlexStyle } from "../core/CanvasNode";
import { DrawBatcher } from "../core/DrawBatcher";

const BUTTON_FONT = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const BUTTON_HEIGHT = 24;
const BUTTON_PADDING = 32;
const DEFAULT_VARIANT = 'primary' as const;
const DEFAULT_CURSOR = 'pointer';

const BUTTON_THEME = {
    accentColor: '#1e88e5',
    accentLight: 'rgba(30, 136, 229, 0.16)',
    accentFg: '#ffffff',
    bgCell: '#ffffff',
    borderColor: '#e0e0e0',
    textLight: '#9e9e9e',
    baseFontFull: BUTTON_FONT
};

const textWidthCache = new Map<string, number>();

export interface CanvasButtonOptions {
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    onClick?: (event: CanvasEvent) => void;
}

export class CanvasButton extends CanvasLeaf {
    text: string;
    variant: 'primary' | 'secondary' | 'danger' = DEFAULT_VARIANT;
    disabled = false;
    isHovered = false;

    constructor(id: string, text: string, options?: CanvasButtonOptions) {
        super(id);
        this.text = text;
        super.style = { ...super.style, cursor: DEFAULT_CURSOR };
        if (options) {
            if (options.variant !== undefined) this.variant = options.variant;
            if (options.disabled !== undefined) this.disabled = options.disabled;
            if (options.onClick) this.onClick = options.onClick;
        }
    }

    set style(value: CanvasFlexStyle) {
        super.style = { ...super.style, cursor: DEFAULT_CURSOR, ...value };
    }

    get style(): CanvasFlexStyle {
        const baseStyle = super.style;
        if (!baseStyle.cursor) {
            baseStyle.cursor = DEFAULT_CURSOR;
        }
        return baseStyle;
    }

    measure(ctx: CanvasRenderingContext2D) {
        const textWidth = getCachedTextWidth(ctx, this.text);
        this.rect.width = textWidth + BUTTON_PADDING;
        this.rect.height = BUTTON_HEIGHT;
    }

    onPaint(batcher: DrawBatcher, ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect;
        drawButton(
            batcher,
            x,
            y,
            width,
            height,
            this.text,
            BUTTON_THEME,
            this.variant,
            this.disabled,
            this.isHovered,
            undefined,
            undefined,
            ctx
        );
    }

    onMouseEnter() {
        this.isHovered = true;
    }

    onMouseLeave() {
        this.isHovered = false;
    }
}

function getCachedTextWidth(ctx: CanvasRenderingContext2D, text: string): number {
    let width = textWidthCache.get(text);
    if (width === undefined) {
        ctx.font = BUTTON_FONT;
        width = ctx.measureText(text).width;
        textWidthCache.set(text, width);
    }
    return width;
}

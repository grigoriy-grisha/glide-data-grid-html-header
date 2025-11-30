import {drawButton} from '../../../customCells/canvasCell/buttons';
import {CanvasLeaf} from "../core/CanvasLeaf.ts";
import {CanvasEvent} from "../core/CanvasNode.ts";

// Cached constants
const BUTTON_FONT = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const BUTTON_HEIGHT = 24;
const BUTTON_PADDING = 32; // paddingX * 2 + 8

// Shared theme object to avoid allocation on each paint
const BUTTON_THEME = {
    accentColor: '#1e88e5',
    accentLight: 'rgba(30, 136, 229, 0.16)',
    accentFg: '#ffffff',
    bgCell: '#ffffff',
    borderColor: '#e0e0e0',
    textLight: '#9e9e9e',
    baseFontFull: BUTTON_FONT
};

// Global text width cache shared across all button instances
const textWidthCache = new Map<string, number>();

export class CanvasButton extends CanvasLeaf {
    text: string;
    variant: 'primary' | 'secondary' | 'danger' = 'primary';
    disabled = false;
    isHovered = false;

    constructor(id: string, text: string, options?: {
        variant?: 'primary' | 'secondary' | 'danger';
        disabled?: boolean;
        onClick?: (event: CanvasEvent) => void;
    }) {
        super(id);
        this.text = text;
        if (options) {
            if (options.variant !== undefined) this.variant = options.variant;
            if (options.disabled !== undefined) this.disabled = options.disabled;
            if (options.onClick) this.onClick = options.onClick;
        }
    }

    measure(ctx: CanvasRenderingContext2D) {
        const text = this.text;
        let width = textWidthCache.get(text);
        
        if (width === undefined) {
            ctx.font = BUTTON_FONT;
            width = ctx.measureText(text).width;
            textWidthCache.set(text, width);
        }

        this.rect.width = width + BUTTON_PADDING;
        this.rect.height = BUTTON_HEIGHT;
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        const rect = this.rect;
        drawButton(
            ctx,
            rect.x,
            rect.y,
            rect.width,
            rect.height,
            this.text,
            BUTTON_THEME,
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


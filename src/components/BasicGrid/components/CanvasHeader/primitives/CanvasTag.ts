import { CanvasLeaf } from '../core/CanvasLeaf';
import { DrawBatcher } from '../core/DrawBatcher';

const DEFAULT_FONT = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const DEFAULT_BACKGROUND = '#E3F2FD';
const DEFAULT_TEXT_COLOR = '#1E88E5';
const DEFAULT_PADDING_X = 8;
const DEFAULT_PADDING_Y = 2;
const DEFAULT_BORDER_RADIUS = 6;
const DEFAULT_FONT_SIZE = 12;
const FONT_SIZE_REGEX = /(\d+)px/;
const CACHE_SEPARATOR = '|';

const textWidthCache = new Map<string, number>();

export interface CanvasTagOptions {
    font?: string;
    textColor?: string;
    backgroundColor?: string;
    paddingX?: number;
    paddingY?: number;
    borderRadius?: number;
}

export class CanvasTag extends CanvasLeaf {
    text: string;
    font: string = DEFAULT_FONT;
    textColor: string = DEFAULT_TEXT_COLOR;
    backgroundColor: string = DEFAULT_BACKGROUND;
    paddingX = DEFAULT_PADDING_X;
    paddingY = DEFAULT_PADDING_Y;
    borderRadius = DEFAULT_BORDER_RADIUS;

    constructor(id: string, text: string, options?: CanvasTagOptions) {
        super(id);
        this.text = text;
        if (options) {
            if (options.font) this.font = options.font;
            if (options.textColor) this.textColor = options.textColor;
            if (options.backgroundColor) this.backgroundColor = options.backgroundColor;
            if (options.paddingX !== undefined) this.paddingX = options.paddingX;
            if (options.paddingY !== undefined) this.paddingY = options.paddingY;
            if (options.borderRadius !== undefined) this.borderRadius = options.borderRadius;
        }
    }

    measure(ctx: CanvasRenderingContext2D) {
        const textWidth = getCachedTextWidth(ctx, this.font, this.text);
        const fontSize = extractFontSize(this.font);

        this.rect.width = textWidth + this.paddingX * 2;
        this.rect.height = fontSize + this.paddingY * 2;
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect;

        batcher.roundedRect(x, y, width, height, this.borderRadius, {
            fillStyle: this.backgroundColor,
        });

        batcher.fillText(
            this.text,
            x + this.paddingX,
            y + height / 2,
            this.font,
            this.textColor,
            'middle'
        );
    }
}

function getCachedTextWidth(ctx: CanvasRenderingContext2D, font: string, text: string): number {
    const cacheKey = `${font}${CACHE_SEPARATOR}${text}`;
    let width = textWidthCache.get(cacheKey);
    if (width === undefined) {
        ctx.font = font;
        width = ctx.measureText(text).width;
        textWidthCache.set(cacheKey, width);
    }
    return width;
}

function extractFontSize(font: string): number {
    const match = FONT_SIZE_REGEX.exec(font);
    return match ? parseInt(match[1], 10) : DEFAULT_FONT_SIZE;
}





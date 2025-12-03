import { CanvasLeaf } from '../core/CanvasLeaf';
import { DrawBatcher } from '../core/DrawBatcher';

const DEFAULT_FONT = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const DEFAULT_BACKGROUND = '#E3F2FD';
const DEFAULT_TEXT_COLOR = '#1E88E5';
const FONT_SIZE_REGEX = /(\d+)px/;

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
    paddingX = 8;
    paddingY = 2;
    borderRadius = 6;

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
        const font = this.font;
        const text = this.text;
        const cacheKey = `${font}|${text}`;

        let width = textWidthCache.get(cacheKey);
        if (width === undefined) {
            ctx.font = font;
            width = ctx.measureText(text).width;
            textWidthCache.set(cacheKey, width);
        }

        const fontSize = extractFontSize(font);
        const contentHeight = fontSize;

        this.rect.width = width + this.paddingX * 2;
        this.rect.height = contentHeight + this.paddingY * 2;
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

function extractFontSize(font: string): number {
    const match = FONT_SIZE_REGEX.exec(font);
    return match ? parseInt(match[1], 10) : 12;
}





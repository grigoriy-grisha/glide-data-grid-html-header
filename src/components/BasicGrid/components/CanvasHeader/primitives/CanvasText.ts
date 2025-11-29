import { split } from "canvas-hypertxt";
import { CanvasNode, Rect } from "../core/CanvasNode.ts";

export interface CanvasTextOptions {
    font?: string;
    color?: string;
    wordWrap?: boolean;
    lineHeight?: number;
}

export class CanvasText extends CanvasNode {
    text: string;
    font: string = "14px sans-serif";
    color: string = "black";
    wordWrap: boolean = false;
    lineHeight: number = 1;

    constructor(id: string, text: string, options?: CanvasTextOptions) {
        super(id);
        this.text = text;
        if (options) {
            if (options.font) this.font = options.font;
            if (options.color) this.color = options.color;
            if (options.wordWrap) this.wordWrap = options.wordWrap;
            if (options.lineHeight) this.lineHeight = options.lineHeight;
        }
    }

    measure(ctx: CanvasRenderingContext2D) {
        ctx.font = this.font;
        const { lineHeightPx } = getFontMetrics(this.font, this.lineHeight);
        const wrapWidth = resolveWrapWidth(this.style.width, this.rect.width);

        if (this.wordWrap && wrapWidth > 0) {
            const lines = normalizeSplitResult(split(ctx, this.text, this.font, wrapWidth, this.wordWrap));
            this.rect.width = wrapWidth;
            this.rect.height = lines.length * lineHeightPx;
            return;
        }

        const metrics = ctx.measureText(this.text);
        this.rect.width = metrics.width;
        this.rect.height = lineHeightPx;
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textBaseline = "top";

        const { lineHeightPx } = getFontMetrics(this.font, this.lineHeight);
        const wrapWidth = Math.max(this.rect.width, 0);
        const lines = this.wordWrap
            ? normalizeSplitResult(split(ctx, this.text, this.font, wrapWidth || 1, this.wordWrap))
            : [this.text];

        if (this.wordWrap) {
            let y = alignWrappedTextY(this.rect, lines.length * lineHeightPx);
            for (const line of lines) {
                ctx.fillText(line, this.rect.x, y);
                y += lineHeightPx;
            }
        } else {
            ctx.textBaseline = "middle";
            const y = this.rect.y + this.rect.height / 2;
            ctx.fillText(this.text, this.rect.x, y);
        }

        ctx.restore();
    }
}

function getFontMetrics(font: string, lineHeight: number) {
    const fontSizeMatch = font.match(/(\d+)px/);
    const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 14;
    return {
        fontSize,
        lineHeightPx: fontSize * lineHeight,
    };
}

function resolveWrapWidth(styleWidth: number | string | undefined, rectWidth: number) {
    if (typeof styleWidth === "number" && styleWidth > 0) {
        return styleWidth;
    }
    if (rectWidth > 0) {
        return rectWidth;
    }
    return 0;
}

function normalizeSplitResult(result: ReturnType<typeof split>): string[] {
    if (Array.isArray(result)) {
        return result;
    }
    if ((result as any).lines && Array.isArray((result as any).lines)) {
        return (result as any).lines;
    }
    return [];
}

function alignWrappedTextY(rect: Rect, contentHeight: number) {
    return rect.y + Math.max(0, (rect.height - contentHeight) / 2);
}

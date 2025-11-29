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
    private fontMetricsCache?: {
        font: string;
        lineHeight: number;
        fontSize: number;
        lineHeightPx: number;
    };
    private cachedWrapWidth: number = 0;
    private measurementSnapshot?: {
        text: string;
        font: string;
        lineHeight: number;
        wordWrap: boolean;
        wrapWidth: number;
        rectWidth: number;
        rectHeight: number;
    };
    private splitCache?: {
        text: string;
        font: string;
        lineHeight: number;
        wordWrap: boolean;
        wrapWidth: number;
        lines: string[];
    };

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
        const { lineHeightPx } = this.getFontMetricsCached();
        const wrapWidth = resolveWrapWidth(this.style.width, this.rect.width);
        this.cachedWrapWidth = wrapWidth;

        if (
            this.measurementSnapshot &&
            this.measurementSnapshot.text === this.text &&
            this.measurementSnapshot.font === this.font &&
            this.measurementSnapshot.lineHeight === this.lineHeight &&
            this.measurementSnapshot.wordWrap === this.wordWrap &&
            (!this.wordWrap || this.measurementSnapshot.wrapWidth === wrapWidth)
        ) {
            this.rect.width = this.measurementSnapshot.rectWidth;
            this.rect.height = this.measurementSnapshot.rectHeight;
            return;
        }

        if (this.wordWrap && wrapWidth > 0) {
            const lines = this.getOrCreateSplitLines(ctx, wrapWidth);
            this.rect.width = wrapWidth;
            this.rect.height = lines.length * lineHeightPx;
            this.updateMeasurementSnapshot(this.rect.width, this.rect.height);
            return;
        }

        const metrics = ctx.measureText(this.text);
        this.rect.width = metrics.width;
        this.rect.height = lineHeightPx;
        this.splitCache = undefined;
        this.updateMeasurementSnapshot(this.rect.width, this.rect.height);
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textBaseline = "top";

        const { lineHeightPx } = this.getFontMetricsCached();
        const wrapWidth = this.cachedWrapWidth || Math.max(this.rect.width, 0);

        const lines = this.wordWrap
            ? this.getOrCreateSplitLines(ctx, wrapWidth || 1)
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

    private getFontMetricsCached() {
        if (
            !this.fontMetricsCache ||
            this.fontMetricsCache.font !== this.font ||
            this.fontMetricsCache.lineHeight !== this.lineHeight
        ) {
            const metrics = getFontMetrics(this.font, this.lineHeight);
            this.fontMetricsCache = {
                ...metrics,
                font: this.font,
                lineHeight: this.lineHeight,
            };
        }
        return this.fontMetricsCache;
    }

    private getOrCreateSplitLines(ctx: CanvasRenderingContext2D, wrapWidth: number) {
        if (
            this.splitCache &&
            this.splitCache.text === this.text &&
            this.splitCache.font === this.font &&
            this.splitCache.lineHeight === this.lineHeight &&
            this.splitCache.wordWrap === this.wordWrap &&
            this.splitCache.wrapWidth === wrapWidth
        ) {
            return this.splitCache.lines;
        }

        const lines = normalizeSplitResult(split(ctx, this.text, this.font, wrapWidth || 1, this.wordWrap));
        if (this.wordWrap) {
            this.splitCache = {
                text: this.text,
                font: this.font,
                lineHeight: this.lineHeight,
                wordWrap: this.wordWrap,
                wrapWidth,
                lines,
            };
        }
        return lines;
    }

    private updateMeasurementSnapshot(rectWidth: number, rectHeight: number) {
        this.measurementSnapshot = {
            text: this.text,
            font: this.font,
            lineHeight: this.lineHeight,
            wordWrap: this.wordWrap,
            wrapWidth: this.cachedWrapWidth,
            rectWidth,
            rectHeight,
        };
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

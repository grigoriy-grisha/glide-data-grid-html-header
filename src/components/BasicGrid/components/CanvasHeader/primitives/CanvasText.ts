import { split } from "canvas-hypertxt";
import { CanvasNode } from "../core/CanvasNode.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Global caches
// ─────────────────────────────────────────────────────────────────────────────

// Cache for font metrics: key = "font|lineHeight"
const fontMetricsCache = new Map<string, { fontSize: number; lineHeightPx: number }>();

// Cache for text width measurements: key = "font|text"
const textWidthCache = new Map<string, number>();


// Precompiled regex for font size extraction
const FONT_SIZE_REGEX = /(\d+)px/;

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

function getCachedFontMetrics(font: string, lineHeight: number): { fontSize: number; lineHeightPx: number } {
    const key = font + '|' + lineHeight;
    let metrics = fontMetricsCache.get(key);
    if (metrics === undefined) {
        const match = FONT_SIZE_REGEX.exec(font);
        const fontSize = match ? parseInt(match[1], 10) : 14;
        metrics = { fontSize, lineHeightPx: fontSize * lineHeight };
        fontMetricsCache.set(key, metrics);
    }
    return metrics;
}

function getCachedTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string): number {
    const key = font + '|' + text;
    let width = textWidthCache.get(key);
    if (width === undefined) {
        ctx.font = font;
        width = ctx.measureText(text).width;
        textWidthCache.set(key, width);
    }
    return width;
}

function getSplitLines(ctx: CanvasRenderingContext2D, text: string, font: string, wrapWidth: number, wordWrap: boolean): string[] {
    ctx.font = font;
    return normalizeSplitResult(split(ctx, text, font, wrapWidth || 1, wordWrap));
}

// ─────────────────────────────────────────────────────────────────────────────
// CanvasText
// ─────────────────────────────────────────────────────────────────────────────

export interface CanvasTextOptions {
    font?: string;
    color?: string;
    /** Allow text to wrap to multiple lines when width is constrained */
    wordWrap?: boolean;
    lineHeight?: number;
}

export class CanvasText extends CanvasNode {
    text: string;
    font: string = "14px sans-serif";
    color: string = "black";
    /** Allow text to wrap to multiple lines when width is constrained */
    wordWrap: boolean = false;
    lineHeight: number = 1;
    
    // Lightweight cache for measurement invalidation (only for non-wordWrap)
    private _lastMeasureKey: string = '';
    // Cache split lines per instance for wordWrap mode
    private _cachedLines: string[] | null = null;
    private _cachedLinesKey: string = '';

    constructor(id: string, text: string, options?: CanvasTextOptions) {
        super(id);
        this.text = text;
        if (options) {
            if (options.font) this.font = options.font;
            if (options.color) this.color = options.color;
            if (options.wordWrap !== undefined) this.wordWrap = options.wordWrap;
            if (options.lineHeight) this.lineHeight = options.lineHeight;
        }
    }

    measure(ctx: CanvasRenderingContext2D) {
        const font = this.font;
        const text = this.text;
        const wordWrap = this.wordWrap;
        const lineHeight = this.lineHeight;
        
        const { lineHeightPx } = getCachedFontMetrics(font, lineHeight);
        const rect = this.rect;

        if (wordWrap) {
            // For wordWrap: use instance-level cache (not global)
            const wrapWidth = resolveWrapWidth(this.style.width, rect.width);
            
            if (wrapWidth > 0) {
                const linesKey = font + '|' + text + '|' + wrapWidth;
                if (linesKey !== this._cachedLinesKey || this._cachedLines === null) {
                    this._cachedLines = getSplitLines(ctx, text, font, wrapWidth, wordWrap);
                    this._cachedLinesKey = linesKey;
                }
                rect.width = wrapWidth;
                rect.height = this._cachedLines.length * lineHeightPx;
            } else {
                rect.width = getCachedTextWidth(ctx, text, font);
                rect.height = lineHeightPx;
                this._cachedLines = null;
            }
        } else {
            // For single-line: use global cache
            const measureKey = font + '|' + text + '|' + lineHeight;
            if (measureKey !== this._lastMeasureKey) {
                this._lastMeasureKey = measureKey;
                rect.width = getCachedTextWidth(ctx, text, font);
                rect.height = lineHeightPx;
            }
            this._cachedLines = null;
        }
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        const font = this.font;
        const text = this.text;
        const rect = this.rect;

        ctx.font = font;
        ctx.fillStyle = this.color;

        const lines = this._cachedLines;
        if (lines !== null && lines.length > 0) {
            // Multiline rendering
            const { lineHeightPx } = getCachedFontMetrics(font, this.lineHeight);
            ctx.textBaseline = "top";
            const contentHeight = lines.length * lineHeightPx;
            let y = rect.y + Math.max(0, (rect.height - contentHeight) * 0.5);
            
            for (let i = 0, len = lines.length; i < len; i++) {
                ctx.fillText(lines[i], rect.x, y);
                y += lineHeightPx;
            }
        } else {
            // Single line rendering
            ctx.textBaseline = "middle";
            ctx.fillText(text, rect.x, rect.y + rect.height * 0.5);
        }
    }
}

function resolveWrapWidth(styleWidth: number | string | undefined, rectWidth: number): number {
    if (typeof styleWidth === "number" && styleWidth > 0) {
        return styleWidth;
    }
    return rectWidth > 0 ? rectWidth : 0;
}

function normalizeSplitResult(result: ReturnType<typeof split>): string[] {
    if (Array.isArray(result)) {
        return result;
    }
    const asAny = result as any;
    if (asAny.lines && Array.isArray(asAny.lines)) {
        return asAny.lines;
    }
    return [];
}

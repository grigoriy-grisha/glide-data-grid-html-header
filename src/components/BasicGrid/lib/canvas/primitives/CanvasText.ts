import { split } from "canvas-hypertxt"
import { CanvasNode } from "../core/CanvasNode"
import { DrawBatcher } from "../core/DrawBatcher"

const DEFAULT_FONT = "14px sans-serif"
const DEFAULT_COLOR = "black"
const DEFAULT_LINE_HEIGHT = 1
const DEFAULT_FONT_SIZE = 14
const FONT_SIZE_REGEX = /(\d+)px/
const CACHE_SEPARATOR = '|'

const fontMetricsCache = new Map<string, { fontSize: number; lineHeightPx: number }>()
const textWidthCache = new Map<string, number>()

export interface CanvasTextOptions {
    font?: string
    color?: string
    wordWrap?: boolean
    lineHeight?: number
}

export class CanvasText extends CanvasNode {
    text: string
    font: string = DEFAULT_FONT
    color: string = DEFAULT_COLOR
    wordWrap: boolean = false
    lineHeight: number = DEFAULT_LINE_HEIGHT

    private _lastMeasureKey: string = ''
    private _cachedLines: string[] | null = null
    private _cachedLinesKey: string = ''

    constructor(id: string, text: string, options?: CanvasTextOptions) {
        super(id)
        this.text = text
        if (options) {
            if (options.font) this.font = options.font
            if (options.color) this.color = options.color
            if (options.wordWrap !== undefined) this.wordWrap = options.wordWrap
            if (options.lineHeight) this.lineHeight = options.lineHeight
        }
    }

    measure(ctx: CanvasRenderingContext2D) {
        const { font, text, wordWrap, lineHeight, rect } = this
        const { lineHeightPx } = getCachedFontMetrics(font, lineHeight)

        if (wordWrap) {
            this.measureWordWrap(ctx, font, text, lineHeightPx, rect)
        } else {
            this.measureSingleLine(ctx, font, text, lineHeightPx, rect)
        }
    }

    private measureWordWrap(
        ctx: CanvasRenderingContext2D,
        font: string,
        text: string,
        lineHeightPx: number,
        rect: { width: number; height: number }
    ) {
        const wrapWidth = resolveWrapWidth(this.style.width, rect.width)

        if (wrapWidth > 0) {
            const linesKey = `${font}${CACHE_SEPARATOR}${text}${CACHE_SEPARATOR}${wrapWidth}`
            if (linesKey !== this._cachedLinesKey || this._cachedLines === null) {
                this._cachedLines = getSplitLines(ctx, text, font, wrapWidth, true)
                this._cachedLinesKey = linesKey
            }
            rect.width = wrapWidth
            rect.height = this._cachedLines.length * lineHeightPx
        } else {
            rect.width = getCachedTextWidth(ctx, text, font)
            rect.height = lineHeightPx
            this._cachedLines = null
        }
    }

    private measureSingleLine(
        ctx: CanvasRenderingContext2D,
        font: string,
        text: string,
        lineHeightPx: number,
        rect: { width: number; height: number }
    ) {
        const measureKey = `${font}${CACHE_SEPARATOR}${text}${CACHE_SEPARATOR}${this.lineHeight}`
        if (measureKey !== this._lastMeasureKey) {
            this._lastMeasureKey = measureKey
            rect.width = getCachedTextWidth(ctx, text, font)
            rect.height = lineHeightPx
        }
        this._cachedLines = null
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
        const { font, text, rect, color } = this
        const lines = this._cachedLines

        if (lines !== null && lines.length > 0) {
            this.paintMultiline(batcher, font, color, lines, rect)
        } else {
            this.paintSingleLine(batcher, text, font, color, rect)
        }
    }

    private paintMultiline(
        batcher: DrawBatcher,
        font: string,
        color: string,
        lines: string[],
        rect: { x: number; y: number; width: number; height: number }
    ) {
        const { lineHeightPx } = getCachedFontMetrics(font, this.lineHeight)
        const contentHeight = lines.length * lineHeightPx
        let y = rect.y + Math.max(0, (rect.height - contentHeight) * 0.5)

        for (let i = 0, len = lines.length; i < len; i++) {
            batcher.fillText(lines[i], rect.x, y, font, color, "top")
            y += lineHeightPx
        }
    }

    private paintSingleLine(
        batcher: DrawBatcher,
        text: string,
        font: string,
        color: string,
        rect: { x: number; y: number; height: number }
    ) {
        batcher.fillText(text, rect.x, rect.y + rect.height * 0.5, font, color, "middle")
    }
}

function getCachedFontMetrics(font: string, lineHeight: number): { fontSize: number; lineHeightPx: number } {
    const key = `${font}${CACHE_SEPARATOR}${lineHeight}`
    let metrics = fontMetricsCache.get(key)
    if (metrics === undefined) {
        const match = FONT_SIZE_REGEX.exec(font)
        const fontSize = match ? parseInt(match[1], 10) : DEFAULT_FONT_SIZE
        metrics = { fontSize, lineHeightPx: fontSize * lineHeight }
        fontMetricsCache.set(key, metrics)
    }
    return metrics
}

function getCachedTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string): number {
    const key = `${font}${CACHE_SEPARATOR}${text}`
    let width = textWidthCache.get(key)
    if (width === undefined) {
        ctx.font = font
        width = ctx.measureText(text).width
        textWidthCache.set(key, width)
    }
    return width
}

function getSplitLines(ctx: CanvasRenderingContext2D, text: string, font: string, wrapWidth: number, wordWrap: boolean): string[] {
    ctx.font = font
    return normalizeSplitResult(split(ctx, text, font, wrapWidth || 1, wordWrap))
}

function resolveWrapWidth(styleWidth: number | string | undefined, rectWidth: number): number {
    if (typeof styleWidth === "number" && styleWidth > 0) {
        return styleWidth
    }
    return rectWidth > 0 ? rectWidth : 0
}

function normalizeSplitResult(result: ReturnType<typeof split>): string[] {
    if (Array.isArray(result)) {
        return result
    }
    const asAny = result as any
    if (asAny.lines && Array.isArray(asAny.lines)) {
        return asAny.lines
    }
    return []
}

import { split } from "canvas-hypertxt";
import { CanvasNode } from "../core/CanvasNode.ts";

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

        const fontSizeMatch = this.font.match(/(\d+)px/);
        const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 14;

        // Use style width if set, or current rect width if it has been set by layout (re-measure pass)
        const targetWidth = (this.style.width !== undefined && this.style.width > 0)
            ? this.style.width
            : (this.rect.width > 0 ? this.rect.width : 0);

        // If we have a fixed width in style, use it to wrap
        if (this.wordWrap && targetWidth > 0) {
            const lines = split(ctx, this.text, this.font, targetWidth, this.wordWrap);

            this.rect.width = targetWidth;

            // Handle potential return types of split
            let lineCount = 0;
            if (Array.isArray(lines)) {
                lineCount = lines.length;
            } else if ((lines as any).lines && Array.isArray((lines as any).lines)) {
                lineCount = (lines as any).lines.length;
            }

            const lineHeightPx = fontSize * this.lineHeight;
            this.rect.height = lineCount * lineHeightPx;

        } else {
            // Default measure (no wrapping or unlimited width)
            const metrics = ctx.measureText(this.text);
            this.rect.width = metrics.width;
            const lineHeightPx = fontSize * this.lineHeight;
            this.rect.height = lineHeightPx;
        }
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // Calculate layout using logical width (rect.width)
        // We use the current transform (logical pixels) so split/measureText works correctly
        const width = this.rect.width > 0 ? this.rect.width : 1000;
        const lines = this.wordWrap
            ? split(ctx, this.text, this.font, width, this.wordWrap)
            : null;

        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textBaseline = "top";

        const fontSizeMatch = this.font.match(/(\d+)px/);
        const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 14;
        const lineHeightPx = fontSize * this.lineHeight;

        if (this.wordWrap && lines) {
            let y = this.rect.y;

            let linesArray: string[] = [];
            if (Array.isArray(lines)) {
                linesArray = lines;
            } else if ((lines as any).lines) {
                linesArray = (lines as any).lines;
            }

            const contentHeight = linesArray.length * lineHeightPx;
            y += Math.max(0, (this.rect.height - contentHeight) / 2);

            for (const line of linesArray) {
                ctx.fillText(line, this.rect.x, y);
                y += lineHeightPx;
            }
        } else {
            // Single line
            ctx.textBaseline = "middle";
            const y = this.rect.y + this.rect.height / 2;
            ctx.fillText(this.text, this.rect.x, y);
        }

        // Debug: visualize bounds
        // ctx.strokeStyle = "magenta";
        // ctx.lineWidth = 1;
        // ctx.strokeRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);

        ctx.restore();
    }

    // Removed manual getLines
}

import {CanvasNode} from "../core/CanvasNode.ts";

export class CanvasButton extends CanvasNode {
    text: string;
    fillColor: string = '#e3f2fd';
    hoverFillColor: string = '#bbdefb';
    textColor: string = '#1565c0';
    borderColor: string = '#2196f3';
    borderRadius: number = 4;
    fontSize: number = 12;
    fontWeight: string = 'normal';
    private isHovered: boolean = false;

    constructor(id: string, text: string, options?: {
        fillColor?: string;
        hoverFillColor?: string;
        textColor?: string;
        borderColor?: string;
        borderRadius?: number;
        fontSize?: number;
        fontWeight?: string;
        onClick?: () => void;
    }) {
        super(id);
        this.text = text;
        if (options) {
            this.fillColor = options.fillColor ?? this.fillColor;
            this.hoverFillColor = options.hoverFillColor ?? this.hoverFillColor;
            this.textColor = options.textColor ?? this.textColor;
            this.borderColor = options.borderColor ?? this.borderColor;
            this.borderRadius = options.borderRadius ?? this.borderRadius;
            this.fontSize = options.fontSize ?? this.fontSize;
            this.fontWeight = options.fontWeight ?? this.fontWeight;
            if (options.onClick) {
                this.onClick = () => options.onClick!();
            }
        }
    }

    measure(ctx: CanvasRenderingContext2D) {
        ctx.font = `${this.fontWeight} ${this.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const metrics = ctx.measureText(this.text);
        this.rect.width = metrics.width + 16; // padding
        this.rect.height = 28;
    }

    paint(ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect;
        // Draw rounded rectangle background
        ctx.fillStyle = this.isHovered ? this.hoverFillColor : this.fillColor;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, this.borderRadius);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw text
        ctx.fillStyle = this.textColor;
        ctx.font = `${this.fontWeight} ${this.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, x + width / 2, y + height / 2);
    }

    onMouseEnter() {
        this.isHovered = true;
    }

    onMouseLeave() {
        this.isHovered = false;
    }
}


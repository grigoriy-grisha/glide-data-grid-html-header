import {CanvasNode} from "../core/CanvasNode.ts";
import {drawButton} from '../../../customCells/canvasCell/buttons';
import {CanvasLeaf} from "../core/CanvasLeaf.ts";

export class CanvasButton extends CanvasLeaf {
    type= "button"
    text: string;
    variant: 'primary' | 'secondary' | 'danger' = 'primary';
    disabled: boolean = false;
    isHovered: boolean = false;

    constructor(id: string, text: string, options?: {
        variant?: 'primary' | 'secondary' | 'danger';
        disabled?: boolean;
        onClick?: () => void;
    }) {
        super(id);
        this.text = text;
        this.variant = options?.variant ?? this.variant;
        this.disabled = options?.disabled ?? this.disabled;
        if (options?.onClick) {
            this.onClick = () => options.onClick!();
        }
    }

    measure(ctx: CanvasRenderingContext2D) {
        // We need to measure the button size using the drawButton helper
        // Since drawButton does drawing, we can use a "dry run" or just rely on its internal logic if extracted
        // For now, let's use a simplified estimation or call drawButton with a dummy context if needed,
        // but drawButton takes x/y which we don't know yet.
        // Ideally drawButton logic should be split into measure and paint.
        // For this implementation, we'll use a temporary estimation similar to drawButton.

        // Simple estimation based on drawButton logic
        ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; // Approximate theme font
        const textMetrics = ctx.measureText(this.text);
        const paddingX = 12; // 6px * 2 roughly

        this.rect.width = textMetrics.width + paddingX * 2 + 8;
        this.rect.height = 24; // Standard height
    }

    paint(ctx: CanvasRenderingContext2D) {
        drawButton(
            ctx,
            this.rect.x,
            this.rect.y,
            this.rect.width,
            this.rect.height,
            this.text,
            {
                // Mock theme
                accentColor: '#1e88e5',
                accentLight: 'rgba(30, 136, 229, 0.16)',
                accentFg: '#ffffff',
                bgCell: '#ffffff',
                borderColor: '#e0e0e0',
                textLight: '#9e9e9e',
                baseFontFull: "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            },
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


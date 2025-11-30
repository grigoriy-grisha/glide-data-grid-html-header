/**
 * DrawBatcher - Optimized canvas rendering via command batching
 *
 * Collects draw commands during paint phase, then executes them
 * with minimal context state changes by sorting and grouping.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TextBaseline = 'top' | 'middle' | 'bottom' | 'alphabetic' | 'hanging' | 'ideographic';
export type TextAlign = 'left' | 'right' | 'center' | 'start' | 'end';

interface BaseCommand {
    zIndex: number;
    order: number; // Insertion order for stable sort within same zIndex
}

interface FillRectCommand extends BaseCommand {
    type: 'fillRect';
    x: number;
    y: number;
    width: number;
    height: number;
    fillStyle: string;
}

interface StrokeRectCommand extends BaseCommand {
    type: 'strokeRect';
    x: number;
    y: number;
    width: number;
    height: number;
    strokeStyle: string;
    lineWidth: number;
}

interface FillTextCommand extends BaseCommand {
    type: 'fillText';
    text: string;
    x: number;
    y: number;
    font: string;
    fillStyle: string;
    textBaseline: TextBaseline;
    textAlign?: TextAlign;
}

interface DrawImageCommand extends BaseCommand {
    type: 'drawImage';
    image: CanvasImageSource;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface RoundedRectCommand extends BaseCommand {
    type: 'roundedRect';
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    fillStyle?: string;
    strokeStyle?: string;
    lineWidth?: number;
}

interface CustomCommand extends BaseCommand {
    type: 'custom';
    fn: (ctx: CanvasRenderingContext2D) => void;
}

export type DrawCommand =
    | FillRectCommand
    | StrokeRectCommand
    | FillTextCommand
    | DrawImageCommand
    | RoundedRectCommand
    | CustomCommand;

// ─────────────────────────────────────────────────────────────────────────────
// Sorting helpers
// ─────────────────────────────────────────────────────────────────────────────

// Priority by command type (lower = drawn first)
const TYPE_PRIORITY: Record<DrawCommand['type'], number> = {
    fillRect: 0,      // Backgrounds first
    roundedRect: 1,   // Rounded backgrounds
    strokeRect: 2,    // Borders
    drawImage: 3,     // Images/icons
    fillText: 4,      // Text on top
    custom: 5,        // Custom last
};

/**
 * Generate a state key for grouping commands with same context state.
 * Commands with same key can be rendered without state changes between them.
 */
function getStateKey(cmd: DrawCommand): string {
    switch (cmd.type) {
        case 'fillRect':
            return `fillRect|${cmd.fillStyle}`;
        case 'strokeRect':
            return `strokeRect|${cmd.strokeStyle}|${cmd.lineWidth}`;
        case 'fillText':
            return `fillText|${cmd.font}|${cmd.fillStyle}|${cmd.textBaseline}|${cmd.textAlign ?? 'left'}`;
        case 'drawImage':
            return 'drawImage';
        case 'roundedRect':
            return `roundedRect|${cmd.fillStyle ?? ''}|${cmd.strokeStyle ?? ''}|${cmd.lineWidth ?? 1}`;
        case 'custom':
            return `custom|${cmd.order}`; // Each custom is unique
    }
}

/**
 * Compare function for sorting commands.
 * Primary: zIndex (ascending)
 * Secondary: type priority (backgrounds before text)
 * Tertiary: state key (group same states together)
 * Quaternary: insertion order (stable sort)
 */
function compareCommands(a: DrawCommand, b: DrawCommand): number {
    // 1. Sort by zIndex
    if (a.zIndex !== b.zIndex) {
        return a.zIndex - b.zIndex;
    }

    // 2. Sort by type priority
    const typePriorityA = TYPE_PRIORITY[a.type];
    const typePriorityB = TYPE_PRIORITY[b.type];
    if (typePriorityA !== typePriorityB) {
        return typePriorityA - typePriorityB;
    }

    // 3. Group by state key (string comparison)
    const keyA = getStateKey(a);
    const keyB = getStateKey(b);
    if (keyA !== keyB) {
        return keyA < keyB ? -1 : 1;
    }

    // 4. Preserve insertion order within same state
    return a.order - b.order;
}

// ─────────────────────────────────────────────────────────────────────────────
// DrawBatcher class
// ─────────────────────────────────────────────────────────────────────────────

// Check for native roundRect support
const hasNativeRoundRect = typeof Path2D !== 'undefined' &&
    typeof CanvasRenderingContext2D.prototype.roundRect === 'function';

export class DrawBatcher {
    private commands: DrawCommand[] = [];
    private orderCounter = 0;
    private currentZIndex = 0;

    // ─────────────────────────────────────────────────────────────────────────
    // Z-Index management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Set the current z-index for subsequent commands.
     * Higher z-index = drawn later = appears on top.
     */
    setZIndex(zIndex: number): this {
        this.currentZIndex = zIndex;
        return this;
    }

    /**
     * Get current z-index
     */
    getZIndex(): number {
        return this.currentZIndex;
    }

    /**
     * Push z-index (increment by amount, useful for layering)
     */
    pushZIndex(delta: number = 1): this {
        this.currentZIndex += delta;
        return this;
    }

    /**
     * Pop z-index (decrement by amount)
     */
    popZIndex(delta: number = 1): this {
        this.currentZIndex -= delta;
        return this;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Command enqueueing
    // ─────────────────────────────────────────────────────────────────────────

    fillRect(
        x: number,
        y: number,
        width: number,
        height: number,
        fillStyle: string,
    ): this {
        this.commands.push({
            type: 'fillRect',
            x, y, width, height,
            fillStyle,
            zIndex: this.currentZIndex,
            order: this.orderCounter++,
        });
        return this;
    }

    strokeRect(
        x: number,
        y: number,
        width: number,
        height: number,
        strokeStyle: string,
        lineWidth: number = 1,
    ): this {
        this.commands.push({
            type: 'strokeRect',
            x, y, width, height,
            strokeStyle,
            lineWidth,
            zIndex: this.currentZIndex,
            order: this.orderCounter++,
        });
        return this;
    }

    fillText(
        text: string,
        x: number,
        y: number,
        font: string,
        fillStyle: string,
        textBaseline: TextBaseline = 'middle',
        textAlign?: TextAlign,
    ): this {
        this.commands.push({
            type: 'fillText',
            text, x, y,
            font,
            fillStyle,
            textBaseline,
            textAlign,
            zIndex: this.currentZIndex,
            order: this.orderCounter++,
        });
        return this;
    }

    drawImage(
        image: CanvasImageSource,
        x: number,
        y: number,
        width: number,
        height: number,
    ): this {
        this.commands.push({
            type: 'drawImage',
            image, x, y, width, height,
            zIndex: this.currentZIndex,
            order: this.orderCounter++,
        });
        return this;
    }

    roundedRect(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        options?: {
            fillStyle?: string;
            strokeStyle?: string;
            lineWidth?: number;
        },
    ): this {
        this.commands.push({
            type: 'roundedRect',
            x, y, width, height, radius,
            fillStyle: options?.fillStyle,
            strokeStyle: options?.strokeStyle,
            lineWidth: options?.lineWidth,
            zIndex: this.currentZIndex,
            order: this.orderCounter++,
        });
        return this;
    }

    /**
     * Enqueue a custom draw function.
     * Use sparingly - custom commands break batching optimization.
     */
    custom(fn: (ctx: CanvasRenderingContext2D) => void): this {
        this.commands.push({
            type: 'custom',
            fn,
            zIndex: this.currentZIndex,
            order: this.orderCounter++,
        });
        return this;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Batch management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Clear all queued commands. Call before starting a new frame.
     */
    clear(): this {
        this.commands.length = 0;
        this.orderCounter = 0;
        this.currentZIndex = 0;
        return this;
    }

    /**
     * Get number of queued commands (for debugging/stats)
     */
    get commandCount(): number {
        return this.commands.length;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Flush / Execute
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sort and execute all queued commands with minimal state changes.
     */
    flush(ctx: CanvasRenderingContext2D): void {
        const commands = this.commands;
        const len = commands.length;

        if (len === 0) {
            return;
        }

        // Sort commands for optimal batching
        commands.sort(compareCommands);

        // Track current state to avoid redundant assignments
        let currentFillStyle = '';
        let currentStrokeStyle = '';
        let currentLineWidth = -1;
        let currentFont = '';
        let currentTextBaseline: TextBaseline | '' = '';
        let currentTextAlign: TextAlign | '' = '';

        for (let i = 0; i < len; i++) {
            const cmd = commands[i];


            switch (cmd.type) {
                case 'fillRect':
                    if (currentFillStyle !== cmd.fillStyle) {
                        ctx.fillStyle = cmd.fillStyle;
                        currentFillStyle = cmd.fillStyle;
                    }
                    ctx.fillRect(cmd.x, cmd.y, cmd.width, cmd.height);
                    break;

                case 'strokeRect':
                    if (currentStrokeStyle !== cmd.strokeStyle) {
                        ctx.strokeStyle = cmd.strokeStyle;
                        currentStrokeStyle = cmd.strokeStyle;
                    }
                    if (currentLineWidth !== cmd.lineWidth) {
                        ctx.lineWidth = cmd.lineWidth;
                        currentLineWidth = cmd.lineWidth;
                    }
                    ctx.strokeRect(cmd.x, cmd.y, cmd.width, cmd.height);
                    break;

                case 'fillText':
                    if (currentFont !== cmd.font) {
                        ctx.font = cmd.font;
                        currentFont = cmd.font;
                    }
                    if (currentFillStyle !== cmd.fillStyle) {
                        ctx.fillStyle = cmd.fillStyle;
                        currentFillStyle = cmd.fillStyle;
                    }
                    if (currentTextBaseline !== cmd.textBaseline) {
                        ctx.textBaseline = cmd.textBaseline;
                        currentTextBaseline = cmd.textBaseline;
                    }
                    if (cmd.textAlign && currentTextAlign !== cmd.textAlign) {
                        ctx.textAlign = cmd.textAlign;
                        currentTextAlign = cmd.textAlign;
                    }
                    ctx.fillText(cmd.text, cmd.x, cmd.y);
                    break;

                case 'drawImage':
                    ctx.drawImage(cmd.image, cmd.x, cmd.y, cmd.width, cmd.height);
                    break;

                case 'roundedRect':
                    this.executeRoundedRect(ctx, cmd);
                    // Rounded rect changes fill/stroke, so invalidate tracking
                    if (cmd.fillStyle) currentFillStyle = cmd.fillStyle;
                    if (cmd.strokeStyle) currentStrokeStyle = cmd.strokeStyle;
                    if (cmd.lineWidth !== undefined) currentLineWidth = cmd.lineWidth;
                    break;

                case 'custom':
                    cmd.fn(ctx);
                    // Custom function may change anything, invalidate all tracking
                    currentFillStyle = '';
                    currentStrokeStyle = '';
                    currentLineWidth = -1;
                    currentFont = '';
                    currentTextBaseline = '';
                    currentTextAlign = '';
                    break;
            }
        }

        // Clear commands after flush
        this.clear();
    }

    private executeRoundedRect(ctx: CanvasRenderingContext2D, cmd: RoundedRectCommand): void {
        const { x, y, width, height, radius, fillStyle, strokeStyle, lineWidth } = cmd;

        // Build path
        if (hasNativeRoundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, radius);
        } else {
            const r = radius;
            const right = x + width;
            const bottom = y + height;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(right - r, y);
            ctx.quadraticCurveTo(right, y, right, y + r);
            ctx.lineTo(right, bottom - r);
            ctx.quadraticCurveTo(right, bottom, right - r, bottom);
            ctx.lineTo(x + r, bottom);
            ctx.quadraticCurveTo(x, bottom, x, bottom - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }

        // Fill if specified
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        // Stroke if specified
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            if (lineWidth !== undefined) {
                ctx.lineWidth = lineWidth;
            }
            ctx.stroke();
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton instance for convenience
// ─────────────────────────────────────────────────────────────────────────────

export const defaultBatcher = new DrawBatcher();


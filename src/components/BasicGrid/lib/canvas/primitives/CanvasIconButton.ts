import { drawIconButton, drawIconButtonWithView, BUTTON_PADDING_Y, ICON_SIZE_ADJUSTMENT, SIZE_CONFIG, type ButtonView, type ButtonSize } from '../cells/buttons'
import type { ButtonIcon } from '../cells/iconSprites'
import { CanvasNode, CanvasEvent, CanvasFlexStyle } from "../core/CanvasNode"
import { CanvasLeaf } from "../core/CanvasLeaf"
import { DrawBatcher } from "../core/DrawBatcher"

const DEFAULT_HEIGHT = 28
const DEFAULT_VIEW: ButtonView = 'default'
const DEFAULT_SIZE: ButtonSize = 's'
const DEFAULT_CURSOR = 'pointer'
const MAX_ICON_SIZE = 20

// Legacy theme for backward compatibility
const BUTTON_THEME = {
    accentColor: '#1e88e5',
    accentLight: 'rgba(30, 136, 229, 0.16)',
    accentFg: '#ffffff',
    bgCell: '#ffffff',
    borderColor: '#e0e0e0',
    textLight: '#9e9e9e',
    textDark: '#1f1f1f',
    baseFontFull: "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

interface ButtonMetrics {
    height: number
    width: number
    paddingX: number
    paddingY: number
    iconSize: number
}

export interface CanvasIconButtonOptions {
    /** @deprecated Use `buttonSize` with ButtonSize type instead */
    size?: number | 'auto'
    /** @deprecated Use `view` instead */
    variant?: 'primary' | 'secondary' | 'danger'
    /** Button view style based on sdds_finai__light theme */
    view?: ButtonView
    /** Button size */
    buttonSize?: ButtonSize
    disabled?: boolean
    onClick?: (event: CanvasEvent) => void
}

export class CanvasIconButton extends CanvasLeaf {
    icon: ButtonIcon
    /** @deprecated Use `buttonSize` instead */
    size: number | 'auto'
    /** @deprecated Use `view` instead */
    variant: 'primary' | 'secondary' | 'danger'
    view: ButtonView = DEFAULT_VIEW
    buttonSize: ButtonSize = DEFAULT_SIZE
    disabled: boolean
    isHovered: boolean = false
    private useNewApi = false

    constructor(id: string, icon: ButtonIcon, options?: CanvasIconButtonOptions) {
        super(id)
        this.icon = icon
        this.size = options?.size ?? 'auto'
        this.variant = options?.variant ?? 'primary'
        this.disabled = options?.disabled ?? false
        super.style = { ...super.style, cursor: DEFAULT_CURSOR }
        
        if (options?.view !== undefined) {
            this.view = options.view
            this.useNewApi = true
        }
        if (options?.buttonSize !== undefined) {
            this.buttonSize = options.buttonSize
            this.useNewApi = true
        }
        if (options?.onClick) {
            this.onClick = (event) => options.onClick!(event)
        }
    }

    override set style(value: CanvasFlexStyle) {
        super.style = { ...super.style, cursor: DEFAULT_CURSOR, ...value }
    }

    override get style(): CanvasFlexStyle {
        const baseStyle = super.style
        if (!baseStyle.cursor) {
            baseStyle.cursor = DEFAULT_CURSOR
        }
        return baseStyle
    }

    measure(_ctx: CanvasRenderingContext2D) {
        if (this.useNewApi) {
            const sizeConfig = SIZE_CONFIG[this.buttonSize]
            this.rect.height = sizeConfig.height
            this.rect.width = sizeConfig.height // Square button
        } else {
            const metrics = resolveButtonMetrics(this.size)
            this.rect.height = metrics.height
            this.rect.width = metrics.width
        }
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect
        
        if (this.useNewApi) {
            drawIconButtonWithView(
                batcher,
                x,
                y,
                this.icon,
                this.view,
                this.buttonSize,
                this.disabled,
                this.isHovered,
            )
        } else {
            drawIconButton(
                batcher,
                x,
                y,
                width,
                height,
                this.icon,
                BUTTON_THEME,
                this.variant,
                this.disabled,
                this.isHovered,
            )
        }
    }

    onMouseEnter() {
        this.isHovered = true
    }

    onMouseLeave() {
        this.isHovered = false
    }

    hitTest(x: number, y: number): CanvasNode[] {
        if (this.useNewApi) {
            const sizeConfig = SIZE_CONFIG[this.buttonSize]
            const bounds = {
                x: this.rect.x,
                y: this.rect.y,
                width: sizeConfig.height,
                height: sizeConfig.height,
            }
            if (isPointInBounds(x, y, bounds)) {
                return [this]
            }
            return []
        }
        
        const metrics = resolveButtonMetrics(this.size, this.rect.height)
        const bounds = getInteractiveBounds(this.rect.x, this.rect.y, metrics)

        if (isPointInBounds(x, y, bounds)) {
            return [this]
        }

        return []
    }
}

function resolveButtonMetrics(size: number | 'auto', currentHeight?: number): ButtonMetrics {
    const height = typeof size === 'number' ? size : currentHeight ?? DEFAULT_HEIGHT
    const paddingX = 0
    const paddingY = BUTTON_PADDING_Y
    const iconSize = Math.min(height - paddingY * 2 - ICON_SIZE_ADJUSTMENT, MAX_ICON_SIZE)
    const width = typeof size === 'number' ? size : iconSize + paddingX * 2

    return { height, width, paddingX, paddingY, iconSize }
}

function getInteractiveBounds(x: number, y: number, metrics: ButtonMetrics) {
    return {
        x: x + metrics.paddingX,
        y: y + metrics.paddingY,
        width: metrics.width - metrics.paddingX * 2,
        height: metrics.height - metrics.paddingY * 2,
    }
}

function isPointInBounds(x: number, y: number, bounds: { x: number; y: number; width: number; height: number }): boolean {
    return (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
    )
}

import { drawButton, drawButtonWithView, SIZE_CONFIG, type ButtonView, type ButtonSize, type ButtonIcon, preloadIconSprites } from '../cells/buttons'
import { CanvasLeaf } from "../core/CanvasLeaf"
import { CanvasEvent, CanvasFlexStyle } from "../core/CanvasNode"
import { DrawBatcher } from "../core/DrawBatcher"

const DEFAULT_VIEW: ButtonView = 'default'
const DEFAULT_SIZE: ButtonSize = 's'
const DEFAULT_CURSOR = 'pointer'
const ICON_TEXT_SPACING = 8

// Legacy theme for backward compatibility
const BUTTON_THEME = {
    accentColor: '#1e88e5',
    accentLight: 'rgba(30, 136, 229, 0.16)',
    accentFg: '#ffffff',
    bgCell: '#ffffff',
    borderColor: '#e0e0e0',
    textLight: '#9e9e9e',
    baseFontFull: "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
}

const textWidthCache = new Map<string, number>()

export interface CanvasButtonOptions {
    /** @deprecated Use `view` instead */
    variant?: 'primary' | 'secondary' | 'danger'
    /** Button view style based on sdds_finai__light theme */
    view?: ButtonView
    /** Button size */
    size?: ButtonSize
    /** Left icon (SVG string or image) */
    leftIcon?: ButtonIcon
    /** Right icon (SVG string or image) */
    rightIcon?: ButtonIcon
    disabled?: boolean
    onClick?: (event: CanvasEvent) => void
}

export class CanvasButton extends CanvasLeaf {
    text: string
    /** @deprecated Use `view` instead */
    variant: 'primary' | 'secondary' | 'danger' = 'primary'
    view: ButtonView = DEFAULT_VIEW
    size: ButtonSize = DEFAULT_SIZE
    leftIcon?: ButtonIcon
    rightIcon?: ButtonIcon
    disabled = false
    isHovered = false
    private useNewApi = false

    constructor(id: string, text: string, options?: CanvasButtonOptions) {
        super(id)
        this.text = text
        super.style = { ...super.style, cursor: DEFAULT_CURSOR }
        if (options) {
            if (options.view !== undefined) {
                this.view = options.view
                this.useNewApi = true
            } else if (options.variant !== undefined) {
                this.variant = options.variant
            }
            if (options.size !== undefined) {
                this.size = options.size
                this.useNewApi = true
            }
            if (options.leftIcon !== undefined) this.leftIcon = options.leftIcon
            if (options.rightIcon !== undefined) this.rightIcon = options.rightIcon
            if (options.disabled !== undefined) this.disabled = options.disabled
            if (options.onClick) this.onClick = options.onClick
        }
        
        // Preload icons
        const sizeConfig = SIZE_CONFIG[this.size]
        if (this.leftIcon) {
            void preloadIconSprites(this.leftIcon, { size: sizeConfig.iconSize })
        }
        if (this.rightIcon) {
            void preloadIconSprites(this.rightIcon, { size: sizeConfig.iconSize })
        }
    }

    set style(value: CanvasFlexStyle) {
        super.style = { ...super.style, cursor: DEFAULT_CURSOR, ...value }
    }

    get style(): CanvasFlexStyle {
        const baseStyle = super.style
        if (!baseStyle.cursor) {
            baseStyle.cursor = DEFAULT_CURSOR
        }
        return baseStyle
    }

    measure(ctx: CanvasRenderingContext2D) {
        const sizeConfig = SIZE_CONFIG[this.size]
        const font = `${sizeConfig.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
        const textWidth = getCachedTextWidth(ctx, this.text, font)
        
        let iconsWidth = 0
        if (this.leftIcon) iconsWidth += sizeConfig.iconSize + ICON_TEXT_SPACING
        if (this.rightIcon) iconsWidth += sizeConfig.iconSize + ICON_TEXT_SPACING
        
        this.rect.width = textWidth + iconsWidth + sizeConfig.paddingX * 2
        this.rect.height = sizeConfig.height
    }

    onPaint(batcher: DrawBatcher, ctx: CanvasRenderingContext2D) {
        const { x, y, width } = this.rect
        
        if (this.useNewApi) {
            drawButtonWithView(
                batcher,
                x,
                y,
                width,
                this.text,
                this.view,
                this.size,
                this.disabled,
                this.isHovered,
                this.leftIcon,
                this.rightIcon,
                ctx,
                ICON_TEXT_SPACING
            )
        } else {
            // Legacy API for backward compatibility
            const sizeConfig = SIZE_CONFIG[this.size]
            drawButton(
                batcher,
                x,
                y,
                width,
                sizeConfig.height,
                this.text,
                BUTTON_THEME,
                this.variant,
                this.disabled,
                this.isHovered,
                this.leftIcon,
                this.rightIcon,
                ctx,
                ICON_TEXT_SPACING
            )
        }
    }

    onMouseEnter() {
        this.isHovered = true
    }

    onMouseLeave() {
        this.isHovered = false
    }
}

function getCachedTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string): number {
    const key = `${font}|${text}`
    let width = textWidthCache.get(key)
    if (width === undefined) {
        ctx.font = font
        width = ctx.measureText(text).width
        textWidthCache.set(key, width)
    }
    return width
}

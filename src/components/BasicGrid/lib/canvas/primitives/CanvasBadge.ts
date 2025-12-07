import { CanvasLeaf } from '../core/CanvasLeaf'
import { DrawBatcher } from '../core/DrawBatcher'
import { drawIcon, preloadIconSprites, type ButtonIcon } from '../cells/buttons'

// Badge view types based on sdds_finai__light theme
export type BadgeView = 
    | 'default'
    | 'accent'
    | 'positive'
    | 'warning'
    | 'negative'
    | 'dark'
    | 'light'

// Badge size types
export type BadgeSize = 'xs' | 's' | 'm' | 'l'

// Size configuration
interface SizeConfig {
    height: number
    fontSize: number
    paddingX: number
    borderRadius: number
}

const SIZE_CONFIG: Record<BadgeSize, SizeConfig> = {
    xs: { height: 16, fontSize: 10, paddingX: 4, borderRadius: 4 },
    s: { height: 20, fontSize: 11, paddingX: 6, borderRadius: 5 },
    m: { height: 24, fontSize: 12, paddingX: 8, borderRadius: 6 },
    l: { height: 28, fontSize: 13, paddingX: 10, borderRadius: 7 },
}

// View colors based on sdds_finai__light theme
interface ViewColors {
    bgColor: string
    bgColorTransparent: string
    textColor: string
    textColorOnTransparent: string
}

const VIEW_COLORS: Record<BadgeView, ViewColors> = {
    default: {
        bgColor: '#060A0C',
        bgColorTransparent: 'rgba(6, 10, 12, 0.12)',
        textColor: '#FFFFFF',
        textColorOnTransparent: '#060A0C',
    },
    accent: {
        bgColor: '#118CDF',
        bgColorTransparent: 'rgba(17, 140, 223, 0.12)',
        textColor: '#FFFFFF',
        textColorOnTransparent: '#118CDF',
    },
    positive: {
        bgColor: '#1A9E32',
        bgColorTransparent: 'rgba(26, 158, 50, 0.12)',
        textColor: '#FFFFFF',
        textColorOnTransparent: '#1A9E32',
    },
    warning: {
        bgColor: '#FA5F05',
        bgColorTransparent: 'rgba(250, 95, 5, 0.12)',
        textColor: '#FFFFFF',
        textColorOnTransparent: '#FA5F05',
    },
    negative: {
        bgColor: '#FF293E',
        bgColorTransparent: 'rgba(255, 41, 62, 0.12)',
        textColor: '#FFFFFF',
        textColorOnTransparent: '#FF293E',
    },
    dark: {
        bgColor: '#13181B',
        bgColorTransparent: 'rgba(19, 24, 27, 0.12)',
        textColor: '#FFFFFF',
        textColorOnTransparent: '#13181B',
    },
    light: {
        bgColor: '#FFFFFF',
        bgColorTransparent: 'rgba(255, 255, 255, 0.56)',
        textColor: '#060A0C',
        textColorOnTransparent: '#060A0C',
    },
}

const CACHE_SEPARATOR = '|'
const ICON_TEXT_SPACING = 6
const textWidthCache = new Map<string, number>()

// Icon sizes for each badge size
const ICON_SIZE_CONFIG: Record<BadgeSize, number> = {
    xs: 10,
    s: 12,
    m: 14,
    l: 16,
}

export interface CanvasBadgeOptions {
    view?: BadgeView
    size?: BadgeSize
    transparent?: boolean
    clear?: boolean
    leftIcon?: ButtonIcon
    rightIcon?: ButtonIcon
}

export class CanvasBadge extends CanvasLeaf {
    text: string
    view: BadgeView = 'default'
    size: BadgeSize = 's'
    transparent = false
    clear = false
    leftIcon?: ButtonIcon
    rightIcon?: ButtonIcon

    constructor(id: string, text: string, options?: CanvasBadgeOptions) {
        super(id)
        this.text = text
        if (options) {
            if (options.view !== undefined) this.view = options.view
            if (options.size !== undefined) this.size = options.size
            if (options.transparent !== undefined) this.transparent = options.transparent
            if (options.clear !== undefined) this.clear = options.clear
            if (options.leftIcon !== undefined) this.leftIcon = options.leftIcon
            if (options.rightIcon !== undefined) this.rightIcon = options.rightIcon
        }
        
        // Preload icons
        const iconSize = ICON_SIZE_CONFIG[this.size]
        if (this.leftIcon) {
            void preloadIconSprites(this.leftIcon, { size: iconSize })
        }
        if (this.rightIcon) {
            void preloadIconSprites(this.rightIcon, { size: iconSize })
        }
    }

    measure(ctx: CanvasRenderingContext2D) {
        const sizeConfig = SIZE_CONFIG[this.size]
        const iconSize = ICON_SIZE_CONFIG[this.size]
        const font = `${sizeConfig.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
        const textWidth = getCachedTextWidth(ctx, font, this.text)

        let iconsWidth = 0
        if (this.leftIcon) iconsWidth += iconSize + ICON_TEXT_SPACING
        if (this.rightIcon) iconsWidth += iconSize + ICON_TEXT_SPACING

        this.rect.width = textWidth + iconsWidth + sizeConfig.paddingX * 2
        this.rect.height = sizeConfig.height
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect
        const sizeConfig = SIZE_CONFIG[this.size]
        const iconSize = ICON_SIZE_CONFIG[this.size]
        const viewColors = VIEW_COLORS[this.view]
        const font = `${sizeConfig.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

        // Determine colors based on transparent/clear mode
        let bgColor: string
        let textColor: string

        if (this.clear) {
            // Clear mode: no background, colored text
            bgColor = 'transparent'
            textColor = viewColors.textColorOnTransparent
        } else if (this.transparent) {
            // Transparent mode: semi-transparent background
            bgColor = viewColors.bgColorTransparent
            textColor = viewColors.textColorOnTransparent
        } else {
            // Solid mode: solid background
            bgColor = viewColors.bgColor
            textColor = viewColors.textColor
        }

        // Draw background (only if not clear)
        if (!this.clear) {
            batcher.roundedRect(x, y, width, height, sizeConfig.borderRadius, {
                fillStyle: bgColor,
            })
        }

        const centerY = y + height / 2
        let currentX = x + sizeConfig.paddingX

        // Draw left icon
        if (this.leftIcon) {
            const iconY = centerY - iconSize / 2
            drawIcon(batcher, this.leftIcon, currentX, iconY, iconSize, textColor)
            currentX += iconSize + ICON_TEXT_SPACING
        }

        // Draw text
        batcher.fillText(
            this.text,
            currentX,
            centerY,
            font,
            textColor,
            'middle'
        )

        // Draw right icon
        if (this.rightIcon) {
            const textWidth = getCachedTextWidth(_ctx, font, this.text)
            const rightIconX = currentX + textWidth + ICON_TEXT_SPACING
            const iconY = centerY - iconSize / 2
            drawIcon(batcher, this.rightIcon, rightIconX, iconY, iconSize, textColor)
        }
    }
}

function getCachedTextWidth(ctx: CanvasRenderingContext2D, font: string, text: string): number {
    const cacheKey = `${font}${CACHE_SEPARATOR}${text}`
    let width = textWidthCache.get(cacheKey)
    if (width === undefined) {
        ctx.font = font
        width = ctx.measureText(text).width
        textWidthCache.set(cacheKey, width)
    }
    return width
}


import { isHoveringBounds } from './helpers'
import type { HoverState } from './types'
import type { GridTheme } from '../../../types'
import {
  getIconSprite,
  getIconImageDirect,
  type ButtonIcon,
  type IconDefinition,
  type IconSpriteOptions,
  type IconSpriteStats,
  type IconLoadCallback,
  preloadIconSprites,
  registerIconDefinitions,
  resetIconSpriteCache,
  getIconSpriteStats,
} from './iconSprites'
import { DrawBatcher } from '../core/DrawBatcher'

export { preloadIconSprites, registerIconDefinitions, resetIconSpriteCache, getIconSpriteStats }
export type { ButtonIcon, IconDefinition, IconSpriteOptions, IconSpriteStats, IconLoadCallback }

// Button view types based on sdds_finai__light theme
export type ButtonView = 
  | 'default'
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'clear'
  | 'success'
  | 'warning'
  | 'critical'
  | 'dark'
  | 'black'
  | 'white'

// Button size types
export type ButtonSize = 'xs' | 's' | 'm' | 'l'

// Size configuration based on theme spacing
export interface SizeConfig {
  height: number
  fontSize: number
  borderRadius: number
  paddingX: number
  iconSize: number
}

export const SIZE_CONFIG: Record<ButtonSize, SizeConfig> = {
  xs: { height: 24, fontSize: 12, borderRadius: 4, paddingX: 8, iconSize: 14 },
  s: { height: 32, fontSize: 13, borderRadius: 6, paddingX: 12, iconSize: 16 },
  m: { height: 40, fontSize: 14, borderRadius: 8, paddingX: 16, iconSize: 18 },
  l: { height: 48, fontSize: 16, borderRadius: 10, paddingX: 20, iconSize: 20 },
}

// View colors based on sdds_finai__light theme
export interface ViewColors {
  bgColor: string
  bgColorHover: string
  borderColor: string
  textColor: string
  iconColor: string
}

export const VIEW_COLORS: Record<ButtonView, ViewColors> = {
  default: {
    bgColor: '#060A0C',
    bgColorHover: '#111C22',
    borderColor: '#060A0C',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  primary: {
    bgColor: '#060A0C',
    bgColorHover: '#111C22',
    borderColor: '#060A0C',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  accent: {
    bgColor: '#118CDF',
    bgColorHover: '#1798EE',
    borderColor: '#118CDF',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  secondary: {
    bgColor: 'transparent',
    bgColorHover: 'rgba(6, 10, 12, 0.08)',
    borderColor: '#060A0C',
    textColor: '#060A0C',
    iconColor: '#060A0C',
  },
  clear: {
    bgColor: 'transparent',
    bgColorHover: 'rgba(6, 10, 12, 0.08)',
    borderColor: 'transparent',
    textColor: '#060A0C',
    iconColor: '#060A0C',
  },
  success: {
    bgColor: '#1A9E32',
    bgColorHover: '#1EB83A',
    borderColor: '#1A9E32',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  warning: {
    bgColor: '#FA5F05',
    bgColorHover: '#FB782D',
    borderColor: '#FA5F05',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  critical: {
    bgColor: '#FF293E',
    bgColorHover: '#FF5263',
    borderColor: '#FF293E',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  dark: {
    bgColor: '#13181B',
    bgColorHover: '#23292D',
    borderColor: '#13181B',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  black: {
    bgColor: '#060A0C',
    bgColorHover: '#13181B',
    borderColor: '#060A0C',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  white: {
    bgColor: '#FFFFFF',
    bgColorHover: '#F2F5F8',
    borderColor: '#D5DFE6',
    textColor: '#060A0C',
    iconColor: '#060A0C',
  },
}

export const BUTTON_PADDING_Y = 4
export const ICON_SIZE_ADJUSTMENT = 4

const CACHE_SEPARATOR = '|'
const HEX_COLOR_PREFIX = '#'
const HEX_COLOR_CHAR_CODE = 35
const LIGHTEN_AMOUNT = 15
const DANGER_COLOR = '#d32f2f'
const DEFAULT_BUTTON_PADDING_Y = 4
const DEFAULT_ICON_SIZE_ADJUSTMENT = 4
const DEFAULT_ICON_SIZE = 16
const MAX_ICON_SIZE = 20
const DEFAULT_BUTTON_RADIUS = 4
const DEFAULT_BORDER_WIDTH = 1
const DEFAULT_ICON_SPACING = 6
const DEFAULT_TEXT_PADDING = 4
const DEFAULT_SIZE: ButtonSize = 's'
const DEFAULT_VIEW: ButtonView = 'default'

const lightenColorCache = new Map<string, string>()
const textMeasureCache = new Map<string, number>()

const DANGER_COLOR_HOVER = lightenColor(DANGER_COLOR, LIGHTEN_AMOUNT)

function getCachedTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  const key = `${font}${CACHE_SEPARATOR}${text}`
  let width = textMeasureCache.get(key)
  if (width === undefined) {
    ctx.font = font
    width = ctx.measureText(text).width
    textMeasureCache.set(key, width)
  }
  return width
}

function lightenColorCached(color: string, amount: number): string {
  const key = `${color}${CACHE_SEPARATOR}${amount}`
  let result = lightenColorCache.get(key)
  if (result === undefined) {
    result = lightenColor(color, amount)
    lightenColorCache.set(key, result)
  }
  return result
}

function lightenColor(color: string, amount: number): string {
  if (color.charCodeAt(0) === HEX_COLOR_CHAR_CODE) {
    const num = parseInt(color.slice(1), 16)
    const r = Math.min(255, ((num >> 16) & 0xff) + amount)
    const g = Math.min(255, ((num >> 8) & 0xff) + amount)
    const b = Math.min(255, (num & 0xff) + amount)
    return `${HEX_COLOR_PREFIX}${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }
  return color
}

export function drawIcon(
  batcher: DrawBatcher,
  icon: ButtonIcon,
  x: number,
  y: number,
  size: number,
  color?: string
): void {
  if (!icon || size <= 0) return

  // Try cached ImageBitmap first (GPU-accelerated)
  const bitmap = getIconSprite(icon, size, color)
  if (bitmap) {
    batcher.drawImage(bitmap, x, y, size, size)
    return
  }
  
  // Fallback to source image while bitmap is loading
  const img = getIconImageDirect(icon, color)
  if (img) {
    batcher.drawImage(img, x, y, size, size)
  }
}

export function drawButton(
  batcher: DrawBatcher,
  x: number,
  y: number,
  width: number | 'auto',
  height: number,
  label: string,
  theme: GridTheme,
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
  disabled = false,
  hovered: HoverState = false,
  leftIcon?: ButtonIcon,
  rightIcon?: ButtonIcon,
  measureCtx?: CanvasRenderingContext2D,
  iconSpacing: number = DEFAULT_ICON_SPACING
): { x: number; y: number; width: number; height: number; actualWidth: number } {
  const paddingY = DEFAULT_BUTTON_PADDING_Y
  const buttonHeight = height - paddingY * 2
  const iconSize = Math.min(buttonHeight - DEFAULT_ICON_SIZE_ADJUSTMENT, DEFAULT_ICON_SIZE)
  const font = theme.baseFontFull

  const textWidth = measureCtx ? getCachedTextWidth(measureCtx, label, font) : 0
  const actualWidth = calculateButtonWidth(width, textWidth, iconSize, iconSpacing, leftIcon, rightIcon)
  const buttonY = y + paddingY
  const isHovered = isHoveringBounds(hovered, { x, y, width: actualWidth, height })
  const colors = resolveButtonColors(theme, variant, disabled, isHovered)

  const centerX = x + actualWidth * 0.5
  const centerY = buttonY + buttonHeight * 0.5

  batcher.roundedRect(x, buttonY, actualWidth, buttonHeight, DEFAULT_BUTTON_RADIUS, {
    fillStyle: colors.bgColor,
    strokeStyle: colors.borderColor,
    lineWidth: DEFAULT_BORDER_WIDTH,
  })

  const contentWidth = calculateContentWidth(textWidth, iconSize, iconSpacing, leftIcon, rightIcon)
  let currentX = centerX - contentWidth * 0.5

  if (leftIcon) {
    const iconY = centerY - iconSize * 0.5
    drawIcon(batcher, leftIcon, currentX, iconY, iconSize, colors.textColor)
    currentX += iconSize + iconSpacing
  }

  batcher.fillText(label, currentX, centerY, font, colors.textColor, 'middle', 'left')

  if (rightIcon) {
    const rightIconX = currentX + textWidth + iconSpacing
    const iconY = centerY - iconSize * 0.5
    drawIcon(batcher, rightIcon, rightIconX, iconY, iconSize, colors.textColor)
  }

  return { x, y: buttonY, width: actualWidth, height: buttonHeight, actualWidth }
}

/**
 * Draw a button with view and size support (sdds_finai__light theme)
 */
export function drawButtonWithView(
  batcher: DrawBatcher,
  x: number,
  y: number,
  width: number | 'auto',
  label: string,
  view: ButtonView = DEFAULT_VIEW,
  size: ButtonSize = DEFAULT_SIZE,
  disabled = false,
  hovered: HoverState = false,
  leftIcon?: ButtonIcon,
  rightIcon?: ButtonIcon,
  measureCtx?: CanvasRenderingContext2D,
  iconSpacing: number = DEFAULT_ICON_SPACING
): { x: number; y: number; width: number; height: number; actualWidth: number } {
  const sizeConfig = SIZE_CONFIG[size]
  const viewColors = VIEW_COLORS[view]
  const font = `${sizeConfig.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

  const textWidth = measureCtx ? getCachedTextWidth(measureCtx, label, font) : 0
  const actualWidth = calculateButtonWidth(width, textWidth, sizeConfig.iconSize, iconSpacing, leftIcon, rightIcon)
  const isHovered = isHoveringBounds(hovered, { x, y, width: actualWidth, height: sizeConfig.height })
  const colors = resolveViewColors(viewColors, disabled, isHovered)

  const centerX = x + actualWidth * 0.5
  const centerY = y + sizeConfig.height * 0.5

  if (colors.bgColor !== 'transparent') {
    batcher.roundedRect(x, y, actualWidth, sizeConfig.height, sizeConfig.borderRadius, {
      fillStyle: colors.bgColor,
      strokeStyle: colors.borderColor !== 'transparent' ? colors.borderColor : undefined,
      lineWidth: colors.borderColor !== 'transparent' ? DEFAULT_BORDER_WIDTH : 0,
    })
  } else if (colors.borderColor !== 'transparent') {
    batcher.roundedRect(x, y, actualWidth, sizeConfig.height, sizeConfig.borderRadius, {
      fillStyle: colors.bgColor,
      strokeStyle: colors.borderColor,
      lineWidth: DEFAULT_BORDER_WIDTH,
    })
  }

  const contentWidth = calculateContentWidth(textWidth, sizeConfig.iconSize, iconSpacing, leftIcon, rightIcon)
  let currentX = centerX - contentWidth * 0.5

  if (leftIcon) {
    const iconY = centerY - sizeConfig.iconSize * 0.5
    drawIcon(batcher, leftIcon, currentX, iconY, sizeConfig.iconSize, colors.textColor)
    currentX += sizeConfig.iconSize + iconSpacing
  }

  batcher.fillText(label, currentX, centerY, font, colors.textColor, 'middle', 'left')

  if (rightIcon) {
    const rightIconX = currentX + textWidth + iconSpacing
    const iconY = centerY - sizeConfig.iconSize * 0.5
    drawIcon(batcher, rightIcon, rightIconX, iconY, sizeConfig.iconSize, colors.textColor)
  }

  return { x, y, width: actualWidth, height: sizeConfig.height, actualWidth }
}

function calculateButtonWidth(
  width: number | 'auto',
  textWidth: number,
  iconSize: number,
  iconSpacing: number,
  leftIcon?: ButtonIcon,
  rightIcon?: ButtonIcon
): number {
  if (width !== 'auto') {
    return width
  }
  
  let iconsWidth = 0
  if (leftIcon) iconsWidth += iconSize + iconSpacing
  if (rightIcon) iconsWidth += iconSize + iconSpacing
  
  return textWidth + iconsWidth + DEFAULT_TEXT_PADDING
}

function calculateContentWidth(
  textWidth: number,
  iconSize: number,
  iconSpacing: number,
  leftIcon?: ButtonIcon,
  rightIcon?: ButtonIcon
): number {
  let contentWidth = textWidth
  if (leftIcon) contentWidth += iconSize + iconSpacing
  if (rightIcon) contentWidth += iconSize + iconSpacing
  return contentWidth
}

export function drawIconButton(
  batcher: DrawBatcher,
  x: number,
  y: number,
  size: number | 'auto',
  height: number,
  icon: ButtonIcon,
  theme: GridTheme,
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
  disabled = false,
  hovered: HoverState = false
): { x: number; y: number; width: number; height: number } {
  const paddingY = BUTTON_PADDING_Y
  const buttonHeight = height - paddingY * 2
  const iconSize = Math.min(buttonHeight - ICON_SIZE_ADJUSTMENT, MAX_ICON_SIZE)
  const actualSize = size === 'auto' ? iconSize : size
  const buttonY = y + paddingY
  const isHovered = isHoveringBounds(hovered, { x, y, width: actualSize, height })
  const colors = resolveButtonColors(theme, variant, disabled, isHovered)

  const centerX = x + actualSize * 0.5
  const centerY = buttonY + buttonHeight * 0.5
  const iconX = centerX - iconSize * 0.5
  const iconY = centerY - iconSize * 0.5

  batcher.roundedRect(x, buttonY, actualSize, buttonHeight, DEFAULT_BUTTON_RADIUS, {
    fillStyle: colors.bgColor,
    strokeStyle: colors.borderColor,
    lineWidth: DEFAULT_BORDER_WIDTH,
  })

  drawIcon(batcher, icon, iconX, iconY, iconSize, colors.iconColor)

  return { x, y: buttonY, width: actualSize, height: buttonHeight }
}

export function drawIconButtonWithView(
  batcher: DrawBatcher,
  x: number,
  y: number,
  icon: ButtonIcon,
  view: ButtonView = DEFAULT_VIEW,
  size: ButtonSize = DEFAULT_SIZE,
  disabled = false,
  hovered: HoverState = false
): { x: number; y: number; width: number; height: number } {
  const sizeConfig = SIZE_CONFIG[size]
  const viewColors = VIEW_COLORS[view]
  const buttonSize = sizeConfig.height
  const isHovered = isHoveringBounds(hovered, { x, y, width: buttonSize, height: buttonSize })
  const colors = resolveViewColors(viewColors, disabled, isHovered)

  const centerX = x + buttonSize * 0.5
  const centerY = y + buttonSize * 0.5
  const iconX = centerX - sizeConfig.iconSize * 0.5
  const iconY = centerY - sizeConfig.iconSize * 0.5

  if (colors.bgColor !== 'transparent') {
    batcher.roundedRect(x, y, buttonSize, buttonSize, sizeConfig.borderRadius, {
      fillStyle: colors.bgColor,
      strokeStyle: colors.borderColor !== 'transparent' ? colors.borderColor : undefined,
      lineWidth: colors.borderColor !== 'transparent' ? DEFAULT_BORDER_WIDTH : 0,
    })
  } else if (colors.borderColor !== 'transparent') {
    batcher.roundedRect(x, y, buttonSize, buttonSize, sizeConfig.borderRadius, {
      fillStyle: colors.bgColor,
      strokeStyle: colors.borderColor,
      lineWidth: DEFAULT_BORDER_WIDTH,
    })
  }

  drawIcon(batcher, icon, iconX, iconY, sizeConfig.iconSize, colors.iconColor)

  return { x, y, width: buttonSize, height: buttonSize }
}

const TAG_PADDING_X = 10
const TAG_PADDING_Y = 4
const TAG_MIN_HEIGHT = 18
const TAG_HEIGHT_OFFSET = 4
const TAG_MAX_RADIUS = 10
const DEFAULT_TAG_BACKGROUND = '#f0f3f9'
const DEFAULT_TAG_TEXT_COLOR = '#1f1f1f'
const DEFAULT_TEXT_HEIGHT = 14
const TEXT_METRICS_FALLBACK_ASCENT = 10
const TEXT_METRICS_FALLBACK_DESCENT = 4

export function drawTag(
  batcher: DrawBatcher,
  x: number,
  centerY: number,
  maxHeight: number,
  label: string,
  theme: GridTheme,
  textColor?: string,
  backgroundColor?: string,
  measureCtx?: CanvasRenderingContext2D
): { x: number; y: number; width: number; height: number } {
  const font = theme.baseFontFull
  const { textWidth, textHeight } = measureTagText(measureCtx, label, font)
  
  const desiredHeight = Math.max(TAG_MIN_HEIGHT, textHeight + TAG_PADDING_Y * 2)
  const availableHeight = Math.max(TAG_MIN_HEIGHT, maxHeight - TAG_HEIGHT_OFFSET)
  const tagHeight = Math.min(desiredHeight, availableHeight)
  const tagWidth = Math.ceil(textWidth + TAG_PADDING_X * 2)
  const radius = Math.min(tagHeight * 0.5, TAG_MAX_RADIUS)
  const tagTop = centerY - tagHeight * 0.5

  const fillColor = backgroundColor ?? theme.bgHeader ?? DEFAULT_TAG_BACKGROUND
  const strokeColor = theme.borderColor ?? fillColor
  const labelColor = textColor ?? theme.textDark ?? DEFAULT_TAG_TEXT_COLOR

  batcher.roundedRect(x, tagTop, tagWidth, tagHeight, radius, {
    fillStyle: fillColor,
    strokeStyle: strokeColor,
    lineWidth: DEFAULT_BORDER_WIDTH,
  })

  batcher.fillText(label, x + TAG_PADDING_X, centerY, font, labelColor, 'middle', 'left')

  return { x, y: tagTop, width: tagWidth, height: tagHeight }
}

function measureTagText(
  measureCtx: CanvasRenderingContext2D | undefined,
  label: string,
  font: string
): { textWidth: number; textHeight: number } {
  if (!measureCtx) {
    return { textWidth: 0, textHeight: DEFAULT_TEXT_HEIGHT }
  }

  const textWidth = getCachedTextWidth(measureCtx, label, font)
  measureCtx.font = font
  const metrics = measureCtx.measureText(label)
  const textHeight = (metrics.actualBoundingBoxAscent ?? TEXT_METRICS_FALLBACK_ASCENT) +
                     (metrics.actualBoundingBoxDescent ?? TEXT_METRICS_FALLBACK_DESCENT)

  return { textWidth, textHeight }
}

const DEFAULT_ACCENT_FG = '#ffffff'
const DEFAULT_SECONDARY_HOVER = 'rgba(30, 136, 229, 0.08)'
const DANGER_TEXT_COLOR = '#ffffff'

function resolveButtonColors(
  theme: GridTheme,
  variant: 'primary' | 'secondary' | 'danger',
  disabled: boolean,
  isHovered: boolean
): { bgColor: string; borderColor: string; textColor: string; iconColor: string } {
  if (disabled) {
    return {
      bgColor: theme.bgCell,
      borderColor: theme.borderColor,
      textColor: theme.textLight,
      iconColor: theme.textLight,
    }
  }

  switch (variant) {
    case 'primary':
      return resolvePrimaryColors(theme, isHovered)
    case 'secondary':
      return resolveSecondaryColors(theme, isHovered)
    case 'danger':
      return resolveDangerColors(isHovered)
    default:
      return resolvePrimaryColors(theme, isHovered)
  }
}

function resolvePrimaryColors(theme: GridTheme, isHovered: boolean) {
  const accentColor = theme.accentColor
  const bgColor = isHovered ? lightenColorCached(accentColor, LIGHTEN_AMOUNT) : accentColor
  return {
    bgColor,
    borderColor: bgColor,
    textColor: theme.accentFg || DEFAULT_ACCENT_FG,
    iconColor: theme.accentFg || DEFAULT_ACCENT_FG,
  }
}

function resolveSecondaryColors(theme: GridTheme, isHovered: boolean) {
  return {
    bgColor: isHovered ? (theme.accentLight || DEFAULT_SECONDARY_HOVER) : theme.bgCell,
    borderColor: theme.accentColor,
    textColor: theme.accentColor,
    iconColor: theme.accentColor,
  }
}

function resolveDangerColors(isHovered: boolean) {
  const bgColor = isHovered ? DANGER_COLOR_HOVER : DANGER_COLOR
  return {
    bgColor,
    borderColor: bgColor,
    textColor: DANGER_TEXT_COLOR,
    iconColor: DANGER_TEXT_COLOR,
  }
}

/**
 * Resolve colors for view-based buttons
 */
function resolveViewColors(
  viewColors: ViewColors,
  disabled: boolean,
  isHovered: boolean
): { bgColor: string; borderColor: string; textColor: string; iconColor: string } {
  if (disabled) {
    return {
      bgColor: '#E8EEF2',
      borderColor: '#D5DFE6',
      textColor: '#8A959D',
      iconColor: '#8A959D',
    }
  }

  return {
    bgColor: isHovered ? viewColors.bgColorHover : viewColors.bgColor,
    borderColor: viewColors.borderColor,
    textColor: viewColors.textColor,
    iconColor: viewColors.iconColor,
  }
}

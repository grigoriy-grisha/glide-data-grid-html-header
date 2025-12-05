import { isHoveringBounds } from './helpers'
import type { HoverState } from './types'
import {
  getIconSprite,
  getIconImageDirect,
  type ButtonIcon,
  type IconDefinition,
  type IconSpriteOptions,
  type IconSpriteStats,
  preloadIconSprites,
  registerIconDefinitions,
  resetIconSpriteCache,
  getIconSpriteStats,
} from './iconSprites'
import { DrawBatcher } from '../core/DrawBatcher'

export { preloadIconSprites, registerIconDefinitions, resetIconSpriteCache, getIconSpriteStats }
export type { ButtonIcon, IconDefinition, IconSpriteOptions, IconSpriteStats }

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
  if (!icon || size <= 0) {
    return
  }

  const sprite = getIconSprite(icon, size, color)
  if (sprite) {
    batcher.drawImage(sprite, x, y, size, size)
    return
  }
  
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
  theme: any,
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
  disabled = false,
  hovered: HoverState = false,
  leftIcon?: ButtonIcon,
  rightIcon?: ButtonIcon,
  measureCtx?: CanvasRenderingContext2D
): { x: number; y: number; width: number; height: number; actualWidth: number } {
  const paddingY = DEFAULT_BUTTON_PADDING_Y
  const buttonHeight = height - paddingY * 2
  const iconSize = Math.min(buttonHeight - DEFAULT_ICON_SIZE_ADJUSTMENT, DEFAULT_ICON_SIZE)
  const iconSpacing = DEFAULT_ICON_SPACING
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
  theme: any,
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
  theme: any,
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
  theme: any,
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

function resolvePrimaryColors(theme: any, isHovered: boolean) {
  const accentColor = theme.accentColor
  const bgColor = isHovered ? lightenColorCached(accentColor, LIGHTEN_AMOUNT) : accentColor
  return {
    bgColor,
    borderColor: bgColor,
    textColor: theme.accentFg || DEFAULT_ACCENT_FG,
    iconColor: theme.accentFg || DEFAULT_ACCENT_FG,
  }
}

function resolveSecondaryColors(theme: any, isHovered: boolean) {
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

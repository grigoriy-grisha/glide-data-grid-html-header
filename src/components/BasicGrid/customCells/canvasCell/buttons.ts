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
import { DrawBatcher } from '../../components/CanvasHeader/core/DrawBatcher'

export { preloadIconSprites, registerIconDefinitions, resetIconSpriteCache, getIconSpriteStats }
export type { ButtonIcon, IconDefinition, IconSpriteOptions, IconSpriteStats }

export const BUTTON_PADDING_Y = 4
export const ICON_SIZE_ADJUSTMENT = 4

// ─────────────────────────────────────────────────────────────────────────────
// Caches
// ─────────────────────────────────────────────────────────────────────────────

// Cache for lightenColor results
const lightenColorCache = new Map<string, string>()

// Cache for text measurements: key = "font|text"
const textMeasureCache = new Map<string, number>()

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

function getCachedTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  const key = font + '|' + text
  let width = textMeasureCache.get(key)
  if (width === undefined) {
    ctx.font = font
    width = ctx.measureText(text).width
    textMeasureCache.set(key, width)
  }
  return width
}

function lightenColorCached(color: string, amount: number): string {
  const key = color + '|' + amount
  let result = lightenColorCache.get(key)
  if (result === undefined) {
    result = lightenColorImpl(color, amount)
    lightenColorCache.set(key, result)
  }
  return result
}

function lightenColorImpl(color: string, amount: number): string {
  if (color.charCodeAt(0) === 35) { // '#'
    const num = parseInt(color.slice(1), 16)
    const r = Math.min(255, ((num >> 16) & 0xff) + amount)
    const g = Math.min(255, ((num >> 8) & 0xff) + amount)
    const b = Math.min(255, (num & 0xff) + amount)
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
  }
  return color
}

// Danger color constants
const DANGER_COLOR = '#d32f2f'
const DANGER_COLOR_HOVER = lightenColorImpl(DANGER_COLOR, 15)

// ─────────────────────────────────────────────────────────────────────────────
// Draw functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw an icon using the batcher.
 */
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

  // Get sprite or image for batched rendering
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

/**
 * Draw a button using the batcher.
 */
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
  /** Required for text measurement when width='auto' */
  measureCtx?: CanvasRenderingContext2D
): { x: number; y: number; width: number; height: number; actualWidth: number } {
  const paddingY = 4
  const buttonHeight = height - paddingY * 2
  const iconSize = Math.min(buttonHeight - 4, 16)
  const iconSpacing = 6
  const font = theme.baseFontFull

  // Calculate width
  let textWidth = 0
  if (measureCtx) {
    textWidth = getCachedTextWidth(measureCtx, label, font)
  }
  
  let actualWidth: number
  if (width === 'auto') {
    let iconsWidth = 0
    if (leftIcon) iconsWidth += iconSize + iconSpacing
    if (rightIcon) iconsWidth += iconSize + iconSpacing
    actualWidth = textWidth + iconsWidth + 4
  } else {
    actualWidth = width
  }

  const buttonY = y + paddingY
  const isHovered = isHoveringBounds(hovered, { x, y, width: actualWidth, height })

  // Resolve colors
  const colors = resolveButtonColors(theme, variant, disabled, isHovered)

  // Calculate content positioning
  const centerX = x + actualWidth * 0.5
  const centerY = buttonY + buttonHeight * 0.5

  let contentWidth = textWidth
  if (leftIcon) contentWidth += iconSize + iconSpacing
  if (rightIcon) contentWidth += iconSize + iconSpacing

  let currentX = centerX - contentWidth * 0.5

  // Draw button background
  batcher.roundedRect(x, buttonY, actualWidth, buttonHeight, 4, {
    fillStyle: colors.bgColor,
    strokeStyle: colors.borderColor,
    lineWidth: 1,
  })

  // Left icon
  if (leftIcon) {
    const iconY = centerY - iconSize * 0.5
    drawIcon(batcher, leftIcon, currentX, iconY, iconSize, colors.textColor)
    currentX += iconSize + iconSpacing
  }

  // Text
  batcher.fillText(label, currentX, centerY, font, colors.textColor, 'middle', 'left')

  // Right icon
  if (rightIcon) {
    const rightIconX = currentX + textWidth + iconSpacing
    const iconY = centerY - iconSize * 0.5
    drawIcon(batcher, rightIcon, rightIconX, iconY, iconSize, colors.textColor)
  }

  return { x, y: buttonY, width: actualWidth, height: buttonHeight, actualWidth }
}

/**
 * Draw an icon button using the batcher.
 */
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
  const iconSize = Math.min(buttonHeight - ICON_SIZE_ADJUSTMENT, 20)

  const actualSize = size === 'auto' ? iconSize : size
  const buttonY = y + paddingY

  const isHovered = isHoveringBounds(hovered, { x, y, width: actualSize, height })

  // Resolve colors
  const colors = resolveButtonColors(theme, variant, disabled, isHovered)

  // Calculate icon position
  const centerX = x + actualSize * 0.5
  const centerY = buttonY + buttonHeight * 0.5
  const iconX = centerX - iconSize * 0.5
  const iconY = centerY - iconSize * 0.5

  // Draw button background
  batcher.roundedRect(x, buttonY, actualSize, buttonHeight, 4, {
    fillStyle: colors.bgColor,
    strokeStyle: colors.borderColor,
    lineWidth: 1,
  })

  // Draw icon
  drawIcon(batcher, icon, iconX, iconY, iconSize, colors.iconColor)

  return { x, y: buttonY, width: actualSize, height: buttonHeight }
}

/**
 * Draw a tag using the batcher.
 */
export function drawTag(
  batcher: DrawBatcher,
  x: number,
  centerY: number,
  maxHeight: number,
  label: string,
  theme: any,
  textColor?: string,
  backgroundColor?: string,
  /** Required for text measurement */
  measureCtx?: CanvasRenderingContext2D
): { x: number; y: number; width: number; height: number } {
  const paddingX = 10
  const paddingY = 4
  const minHeight = 18
  const font = theme.baseFontFull

  let textWidth = 0
  let textHeight = 14
  if (measureCtx) {
    textWidth = getCachedTextWidth(measureCtx, label, font)
    measureCtx.font = font
    const metrics = measureCtx.measureText(label)
    textHeight = (metrics.actualBoundingBoxAscent ?? 10) + (metrics.actualBoundingBoxDescent ?? 4)
  }

  const desiredHeight = Math.max(minHeight, textHeight + paddingY * 2)
  const availableHeight = Math.max(minHeight, maxHeight - 4)
  const tagHeight = Math.min(desiredHeight, availableHeight)
  const tagWidth = Math.ceil(textWidth + paddingX * 2)
  const radius = Math.min(tagHeight * 0.5, 10)
  const tagTop = centerY - tagHeight * 0.5

  const fillColor = backgroundColor ?? theme.bgHeader ?? '#f0f3f9'
  const strokeColor = theme.borderColor ?? fillColor
  const labelColor = textColor ?? theme.textDark ?? '#1f1f1f'

  // Draw tag background
  batcher.roundedRect(x, tagTop, tagWidth, tagHeight, radius, {
    fillStyle: fillColor,
    strokeStyle: strokeColor,
    lineWidth: 1,
  })

  // Draw text
  batcher.fillText(label, x + paddingX, centerY, font, labelColor, 'middle', 'left')

  return { x, y: tagTop, width: tagWidth, height: tagHeight }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared color resolution helper
// ─────────────────────────────────────────────────────────────────────────────

function resolveButtonColors(
  theme: any,
  variant: 'primary' | 'secondary' | 'danger',
  disabled: boolean,
  isHovered: boolean
): { bgColor: string; borderColor: string; textColor: string; iconColor: string } {
  let bgColor: string
  let borderColor: string
  let textColor: string

  if (disabled) {
    bgColor = theme.bgCell
    borderColor = theme.borderColor
    textColor = theme.textLight
  } else if (variant === 'primary') {
    const accentColor = theme.accentColor
    if (isHovered) {
      const hoverColor = lightenColorCached(accentColor, 15)
      bgColor = hoverColor
      borderColor = hoverColor
    } else {
      bgColor = accentColor
      borderColor = accentColor
    }
    textColor = theme.accentFg || '#ffffff'
  } else if (variant === 'secondary') {
    bgColor = isHovered ? (theme.accentLight || 'rgba(30, 136, 229, 0.08)') : theme.bgCell
    borderColor = theme.accentColor
    textColor = theme.accentColor
  } else if (variant === 'danger') {
    if (isHovered) {
      bgColor = DANGER_COLOR_HOVER
      borderColor = DANGER_COLOR_HOVER
    } else {
      bgColor = DANGER_COLOR
      borderColor = DANGER_COLOR
    }
    textColor = '#ffffff'
  } else {
    bgColor = theme.accentColor
    borderColor = theme.accentColor
    textColor = theme.accentFg || '#ffffff'
  }

  return { bgColor, borderColor, textColor, iconColor: textColor }
}

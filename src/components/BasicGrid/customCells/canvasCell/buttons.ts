import { isHoveringBounds } from './helpers'
import type { HoverState } from './types'
import {
  drawIcon,
  type ButtonIcon,
  type IconDefinition,
  type IconSpriteOptions,
  type IconSpriteStats,
  preloadIconSprites,
  registerIconDefinitions,
  resetIconSpriteCache,
  getIconSpriteStats,
} from './iconSprites'

export { drawIcon, preloadIconSprites, registerIconDefinitions, resetIconSpriteCache, getIconSpriteStats }
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

// Check if native roundRect is available
const hasNativeRoundRect = typeof CanvasRenderingContext2D.prototype.roundRect === 'function'

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  if (hasNativeRoundRect) {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    ctx.closePath()
  } else {
    const r = radius
    const right = x + width
    const bottom = y + height
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(right - r, y)
    ctx.quadraticCurveTo(right, y, right, y + r)
    ctx.lineTo(right, bottom - r)
    ctx.quadraticCurveTo(right, bottom, right - r, bottom)
    ctx.lineTo(x + r, bottom)
    ctx.quadraticCurveTo(x, bottom, x, bottom - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}

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

export function drawButton(
  ctx: CanvasRenderingContext2D,
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
  rightIcon?: ButtonIcon
): { x: number; y: number; width: number; height: number; actualWidth: number } {
  const paddingY = 4
  const buttonHeight = height - paddingY * 2
  const iconSize = Math.min(buttonHeight - 4, 16)
  const iconSpacing = 6
  const font = theme.baseFontFull

  // Calculate width
  const textWidth = getCachedTextWidth(ctx, label, font)
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

  // Draw button background
  ctx.fillStyle = bgColor
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1

  drawRoundedRect(ctx, x, buttonY, actualWidth, buttonHeight, 4)
  ctx.fill()
  ctx.stroke()

  // Calculate content positioning
  const centerX = x + actualWidth * 0.5
  const centerY = buttonY + buttonHeight * 0.5

  let contentWidth = textWidth
  if (leftIcon) contentWidth += iconSize + iconSpacing
  if (rightIcon) contentWidth += iconSize + iconSpacing

  let currentX = centerX - contentWidth * 0.5

  // Draw left icon
  if (leftIcon) {
    const iconY = centerY - iconSize * 0.5
    drawIcon(ctx, leftIcon, currentX, iconY, iconSize, textColor)
    currentX += iconSize + iconSpacing
  }

  // Draw text
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = textColor
  ctx.fillText(label, currentX, centerY)

  // Draw right icon
  if (rightIcon) {
    currentX += textWidth + iconSpacing
    const iconY = centerY - iconSize * 0.5
    drawIcon(ctx, rightIcon, currentX, iconY, iconSize, textColor)
  }

  return { x, y: buttonY, width: actualWidth, height: buttonHeight, actualWidth }
}

export function drawIconButton(
  ctx: CanvasRenderingContext2D,
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
  let bgColor: string
  let borderColor: string
  let iconColor: string

  if (disabled) {
    bgColor = theme.bgCell
    borderColor = theme.borderColor
    iconColor = theme.textLight
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
    iconColor = theme.accentFg || '#ffffff'
  } else if (variant === 'secondary') {
    bgColor = isHovered ? (theme.accentLight || 'rgba(30, 136, 229, 0.08)') : theme.bgCell
    borderColor = theme.accentColor
    iconColor = theme.accentColor
  } else if (variant === 'danger') {
    if (isHovered) {
      bgColor = DANGER_COLOR_HOVER
      borderColor = DANGER_COLOR_HOVER
    } else {
      bgColor = DANGER_COLOR
      borderColor = DANGER_COLOR
    }
    iconColor = '#ffffff'
  } else {
    bgColor = theme.accentColor
    borderColor = theme.accentColor
    iconColor = theme.accentFg || '#ffffff'
  }

  // Draw button background
  ctx.fillStyle = bgColor
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1

  drawRoundedRect(ctx, x, buttonY, actualSize, buttonHeight, 4)
  ctx.fill()
  ctx.stroke()

  // Draw icon centered
  const centerX = x + actualSize * 0.5
  const centerY = buttonY + buttonHeight * 0.5
  const iconX = centerX - iconSize * 0.5
  const iconY = centerY - iconSize * 0.5

  drawIcon(ctx, icon, iconX, iconY, iconSize, iconColor)

  return { x, y: buttonY, width: actualSize, height: buttonHeight }
}

export function drawTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  centerY: number,
  maxHeight: number,
  label: string,
  theme: any,
  textColor?: string,
  backgroundColor?: string
): { x: number; y: number; width: number; height: number } {
  const paddingX = 10
  const paddingY = 4
  const minHeight = 18
  const font = theme.baseFontFull

  const textWidth = getCachedTextWidth(ctx, label, font)
  
  // For text height we still need fresh metrics (ascent/descent vary by content)
  ctx.font = font
  const metrics = ctx.measureText(label)
  const textHeight = (metrics.actualBoundingBoxAscent ?? 10) + (metrics.actualBoundingBoxDescent ?? 4)

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
  ctx.fillStyle = fillColor
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 1

  drawRoundedRect(ctx, x, tagTop, tagWidth, tagHeight, radius)
  ctx.fill()
  ctx.stroke()

  // Draw text
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = labelColor
  ctx.fillText(label, x + paddingX, centerY)

  return { x, y: tagTop, width: tagWidth, height: tagHeight }
}


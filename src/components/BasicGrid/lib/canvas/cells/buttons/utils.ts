import {
  CACHE_SEPARATOR,
  HEX_COLOR_PREFIX,
  HEX_COLOR_CHAR_CODE,
} from './constants'
import type { ButtonIcon } from '../iconSprites'

// Caches for performance
const lightenColorCache = new Map<string, string>()
const textMeasureCache = new Map<string, number>()

/**
 * Lighten a hex color by a given amount
 */
export function lightenColor(color: string, amount: number): string {
  if (color.charCodeAt(0) === HEX_COLOR_CHAR_CODE) {
    const num = parseInt(color.slice(1), 16)
    const r = Math.min(255, ((num >> 16) & 0xff) + amount)
    const g = Math.min(255, ((num >> 8) & 0xff) + amount)
    const b = Math.min(255, (num & 0xff) + amount)
    return `${HEX_COLOR_PREFIX}${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }
  return color
}

/**
 * Lighten a color with caching for performance
 */
export function lightenColorCached(color: string, amount: number): string {
  const key = `${color}${CACHE_SEPARATOR}${amount}`
  let result = lightenColorCache.get(key)
  if (result === undefined) {
    result = lightenColor(color, amount)
    lightenColorCache.set(key, result)
  }
  return result
}

/**
 * Get cached text width for performance
 */
export function getCachedTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  const key = `${font}${CACHE_SEPARATOR}${text}`
  let width = textMeasureCache.get(key)
  if (width === undefined) {
    ctx.font = font
    width = ctx.measureText(text).width
    textMeasureCache.set(key, width)
  }
  return width
}

/**
 * Calculate button width based on content
 */
export function calculateButtonWidth(
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

  // Add some padding for text
  const DEFAULT_TEXT_PADDING = 4
  return textWidth + iconsWidth + DEFAULT_TEXT_PADDING
}

/**
 * Calculate content width for centering
 */
export function calculateContentWidth(
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

/**
 * Clear all caches (useful for testing or memory management)
 */
export function clearButtonCaches(): void {
  lightenColorCache.clear()
  textMeasureCache.clear()
}


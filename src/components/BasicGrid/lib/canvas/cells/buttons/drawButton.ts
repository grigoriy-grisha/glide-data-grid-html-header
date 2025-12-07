import { DrawBatcher } from '../../core/DrawBatcher'
import { isHoveringBounds } from '../helpers'
import type { HoverState } from '../types'
import type { ButtonIcon } from '../iconSprites'
import type { GridTheme, ButtonView, ButtonSize, ButtonResult, ButtonVariant } from './types'
import {
  SIZE_CONFIG,
  VIEW_COLORS,
  BUTTON_PADDING_Y,
  ICON_SIZE_ADJUSTMENT,
  DEFAULT_ICON_SIZE,
  DEFAULT_BUTTON_RADIUS,
  DEFAULT_BORDER_WIDTH,
  DEFAULT_ICON_SPACING,
  DEFAULT_SIZE,
  DEFAULT_VIEW,
} from './constants'
import { getCachedTextWidth, calculateButtonWidth, calculateContentWidth } from './utils'
import { resolveButtonColors, resolveViewColors } from './colorResolvers'
import { drawIcon } from './drawIcon'

/**
 * Draw a button with theme-based styling
 */
export function drawButton(
  batcher: DrawBatcher,
  x: number,
  y: number,
  width: number | 'auto',
  height: number,
  label: string,
  theme: GridTheme,
  variant: ButtonVariant = 'primary',
  disabled = false,
  hovered: HoverState = false,
  leftIcon?: ButtonIcon,
  rightIcon?: ButtonIcon,
  measureCtx?: CanvasRenderingContext2D,
  iconSpacing: number = DEFAULT_ICON_SPACING
): ButtonResult {
  const paddingY = BUTTON_PADDING_Y
  const buttonHeight = height - paddingY * 2
  const iconSize = Math.min(buttonHeight - ICON_SIZE_ADJUSTMENT, DEFAULT_ICON_SIZE)
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
): ButtonResult {
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


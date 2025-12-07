import { DrawBatcher } from '../../core/DrawBatcher'
import { isHoveringBounds } from '../helpers'
import type { HoverState } from '../types'
import type { ButtonIcon } from '../iconSprites'
import type { GridTheme, ButtonView, ButtonSize, ButtonBounds, ButtonVariant } from './types'
import {
  SIZE_CONFIG,
  VIEW_COLORS,
  BUTTON_PADDING_Y,
  ICON_SIZE_ADJUSTMENT,
  MAX_ICON_SIZE,
  DEFAULT_BUTTON_RADIUS,
  DEFAULT_BORDER_WIDTH,
  DEFAULT_SIZE,
  DEFAULT_VIEW,
} from './constants'
import { resolveButtonColors, resolveViewColors } from './colorResolvers'
import { drawIcon } from './drawIcon'

/**
 * Draw an icon-only button with theme-based styling
 */
export function drawIconButton(
  batcher: DrawBatcher,
  x: number,
  y: number,
  size: number | 'auto',
  height: number,
  icon: ButtonIcon,
  theme: GridTheme,
  variant: ButtonVariant = 'primary',
  disabled = false,
  hovered: HoverState = false
): ButtonBounds {
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

/**
 * Draw an icon-only button with view and size support (sdds_finai__light theme)
 */
export function drawIconButtonWithView(
  batcher: DrawBatcher,
  x: number,
  y: number,
  icon: ButtonIcon,
  view: ButtonView = DEFAULT_VIEW,
  size: ButtonSize = DEFAULT_SIZE,
  disabled = false,
  hovered: HoverState = false
): ButtonBounds {
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


import type { GridTheme, ButtonVariant, ViewColors, ResolvedColors } from './types'
import {
  DANGER_COLOR,
  LIGHTEN_AMOUNT,
  DEFAULT_ACCENT_FG,
  DEFAULT_SECONDARY_HOVER,
  DANGER_TEXT_COLOR,
  DISABLED_BG_COLOR,
  DISABLED_BORDER_COLOR,
  DISABLED_TEXT_COLOR,
} from './constants'
import { lightenColor, lightenColorCached } from './utils'

// Pre-computed danger hover color
const DANGER_COLOR_HOVER = lightenColor(DANGER_COLOR, LIGHTEN_AMOUNT)

/**
 * Resolve colors for theme-based buttons
 */
export function resolveButtonColors(
  theme: GridTheme,
  variant: ButtonVariant,
  disabled: boolean,
  isHovered: boolean
): ResolvedColors {
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

/**
 * Resolve colors for primary variant
 */
export function resolvePrimaryColors(theme: GridTheme, isHovered: boolean): ResolvedColors {
  const accentColor = theme.accentColor
  const bgColor = isHovered ? lightenColorCached(accentColor, LIGHTEN_AMOUNT) : accentColor
  return {
    bgColor,
    borderColor: bgColor,
    textColor: theme.accentFg || DEFAULT_ACCENT_FG,
    iconColor: theme.accentFg || DEFAULT_ACCENT_FG,
  }
}

/**
 * Resolve colors for secondary variant
 */
export function resolveSecondaryColors(theme: GridTheme, isHovered: boolean): ResolvedColors {
  return {
    bgColor: isHovered ? (theme.accentLight || DEFAULT_SECONDARY_HOVER) : theme.bgCell,
    borderColor: theme.accentColor,
    textColor: theme.accentColor,
    iconColor: theme.accentColor,
  }
}

/**
 * Resolve colors for danger variant
 */
export function resolveDangerColors(isHovered: boolean): ResolvedColors {
  const bgColor = isHovered ? DANGER_COLOR_HOVER : DANGER_COLOR
  return {
    bgColor,
    borderColor: bgColor,
    textColor: DANGER_TEXT_COLOR,
    iconColor: DANGER_TEXT_COLOR,
  }
}

/**
 * Resolve colors for view-based buttons (sdds_finai__light theme)
 */
export function resolveViewColors(
  viewColors: ViewColors,
  disabled: boolean,
  isHovered: boolean
): ResolvedColors {
  if (disabled) {
    return {
      bgColor: DISABLED_BG_COLOR,
      borderColor: DISABLED_BORDER_COLOR,
      textColor: DISABLED_TEXT_COLOR,
      iconColor: DISABLED_TEXT_COLOR,
    }
  }

  return {
    bgColor: isHovered ? viewColors.bgColorHover : viewColors.bgColor,
    borderColor: viewColors.borderColor,
    textColor: viewColors.textColor,
    iconColor: viewColors.iconColor,
  }
}


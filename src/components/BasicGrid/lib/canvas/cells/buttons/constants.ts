import type { ButtonSize, ButtonView, SizeConfig, ViewColors } from './types'

// Size configurations for each button size
export const SIZE_CONFIG: Record<ButtonSize, SizeConfig> = {
  xs: { height: 24, fontSize: 12, borderRadius: 4, paddingX: 8, iconSize: 14 },
  s: { height: 32, fontSize: 13, borderRadius: 6, paddingX: 12, iconSize: 16 },
  m: { height: 40, fontSize: 14, borderRadius: 8, paddingX: 16, iconSize: 18 },
  l: { height: 48, fontSize: 16, borderRadius: 10, paddingX: 20, iconSize: 20 },
}

// View colors for each button view variant
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

// Button layout constants
export const BUTTON_PADDING_Y = 4
export const ICON_SIZE_ADJUSTMENT = 4
export const DEFAULT_ICON_SIZE = 16
export const MAX_ICON_SIZE = 20
export const DEFAULT_BUTTON_RADIUS = 4
export const DEFAULT_BORDER_WIDTH = 1
export const DEFAULT_ICON_SPACING = 6
export const DEFAULT_TEXT_PADDING = 4

// Default values
export const DEFAULT_SIZE: ButtonSize = 's'
export const DEFAULT_VIEW: ButtonView = 'default'

// Color constants
export const DANGER_COLOR = '#d32f2f'
export const DEFAULT_ACCENT_FG = '#ffffff'
export const DEFAULT_SECONDARY_HOVER = 'rgba(30, 136, 229, 0.08)'
export const DANGER_TEXT_COLOR = '#ffffff'

// Disabled state colors
export const DISABLED_BG_COLOR = '#E8EEF2'
export const DISABLED_BORDER_COLOR = '#D5DFE6'
export const DISABLED_TEXT_COLOR = '#8A959D'

// Cache constants
export const CACHE_SEPARATOR = '|'
export const HEX_COLOR_PREFIX = '#'
export const HEX_COLOR_CHAR_CODE = 35
export const LIGHTEN_AMOUNT = 15


export const HEADER_COLORS = ['#e3f2fd', '#f5f5f5', '#fafafa'] as const
export const HEADER_TEXT_COLORS = ['#1565c0', '#333333', '#666666'] as const
export const HEADER_FONT_SIZES = [14, 13, 12] as const

export const HEADER_BORDER_COLOR = '#d0d0d0'
export const HEADER_BACKGROUND_COLOR = '#ffffff'
export const HEADER_TEXT_PADDING = 8

export function getHeaderColor(level: number): string {
  return HEADER_COLORS[level] ?? HEADER_COLORS[HEADER_COLORS.length - 1]
}

export function getHeaderTextColor(level: number): string {
  return HEADER_TEXT_COLORS[level] ?? HEADER_TEXT_COLORS[HEADER_TEXT_COLORS.length - 1]
}

export function getHeaderFontSize(level: number): number {
  return HEADER_FONT_SIZES[level] ?? HEADER_FONT_SIZES[HEADER_FONT_SIZES.length - 1]
}

export function getHeaderFontWeight(level: number): 'bold' | 'normal' {
  return level <= 1 ? 'bold' : 'normal'
}


import { useMemo } from 'react'

interface UseGridThemeOptions {
  accentColor?: string
  accentLight?: string
  accentForeground?: string
}

const DEFAULT_ACCENT_COLOR = '#1e88e5'
const DEFAULT_ACCENT_LIGHT = 'rgba(30, 136, 229, 0.16)'
const DEFAULT_ACCENT_FOREGROUND = '#ffffff'

export function useGridTheme(options?: UseGridThemeOptions) {
  return useMemo(
    () => ({
      accentColor: options?.accentColor ?? DEFAULT_ACCENT_COLOR,
      accentLight: options?.accentLight ?? DEFAULT_ACCENT_LIGHT,
      accentFg: options?.accentForeground ?? DEFAULT_ACCENT_FOREGROUND,
    }),
    [options?.accentColor, options?.accentLight, options?.accentForeground]
  )
}



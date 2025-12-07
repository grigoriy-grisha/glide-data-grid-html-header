import type { GridTheme } from '../../../../types'

// Button view types based on sdds_finai__light theme
export type ButtonView =
  | 'default'
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'clear'
  | 'success'
  | 'warning'
  | 'critical'
  | 'dark'
  | 'black'
  | 'white'

// Button size types
export type ButtonSize = 'xs' | 's' | 'm' | 'l'

// Size configuration based on theme spacing
export interface SizeConfig {
  height: number
  fontSize: number
  borderRadius: number
  paddingX: number
  iconSize: number
}

// View colors based on sdds_finai__light theme
export interface ViewColors {
  bgColor: string
  bgColorHover: string
  borderColor: string
  textColor: string
  iconColor: string
}

// Resolved button colors
export interface ResolvedColors {
  bgColor: string
  borderColor: string
  textColor: string
  iconColor: string
}

// Button bounds for hit testing
export interface ButtonBounds {
  x: number
  y: number
  width: number
  height: number
}

// Extended button bounds with actualWidth
export interface ButtonResult extends ButtonBounds {
  actualWidth: number
}

// Button variant for theme-based buttons
export type ButtonVariant = 'primary' | 'secondary' | 'danger'

// Re-export GridTheme for convenience
export type { GridTheme }


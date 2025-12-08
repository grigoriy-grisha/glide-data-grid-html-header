import type { ReactElement } from 'react'

/** Icon can be a URL string, inline SVG, HTMLImageElement, or React element */
export type ButtonIcon = string | HTMLImageElement | ReactElement | null | undefined

/** Options for sprite generation */
export interface IconSpriteOptions {
  size: number
  color?: string
}

/** Definition for registering named icons */
export interface IconDefinition {
  name: string
  svg: string
}

/** Cache statistics for debugging */
export interface IconSpriteStats {
  requests: number
  hits: number
  misses: number
  cacheSize: number
  inFlight: number
}

/** Callback for icon load events */
export type IconLoadCallback = () => void

/** Resolved icon URL with cache key */
export interface ResolvedIcon {
  key: string
  url: string
}

/** Options for registering icon definitions */
export interface RegisterOptions {
  overwrite?: boolean
}



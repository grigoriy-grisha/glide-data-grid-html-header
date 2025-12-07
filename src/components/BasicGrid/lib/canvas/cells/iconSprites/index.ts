// Re-export types
export type {
  ButtonIcon,
  IconSpriteOptions,
  IconDefinition,
  IconSpriteStats,
  IconLoadCallback,
  ResolvedIcon,
  RegisterOptions,
} from './types'

// Re-export utilities
export { getDpr, hashString, createSvgDataUrl } from './utils'

// Re-export the main class
export { IconSpriteManager } from './IconSpriteManager'

// ============================================================================
// Default Instance & Backward-Compatible API
// ============================================================================

import { IconSpriteManager } from './IconSpriteManager'
import type { ButtonIcon, IconSpriteOptions, IconDefinition, IconSpriteStats, IconLoadCallback } from './types'

/** Default shared instance for backward compatibility */
export const defaultIconManager = new IconSpriteManager()

/** Subscribe to icon load events (for grid invalidation) */
export function onAnyIconLoad(callback: IconLoadCallback): () => void {
  return defaultIconManager.onLoad(callback)
}

/** Register named icon definitions */
export function registerIconDefinitions(
  definitions: IconDefinition[] | Record<string, string>,
  options: { overwrite?: boolean } = {}
): void {
  defaultIconManager.register(definitions, options)
}

/** Get cached sprite canvas (returns null if not ready, triggers load) */
export function getIconSprite(icon: ButtonIcon, size: number, color?: string): HTMLCanvasElement | null {
  return defaultIconManager.getSprite(icon, size, color)
}

/** Preload icons into cache */
export function preloadIconSprites(icons: ButtonIcon | ButtonIcon[], options: IconSpriteOptions): void {
  defaultIconManager.preload(icons, options)
}

/** Draw icon directly to context */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: ButtonIcon,
  x: number,
  y: number,
  size: number,
  color?: string
): void {
  defaultIconManager.draw(ctx, icon, x, y, size, color)
}

/** Get icon as HTMLImageElement (fallback for batcher) */
export function getIconImageDirect(icon: ButtonIcon, _color?: string): HTMLImageElement | null {
  return defaultIconManager.getImageDirect(icon)
}

/** Get cache statistics */
export function getIconSpriteStats(): IconSpriteStats {
  return defaultIconManager.getStats()
}

/** Clear all caches */
export function resetIconSpriteCache(): void {
  defaultIconManager.clearSpriteCache()
}

// Backward compatibility alias
export const drawIconDirect = drawIcon


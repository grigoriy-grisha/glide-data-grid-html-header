// ============================================================================
// Types
// ============================================================================

import type { ReactElement } from 'react'

export type ButtonIcon = string | HTMLImageElement | ReactElement | null | undefined

export type IconSpriteOptions = {
  size: number
  color?: string
}

export type IconDefinition = {
  name: string
  svg: string
}

export type IconSpriteStats = {
  requests: number
  hits: number
  misses: number
  cacheSize: number
  inFlight: number
}

export type IconLoadCallback = () => void

// ============================================================================
// Global State
// ============================================================================

const iconRegistry = new Map<string, string>()
const svgDataUrlCache = new Map<string, string>()
const spriteCache = new Map<string, HTMLCanvasElement>()
const pendingLoads = new Set<string>()
const loadListeners = new Set<IconLoadCallback>()

let inFlightCount = 0
let stats: IconSpriteStats = {
  requests: 0,
  hits: 0,
  misses: 0,
  cacheSize: 0,
  inFlight: 0,
}

// ============================================================================
// Helpers
// ============================================================================

function getDpr(): number {
  return typeof window !== 'undefined' ? Math.ceil(window.devicePixelRatio) : 1
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

function createSvgDataUrl(svg: string, color?: string): string {
  let processed = svg
  if (color) {
    processed = processed.replace(/currentColor/g, color)
    if (!processed.includes('fill=') && !processed.includes('stroke=')) {
      processed = processed.replace('<svg', `<svg fill="${color}"`)
    }
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(processed)}`
}

function resolveIconUrl(icon: string, color?: string): { key: string; url: string } {
  const colorKey = color ?? ''
  
  // Check registry
  const registered = iconRegistry.get(icon)
  if (registered) {
    const key = `r:${icon}:${colorKey}`
    if (!svgDataUrlCache.has(key)) {
      svgDataUrlCache.set(key, createSvgDataUrl(registered, color))
    }
    return { key, url: svgDataUrlCache.get(key)! }
  }

  // Inline SVG
  const trimmed = icon.trimStart()
  if (trimmed.startsWith('<svg')) {
    const key = `s:${hashString(trimmed)}:${colorKey}`
    if (!svgDataUrlCache.has(key)) {
      svgDataUrlCache.set(key, createSvgDataUrl(trimmed, color))
    }
    return { key, url: svgDataUrlCache.get(key)! }
  }

  // URL as-is
  return { key: `u:${icon}:${colorKey}`, url: icon }
}

function getSpriteKey(icon: ButtonIcon, size: number, color?: string): { key: string; url: string } | null {
  if (!icon || size <= 0) return null
  
  const rSize = size * getDpr()
  
  if (typeof icon === 'string') {
    const { key, url } = resolveIconUrl(icon, color)
    return { key: `${key}@${rSize}`, url }
  }
  
  if (icon instanceof HTMLImageElement) {
    return { key: `img:${icon.src}:${color ?? ''}@${rSize}`, url: icon.src }
  }
  
  return null
}

function loadSprite(key: string, url: string, size: number, notify: boolean): void {
  if (spriteCache.has(key) || pendingLoads.has(key)) return
  
  pendingLoads.add(key)
  inFlightCount++
  stats.inFlight = inFlightCount

  const img = new Image()
  img.src = url

  const rSize = size * getDpr()
  
  img.decode?.()
    .then(() => {
      const canvas = document.createElement('canvas')
      canvas.width = rSize
      canvas.height = rSize
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, rSize, rSize)
        spriteCache.set(key, canvas)
        stats.cacheSize = spriteCache.size
      }
      if (notify) {
        loadListeners.forEach(cb => cb())
      }
    })
    .catch(() => {})
    .finally(() => {
      pendingLoads.delete(key)
      inFlightCount--
      stats.inFlight = inFlightCount
      if (!notify && inFlightCount === 0) {
        loadListeners.forEach(cb => cb())
      }
    })
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Subscribe to icon load events (for grid invalidation)
 */
export function onAnyIconLoad(callback: IconLoadCallback): () => void {
  loadListeners.add(callback)
  return () => loadListeners.delete(callback)
}

/**
 * Register named icon definitions
 */
export function registerIconDefinitions(
  definitions: IconDefinition[] | Record<string, string>,
  options: { overwrite?: boolean } = {}
): void {
  const entries = Array.isArray(definitions)
    ? definitions
    : Object.entries(definitions).map(([name, svg]) => ({ name, svg }))
  
  for (const { name, svg } of entries) {
    if (name && svg && (options.overwrite || !iconRegistry.has(name))) {
      iconRegistry.set(name, svg)
    }
  }
}

/**
 * Get cached sprite canvas (returns null if not ready, triggers load)
 */
export function getIconSprite(icon: ButtonIcon, size: number, color?: string): HTMLCanvasElement | null {
  const resolved = getSpriteKey(icon, size, color)
  if (!resolved) return null
  
  stats.requests++
  
  const cached = spriteCache.get(resolved.key)
  if (cached) {
    stats.hits++
    return cached
  }
  
  stats.misses++
  loadSprite(resolved.key, resolved.url, size, true)
  return null
}

/**
 * Preload icons into cache
 */
export function preloadIconSprites(icons: ButtonIcon | ButtonIcon[], options: IconSpriteOptions): void {
  const list = Array.isArray(icons) ? icons : [icons]
  for (const icon of list) {
    const resolved = getSpriteKey(icon, options.size, options.color)
    if (resolved) {
      loadSprite(resolved.key, resolved.url, options.size, false)
    }
  }
}

/**
 * Draw icon directly to context
 */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: ButtonIcon,
  x: number,
  y: number,
  size: number,
  color?: string
): void {
  const sprite = getIconSprite(icon, size, color)
  if (sprite) {
    const rSize = size * getDpr()
    ctx.drawImage(sprite, 0, 0, rSize, rSize, x, y, size, size)
  }
}

/**
 * Get icon as HTMLImageElement (fallback for batcher)
 */
export function getIconImageDirect(icon: ButtonIcon, _color?: string): HTMLImageElement | null {
  if (!icon) return null
  
  if (icon instanceof HTMLImageElement) {
    return icon.complete && icon.naturalHeight !== 0 ? icon : null
  }
  
  return null
}

/**
 * Get cache statistics
 */
export function getIconSpriteStats(): IconSpriteStats {
  return { ...stats }
}

/**
 * Clear all caches
 */
export function resetIconSpriteCache(): void {
  spriteCache.clear()
  pendingLoads.clear()
  stats.cacheSize = 0
}

// Aliases for backward compatibility
export const drawIconDirect = drawIcon

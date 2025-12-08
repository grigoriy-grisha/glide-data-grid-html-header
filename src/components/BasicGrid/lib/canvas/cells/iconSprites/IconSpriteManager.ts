import type {
  ButtonIcon,
  IconSpriteOptions,
  IconDefinition,
  IconSpriteStats,
  IconLoadCallback,
  ResolvedIcon,
  RegisterOptions,
} from './types'
import { getDpr, hashString, createSvgDataUrl } from './utils'

/**
 * Manages icon sprite caching and rendering for canvas-based grids.
 * 
 * Features:
 * - Automatic sprite generation from SVG strings, URLs, or HTMLImageElements
 * - High-DPI support with device pixel ratio scaling
 * - Lazy loading with load event notifications
 * - Named icon registry for reusable definitions
 * - Cache statistics for debugging
 * 
 * @example
 * ```ts
 * const manager = new IconSpriteManager()
 * 
 * // Register named icons
 * manager.register([
 *   { name: 'edit', svg: '<svg>...</svg>' },
 *   { name: 'delete', svg: '<svg>...</svg>' }
 * ])
 * 
 * // Get sprite for rendering
 * const sprite = manager.getSprite('edit', 16, '#333')
 * if (sprite) {
 *   ctx.drawImage(sprite, x, y)
 * }
 * 
 * // Listen for load events to trigger redraws
 * manager.onLoad(() => grid.invalidate())
 * ```
 */
export class IconSpriteManager {
  private iconRegistry = new Map<string, string>()
  private svgDataUrlCache = new Map<string, string>()
  private spriteCache = new Map<string, HTMLCanvasElement>()
  private pendingLoads = new Set<string>()
  private loadListeners = new Set<IconLoadCallback>()
  private inFlightCount = 0
  
  private stats: IconSpriteStats = {
    requests: 0,
    hits: 0,
    misses: 0,
    cacheSize: 0,
    inFlight: 0,
  }

  /**
   * Subscribe to icon load events.
   * Useful for triggering grid redraws when icons finish loading.
   * 
   * @returns Unsubscribe function
   */
  onLoad(callback: IconLoadCallback): () => void {
    this.loadListeners.add(callback)
    return () => this.loadListeners.delete(callback)
  }

  /**
   * Register named icon definitions for use with string keys.
   * 
   * @param definitions - Array of {name, svg} or Record<name, svg>
   * @param options - Set overwrite: true to replace existing icons
   */
  register(
    definitions: IconDefinition[] | Record<string, string>,
    options: RegisterOptions = {}
  ): this {
    const entries = Array.isArray(definitions)
      ? definitions
      : Object.entries(definitions).map(([name, svg]) => ({ name, svg }))

    for (const { name, svg } of entries) {
      if (name && svg && (options.overwrite || !this.iconRegistry.has(name))) {
        this.iconRegistry.set(name, svg)
      }
    }
    
    return this
  }

  /**
   * Get cached sprite canvas for an icon.
   * Returns null if not ready and triggers async load.
   * 
   * @param icon - Icon source (name, URL, inline SVG, or HTMLImageElement)
   * @param size - Desired size in CSS pixels
   * @param color - Optional color for SVG icons
   */
  getSprite(icon: ButtonIcon, size: number, color?: string): HTMLCanvasElement | null {
    const resolved = this.resolveKey(icon, size, color)
    if (!resolved) return null

    this.stats.requests++

    const cached = this.spriteCache.get(resolved.key)
    if (cached) {
      this.stats.hits++
      return cached
    }

    this.stats.misses++
    this.loadSprite(resolved.key, resolved.url, size, true)
    return null
  }

  /**
   * Preload icons into cache without returning them.
   * Useful for warming the cache before rendering.
   */
  preload(icons: ButtonIcon | ButtonIcon[], options: IconSpriteOptions): this {
    const list = Array.isArray(icons) ? icons : [icons]
    for (const icon of list) {
      const resolved = this.resolveKey(icon, options.size, options.color)
      if (resolved) {
        this.loadSprite(resolved.key, resolved.url, options.size, false)
      }
    }
    return this
  }

  /**
   * Draw icon directly to a canvas context.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    icon: ButtonIcon,
    x: number,
    y: number,
    size: number,
    color?: string
  ): void {
    const sprite = this.getSprite(icon, size, color)
    if (sprite) {
      const rSize = size * getDpr()
      ctx.drawImage(sprite, 0, 0, rSize, rSize, x, y, size, size)
    }
  }

  /**
   * Get HTMLImageElement directly (for fallback rendering).
   */
  getImageDirect(icon: ButtonIcon): HTMLImageElement | null {
    if (!icon) return null
    if (icon instanceof HTMLImageElement) {
      return icon.complete && icon.naturalHeight !== 0 ? icon : null
    }
    return null
  }

  /**
   * Get cache statistics for debugging.
   */
  getStats(): IconSpriteStats {
    return { ...this.stats }
  }

  /**
   * Clear all caches and reset statistics.
   */
  reset(): this {
    this.spriteCache.clear()
    this.svgDataUrlCache.clear()
    this.pendingLoads.clear()
    this.stats = {
      requests: 0,
      hits: 0,
      misses: 0,
      cacheSize: 0,
      inFlight: 0,
    }
    return this
  }

  /**
   * Clear sprite cache only (keeps registry and data URLs).
   */
  clearSpriteCache(): this {
    this.spriteCache.clear()
    this.pendingLoads.clear()
    this.stats.cacheSize = 0
    return this
  }

  /**
   * Check if an icon name is registered.
   */
  has(name: string): boolean {
    return this.iconRegistry.has(name)
  }

  /**
   * Get registered SVG by name.
   */
  getSvg(name: string): string | undefined {
    return this.iconRegistry.get(name)
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private resolveKey(icon: ButtonIcon, size: number, color?: string): ResolvedIcon | null {
    if (!icon || size <= 0) return null

    const rSize = size * getDpr()

    if (typeof icon === 'string') {
      const { key, url } = this.resolveIconUrl(icon, color)
      return { key: `${key}@${rSize}`, url }
    }

    if (icon instanceof HTMLImageElement) {
      return { key: `img:${icon.src}:${color ?? ''}@${rSize}`, url: icon.src }
    }

    return null
  }

  private resolveIconUrl(icon: string, color?: string): ResolvedIcon {
    const colorKey = color ?? ''

    // Check registry first
    const registered = this.iconRegistry.get(icon)
    if (registered) {
      const key = `r:${icon}:${colorKey}`
      if (!this.svgDataUrlCache.has(key)) {
        this.svgDataUrlCache.set(key, createSvgDataUrl(registered, color))
      }
      return { key, url: this.svgDataUrlCache.get(key)! }
    }

    // Inline SVG
    const trimmed = icon.trimStart()
    if (trimmed.startsWith('<svg')) {
      const key = `s:${hashString(trimmed)}:${colorKey}`
      if (!this.svgDataUrlCache.has(key)) {
        this.svgDataUrlCache.set(key, createSvgDataUrl(trimmed, color))
      }
      return { key, url: this.svgDataUrlCache.get(key)! }
    }

    // URL as-is
    return { key: `u:${icon}:${colorKey}`, url: icon }
  }

  private loadSprite(key: string, url: string, size: number, notify: boolean): void {
    if (this.spriteCache.has(key) || this.pendingLoads.has(key)) return

    this.pendingLoads.add(key)
    this.inFlightCount++
    this.stats.inFlight = this.inFlightCount

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
          this.spriteCache.set(key, canvas)
          this.stats.cacheSize = this.spriteCache.size
        }
        if (notify) {
          this.notifyListeners()
        }
      })
      .catch(() => {})
      .finally(() => {
        this.pendingLoads.delete(key)
        this.inFlightCount--
        this.stats.inFlight = this.inFlightCount
        if (!notify && this.inFlightCount === 0) {
          this.notifyListeners()
        }
      })
  }

  private notifyListeners(): void {
    this.loadListeners.forEach(cb => cb())
  }
}



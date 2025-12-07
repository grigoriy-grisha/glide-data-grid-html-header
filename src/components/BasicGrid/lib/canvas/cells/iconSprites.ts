export type ButtonIcon = string | HTMLImageElement | null | undefined

export type IconSpriteOptions = {
  size: number
  color?: string
}

export type IconDefinition = {
  name: string
  svg: string
}

type IconDefinitionInput = IconDefinition[] | Record<string, string>

export type IconSpriteStats = {
  requests: number
  hits: number
  misses: number
  cacheSize: number
  inFlight: number
}

export type IconLoadCallback = () => void

// Global listeners for any icon load event (used for grid invalidation)
const globalIconLoadListeners = new Set<IconLoadCallback>()

export function onAnyIconLoad(callback: IconLoadCallback): () => void {
  globalIconLoadListeners.add(callback)
  return () => {
    globalIconLoadListeners.delete(callback)
  }
}

function notifyGlobalIconLoad(): void {
  globalIconLoadListeners.forEach(cb => cb())
}

const iconRegistry = new Map<string, string>()
const svgDataUrlCache = new Map<string, string>()

function createSVGDataURL(svgString: string, color?: string): string {
  let processedSVG = svgString

  if (color) {
    processedSVG = processedSVG.replace(/currentColor/g, color)
    // Add fill only if neither fill nor stroke is present
    if (processedSVG.indexOf('fill=') === -1 && processedSVG.indexOf('stroke=') === -1) {
      processedSVG = processedSVG.replace('<svg', `<svg fill="${color}"`)
    }
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(processedSVG)}`
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

function getDataUrl(icon: string, color?: string): { key: string; url: string } {
  const colorKey = color ?? 'default'
  
  // Check registry first
  const fromRegistry = iconRegistry.get(icon)
  if (fromRegistry) {
    const cacheKey = `reg:${icon}:${colorKey}`
    if (!svgDataUrlCache.has(cacheKey)) {
      svgDataUrlCache.set(cacheKey, createSVGDataURL(fromRegistry, color))
    }
    return { key: cacheKey, url: svgDataUrlCache.get(cacheKey)! }
  }

  // Check if inline SVG
  const trimmed = icon.trimStart()
  if (trimmed.startsWith('<svg')) {
    const cacheKey = `svg:${hashString(trimmed)}:${colorKey}`
    if (!svgDataUrlCache.has(cacheKey)) {
      svgDataUrlCache.set(cacheKey, createSVGDataURL(trimmed, color))
    }
    return { key: cacheKey, url: svgDataUrlCache.get(cacheKey)! }
  }

  // Already a URL
  return { key: `url:${icon}:${colorKey}`, url: icon }
}

function normalizeDefinitions(input: IconDefinitionInput): IconDefinition[] {
  if (Array.isArray(input)) {
    return input.filter((entry): entry is IconDefinition => Boolean(entry?.name && entry?.svg))
  }
  return Object.entries(input).map(([name, svg]) => ({ name, svg }))
}

export function registerIconDefinitions(
  definitions: IconDefinitionInput,
  options: { overwrite?: boolean } = {}
): void {
  const normalized = normalizeDefinitions(definitions)
  normalized.forEach(({ name, svg }) => {
    if (!name || !svg) return
    if (!options.overwrite && iconRegistry.has(name)) return
    iconRegistry.set(name, svg)
  })
}

/**
 * Simple sprite manager inspired by glide-data-grid SpriteManager
 * Uses image.decode() and caches sprites as HTMLCanvasElement
 */
class IconSpriteManager {
  private spriteMap = new Map<string, HTMLCanvasElement>()
  private pending = new Set<string>()
  private inFlight = 0
  private stats: IconSpriteStats = {
    requests: 0,
    hits: 0,
    misses: 0,
    cacheSize: 0,
    inFlight: 0,
  }

  drawSprite(
    ctx: CanvasRenderingContext2D,
    icon: ButtonIcon,
    x: number,
    y: number,
    size: number,
    color?: string
  ): void {
    if (!icon || size <= 0) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const rSize = Math.ceil(size * dpr)
    
    const colorKey = color ?? 'default'
    let spriteKey: string
    let imgUrl: string

    if (typeof icon === 'string') {
      const { key, url } = getDataUrl(icon, color)
      spriteKey = `${key}_${rSize}`
      imgUrl = url
    } else if (icon instanceof HTMLImageElement) {
      spriteKey = `img:${icon.src}_${colorKey}_${rSize}`
      imgUrl = icon.src
    } else {
      return
    }

    this.stats.requests++

    const spriteCanvas = this.spriteMap.get(spriteKey)
    if (spriteCanvas !== undefined) {
      this.stats.hits++
      ctx.drawImage(spriteCanvas, 0, 0, rSize, rSize, x, y, size, size)
      return
    }

    // Check if already loading
    if (this.pending.has(spriteKey)) {
      return
    }

    // Cache miss - start loading
    this.stats.misses++

    const imgSource = new Image()
    imgSource.src = imgUrl

    // Mark as pending
    this.pending.add(spriteKey)

    // Decode and draw
    const promise = imgSource.decode?.()
    if (!promise) {
      this.pending.delete(spriteKey)
      return
    }

    this.inFlight++
    this.stats.inFlight = this.inFlight

    promise
      .then(() => {
        // Create canvas and draw
        const canvas = document.createElement('canvas')
        canvas.width = rSize
        canvas.height = rSize
        const spriteCtx = canvas.getContext('2d')
        if (spriteCtx) {
          spriteCtx.imageSmoothingEnabled = true
          spriteCtx.imageSmoothingQuality = 'high'
          spriteCtx.drawImage(imgSource, 0, 0, rSize, rSize)
          this.spriteMap.set(spriteKey, canvas)
          this.stats.cacheSize = this.spriteMap.size
        }
      })
      .catch(() => {
        // Failed to decode
      })
      .finally(() => {
        this.pending.delete(spriteKey)
        this.inFlight--
        this.stats.inFlight = this.inFlight
        if (this.inFlight === 0) {
          notifyGlobalIconLoad()
        }
      })
  }

  getSprite(icon: ButtonIcon, size: number, color?: string): HTMLCanvasElement | null {
    if (!icon || size <= 0) return null

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const rSize = Math.ceil(size * dpr)
    const colorKey = color ?? 'default'
    
    let spriteKey: string
    let imgUrl: string
    
    if (typeof icon === 'string') {
      const { key, url } = getDataUrl(icon, color)
      spriteKey = `${key}_${rSize}`
      imgUrl = url
    } else if (icon instanceof HTMLImageElement) {
      spriteKey = `img:${icon.src}_${colorKey}_${rSize}`
      imgUrl = icon.src
    } else {
      return null
    }

    // Check cache
    const cached = this.spriteMap.get(spriteKey)
    if (cached) {
      return cached
    }

    // Not in cache - start loading if not already
    if (!this.pending.has(spriteKey)) {
      this.pending.add(spriteKey)

      const imgSource = new Image()
      imgSource.src = imgUrl

      const promise = imgSource.decode?.()
      if (promise) {
        this.inFlight++
        this.stats.inFlight = this.inFlight

        promise
          .then(() => {
            // Simple approach like glide-data-grid
            const canvas = document.createElement('canvas')
            canvas.width = rSize
            canvas.height = rSize
            const spriteCtx = canvas.getContext('2d')
            if (spriteCtx) {
              spriteCtx.drawImage(imgSource, 0, 0, rSize, rSize)
              this.spriteMap.set(spriteKey, canvas)
              this.stats.cacheSize = this.spriteMap.size
            }
            notifyGlobalIconLoad()
          })
          .catch((e) => {
            console.error('[IconSprites] Decode failed:', e)
          })
          .finally(() => {
            this.pending.delete(spriteKey)
            this.inFlight--
            this.stats.inFlight = this.inFlight
          })
      } else {
        this.pending.delete(spriteKey)
      }
    }

    return null
  }

  warmSprite(icon: ButtonIcon, size: number, color?: string): void {
    if (!icon || size <= 0) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const rSize = Math.ceil(size * dpr)
    const colorKey = color ?? 'default'

    let spriteKey: string
    let imgUrl: string

    if (typeof icon === 'string') {
      const { key, url } = getDataUrl(icon, color)
      spriteKey = `${key}_${rSize}`
      imgUrl = url
    } else if (icon instanceof HTMLImageElement) {
      spriteKey = `img:${icon.src}_${colorKey}_${rSize}`
      imgUrl = icon.src
    } else {
      return
    }

    // Already cached or loading
    if (this.spriteMap.has(spriteKey) || this.pending.has(spriteKey)) return

    this.pending.add(spriteKey)

    const imgSource = new Image()
    imgSource.src = imgUrl

    const promise = imgSource.decode?.()
    if (!promise) {
      this.pending.delete(spriteKey)
      return
    }

    this.inFlight++
    this.stats.inFlight = this.inFlight

    promise
      .then(() => {
        const canvas = document.createElement('canvas')
        canvas.width = rSize
        canvas.height = rSize
        const spriteCtx = canvas.getContext('2d')
        if (spriteCtx) {
          spriteCtx.drawImage(imgSource, 0, 0, rSize, rSize)
          this.spriteMap.set(spriteKey, canvas)
          this.stats.cacheSize = this.spriteMap.size
        }
      })
      .catch(() => {
        // Failed to decode
      })
      .finally(() => {
        this.pending.delete(spriteKey)
        this.inFlight--
        this.stats.inFlight = this.inFlight
        if (this.inFlight === 0) {
          notifyGlobalIconLoad()
        }
      })
  }

  clear(): void {
    this.spriteMap.clear()
    this.pending.clear()
    this.stats.cacheSize = 0
  }

  getStats(): IconSpriteStats {
    return { ...this.stats }
  }
}

const iconSpriteManager = new IconSpriteManager()

// Public API

export function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: ButtonIcon,
  x: number,
  y: number,
  size: number,
  color?: string
): void {
  iconSpriteManager.drawSprite(ctx, icon, x, y, size, color)
}

export const drawIconDirect = drawIcon

export function getIconSprite(
  icon: ButtonIcon,
  size: number,
  color?: string
): HTMLCanvasElement | null {
  return iconSpriteManager.getSprite(icon, size, color)
}

export function preloadIconSprites(
  icons: ButtonIcon | ButtonIcon[],
  options: IconSpriteOptions
): Promise<void> {
  const list = (Array.isArray(icons) ? icons : [icons]).filter(Boolean) as ButtonIcon[]
  list.forEach(icon => iconSpriteManager.warmSprite(icon, options.size, options.color))
    return Promise.resolve()
}

export function getIconSpriteStats(): IconSpriteStats {
  return iconSpriteManager.getStats()
}

export function resetIconSpriteCache(): void {
  iconSpriteManager.clear()
}

// Image cache for fallback rendering
const imageCache = new Map<string, HTMLImageElement>()

export function getIconImageDirect(icon: ButtonIcon, color?: string): HTMLImageElement | null {
  if (!icon) return null
  
  if (icon instanceof HTMLImageElement) {
    return icon.complete && icon.naturalHeight !== 0 ? icon : null
  }
  
  if (typeof icon === 'string') {
    const { key, url } = getDataUrl(icon, color)
    
    // Check cache
    let img = imageCache.get(key)
    if (img) {
      return img.complete && img.naturalHeight !== 0 ? img : null
    }
    
    // Create and cache image
    img = new Image()
    img.src = url
    imageCache.set(key, img)
    
    return null
  }
  
  return null
}

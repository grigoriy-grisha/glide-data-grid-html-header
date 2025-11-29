export type ButtonIcon = string | HTMLImageElement | null | undefined

export type IconSpriteOptions = {
  size: number
  color?: string
  smoothing?: boolean
}

export type IconDefinition = {
  name: string
  svg: string
}

type IconDefinitionInput = IconDefinition[] | Record<string, string>

type CanvasSprite = CanvasImageSource & { width: number; height: number }

type IconImageRecord = {
  image: HTMLImageElement
  sourceKey: string
}

export type IconSpriteStats = {
  requests: number
  hits: number
  misses: number
  warmed: number
  cacheSize: number
  pending: number
}

const iconSourceImages = new Map<string, HTMLImageElement>()
const svgDataUrlCache = new Map<string, string>()
const iconIdentity = new WeakMap<HTMLImageElement, string>()
const iconRegistry = new Map<string, string>()
let iconIdentityCursor = 0

const hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined'
const hasImageConstructor = typeof Image !== 'undefined'
const hasHTMLImageElement = typeof HTMLImageElement !== 'undefined'

function createSVGDataURL(svgString: string, color?: string): string {
  let processedSVG = svgString

  if (color) {
    processedSVG = processedSVG.replace(/currentColor/g, color)
    if (!processedSVG.includes('fill=') && !processedSVG.includes('stroke=')) {
      processedSVG = processedSVG.replace('<svg', `<svg fill="${color}"`)
    }
  }

  const encoded = encodeURIComponent(processedSVG)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

function getRegistrySVG(iconName: string): string | undefined {
  return iconRegistry.get(iconName)
}

function hashInlineIcon(svg: string): string {
  let hash = 0
  for (let i = 0; i < svg.length; i += 1) {
    hash = (hash << 5) - hash + svg.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

function getOrCreateDataUrl(
  cacheKey: string,
  svgString: string,
  color?: string
): { cacheKey: string; dataURL: string } {
  const colorAwareKey = `${cacheKey}__${color ?? 'default'}`
  if (svgDataUrlCache.has(colorAwareKey)) {
    return { cacheKey: colorAwareKey, dataURL: svgDataUrlCache.get(colorAwareKey)! }
  }
  const dataURL = createSVGDataURL(svgString, color)
  svgDataUrlCache.set(colorAwareKey, dataURL)
  return { cacheKey: colorAwareKey, dataURL }
}

function resolveIconSource(icon: string, color?: string): {
  cacheKey: string
  dataURL: string
} {
  const fromRegistry = getRegistrySVG(icon)
  if (fromRegistry) {
    return getOrCreateDataUrl(`registry:${icon}`, fromRegistry, color)
  }

  const trimmed = icon.trimStart()
  const isInlineSVG = trimmed.startsWith('<svg')

  if (isInlineSVG && !icon.startsWith('data:') && !icon.startsWith('http')) {
    return getOrCreateDataUrl(`inline:${hashInlineIcon(trimmed)}`, trimmed, color)
  }

  if (!icon.startsWith('data:') && !icon.startsWith('http')) {
    return getOrCreateDataUrl(icon, icon, color)
  }

  return { cacheKey: icon, dataURL: icon }
}

function getOrCreateIconImageRecord(icon: ButtonIcon, color?: string): IconImageRecord | null {
  if (!hasImageConstructor || !icon) {
    return null
  }

  if (typeof icon === 'string') {
    const { cacheKey, dataURL } = resolveIconSource(icon, color)
    if (iconSourceImages.has(cacheKey)) {
      return { image: iconSourceImages.get(cacheKey)!, sourceKey: cacheKey }
    }

    const img = new Image()
    img.decoding = 'async'
    img.src = dataURL
    iconSourceImages.set(cacheKey, img)
    return { image: img, sourceKey: cacheKey }
  }

  if (hasHTMLImageElement && icon instanceof HTMLImageElement) {
    if (!iconIdentity.has(icon)) {
      iconIdentityCursor += 1
      iconIdentity.set(icon, `html-img-${iconIdentityCursor}`)
    }
    return { image: icon, sourceKey: iconIdentity.get(icon)! }
  }

  return null
}

function getIconImage(icon: ButtonIcon, color?: string): HTMLImageElement | null {
  const record = getOrCreateIconImageRecord(icon, color)
  if (record?.image && record.image.complete && record.image.naturalHeight !== 0) {
    return record.image
  }
  return null
}

function buildVariantKey(recordKey: string, options: IconSpriteOptions): string {
  const { size, color, smoothing } = options
  return `${recordKey}|${size}|${color ?? 'default'}|sm=${smoothing === false ? 0 : 1}`
}

function createMemoryCanvas(size: number): HTMLCanvasElement | null {
  if (!hasDOM) return null
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
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
  if (normalized.length === 0) {
    return
  }

  normalized.forEach(({ name, svg }) => {
    if (!name || !svg) return
    if (!options.overwrite && iconRegistry.has(name)) return
    iconRegistry.set(name, svg)
  })
}

class IconSpriteManager {
  private sprites = new Map<string, CanvasSprite>()
  private pending = new Map<string, Promise<CanvasSprite | null>>()
  private stats: IconSpriteStats = {
    requests: 0,
    hits: 0,
    misses: 0,
    warmed: 0,
    cacheSize: 0,
    pending: 0,
  }

  getSprite(icon: ButtonIcon, options: IconSpriteOptions): CanvasSprite | null {
    if (!options.size || options.size <= 0) {
      return null
    }
    const record = getOrCreateIconImageRecord(icon, options.color)
    if (!record) {
      return null
    }

    const variantKey = buildVariantKey(record.sourceKey, options)
    this.stats.requests += 1
    const cached = this.sprites.get(variantKey)
    if (cached) {
      this.stats.hits += 1
      return cached
    }

    this.stats.misses += 1

    if (record.image.complete && record.image.naturalHeight !== 0) {
      const sprite = this.rasterize(record.image, options)
      if (sprite) {
        this.sprites.set(variantKey, sprite)
        this.stats.cacheSize = this.sprites.size
        return sprite
      }
    }

    this.scheduleWarm(record.image, variantKey, options)
    return null
  }

  warmSprite(icon: ButtonIcon, options: IconSpriteOptions): Promise<void> {
    if (!options.size || options.size <= 0) {
      return Promise.resolve()
    }
    const record = getOrCreateIconImageRecord(icon, options.color)
    if (!record) {
      return Promise.resolve()
    }
    const variantKey = buildVariantKey(record.sourceKey, options)
    if (this.sprites.has(variantKey)) {
      return Promise.resolve()
    }
    return this.scheduleWarm(record.image, variantKey, options)
  }

  clear() {
    this.sprites.clear()
    this.pending.clear()
    this.stats.cacheSize = 0
    this.stats.pending = 0
  }

  getStats(): IconSpriteStats {
    return {
      ...this.stats,
      cacheSize: this.sprites.size,
      pending: this.pending.size,
    }
  }

  private scheduleWarm(
    image: HTMLImageElement,
    variantKey: string,
    options: IconSpriteOptions
  ): Promise<void> {
    if (this.pending.has(variantKey)) {
      return this.pending.get(variantKey)!.then(() => undefined)
    }

    const promise = this.waitForImage(image)
      .then((loaded) => {
        if (!loaded) return null
        const sprite = this.rasterize(loaded, options)
        if (sprite) {
          this.sprites.set(variantKey, sprite)
          this.stats.warmed += 1
          this.stats.cacheSize = this.sprites.size
        }
        return sprite
      })
      .finally(() => {
        this.pending.delete(variantKey)
        this.stats.pending = this.pending.size
      })

    this.pending.set(variantKey, promise)
    this.stats.pending = this.pending.size
    return promise.then(() => undefined)
  }

  private waitForImage(image: HTMLImageElement): Promise<HTMLImageElement | null> {
    if (image.complete && image.naturalHeight !== 0) {
      return Promise.resolve(image)
    }

    return new Promise((resolve) => {
      const cleanup = () => {
        image.removeEventListener('load', onLoad)
        image.removeEventListener('error', onError)
      }
      const onLoad = () => {
        cleanup()
        resolve(image)
      }
      const onError = () => {
        cleanup()
        resolve(null)
      }
      image.addEventListener('load', onLoad, { once: true })
      image.addEventListener('error', onError, { once: true })
    })
  }

  private rasterize(source: CanvasImageSource, options: IconSpriteOptions): CanvasSprite | null {
    if (!hasDOM) {
      return source as CanvasSprite
    }
    const canvas = createMemoryCanvas(options.size)
    if (!canvas) {
      return source as CanvasSprite
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return source as CanvasSprite
    }
    ctx.clearRect(0, 0, options.size, options.size)
    ctx.imageSmoothingEnabled = options.smoothing !== false
    ctx.drawImage(source, 0, 0, options.size, options.size)
    return canvas
  }
}

const iconSpriteManager = new IconSpriteManager()

export function preloadIconSprites(
  icons: ButtonIcon | ButtonIcon[],
  options: IconSpriteOptions
): Promise<void> {
  const list = (Array.isArray(icons) ? icons : [icons]).filter(Boolean)
  if (!list.length) {
    return Promise.resolve()
  }
  return Promise.all(list.map((icon) => iconSpriteManager.warmSprite(icon!, options))).then(
    () => undefined
  )
}

export function getIconSpriteStats(): IconSpriteStats {
  return iconSpriteManager.getStats()
}

export function resetIconSpriteCache(): void {
  iconSpriteManager.clear()
}

export function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: ButtonIcon,
  x: number,
  y: number,
  size: number,
  color?: string
): void {
  if (!icon || size <= 0) {
    return
  }

  const sprite = iconSpriteManager.getSprite(icon, { size, color })
  if (sprite) {
    ctx.drawImage(sprite, x, y, size, size)
    return
  }

  const img = getIconImage(icon, color)
  if (img) {
    ctx.drawImage(img, x, y, size, size)
  }
}


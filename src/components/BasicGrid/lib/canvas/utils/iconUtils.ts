import { ReactElement, isValidElement } from 'react'
import { renderToString } from 'react-dom/server'

/**
 * Cache for converted React icon components to SVG strings.
 * Key is the component type + props hash, value is the SVG string.
 */
const iconCache = new Map<string, string>()

/**
 * Extracts SVG string from a rendered React component.
 * Caches the result for performance.
 */
export function reactIconToSvg(iconElement: ReactElement): string {
  // Create a cache key based on the component type and key props
  const cacheKey = createCacheKey(iconElement)

  const cached = iconCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const htmlString = renderToString(iconElement)

  const svgMatch = htmlString.match(/<svg[\s\S]*?<\/svg>/)

  if (!svgMatch) {
    console.warn('Could not extract SVG from React icon component:', iconElement.type)
    return ''
  }

  const svgString = svgMatch[0]
  iconCache.set(cacheKey, svgString)

  return svgString
}

/**
 * Creates a cache key for a React icon element.
 */
function createCacheKey(element: ReactElement): string {
  const type = element.type as { displayName?: string; name?: string } | string
  const typeName = typeof type === 'function' || typeof type === 'object'
    ? (type as { displayName?: string; name?: string }).displayName
      || (type as { name?: string }).name
      || 'Anonymous'
    : String(type)

  // Include relevant props in the cache key
  const { size, color, className } = (element.props || {}) as Record<string, unknown>

  // Simple hash of props that affect rendering
  const propsHash = JSON.stringify({ size, color, className })

  return `${typeName}:${propsHash}`
}

/**
 * Type guard to check if a value is a React element (icon component).
 */
export function isReactIcon(value: unknown): value is ReactElement {
  return isValidElement(value)
}

/**
 * Normalizes icon input - accepts either SVG string or React element.
 * Returns SVG string.
 */
export function normalizeIcon(icon: string | ReactElement): string {
  if (typeof icon === 'string') {
    return icon
  }

  if (isReactIcon(icon)) {
    return reactIconToSvg(icon)
  }

  return ''
}

/**
 * Clears the icon cache. Useful for testing or memory management.
 */
export function clearIconCache(): void {
  iconCache.clear()
}

/**
 * Returns the current size of the icon cache.
 */
export function getIconCacheSize(): number {
  return iconCache.size
}


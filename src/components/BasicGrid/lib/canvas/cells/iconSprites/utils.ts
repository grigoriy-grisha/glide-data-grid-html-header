/**
 * Get device pixel ratio (ceiling for crisp rendering)
 */
export function getDpr(): number {
  return typeof window !== 'undefined' ? Math.ceil(window.devicePixelRatio) : 1
}

/**
 * Fast string hash for cache keys
 */
export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

/**
 * Convert SVG string to data URL with optional color replacement
 */
export function createSvgDataUrl(svg: string, color?: string): string {
  let processed = svg
  if (color) {
    processed = processed.replace(/currentColor/g, color)
    if (!processed.includes('fill=') && !processed.includes('stroke=')) {
      processed = processed.replace('<svg', `<svg fill="${color}"`)
    }
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(processed)}`
}


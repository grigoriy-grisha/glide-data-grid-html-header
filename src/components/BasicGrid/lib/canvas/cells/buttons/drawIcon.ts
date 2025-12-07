import { DrawBatcher } from '../../core/DrawBatcher'
import {
  getIconSprite,
  getIconImageDirect,
  type ButtonIcon,
} from '../iconSprites'

/**
 * Draw an icon using cached sprite or fallback to source image
 */
export function drawIcon(
  batcher: DrawBatcher,
  icon: ButtonIcon,
  x: number,
  y: number,
  size: number,
  color?: string
): void {
  if (!icon || size <= 0) return

  // Try cached ImageBitmap first (GPU-accelerated)
  const bitmap = getIconSprite(icon, size, color)
  if (bitmap) {
    batcher.drawImage(bitmap, x, y, size, size)
    return
  }

  // Fallback to source image while bitmap is loading
  const img = getIconImageDirect(icon, color)
  if (img) {
    batcher.drawImage(img, x, y, size, size)
  }
}


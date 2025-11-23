import { isHoveringBounds } from './helpers'
import type { HoverState } from './types'

export type ButtonIcon = string | HTMLImageElement | null | undefined

const iconCache = new Map<string, HTMLImageElement>()

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

function getIconImage(icon: ButtonIcon, color?: string): HTMLImageElement | null {
  if (!icon) return null

  if (typeof icon === 'string') {
    let dataURL: string

    if (!icon.startsWith('data:') && !icon.startsWith('http')) {
      dataURL = createSVGDataURL(icon, color)
    } else {
      dataURL = icon
    }

    if (iconCache.has(dataURL)) {
      const cached = iconCache.get(dataURL)!
      if (cached.complete && cached.naturalHeight !== 0) {
        return cached
      }
    }

    const img = new Image()
    img.src = dataURL
    iconCache.set(dataURL, img)

    if (img.complete && img.naturalHeight !== 0) {
      return img
    }

    return null
  } else if (icon instanceof HTMLImageElement) {
    if (icon.complete && icon.naturalHeight !== 0) {
      return icon
    }
  }

  return null
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: ButtonIcon,
  x: number,
  y: number,
  size: number,
  color?: string
): void {
  const img = getIconImage(icon, color)
  if (img) {
    ctx.drawImage(img, x, y, size, size)
  }
}

export function drawButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number | 'auto',
  height: number,
  label: string,
  theme: any,
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
  disabled = false,
  hovered: HoverState = false,
  leftIcon?: ButtonIcon,
  rightIcon?: ButtonIcon
): { x: number; y: number; width: number; height: number; actualWidth: number } {
  const paddingX = 8
  const paddingY = 4
  const iconSize = Math.min(height - paddingY * 2 - 4, 16)
  const iconSpacing = 6

  let actualWidth: number
  if (width === 'auto') {
    ctx.font = theme.baseFontFull
    const textMetrics = ctx.measureText(label)
    const textWidth = textMetrics.width

    let iconsWidth = 0
    if (leftIcon) iconsWidth += iconSize + iconSpacing
    if (rightIcon) iconsWidth += iconSize + iconSpacing

    actualWidth = textWidth + iconsWidth + paddingX * 2 + 4
  } else {
    actualWidth = width
  }

  const buttonX = x + paddingX
  const buttonY = y + paddingY
  const buttonWidth = actualWidth - paddingX * 2
  const buttonHeight = height - paddingY * 2

  const isHovered = isHoveringBounds(hovered, { x, y, width: actualWidth, height })

  let bgColor: string
  let borderColor: string
  let textColor: string

  if (disabled) {
    bgColor = theme.bgCell
    borderColor = theme.borderColor
    textColor = theme.textLight
  } else {
    switch (variant) {
      case 'primary':
        bgColor = isHovered ? lightenColor(theme.accentColor, 15) : theme.accentColor
        borderColor = isHovered ? lightenColor(theme.accentColor, 15) : theme.accentColor
        textColor = theme.accentFg || '#ffffff'
        break
      case 'secondary':
        bgColor = isHovered ? theme.accentLight || 'rgba(30, 136, 229, 0.08)' : theme.bgCell
        borderColor = theme.accentColor
        textColor = theme.accentColor
        break
      case 'danger':
        bgColor = isHovered ? lightenColor('#d32f2f', 15) : '#d32f2f'
        borderColor = isHovered ? lightenColor('#d32f2f', 15) : '#d32f2f'
        textColor = '#ffffff'
        break
      default:
        bgColor = theme.accentColor
        borderColor = theme.accentColor
        textColor = theme.accentFg || '#ffffff'
    }
  }

  ctx.fillStyle = bgColor
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1

  const radius = 4
  ctx.beginPath()
  ctx.moveTo(buttonX + radius, buttonY)
  ctx.lineTo(buttonX + buttonWidth - radius, buttonY)
  ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + radius)
  ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - radius)
  ctx.quadraticCurveTo(
    buttonX + buttonWidth,
    buttonY + buttonHeight,
    buttonX + buttonWidth - radius,
    buttonY + buttonHeight
  )
  ctx.lineTo(buttonX + radius, buttonY + buttonHeight)
  ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - radius)
  ctx.lineTo(buttonX, buttonY + radius)
  ctx.quadraticCurveTo(buttonX, buttonY, buttonX + radius, buttonY)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  const centerX = buttonX + buttonWidth / 2
  const centerY = buttonY + buttonHeight / 2

  ctx.font = theme.baseFontFull
  const textMetrics = ctx.measureText(label)
  const textWidth = textMetrics.width

  let contentWidth = textWidth
  if (leftIcon) contentWidth += iconSize + iconSpacing
  if (rightIcon) contentWidth += iconSize + iconSpacing

  let currentX = centerX - contentWidth / 2

  if (leftIcon) {
    const iconY = centerY - iconSize / 2
    drawIcon(ctx, leftIcon, currentX, iconY, iconSize, textColor)
    currentX += iconSize + iconSpacing
  }

  ctx.font = theme.baseFontFull
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = textColor
  ctx.fillText(label, currentX, centerY)
  currentX += textWidth

  if (rightIcon) {
    currentX += iconSpacing
    const iconY = centerY - iconSize / 2
    drawIcon(ctx, rightIcon, currentX, iconY, iconSize, textColor)
  }

  return { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight, actualWidth }
}

export function drawIconButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number | 'auto',
  height: number,
  icon: ButtonIcon,
  theme: any,
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
  disabled = false,
  hovered: HoverState = false
): { x: number; y: number; width: number; height: number } {
  const paddingX = 8
  const paddingY = 4
  const iconSize = Math.min(height - paddingY * 2 - 4, 20)

  let actualSize: number
  if (size === 'auto') {
    actualSize = iconSize + paddingX * 2
  } else {
    actualSize = size
  }

  const buttonX = x + paddingX
  const buttonY = y + paddingY
  const buttonWidth = actualSize - paddingX * 2
  const buttonHeight = height - paddingY * 2

  const isHovered = isHoveringBounds(hovered, { x, y, width: actualSize, height })

  let bgColor: string
  let borderColor: string
  let iconColor: string

  if (disabled) {
    bgColor = theme.bgCell
    borderColor = theme.borderColor
    iconColor = theme.textLight
  } else {
    switch (variant) {
      case 'primary':
        bgColor = isHovered ? lightenColor(theme.accentColor, 15) : theme.accentColor
        borderColor = isHovered ? lightenColor(theme.accentColor, 15) : theme.accentColor
        iconColor = theme.accentFg || '#ffffff'
        break
      case 'secondary':
        bgColor = isHovered ? theme.accentLight || 'rgba(30, 136, 229, 0.08)' : theme.bgCell
        borderColor = theme.accentColor
        iconColor = theme.accentColor
        break
      case 'danger':
        bgColor = isHovered ? lightenColor('#d32f2f', 15) : '#d32f2f'
        borderColor = isHovered ? lightenColor('#d32f2f', 15) : '#d32f2f'
        iconColor = '#ffffff'
        break
      default:
        bgColor = theme.accentColor
        borderColor = theme.accentColor
        iconColor = theme.accentFg || '#ffffff'
    }
  }

  ctx.fillStyle = bgColor
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1

  const radius = 4
  ctx.beginPath()
  ctx.moveTo(buttonX + radius, buttonY)
  ctx.lineTo(buttonX + buttonWidth - radius, buttonY)
  ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + radius)
  ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - radius)
  ctx.quadraticCurveTo(
    buttonX + buttonWidth,
    buttonY + buttonHeight,
    buttonX + buttonWidth - radius,
    buttonY + buttonHeight
  )
  ctx.lineTo(buttonX + radius, buttonY + buttonHeight)
  ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - radius)
  ctx.lineTo(buttonX, buttonY + radius)
  ctx.quadraticCurveTo(buttonX, buttonY, buttonX + radius, buttonY)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  const centerX = buttonX + buttonWidth / 2
  const centerY = buttonY + buttonHeight / 2
  const iconX = centerX - iconSize / 2
  const iconY = centerY - iconSize / 2

  drawIcon(ctx, icon, iconX, iconY, iconSize, iconColor)

  return { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight }
}

function lightenColor(color: string, amount: number): string {
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16)
    const r = Math.min(255, ((num >> 16) & 0xff) + amount)
    const g = Math.min(255, ((num >> 8) & 0xff) + amount)
    const b = Math.min(255, (num & 0xff) + amount)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }
  return color
}


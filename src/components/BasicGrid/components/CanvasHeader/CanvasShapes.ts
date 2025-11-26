export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface HoverStyle {
  fillColor?: string
}

export interface ShapeStyle {
  fillColor?: string
  strokeColor?: string
  lineWidth?: number
  hover?: HoverStyle
  mousePosition?: { x: number; y: number } | null
}

export class CanvasShapes {
  private ctx: CanvasRenderingContext2D | null = null

  setContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx
  }

  drawRect(rect: Rect, style?: ShapeStyle): void {
    if (!this.ctx) {
      return
    }

    const x = Math.round(rect.x)
    const y = Math.round(rect.y)
    const width = Math.round(rect.width)
    const height = Math.round(rect.height)

    const { fillColor, strokeColor, lineWidth = 1, hover, mousePosition } = style || {}

    // Определяем, находится ли курсор над прямоугольником
    const isHovered = mousePosition !== null && mousePosition !== undefined &&
      mousePosition.x >= x &&
      mousePosition.x < x + width &&
      mousePosition.y >= y &&
      mousePosition.y < y + height

    const finalFillColor = isHovered && hover?.fillColor 
      ? hover.fillColor 
      : fillColor

    if (finalFillColor) {
      this.ctx.fillStyle = finalFillColor
      this.ctx.fillRect(x, y, width, height)
    }

    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor
      this.ctx.lineWidth = lineWidth
      this.ctx.strokeRect(x + lineWidth / 2, y + lineWidth / 2, width - lineWidth, height - lineWidth)
    }
  }

  adjustColorForHover(color: string): string {
    if (color === '#e3f2fd') {
      return '#bbdefb'
    }
    if (color === '#f5f5f5') {
      return '#e0e0e0'
    }
    if (color === '#fafafa') {
      return '#eeeeee'
    }
    if (color === '#ffffff') {
      return '#f5f5f5'
    }
    return color
  }

  drawSquare(x: number, y: number, size: number, style?: ShapeStyle): void {
    this.drawRect({ x, y, width: size, height: size }, style)
  }
}


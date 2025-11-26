export interface LineStyle {
  color?: string
  lineWidth?: number
}

export interface LinePosition {
  x1: number
  y1: number
  x2: number
  y2: number
}

export class CanvasLines {
  private ctx: CanvasRenderingContext2D | null = null

  setContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx
  }

  drawLine(position: LinePosition, style?: LineStyle): void {
    if (!this.ctx) {
      return
    }

    const {
      color = '#000000',
      lineWidth = 1,
    } = style || {}

    const { x1, y1, x2, y2 } = position

    this.ctx.strokeStyle = color
    this.ctx.lineWidth = lineWidth
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
  }
}


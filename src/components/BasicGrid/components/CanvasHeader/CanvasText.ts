export interface TextStyle {
  color?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number
  textAlign?: 'left' | 'center' | 'right'
  textBaseline?: 'top' | 'middle' | 'bottom' | 'alphabetic'
}

export interface TextPosition {
  x: number
  y: number
}

export class CanvasText {
  private ctx: CanvasRenderingContext2D | null = null

  setContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx
  }

  drawText(text: string, position: TextPosition, style?: TextStyle): void {
    if (!this.ctx) {
      return
    }

    const {
      color = '#000000',
      fontSize = 14,
      fontFamily = 'sans-serif',
      fontWeight = 'normal',
      textAlign = 'left',
      textBaseline = 'alphabetic',
    } = style || {}

    const x = Math.round(position.x)
    const y = Math.round(position.y)

    this.ctx.fillStyle = color
    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    this.ctx.textAlign = textAlign
    this.ctx.textBaseline = textBaseline

    this.ctx.imageSmoothingEnabled = true

    this.ctx.fillText(text, x, y)
  }
}


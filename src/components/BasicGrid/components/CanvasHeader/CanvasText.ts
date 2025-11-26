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
  private text: string
  private position: TextPosition
  private style: TextStyle

  constructor(text: string, position: TextPosition, style?: TextStyle) {
    this.text = text
    this.position = position
    this.style = style || {}
  }

  setContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx
  }

  getText(): string {
    return this.text
  }

  setText(text: string): void {
    this.text = text
  }

  getPosition(): TextPosition {
    return { ...this.position }
  }

  setPosition(position: TextPosition): void {
    this.position = position
  }

  getStyle(): TextStyle {
    return { ...this.style }
  }

  setStyle(style: TextStyle): void {
    this.style = { ...this.style, ...style }
  }

  draw(): void {
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
    } = this.style

    const x = Math.round(this.position.x)
    const y = Math.round(this.position.y)

    this.ctx.fillStyle = color
    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    this.ctx.textAlign = textAlign
    this.ctx.textBaseline = textBaseline
    this.ctx.imageSmoothingEnabled = true

    this.ctx.fillText(this.text, x, y)
  }
}

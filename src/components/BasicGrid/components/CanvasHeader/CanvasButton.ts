export interface ButtonStyle {
  fillColor?: string
  hoverFillColor?: string
  strokeColor?: string
  lineWidth?: number
  textColor?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number
  borderRadius?: number
  height?: number
  verticalAlign?: 'top' | 'center' | 'bottom'
  horizontalAlign?: 'left' | 'center' | 'right'
  onClick?: () => void
}

export interface ButtonRect {
  x: number
  y: number
  width: number
  height: number
}

export class CanvasButton {
  private ctx: CanvasRenderingContext2D | null = null
  private rect: ButtonRect
  private text: string
  private style: ButtonStyle
  private isHovered: boolean = false

  constructor(rect: ButtonRect, text: string, style?: ButtonStyle) {
    this.rect = rect
    this.text = text
    this.style = style || {}
  }

  setContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx
  }

  getRect(): ButtonRect {
    return { ...this.rect }
  }

  setRect(rect: ButtonRect): void {
    this.rect = rect
  }

  getText(): string {
    return this.text
  }

  setText(text: string): void {
    this.text = text
  }

  getStyle(): ButtonStyle {
    return { ...this.style }
  }

  setStyle(style: ButtonStyle): void {
    this.style = { ...this.style, ...style }
  }

  setIsHovered(isHovered: boolean): void {
    this.isHovered = isHovered
  }

  isPointInside(x: number, y: number): boolean {
    const {
      height: customHeight,
      verticalAlign = 'center',
    } = this.style

    // Вычисляем фактическую высоту
    const buttonHeight = customHeight !== undefined 
      ? Math.min(customHeight, this.rect.height)
      : this.rect.height

    // Вычисляем вертикальную позицию
    let buttonY = this.rect.y
    if (customHeight !== undefined && customHeight < this.rect.height) {
      switch (verticalAlign) {
        case 'top':
          buttonY = this.rect.y
          break
        case 'center':
          buttonY = this.rect.y + (this.rect.height - buttonHeight) / 2
          break
        case 'bottom':
          buttonY = this.rect.y + this.rect.height - buttonHeight
          break
      }
    }

    const buttonX = this.rect.x
    const buttonWidth = this.rect.width

    return (
      x >= buttonX &&
      x < buttonX + buttonWidth &&
      y >= buttonY &&
      y < buttonY + buttonHeight
    )
  }

  draw(): void {
    if (!this.ctx) {
      console.log('[CanvasButton] draw: no context')
      return
    }
    console.log('[CanvasButton] draw called', { rect: this.rect, text: this.text })

    const {
      height: customHeight,
      verticalAlign = 'center',
      horizontalAlign = 'center',
    } = this.style

    // Вычисляем фактическую высоту
    const buttonHeight = customHeight !== undefined 
      ? Math.min(customHeight, this.rect.height)
      : this.rect.height

    // Вычисляем вертикальную позицию
    let buttonY = this.rect.y
    if (customHeight !== undefined && customHeight < this.rect.height) {
      switch (verticalAlign) {
        case 'top':
          buttonY = this.rect.y
          break
        case 'center':
          buttonY = this.rect.y + (this.rect.height - buttonHeight) / 2
          break
        case 'bottom':
          buttonY = this.rect.y + this.rect.height - buttonHeight
          break
      }
    }

    // Вычисляем горизонтальную позицию
    let buttonX = this.rect.x
    let buttonWidth = this.rect.width
    if (horizontalAlign !== 'left') {
      // Если нужно центрирование или выравнивание справа, пока оставляем как есть
      // Можно расширить позже
      buttonX = this.rect.x
      buttonWidth = this.rect.width
    }

    const x = Math.round(buttonX)
    const y = Math.round(buttonY)
    const width = Math.round(buttonWidth)
    const height = Math.round(buttonHeight)

    const {
      fillColor,
      hoverFillColor,
      strokeColor,
      lineWidth = 1,
      textColor = '#000000',
      fontSize = 14,
      fontFamily = 'sans-serif',
      fontWeight = 'normal',
      borderRadius = 0,
    } = this.style

    const finalFillColor = this.isHovered && hoverFillColor 
      ? hoverFillColor 
      : fillColor

    // Функция для рисования скругленного прямоугольника
    const drawRoundedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
    }

    // Рисуем прямоугольник с заливкой
    if (finalFillColor) {
      this.ctx.fillStyle = finalFillColor
      if (borderRadius > 0) {
        drawRoundedRect(this.ctx, x, y, width, height, borderRadius)
        this.ctx.fill()
      } else {
        this.ctx.fillRect(x, y, width, height)
      }
    }

    // Рисуем обводку
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor
      this.ctx.lineWidth = lineWidth
      const offset = lineWidth / 2
      if (borderRadius > 0) {
        drawRoundedRect(this.ctx, x + offset, y + offset, width - lineWidth, height - lineWidth, Math.max(0, borderRadius - offset))
        this.ctx.stroke()
      } else {
        this.ctx.strokeRect(x + offset, y + offset, width - lineWidth, height - lineWidth)
      }
    }

    if (this.text) {
      this.ctx.fillStyle = textColor
      this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.imageSmoothingEnabled = true

      const textX = x + width / 2
      const textY = y + height / 2
      this.ctx.fillText(this.text, textX, textY)
    }
  }

  updateMousePosition(mouseX: number, mouseY: number): void {
    this.isHovered = this.isPointInside(mouseX, mouseY)
  }

  handleClick(x: number, y: number): boolean {
    if (this.isPointInside(x, y) && this.style.onClick) {
      this.style.onClick()
      return true
    }
    return false
  }

  getClickableArea(): { rect: ButtonRect; onClick: () => void } | null {
    if (!this.style.onClick) {
      return null
    }
    
    // Вычисляем фактический rect с учетом позиционирования
    const {
      height: customHeight,
      verticalAlign = 'center',
    } = this.style

    const buttonHeight = customHeight !== undefined 
      ? Math.min(customHeight, this.rect.height)
      : this.rect.height

    let buttonY = this.rect.y
    if (customHeight !== undefined && customHeight < this.rect.height) {
      switch (verticalAlign) {
        case 'top':
          buttonY = this.rect.y
          break
        case 'center':
          buttonY = this.rect.y + (this.rect.height - buttonHeight) / 2
          break
        case 'bottom':
          buttonY = this.rect.y + this.rect.height - buttonHeight
          break
      }
    }

    return {
      rect: {
        x: this.rect.x,
        y: buttonY,
        width: this.rect.width,
        height: buttonHeight,
      },
      onClick: this.style.onClick,
    }
  }
}


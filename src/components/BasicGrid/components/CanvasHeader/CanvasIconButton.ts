import { CanvasButton } from './CanvasButton'
import { CanvasIcon } from './CanvasIcon'
import { CanvasText } from './CanvasText'
import type { ButtonRect, ButtonStyle } from './CanvasButton'

export interface IconButtonStyle extends Omit<ButtonStyle, 'onClick'> {
  onClick?: () => void
  iconSize?: number
  iconColor?: string
  iconPosition?: 'left' | 'right' | 'top' | 'bottom'
  gapBetweenIconAndText?: number
  showText?: boolean // Показывать ли текст, если он передан
}

export interface IconButtonRect {
  x: number
  y: number
  width: number
  height: number
}

export class CanvasIconButton {
  private ctx: CanvasRenderingContext2D | null = null
  private rect: IconButtonRect
  private text: string
  private style: IconButtonStyle
  private button: CanvasButton
  private icon: CanvasIcon | null = null
  private textElement: CanvasText | null = null

  constructor(
    rect: IconButtonRect,
    text: string,
    iconSvg: string | null = null,
    style?: IconButtonStyle
  ) {
    this.rect = rect
    this.text = text
    this.style = style || {}
    
    const finalStyle = style || {}
    const showText = finalStyle.showText !== false && text.length > 0

    // Создаем внутреннюю кнопку без текста (текст нарисуем отдельно, если нужно)
    this.button = new CanvasButton(
      rect,
      '', // Без текста в самой кнопке
      {
        ...finalStyle,
        onClick: finalStyle.onClick,
      }
    )

    // Создаем иконку если предоставлена
    if (iconSvg) {
      const iconSize = finalStyle.iconSize ?? 16
      this.icon = new CanvasIcon(
        { x: 0, y: 0 },
        iconSvg,
        {
          width: iconSize,
          height: iconSize,
          color: finalStyle.iconColor || '#000000',
        }
      )
    }

    // Создаем текстовый элемент только если нужно показывать текст
    if (showText && text) {
      this.textElement = new CanvasText(
        text,
        { x: 0, y: 0 },
        {
          color: finalStyle.textColor || '#000000',
          fontSize: finalStyle.fontSize || 14,
          fontFamily: finalStyle.fontFamily || 'sans-serif',
          fontWeight: finalStyle.fontWeight || 'normal',
        }
      )
    }
  }

  setContext(ctx: CanvasRenderingContext2D | null, onIconLoad?: () => void): void {
    this.ctx = ctx
    this.button.setContext(ctx)
    if (this.icon) {
      this.icon.setContext(ctx)
      // Всегда устанавливаем callback, если он передан, чтобы перерисовать после загрузки
      if (onIconLoad) {
        this.icon.setOnLoadCallback(onIconLoad)
      }
    }
    if (this.textElement) {
      this.textElement.setContext(ctx)
    }
  }

  getRect(): IconButtonRect {
    return { ...this.rect }
  }

  setRect(rect: IconButtonRect): void {
    this.rect = rect
    this.button.setRect(rect)
    // Позиция иконки будет вычислена в draw() на основе текущего rect
  }

  getText(): string {
    return this.text
  }

  setText(text: string): void {
    this.text = text
    this.button.setText(text)
    if (this.textElement) {
      this.textElement.setText(text)
    }
  }

  getStyle(): IconButtonStyle {
    return { ...this.style }
  }

  setStyle(style: IconButtonStyle): void {
    this.style = { ...this.style, ...style }
    this.button.setStyle({
      ...style,
      onClick: style.onClick,
    })
    
    if (this.icon) {
      const iconStyle: any = {
        ...this.icon.getStyle(),
      }
      
      if (style.iconColor !== undefined) {
        iconStyle.color = style.iconColor || style.textColor || '#000000'
      }
      
      if (style.iconSize !== undefined) {
        iconStyle.width = style.iconSize
        iconStyle.height = style.iconSize
      }
      
      this.icon.setStyle(iconStyle)
    }
    
    if (this.textElement) {
      this.textElement.setStyle({
        ...this.textElement.getStyle(),
        color: style.textColor || '#000000',
        fontSize: style.fontSize || 14,
        fontFamily: style.fontFamily || 'sans-serif',
        fontWeight: style.fontWeight || 'normal',
      })
    }
  }

  setIsHovered(isHovered: boolean): void {
    this.button.setIsHovered(isHovered)
  }

  isPointInside(x: number, y: number): boolean {
    return this.button.isPointInside(x, y)
  }

  updateMousePosition(mouseX: number, mouseY: number): void {
    this.button.updateMousePosition(mouseX, mouseY)
  }

  handleClick(x: number, y: number): boolean {
    return this.button.handleClick(x, y)
  }

  getClickableArea(): { rect: ButtonRect; onClick: () => void } | null {
    return this.button.getClickableArea()
  }

  draw(): void {
    if (!this.ctx) {
      return
    }

    const {
      iconPosition = 'left',
      gapBetweenIconAndText = 6,
    } = this.style

    // Если нет иконки, просто рисуем кнопку без иконки
    if (!this.icon) {
      this.button.draw()
      return
    }

    // Рисуем кнопку (без текста в самой кнопке)
    this.button.draw()

    // Вычисляем размеры элементов
    let iconWidth = 0
    let iconHeight = 0
    let textWidth = 0
    let textHeight = 0

    const iconBounds = this.icon.getBounds()
    iconWidth = iconBounds.width
    iconHeight = iconBounds.height

    if (this.textElement && this.ctx) {
      const textStyle = this.textElement.getStyle()
      this.ctx.font = `${textStyle.fontWeight || 'normal'} ${textStyle.fontSize || 14}px ${textStyle.fontFamily || 'sans-serif'}`
      const textMetrics = this.ctx.measureText(this.textElement.getText())
      textWidth = textMetrics.width
      textHeight = textStyle.fontSize || 14
    }

    // Вычисляем общий размер содержимого
    const hasText = this.textElement !== null
    const isHorizontal = iconPosition === 'left' || iconPosition === 'right'
    const totalContentWidth = isHorizontal
      ? iconWidth + (hasText ? gapBetweenIconAndText + textWidth : 0)
      : Math.max(iconWidth, textWidth)
    
    const totalContentHeight = isHorizontal
      ? Math.max(iconHeight, textHeight || 0)
      : iconHeight + (hasText ? gapBetweenIconAndText + textHeight : 0)

    // Центрируем содержимое в кнопке
    const contentX = this.rect.x + (this.rect.width - totalContentWidth) / 2
    const contentY = this.rect.y + (this.rect.height - totalContentHeight) / 2

    // Позиционируем иконку (и текст, если есть)
    if (hasText) {
      // Если есть текст, используем логику позиционирования
      if (iconPosition === 'left') {
        // Иконка слева, текст справа
        const iconY = contentY + (totalContentHeight - iconHeight) / 2
        this.icon.setPosition({
          x: contentX + iconWidth / 2,
          y: iconY + iconHeight / 2,
        })
        this.icon.setStyle({
          ...this.icon.getStyle(),
          horizontalAlign: 'center',
          verticalAlign: 'center',
        })
        // Пытаемся нарисовать синхронно, если не получилось - вызываем асинхронный draw
        this.icon.drawSync()
        // Если изображение еще не загружено, вызываем draw для начала загрузки
        if (!this.icon.isLoaded()) {
          this.icon.draw()
        }

        if (this.textElement) {
          const textX = contentX + iconWidth + gapBetweenIconAndText
          const textY = contentY + (totalContentHeight - textHeight) / 2 + textHeight
          this.textElement.setPosition({
            x: textX,
            y: textY,
          })
          this.textElement.setStyle({
            ...this.textElement.getStyle(),
            textAlign: 'left',
            textBaseline: 'top',
          })
          this.textElement.draw()
        }
      } else if (iconPosition === 'right') {
        // Текст слева, иконка справа
        if (this.textElement) {
          const textX = contentX
          const textY = contentY + (totalContentHeight - textHeight) / 2 + textHeight
          this.textElement.setPosition({
            x: textX,
            y: textY,
          })
          this.textElement.setStyle({
            ...this.textElement.getStyle(),
            textAlign: 'left',
            textBaseline: 'top',
          })
          this.textElement.draw()
        }

        const iconX = contentX + textWidth + gapBetweenIconAndText + iconWidth / 2
        const iconY = contentY + (totalContentHeight - iconHeight) / 2 + iconHeight / 2
        this.icon.setPosition({
          x: iconX,
          y: iconY,
        })
        this.icon.setStyle({
          ...this.icon.getStyle(),
          horizontalAlign: 'center',
          verticalAlign: 'center',
        })
        // Пытаемся нарисовать синхронно, если не получилось - вызываем асинхронный draw
        this.icon.drawSync()
        // Если изображение еще не загружено, вызываем draw для начала загрузки
        if (!this.icon.isLoaded()) {
          this.icon.draw()
        }
      } else if (iconPosition === 'top') {
        // Иконка сверху, текст снизу
        const iconX = contentX + totalContentWidth / 2
        const iconY = contentY + iconHeight / 2
        this.icon.setPosition({
          x: iconX,
          y: iconY,
        })
        this.icon.setStyle({
          ...this.icon.getStyle(),
          horizontalAlign: 'center',
          verticalAlign: 'center',
        })
        // Пытаемся нарисовать синхронно, если не получилось - вызываем асинхронный draw
        this.icon.drawSync()
        // Если изображение еще не загружено, вызываем draw для начала загрузки
        if (!this.icon.isLoaded()) {
          this.icon.draw()
        }

        if (this.textElement) {
          const textX = contentX + totalContentWidth / 2
          const textY = contentY + iconHeight + gapBetweenIconAndText + textHeight
          this.textElement.setPosition({
            x: textX,
            y: textY,
          })
          this.textElement.setStyle({
            ...this.textElement.getStyle(),
            textAlign: 'center',
            textBaseline: 'top',
          })
          this.textElement.draw()
        }
      } else if (iconPosition === 'bottom') {
        // Текст сверху, иконка снизу
        if (this.textElement) {
          const textX = contentX + totalContentWidth / 2
          const textY = contentY + textHeight
          this.textElement.setPosition({
            x: textX,
            y: textY,
          })
          this.textElement.setStyle({
            ...this.textElement.getStyle(),
            textAlign: 'center',
            textBaseline: 'top',
          })
          this.textElement.draw()
        }

        const iconX = contentX + totalContentWidth / 2
        const iconY = contentY + textHeight + gapBetweenIconAndText + iconHeight / 2
        this.icon.setPosition({
          x: iconX,
          y: iconY,
        })
        this.icon.setStyle({
          ...this.icon.getStyle(),
          horizontalAlign: 'center',
          verticalAlign: 'center',
        })
        // Пытаемся нарисовать синхронно, если не получилось - вызываем асинхронный draw
        this.icon.drawSync()
        // Если изображение еще не загружено, вызываем draw для начала загрузки
        if (!this.icon.isLoaded()) {
          this.icon.draw()
        }
      }
    } else {
      // Только иконка, без текста - центрируем иконку
      // Убеждаемся, что контекст установлен
      if (this.icon && this.ctx) {
        this.icon.setContext(this.ctx)
      }
      
      const iconX = this.rect.x + this.rect.width / 2
      const iconY = this.rect.y + this.rect.height / 2
      this.icon.setPosition({
        x: iconX,
        y: iconY,
      })
      
      const iconStyle = this.icon.getStyle()
      this.icon.setStyle({
        ...iconStyle,
        horizontalAlign: 'center',
        verticalAlign: 'center',
        width: this.style.iconSize ?? 12,
        height: this.style.iconSize ?? 12,
      })
      
      // Пытаемся нарисовать синхронно
      const drawn = this.icon.drawSync()
      // Если изображение еще не нарисовано, вызываем draw для начала загрузки
      // Но если уже загружается, просто ждем callback
      if (!drawn && !this.icon.isLoading()) {
        this.icon.draw()
      }
    }
  }
}


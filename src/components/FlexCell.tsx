import { useRef, useEffect } from 'react'

// Типы для направления компоновки
export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse'
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around'
export type FlexJustify = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'

// Класс для элемента flex-ячейки с позицией и состоянием
export class FlexElement {
  id: string
  type: 'button' | 'text' | 'icon-button'
  content?: string
  icon?: HTMLImageElement | null
  width?: number | string
  height?: number | string
  onClick?: () => void
  progress: number = 0
  style?: {
    backgroundColor?: string
    textColor?: string
    borderRadius?: number
    padding?: number
    fontSize?: number
  }
  
  // Позиция и границы элемента (вычисляются при отрисовке)
  x: number = 0
  y: number = 0
  widthPx: number = 0
  heightPx: number = 0
  
  constructor(
    id: string,
    type: 'button' | 'text' | 'icon-button',
    config: {
      content?: string
      icon?: HTMLImageElement | null
      width?: number | string
      height?: number | string
      onClick?: () => void
      progress?: number
      style?: {
        backgroundColor?: string
        textColor?: string
        borderRadius?: number
        padding?: number
        fontSize?: number
      }
    }
  ) {
    this.id = id
    this.type = type
    this.content = config.content
    this.icon = config.icon
    this.width = config.width
    this.height = config.height
    this.onClick = config.onClick
    this.progress = config.progress || 0
    this.style = config.style
  }
  
  // Проверяет, находится ли точка (x, y) внутри элемента
  // x и y должны быть относительно начала ячейки
  contains(x: number, y: number): boolean {
    // Проверяем попадание точки в границы элемента
    // Добавляем небольшой запас для удобства клика
    const margin = 1
    const result = x >= this.x - margin && 
                   x <= this.x + this.widthPx + margin &&
                   y >= this.y - margin && 
                   y <= this.y + this.heightPx + margin
    return result
  }
  
  // Устанавливает позицию и размеры элемента
  setBounds(x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.widthPx = width
    this.heightPx = height
  }
}

// Конфигурация для элементов внутри flex-ячейки (для обратной совместимости)
export interface FlexItem {
  type: 'button' | 'text' | 'icon-button'
  content?: string // Текст или SVG иконка
  icon?: HTMLImageElement | null // Предзагруженная иконка
  width?: number | string // Число или 'auto' или процентная строка
  height?: number | string
  onClick?: () => void
  progress?: number // Для анимации ховера
  style?: {
    backgroundColor?: string
    textColor?: string
    borderRadius?: number
    padding?: number
    fontSize?: number
  }
}

// Конфигурация flex-контейнера
export interface FlexCellConfig {
  direction?: FlexDirection
  align?: FlexAlign // Выравнивание по поперечной оси
  justify?: FlexJustify // Выравнивание по главной оси
  gap?: number // Расстояние между элементами
  padding?: number // Внутренние отступы контейнера
  backgroundColor?: string
  items: FlexItem[]
}

interface FlexCellProps extends FlexCellConfig {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  width: number
  height: number
  elements?: FlexElement[] // Опциональный массив элементов с позициями
  onElementBounds?: (elements: FlexElement[]) => void // Callback для передачи позиций элементов
}

// Функция для интерполяции цветов
const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')
  
  const r1 = parseInt(hex1.substring(0, 2), 16)
  const g1 = parseInt(hex1.substring(2, 4), 16)
  const b1 = parseInt(hex1.substring(4, 6), 16)
  
  const r2 = parseInt(hex2.substring(0, 2), 16)
  const g2 = parseInt(hex2.substring(2, 4), 16)
  const b2 = parseInt(hex2.substring(4, 6), 16)
  
  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)
  
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')}`
}

// Рисует кнопку с текстом и/или иконкой
const drawButton = (
  ctx: CanvasRenderingContext2D,
  item: FlexItem,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  ctx.save()
  
  const progress = item.progress || 0
  const style = item.style || {}
  const padding = style.padding || 8
  const borderRadius = style.borderRadius || 8
  
  // Цвета кнопки
  const startColor1 = style.backgroundColor || '#1b5e20'
  const hoverColor1 = '#3949ab'
  const color1 = interpolateColor(startColor1, hoverColor1, progress)
  
  // Градиентный фон
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, interpolateColor('#2e7d32', '#5c6bc0', progress))
  
  // Рисуем скругленный прямоугольник
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(x + borderRadius, y)
  ctx.lineTo(x + width - borderRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius)
  ctx.lineTo(x + width, y + height - borderRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height)
  ctx.lineTo(x + borderRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius)
  ctx.lineTo(x, y + borderRadius)
  ctx.quadraticCurveTo(x, y, x + borderRadius, y)
  ctx.closePath()
  ctx.fill()
  
  // Тень при ховере
  if (progress > 0) {
    ctx.shadowColor = `rgba(102, 126, 234, ${0.3 * progress})`
    ctx.shadowBlur = 10 * progress
    ctx.shadowOffsetY = 4 * progress
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }
  
  // Граница
  ctx.strokeStyle = '#666666'
  ctx.lineWidth = 1.5
  ctx.stroke()
  
  // Содержимое кнопки
  const contentX = x + padding
  const contentY = y + height / 2
  const iconSize = 16
  
  // Рисуем иконку если есть
  if (item.icon && item.icon.complete) {
    const iconY = contentY - iconSize / 2
    ctx.drawImage(item.icon, contentX, iconY, iconSize, iconSize)
  }
  
  // Рисуем текст если есть
  if (item.content && item.type !== 'icon-button') {
    const fontSize = style.fontSize || 13
    ctx.fillStyle = style.textColor || '#ffffff'
    ctx.font = `bold ${fontSize + progress * 2}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    
    const textX = item.icon && item.icon.complete ? contentX + iconSize + 6 : contentX
    ctx.fillText(item.content, textX, contentY)
  }
  
  ctx.restore()
}

// Рисует только иконку-кнопку
const drawIconButton = (
  ctx: CanvasRenderingContext2D,
  item: FlexItem,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  ctx.save()
  
  const progress = item.progress || 0
  const style = item.style || {}
  const borderRadius = style.borderRadius || 8
  
  // Цвета кнопки
  const startColor1 = style.backgroundColor || '#1b5e20'
  const hoverColor1 = '#3949ab'
  const color1 = interpolateColor(startColor1, hoverColor1, progress)
  
  // Градиентный фон
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, interpolateColor('#2e7d32', '#5c6bc0', progress))
  
  // Рисуем скругленный прямоугольник (квадратный)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(x + borderRadius, y)
  ctx.lineTo(x + width - borderRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius)
  ctx.lineTo(x + width, y + height - borderRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height)
  ctx.lineTo(x + borderRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius)
  ctx.lineTo(x, y + borderRadius)
  ctx.quadraticCurveTo(x, y, x + borderRadius, y)
  ctx.closePath()
  ctx.fill()
  
  // Тень при ховере
  if (progress > 0) {
    ctx.shadowColor = `rgba(102, 126, 234, ${0.3 * progress})`
    ctx.shadowBlur = 10 * progress
    ctx.shadowOffsetY = 4 * progress
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }
  
  // Граница
  ctx.strokeStyle = '#666666'
  ctx.lineWidth = 1.5
  ctx.stroke()
  
  // Рисуем иконку по центру
  if (item.icon && item.icon.complete) {
    const iconSize = Math.min(width, height) - 8
    const iconX = x + (width - iconSize) / 2
    const iconY = y + (height - iconSize) / 2
    ctx.drawImage(item.icon, iconX, iconY, iconSize, iconSize)
  }
  
  ctx.restore()
}

// Рисует текст
const drawText = (
  ctx: CanvasRenderingContext2D,
  item: FlexItem,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  ctx.save()
  
  const style = item.style || {}
  const fontSize = style.fontSize || 14
  const padding = style.padding || 4
  
  ctx.fillStyle = style.textColor || '#000000'
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  
  if (item.content) {
    // Обрезаем текст если не помещается
    const maxWidth = width - padding * 2
    let text = item.content
    const metrics = ctx.measureText(text)
    if (metrics.width > maxWidth) {
      while (ctx.measureText(text + '...').width > maxWidth && text.length > 0) {
        text = text.slice(0, -1)
      }
      text += '...'
    }
    
    ctx.fillText(text, x + padding, y + height / 2)
  }
  
  ctx.restore()
}

// Вычисляет размеры элементов в flex-контейнере
const calculateFlexLayout = (
  items: FlexItem[],
  containerWidth: number,
  containerHeight: number,
  direction: FlexDirection,
  gap: number
): Array<{ x: number; y: number; width: number; height: number }> => {
  const isRow = direction === 'row' || direction === 'row-reverse'
  const isReverse = direction === 'row-reverse' || direction === 'column-reverse'
  
  const positions: Array<{ x: number; y: number; width: number; height: number }> = []
  
  // Вычисляем размеры элементов
  const itemSizes = items.map(item => {
    let width: number
    let height: number
    
    if (isRow) {
      // Для строкового направления
      if (typeof item.width === 'number') {
        width = item.width
      } else if (item.width === 'auto') {
        // Автоматический размер на основе типа
        if (item.type === 'icon-button') {
          width = item.height && typeof item.height === 'number' ? item.height : 32
        } else if (item.type === 'text') {
          width = 100 // Базовая ширина для текста
        } else {
          width = 120 // Базовая ширина для кнопки
        }
      } else {
        // Процентная строка
        const percent = parseFloat(item.width as string) / 100
        width = containerWidth * percent
      }
      
      height = typeof item.height === 'number' ? item.height : containerHeight
    } else {
      // Для колоночного направления
      width = typeof item.width === 'number' ? item.width : containerWidth
      
      if (typeof item.height === 'number') {
        height = item.height
      } else if (item.height === 'auto') {
        if (item.type === 'icon-button') {
          height = item.width && typeof item.width === 'number' ? item.width : 32
        } else {
          height = 32
        }
      } else {
        const percent = parseFloat(item.height as string) / 100
        height = containerHeight * percent
      }
    }
    
    return { width, height }
  })
  
  // Вычисляем позиции
  let currentPos = 0
  
  for (let i = 0; i < items.length; i++) {
    const index = isReverse ? items.length - 1 - i : i
    const size = itemSizes[index]
    
    let x: number, y: number
    
    if (isRow) {
      x = currentPos
      y = 0
      currentPos += size.width + gap
    } else {
      x = 0
      y = currentPos
      currentPos += size.height + gap
    }
    
    positions[index] = { x, y, width: size.width, height: size.height }
  }
  
  return positions
}

export const drawFlexCell = ({
  ctx,
  x,
  y,
  width,
  height,
  direction = 'row',
  align = 'center',
  justify = 'start',
  gap = 8,
  padding = 4,
  backgroundColor,
  items,
  elements,
  onElementBounds,
}: FlexCellProps) => {
  ctx.save()
  
  // Рисуем фон контейнера если указан
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(x, y, width, height)
  }
  
  // Вычисляем доступное пространство с учетом padding
  const innerX = x + padding
  const innerY = y + padding
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2
  
  // Если переданы элементы FlexElement, используем их, иначе создаем из items
  let flexElements: FlexElement[]
  if (elements && elements.length > 0) {
    flexElements = elements
  } else {
    // Создаем элементы из items для обратной совместимости
    flexElements = items.map((item, index) => {
      const element = new FlexElement(
        `item-${index}`,
        item.type,
        {
          content: item.content,
          icon: item.icon,
          width: item.width,
          height: item.height,
          onClick: item.onClick,
          progress: item.progress || 0,
          style: item.style,
        }
      )
      return element
    })
  }
  
  // Вычисляем позиции элементов
  const positions = calculateFlexLayout(
    flexElements.map(el => ({
      type: el.type,
      width: el.width,
      height: el.height,
    })),
    innerWidth,
    innerHeight,
    direction,
    gap
  )
  
  // Применяем justify (выравнивание по главной оси)
  const totalSize = positions.reduce((sum, pos, idx) => {
    const isRow = direction === 'row' || direction === 'row-reverse'
    return sum + (isRow ? pos.width : pos.height) + (idx < positions.length - 1 ? gap : 0)
  }, 0)
  
  const isRow = direction === 'row' || direction === 'row-reverse'
  const availableSpace = isRow ? innerWidth - totalSize : innerHeight - totalSize
  let offsetX = 0
  let offsetY = 0
  
  if (justify === 'center') {
    offsetX = isRow ? availableSpace / 2 : 0
    offsetY = isRow ? 0 : availableSpace / 2
  } else if (justify === 'end') {
    offsetX = isRow ? availableSpace : 0
    offsetY = isRow ? 0 : availableSpace
  } else if (justify === 'space-between' && positions.length > 1) {
    // spaceBetween будет применяться при отрисовке элементов
  } else if (justify === 'space-around' && positions.length > 0) {
    const spaceAround = availableSpace / (positions.length * 2)
    offsetX = isRow ? spaceAround : 0
    offsetY = isRow ? 0 : spaceAround
  }
  
  // Применяем align (выравнивание по поперечной оси)
  const maxCrossSize = Math.max(...positions.map(pos => isRow ? pos.height : pos.width))
  const crossSpace = (isRow ? innerHeight : innerWidth) - maxCrossSize
  let crossOffset = 0
  
  if (align === 'center') {
    crossOffset = crossSpace / 2
  } else if (align === 'end') {
    crossOffset = crossSpace
  }
  
  // Рисуем элементы и сохраняем их позиции
  flexElements.forEach((element, index) => {
    const pos = positions[index]
    // Вычисляем позицию элемента относительно innerX/innerY (с учетом padding)
    let relativeX = pos.x + offsetX
    let relativeY = pos.y + offsetY
    
    // Применяем crossOffset
    if (isRow) {
      relativeY += crossOffset
    } else {
      relativeX += crossOffset
    }
    
    // Обрабатываем space-between и space-around
    if (justify === 'space-between' && index > 0) {
      const spaceBetween = availableSpace / (positions.length - 1)
      if (isRow) {
        relativeX += spaceBetween * index
      } else {
        relativeY += spaceBetween * index
      }
    } else if (justify === 'space-around') {
      const spaceAround = availableSpace / (positions.length * 2)
      if (isRow) {
        relativeX += spaceAround * (index * 2 + 1)
      } else {
        relativeY += spaceAround * (index * 2 + 1)
      }
    }
    
    // Абсолютные координаты для отрисовки (на canvas)
    const itemX = innerX + relativeX
    const itemY = innerY + relativeY
    
    // Сохраняем позицию элемента относительно начала ячейки (x, y)
    // Это нужно для проверки hover, так как hoverX/hoverY тоже относительно начала ячейки
    // innerX = x + padding, innerY = y + padding
    // Поэтому: itemX - x = innerX + relativeX - x = (x + padding) + relativeX - x = padding + relativeX
    element.setBounds(padding + relativeX, padding + relativeY, pos.width, pos.height)
    
    // Рисуем элемент в зависимости от типа
    switch (element.type) {
      case 'button':
        drawButton(ctx, {
          type: element.type,
          content: element.content,
          icon: element.icon,
          progress: element.progress,
          style: element.style,
        }, itemX, itemY, pos.width, pos.height)
        break
      case 'icon-button':
        drawIconButton(ctx, {
          type: element.type,
          icon: element.icon,
          progress: element.progress,
          style: element.style,
        }, itemX, itemY, pos.width, pos.height)
        break
      case 'text':
        drawText(ctx, {
          type: element.type,
          content: element.content,
          style: element.style,
        }, itemX, itemY, pos.width, pos.height)
        break
    }
  })
  
  // Вызываем callback с элементами для передачи позиций
  if (onElementBounds) {
    onElementBounds(flexElements)
  }
  
  ctx.restore()
}

// Хук для предзагрузки SVG иконки
export const useFlexIcon = (iconSvg?: string) => {
  const iconRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (iconSvg && !iconRef.current) {
      const blob = new Blob([iconSvg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        iconRef.current = img
        URL.revokeObjectURL(url)
      }
      img.src = url
    }
  }, [iconSvg])

  return iconRef
}


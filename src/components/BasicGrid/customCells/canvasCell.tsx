import { GridCellKind, type CustomCell, type CustomRenderer } from '@glideapps/glide-data-grid'

export const CANVAS_CELL_KIND = 'canvas-cell'

// Хранилище для отслеживания состояния hover каждой ячейки
const hoverStateMap = new WeakMap<CanvasCellData, { hovered: boolean }>()

// Хранилище для сохранения renderData между вызовами draw и onClick
// Используем Map с ключом `${col}-${row}` или уникальным ID из данных строки
const renderDataMap = new Map<string, any>()

export interface CanvasCellData {
  kind: typeof CANVAS_CELL_KIND
  render: (ctx: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }, theme: any, hoverX: number | undefined, hoverY: number | undefined) => {
    hoveredAreas?: Array<{ x: number; y: number; width: number; height: number }>
    [key: string]: any // Дополнительные данные для onClick
  }
  onClick?: (x: number, y: number, rect: { x: number; y: number; width: number; height: number }, row?: any, rowIndex?: number, renderData?: any) => boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  copyData?: string
  renderData?: any // Данные из render для использования в onClick
}

export type CanvasCell = CustomCell<CanvasCellData>

// Функция для проверки, попадает ли точка в область
export function isPointInArea(
  x: number,
  y: number,
  area: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    x >= area.x &&
    x <= area.x + area.width &&
    y >= area.y &&
    y <= area.y + area.height
  )
}

export function createCanvasCell(
  render: (ctx: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }, theme: any, hoverX: number | undefined, hoverY: number | undefined) => {
    hoveredAreas?: Array<{ x: number; y: number; width: number; height: number }>
    [key: string]: any
  },
  onClick?: (x: number, y: number, rect: { x: number; y: number; width: number; height: number }, row?: any, rowIndex?: number, renderData?: any) => boolean,
  copyData?: string
): CanvasCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    readonly: true,
    copyData: copyData ?? '',
    data: {
      kind: CANVAS_CELL_KIND,
      render: render as CanvasCellData['render'],
      onClick: onClick as CanvasCellData['onClick'],
    },
  }
}

export function isCanvasCell(cell: CustomCell | undefined): cell is CanvasCell {
  return Boolean(cell && cell.kind === GridCellKind.Custom && (cell.data as CanvasCellData)?.kind === CANVAS_CELL_KIND)
}

export const canvasCellRenderer: CustomRenderer<CanvasCell> = {
  kind: GridCellKind.Custom,
  isMatch: (cell): cell is CanvasCell => (cell.data as CanvasCellData)?.kind === CANVAS_CELL_KIND,
  needsHover: true,
  needsHoverPosition: true,
  onClick: (args) => {
    const cell = args.cell as CanvasCell
    const rect = args.bounds
    const argsAny = args as any

    // Пытаемся получить координаты клика
    let clickX: number | undefined
    let clickY: number | undefined

    if (argsAny.posX !== undefined && argsAny.posY !== undefined) {
      clickX = argsAny.posX
      clickY = argsAny.posY
    } else if (argsAny.x !== undefined && argsAny.y !== undefined) {
      clickX = argsAny.x
      clickY = argsAny.y
    } else if (argsAny.location && Array.isArray(argsAny.location)) {
      clickX = argsAny.location[0]
      clickY = argsAny.location[1]
    }

    // Если координаты недоступны, блокируем клик
    if (clickX === undefined || clickY === undefined ||
        typeof clickX !== 'number' || typeof clickY !== 'number' ||
        isNaN(clickX) || isNaN(clickY)) {
      return undefined
    }

    // Определяем, относительные или абсолютные координаты
    let relativeX: number
    let relativeY: number

    if (clickX >= rect.x && clickX <= rect.x + rect.width &&
        clickY >= rect.y && clickY <= rect.y + rect.height) {
      relativeX = clickX - rect.x
      relativeY = clickY - rect.y
    } else {
      relativeX = clickX
      relativeY = clickY
    }

    // Получаем индексы ячейки для получения renderData
    let colIndex: number = -1
    let rowIndex: number = -1

    if (argsAny.location && Array.isArray(argsAny.location) && argsAny.location.length >= 2) {
      colIndex = argsAny.location[0] ?? -1
      rowIndex = argsAny.location[1] ?? -1
    } else if (argsAny.col !== undefined && argsAny.row !== undefined) {
      colIndex = argsAny.col
      rowIndex = argsAny.row
    } else if (argsAny.colIndex !== undefined && argsAny.rowIndex !== undefined) {
      colIndex = argsAny.colIndex
      rowIndex = argsAny.rowIndex
    }

    // Используем индексы для создания уникального ID ячейки
    const cellId = colIndex >= 0 && rowIndex >= 0
      ? `${colIndex}-${rowIndex}`
      : `${rect.x}-${rect.y}-${rect.width}-${rect.height}`

    // Получаем renderData из cell.data или из Map
    let renderData: any = cell.data.renderData
    if (!renderData) {
      renderData = renderDataMap.get(cellId)
    }

    // Глобальный обработчик кликов: проверяем координаты против всех clickHandlers
    if (renderData?.clickHandlers && Array.isArray(renderData.clickHandlers)) {
      for (const { area, handler } of renderData.clickHandlers) {
        // Проверяем, попал ли клик в область этого обработчика
        if (relativeX >= area.x && relativeX <= area.x + area.width &&
            relativeY >= area.y && relativeY <= area.y + area.height) {
          // Вызываем обработчик
          handler()
          return cell
        }
      }
    }

    // Если есть кастомный onClick в cell.data, вызываем его (для обратной совместимости)
    const { onClick } = cell.data
    if (onClick) {
      // Пытаемся получить данные строки из args (если доступны)
      let row: any = undefined
      if (argsAny.row !== undefined) {
        row = argsAny.row
      } else if (argsAny.rowData !== undefined) {
        row = argsAny.rowData
      }

      if (onClick(relativeX, relativeY, rect, row, rowIndex, renderData)) {
        return cell
      }
    }

    return undefined
  },
  draw: (args, cell) => {
    const { ctx, rect, theme } = args
    const { render, onMouseEnter, onMouseLeave } = cell.data
    const argsAny = args as any

    // Получаем индексы ячейки из args.location или других полей
    let colIndex: number = -1
    let rowIndex: number = -1

    if (argsAny.location && Array.isArray(argsAny.location) && argsAny.location.length >= 2) {
      // location обычно содержит [colIndex, rowIndex]
      colIndex = argsAny.location[0] ?? -1
      rowIndex = argsAny.location[1] ?? -1
    } else if (argsAny.col !== undefined && argsAny.row !== undefined) {
      colIndex = argsAny.col
      rowIndex = argsAny.row
    } else if (argsAny.colIndex !== undefined && argsAny.rowIndex !== undefined) {
      colIndex = argsAny.colIndex
      rowIndex = argsAny.rowIndex
    }

    // Используем индексы для создания уникального ID ячейки
    // Если индексы не найдены, используем координаты ячейки как fallback
    const cellId = colIndex >= 0 && rowIndex >= 0
      ? `${colIndex}-${rowIndex}`
      : `${rect.x}-${rect.y}-${rect.width}-${rect.height}`

    // Получаем координаты курсора
    const hoverX = argsAny.hoverX
    const hoverY = argsAny.hoverY

    // Преобразуем координаты курсора в относительные к ячейке
    // Glide Data Grid передает hoverX/hoverY уже в относительных координатах,
    // но для совместимости поддерживаем и абсолютные значения.
    let relativeHoverX: number | undefined
    let relativeHoverY: number | undefined

    if (hoverX !== undefined && hoverY !== undefined) {
      const isAbsoluteCoords =
        hoverX >= rect.x - 1 &&
        hoverX <= rect.x + rect.width + 1 &&
        hoverY >= rect.y - 1 &&
        hoverY <= rect.y + rect.height + 1

      const isRelativeCoords =
        hoverX >= -1 &&
        hoverX <= rect.width + 1 &&
        hoverY >= -1 &&
        hoverY <= rect.height + 1

      if (isAbsoluteCoords) {
        relativeHoverX = hoverX - rect.x
        relativeHoverY = hoverY - rect.y
      } else if (isRelativeCoords) {
        relativeHoverX = hoverX
        relativeHoverY = hoverY
      }
    }

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.clip()

    // Вызываем кастомную функцию отрисовки, которая возвращает информацию о hover областях
    const renderResult = render(ctx, rect, theme, relativeHoverX, relativeHoverY)
    const hoveredAreas = renderResult?.hoveredAreas ?? []

    // Сохраняем данные из render для использования в onClick
    const renderData = { ...renderResult }
    delete renderData.hoveredAreas

    // Сохраняем renderData в Map, используя внутренний уникальный ID ячейки
    renderDataMap.set(cellId, renderData)

    // Также сохраняем в cell.data - это основной способ передачи данных в onClick
    cell.data.renderData = renderData




    // Проверяем, находится ли курсор над какой-либо hover областью
    let isHovered = false
    if (relativeHoverX !== undefined && relativeHoverY !== undefined) {
      for (const area of hoveredAreas) {
        if (relativeHoverX >= area.x && relativeHoverX <= area.x + area.width &&
            relativeHoverY >= area.y && relativeHoverY <= area.y + area.height) {
          isHovered = true
          break
        }
      }
    }

    // Отслеживаем состояние hover для вызова обработчиков
    const currentState = hoverStateMap.get(cell.data)
    const wasHovered = currentState?.hovered ?? false

    if (isHovered && !wasHovered) {
      hoverStateMap.set(cell.data, { hovered: true })
      if (onMouseEnter) {
        onMouseEnter()
      }
    } else if (!isHovered && wasHovered) {
      hoverStateMap.set(cell.data, { hovered: false })
      if (onMouseLeave) {
        onMouseLeave()
      }
    }

    // Устанавливаем курсор pointer если hover над кнопкой
    if (isHovered) {
      args.overrideCursor?.('pointer')
    }

    ctx.restore()
  },
  onPaste: () => undefined,
}

// Типы для иконок
export type ButtonIcon = string | HTMLImageElement | null | undefined

// Кэш для загруженных изображений
const iconCache = new Map<string, HTMLImageElement>()

// Функция для создания data URL из SVG строки
function createSVGDataURL(svgString: string, color?: string): string {
  let processedSVG = svgString

  // Если указан цвет и SVG использует currentColor, заменяем его
  if (color) {
    // Заменяем currentColor на указанный цвет
    processedSVG = processedSVG.replace(/currentColor/g, color)
    // Если нет fill и stroke, добавляем fill с цветом
    if (!processedSVG.includes('fill=') && !processedSVG.includes('stroke=')) {
      processedSVG = processedSVG.replace('<svg', `<svg fill="${color}"`)
    }
  }

  // Кодируем SVG для data URL
  const encoded = encodeURIComponent(processedSVG)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

// Функция для получения или создания изображения из иконки
function getIconImage(icon: ButtonIcon, color?: string): HTMLImageElement | null {
  if (!icon) return null

  if (typeof icon === 'string') {
    let dataURL: string

    // Если это не data URL и не HTTP URL, предполагаем что это SVG код
    if (!icon.startsWith('data:') && !icon.startsWith('http')) {
      dataURL = createSVGDataURL(icon, color)
    } else {
      dataURL = icon
    }

    // Проверяем кэш
    if (iconCache.has(dataURL)) {
      const cached = iconCache.get(dataURL)!
      if (cached.complete && cached.naturalHeight !== 0) {
        return cached
      }
    }

    // Создаем новое изображение
    const img = new Image()
    img.src = dataURL
    iconCache.set(dataURL, img)

    // Если изображение уже загружено, возвращаем его
    if (img.complete && img.naturalHeight !== 0) {
      return img
    }

    // Иначе возвращаем null (изображение еще загружается)
    return null
  } else if (icon instanceof HTMLImageElement) {
    // Если это уже загруженное изображение
    if (icon.complete && icon.naturalHeight !== 0) {
      return icon
    }
  }

  return null
}

// Функция для отрисовки иконки
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

// Вспомогательные функции для отрисовки кнопки
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
  hovered: boolean | { hoverX?: number; hoverY?: number; rectX: number; rectY: number } = false,
  leftIcon?: ButtonIcon,
  rightIcon?: ButtonIcon
): { x: number; y: number; width: number; height: number, actualWidth: number } {
  const paddingX = 8
  const paddingY = 4
  const iconSize = Math.min(height - paddingY * 2 - 4, 16) // Размер иконки
  const iconSpacing = 6 // Отступ между иконкой и текстом

  // Если width === 'auto', вычисляем ширину на основе текста и иконок
  let actualWidth: number
  if (width === 'auto') {
    ctx.font = theme.baseFontFull
    const textMetrics = ctx.measureText(label)
    const textWidth = textMetrics.width

    let iconsWidth = 0
    if (leftIcon) iconsWidth += iconSize + iconSpacing
    if (rightIcon) iconsWidth += iconSize + iconSpacing

    actualWidth = textWidth + iconsWidth + paddingX * 2 + 4 // текст + иконки + отступы + небольшой запас
  } else {
    actualWidth = width
  }

  const buttonX = x + paddingX
  const buttonY = y + paddingY
  const buttonWidth = actualWidth - paddingX * 2
  const buttonHeight = height - paddingY * 2

  // Определяем hover состояние
  // Проверка ховера теперь выполняется через hoveredAreas в canvasCellRenderer.draw
  // Здесь просто используем переданное значение или вычисляем по координатам для обратной совместимости
  let isHovered = false
  if (typeof hovered === 'object' && hovered.hoverX !== undefined && hovered.hoverY !== undefined) {
    // hoverX и hoverY уже относительные к ячейке (передаются из renderComponents)
    // Используем внешние координаты кнопки (с padding) для проверки ховера
    // чтобы соответствовать hoveredAreas в renderButton
    const buttonOuterX = x // Внешняя координата X (с padding) - абсолютная
    const buttonOuterY = y // Внешняя координата Y (с padding) - абсолютная
    const buttonOuterWidth = actualWidth // Внешняя ширина (с padding)
    const buttonOuterHeight = height // Внешняя высота (с padding)
    
    // Преобразуем внешние координаты в относительные к ячейке
    const buttonOuterRelativeX = buttonOuterX - hovered.rectX
    const buttonOuterRelativeY = buttonOuterY - hovered.rectY

    // hoverX и hoverY уже относительные к ячейке, поэтому сравниваем напрямую
    isHovered = hovered.hoverX >= buttonOuterRelativeX &&
                hovered.hoverX <= buttonOuterRelativeX + buttonOuterWidth &&
                hovered.hoverY >= buttonOuterRelativeY &&
                hovered.hoverY <= buttonOuterRelativeY + buttonOuterHeight
  } else {
    isHovered = hovered as boolean
  }

  // Получаем цвета кнопки
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

  // Рисуем фон кнопки
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

  // Вычисляем позиции элементов
  const centerX = buttonX + buttonWidth / 2
  const centerY = buttonY + buttonHeight / 2

  // Вычисляем ширину текста для правильного позиционирования
  ctx.font = theme.baseFontFull
  const textMetrics = ctx.measureText(label)
  const textWidth = textMetrics.width

  // Общая ширина контента (иконки + текст)
  let contentWidth = textWidth
  if (leftIcon) contentWidth += iconSize + iconSpacing
  if (rightIcon) contentWidth += iconSize + iconSpacing

  // Начальная позиция для отрисовки (центрируем контент)
  let currentX = centerX - contentWidth / 2

  // Рисуем левую иконку
  if (leftIcon) {
    const iconY = centerY - iconSize / 2
    drawIcon(ctx, leftIcon, currentX, iconY, iconSize, textColor)
    currentX += iconSize + iconSpacing
  }

  // Рисуем текст
  ctx.font = theme.baseFontFull
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = textColor
  ctx.fillText(label, currentX, centerY)
  currentX += textWidth

  // Рисуем правую иконку
  if (rightIcon) {
    currentX += iconSpacing
    const iconY = centerY - iconSize / 2
    drawIcon(ctx, rightIcon, currentX, iconY, iconSize, textColor)
  }

  return { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight, actualWidth }
}

// Функция для отрисовки кнопки только с иконкой
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
  hovered: boolean | { hoverX?: number; hoverY?: number; rectX: number; rectY: number } = false
): { x: number; y: number; width: number; height: number } {
  const paddingX = 8
  const paddingY = 4
  const iconSize = Math.min(height - paddingY * 2 - 4, 20) // Размер иконки (немного больше для icon-only кнопки)

  // Если size === 'auto', вычисляем ширину на основе размера иконки
  let actualSize: number
  if (size === 'auto') {
    actualSize = iconSize + paddingX * 2 // иконка + отступы
  } else {
    actualSize = size
  }

  const buttonX = x + paddingX
  const buttonY = y + paddingY
  const buttonWidth = actualSize - paddingX * 2
  const buttonHeight = height - paddingY * 2

  // Определяем hover состояние, если передан объект с координатами
  let isHovered = false
  if (typeof hovered === 'object' && hovered.hoverX !== undefined && hovered.hoverY !== undefined) {
    // hoverX и hoverY уже относительные к ячейке
    // Используем внешние координаты кнопки (с padding) для проверки ховера
    // чтобы соответствовать hoveredAreas в renderButtonIcon
    const buttonOuterX = x // Внешняя координата X (с padding)
    const buttonOuterY = y // Внешняя координата Y (с padding)
    const buttonOuterWidth = actualSize // Внешняя ширина (с padding)
    const buttonOuterHeight = height // Внешняя высота (с padding)
    
    // Преобразуем внешние координаты в относительные к ячейке
    const buttonOuterRelativeX = buttonOuterX - hovered.rectX
    const buttonOuterRelativeY = buttonOuterY - hovered.rectY

    isHovered = hovered.hoverX >= buttonOuterRelativeX &&
                hovered.hoverX <= buttonOuterRelativeX + buttonOuterWidth &&
                hovered.hoverY >= buttonOuterRelativeY &&
                hovered.hoverY <= buttonOuterRelativeY + buttonOuterHeight
  } else {
    isHovered = hovered as boolean
  }

  // Получаем цвета кнопки
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

  // Рисуем фон кнопки (квадратная или круглая)
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

  // Рисуем иконку по центру кнопки
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


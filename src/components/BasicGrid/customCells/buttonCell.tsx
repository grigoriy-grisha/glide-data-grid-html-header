import { GridCellKind, type CustomCell, type CustomRenderer } from '@glideapps/glide-data-grid'

export const BUTTON_CELL_KIND = 'button-cell'

// Хранилище для отслеживания состояния hover каждой ячейки
// Используем WeakMap для автоматической очистки
const hoverStateMap = new WeakMap<ButtonCellData, { hovered: boolean }>()

export interface ButtonCellData {
  kind: typeof BUTTON_CELL_KIND
  label: string
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onMouseDown?: () => void
  onMouseUp?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  hovered?: boolean
  pressed?: boolean
}

export type ButtonCell = CustomCell<ButtonCellData>

export function createButtonCell(
  label: string,
  onClick?: () => void,
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
  disabled = false
): ButtonCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    readonly: true,
    copyData: label,
    data: {
      kind: BUTTON_CELL_KIND,
      label,
      onClick,
      variant,
      disabled,
    },
  }
}

export function isButtonCell(cell: CustomCell | undefined): cell is ButtonCell {
  return Boolean(cell && cell.kind === GridCellKind.Custom && (cell.data as ButtonCellData)?.kind === BUTTON_CELL_KIND)
}

function getButtonColors(
  variant: 'primary' | 'secondary' | 'danger',
  theme: any,
  disabled: boolean,
  hovered: boolean,
  pressed: boolean
) {
  if (disabled) {
    return {
      bg: theme.bgCell,
      border: theme.borderColor,
      text: theme.textLight,
      cursor: 'not-allowed',
    }
  }

  const baseColors = (() => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.accentColor,
          border: theme.accentColor,
          text: theme.accentFg || '#ffffff',
        }
      case 'secondary':
        return {
          bg: theme.bgCell,
          border: theme.accentColor,
          text: theme.accentColor,
        }
      case 'danger':
        return {
          bg: '#d32f2f',
          border: '#d32f2f',
          text: '#ffffff',
        }
      default:
        return {
          bg: theme.accentColor,
          border: theme.accentColor,
          text: theme.accentFg || '#ffffff',
        }
    }
  })()

  // Эффект нажатия
  if (pressed) {
    if (variant === 'secondary') {
      return {
        ...baseColors,
        bg: theme.accentLight || 'rgba(30, 136, 229, 0.1)',
        cursor: 'pointer',
      }
    } else {
      // Затемняем фон при нажатии
      const darken = (color: string, amount: number) => {
        if (color.startsWith('#')) {
          const num = parseInt(color.slice(1), 16)
          const r = Math.max(0, ((num >> 16) & 0xff) - amount)
          const g = Math.max(0, ((num >> 8) & 0xff) - amount)
          const b = Math.max(0, (num & 0xff) - amount)
          return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
        }
        return color
      }
      return {
        ...baseColors,
        bg: darken(baseColors.bg, 20),
        border: darken(baseColors.border, 20),
        cursor: 'pointer',
      }
    }
  }

  // Эффект ховера
  if (hovered) {
    if (variant === 'secondary') {
      return {
        ...baseColors,
        bg: theme.accentLight || 'rgba(30, 136, 229, 0.08)',
        cursor: 'pointer',
      }
    } else {
      // Осветляем фон при ховере
      const lighten = (color: string, amount: number) => {
        if (color.startsWith('#')) {
          const num = parseInt(color.slice(1), 16)
          const r = Math.min(255, ((num >> 16) & 0xff) + amount)
          const g = Math.min(255, ((num >> 8) & 0xff) + amount)
          const b = Math.min(255, (num & 0xff) + amount)
          return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
        }
        return color
      }
      return {
        ...baseColors,
        bg: lighten(baseColors.bg, 15),
        border: lighten(baseColors.border, 15),
        cursor: 'pointer',
      }
    }
  }

  return {
    ...baseColors,
    cursor: 'pointer',
  }
}

// Функция для проверки, попадает ли точка в область кнопки
// Принимает координаты относительно ячейки (relativeX, relativeY)
function isPointInButton(
  relativeX: number,
  relativeY: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  const paddingX = 8
  const paddingY = 4
  // Координаты кнопки относительно ячейки
  const buttonX = paddingX
  const buttonY = paddingY
  const buttonWidth = rect.width - paddingX * 2
  const buttonHeight = rect.height - paddingY * 2

  return (
    relativeX >= buttonX &&
    relativeX <= buttonX + buttonWidth &&
    relativeY >= buttonY &&
    relativeY <= buttonY + buttonHeight
  )
}

export const buttonCellRenderer: CustomRenderer<ButtonCell> = {
  kind: GridCellKind.Custom,
  isMatch: (cell): cell is ButtonCell => (cell.data as ButtonCellData)?.kind === BUTTON_CELL_KIND,
  needsHover: true,
  needsHoverPosition: true,
  onClick: (args) => {
    const cell = args.cell as ButtonCell
    const { onClick, disabled, onMouseUp, onMouseDown } = cell.data

    if (disabled || !onClick) {
      return undefined
    }

    // Проверяем, что клик был именно по кнопке, а не по всей ячейке
    const rect = args.bounds
    
    // Пытаемся получить координаты клика из args
    // В glide-data-grid координаты могут быть в разных свойствах
    const argsAny = args as any
    
    // Пробуем разные варианты получения координат
    let clickX: number | undefined
    let clickY: number | undefined
    
    // Вариант 1: posX/posY
    if (argsAny.posX !== undefined && argsAny.posY !== undefined) {
      clickX = argsAny.posX
      clickY = argsAny.posY
    }
    // Вариант 2: x/y
    else if (argsAny.x !== undefined && argsAny.y !== undefined) {
      clickX = argsAny.x
      clickY = argsAny.y
    }
    // Вариант 3: location
    else if (argsAny.location && Array.isArray(argsAny.location)) {
      clickX = argsAny.location[0]
      clickY = argsAny.location[1]
    }

    // Если координаты доступны, проверяем попадание в кнопку
    if (clickX !== undefined && clickY !== undefined && 
        typeof clickX === 'number' && typeof clickY === 'number' &&
        !isNaN(clickX) && !isNaN(clickY)) {
      
      // Координаты могут быть относительно канваса или ячейки
      // Определяем, какие координаты мы получили
      let relativeX: number
      let relativeY: number
      
      // Если координаты выходят за пределы ячейки, значит они абсолютные (относительно канваса)
      if (clickX >= rect.x && clickX <= rect.x + rect.width &&
          clickY >= rect.y && clickY <= rect.y + rect.height) {
        // Координаты уже абсолютные, преобразуем в относительные
        relativeX = clickX - rect.x
        relativeY = clickY - rect.y
      } else {
        // Координаты уже относительные
        relativeX = clickX
        relativeY = clickY
      }
      
      // Проверяем попадание в кнопку используя относительные координаты
      const isInButton = isPointInButton(relativeX, relativeY, rect)
      
      if (!isInButton) {
        // Клик был не по кнопке, игнорируем
        return undefined
      }
    } else {
      // Если координаты недоступны, блокируем клик для безопасности
      // (чтобы не обрабатывать клики по всей ячейке)
      return undefined
    }

    // Вызываем onMouseDown перед onClick (симуляция нажатия)
    if (onMouseDown) {
      onMouseDown()
    }

    // Вызываем onClick при клике по кнопке
    onClick()

    // Вызываем onMouseUp после onClick (симуляция отпускания)
    if (onMouseUp) {
      onMouseUp()
    }

    return cell
  },
  draw: (args, cell) => {
    const { ctx, rect, theme } = args
    const {
      label,
      variant = 'primary',
      disabled = false,
      onMouseEnter,
      onMouseLeave,
    } = cell.data

    // Получаем координаты курсора из args (если доступны)
    const hoverX = (args as any).hoverX
    const hoverY = (args as any).hoverY

    // Проверяем, находится ли курсор именно над кнопкой
    // Используем hoverX и hoverY (не highlighted, так как highlighted означает "выбрана")
    let isHoverOverButton = false
    if (hoverX !== undefined && hoverY !== undefined) {
      // Координаты hover обычно относительные к ячейке
      // Но проверяем оба варианта для надежности
      let relativeHoverX: number
      let relativeHoverY: number
      
      // Если координаты выходят за пределы ячейки, значит они абсолютные
      if (hoverX >= rect.x && hoverX <= rect.x + rect.width &&
          hoverY >= rect.y && hoverY <= rect.y + rect.height) {
        // Абсолютные координаты - преобразуем в относительные
        relativeHoverX = hoverX - rect.x
        relativeHoverY = hoverY - rect.y
      } else {
        // Относительные координаты - используем как есть
        relativeHoverX = hoverX
        relativeHoverY = hoverY
      }
      
      isHoverOverButton = isPointInButton(relativeHoverX, relativeHoverY, rect)
    }
    
    // Устанавливаем курсор в зависимости от состояния
    if (disabled) {
      args.overrideCursor?.('not-allowed')
    } else if (isHoverOverButton) {
      args.overrideCursor?.('pointer')
    }

    // Отслеживаем состояние hover для вызова обработчиков
    // НЕ используем highlighted, так как он означает "выбрана", а не "наведен курсор"
    const currentState = hoverStateMap.get(cell.data)
    const wasHovered = currentState?.hovered ?? false
    const isHovered = isHoverOverButton && !disabled

    if (isHovered && !wasHovered) {
      // Если только что навели курсор
      hoverStateMap.set(cell.data, { hovered: true })
      // Вызываем onMouseEnter только один раз
      if (onMouseEnter) {
        onMouseEnter()
      }
    } else if (!isHovered && wasHovered) {
      // Если только что убрали курсор
      hoverStateMap.set(cell.data, { hovered: false })
      // Вызываем onMouseLeave только один раз
      if (onMouseLeave) {
        onMouseLeave()
      }
    }

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.clip()

    const paddingX = 8
    const paddingY = 4
    const buttonX = rect.x + paddingX
    const buttonY = rect.y + paddingY
    const buttonWidth = rect.width - paddingX * 2
    const buttonHeight = rect.height - paddingY * 2

    // Используем isHovered только если курсор над кнопкой
    const colors = getButtonColors(variant, theme, disabled, isHovered, false)

    // Рисуем фон кнопки
    ctx.fillStyle = colors.bg
    ctx.strokeStyle = colors.border
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

    // Рисуем текст
    ctx.font = theme.baseFontFull
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillStyle = colors.text
    ctx.fillText(label, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2)

    ctx.restore()
  },
  onPaste: () => undefined,
}
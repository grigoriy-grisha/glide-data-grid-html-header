import { drawButton, drawIconButton, drawTag } from './canvasCell/index'

export type ButtonIcon = string | HTMLImageElement | null | undefined

export interface ButtonProps {
  text: string
  leftIcon?: ButtonIcon
  rightIcon?: ButtonIcon
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  onClick?: () => void
}

export interface ButtonIconProps {
  icon: ButtonIcon
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  onClick?: () => void
}

export interface TextProps {
  text: string
  color?: string
}

export interface TagProps {
  text: string
  color?: string
  background?: string
}

export interface ContainerProps {
  gap?: number
  padding?: number
  marginLeft?: number
  marginRight?: number
}

// Типы для компонентов
export type CanvasComponent = 
  | { type: 'button'; props: ButtonProps }
  | { type: 'buttonIcon'; props: ButtonIconProps }
  | { type: 'text'; props: TextProps }
  | { type: 'tag'; props: TagProps }
  | { type: 'container'; children: CanvasComponent[]; props: ContainerProps }

// Контекст для отрисовки
interface RenderContext {
  ctx: CanvasRenderingContext2D
  rect: { x: number; y: number; width: number; height: number }
  theme: any
  hoverX?: number
  hoverY?: number
  currentX: number
  currentY: number
  hoveredAreas: Array<{ x: number; y: number; width: number; height: number }>
  clickHandlers: Array<{ 
    area: { x: number; y: number; width: number; height: number }
    handler: () => void
    componentType: 'button' | 'buttonIcon' | 'text' | 'tag'
    componentId?: string
  }>
}

// Функции-компоненты для декларативного API
export function button(props: ButtonProps): CanvasComponent {
  return { type: 'button', props }
}

export function buttonIcon(props: ButtonIconProps): CanvasComponent {
  return { type: 'buttonIcon', props }
}

export function text(props: TextProps): CanvasComponent {
  return { type: 'text', props }
}

export function tag(props: TagProps): CanvasComponent {
  return { type: 'tag', props }
}

export function container(children: CanvasComponent[], props: ContainerProps = {}): CanvasComponent {
  return { type: 'container', children, props }
}

// Функция для отрисовки компонентов
export function renderComponents(
  components: CanvasComponent[],
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  theme: any,
  hoverX?: number,
  hoverY?: number
): {
  hoveredAreas: Array<{ x: number; y: number; width: number; height: number }>
  clickHandlers: Array<{ 
    area: { x: number; y: number; width: number; height: number }
    handler: () => void
    componentType: 'button' | 'buttonIcon' | 'text' | 'tag'
    componentId?: string
  }>
} {
  const context: RenderContext = {
    ctx,
    rect,
    theme,
    hoverX,
    hoverY,
    currentX: rect.x,
    currentY: rect.y,
    hoveredAreas: [],
    clickHandlers: [],
  }

  renderComponentList(components, context)

  return {
    hoveredAreas: context.hoveredAreas,
    clickHandlers: context.clickHandlers,
  }
}

function renderComponentList(components: CanvasComponent[], context: RenderContext) {
  for (const component of components) {
    renderComponent(component, context)
  }
}

function renderComponent(component: CanvasComponent, context: RenderContext) {
  switch (component.type) {
    case 'button':
      renderButton(component.props, context)
      break
    case 'buttonIcon':
      renderButtonIcon(component.props, context)
      break
    case 'text':
      renderText(component.props, context)
      break
    case 'tag':
      renderTag(component.props, context)
      break
    case 'container':
      renderContainer(component.children, component.props, context)
      break
  }
}

function renderButton(props: ButtonProps, context: RenderContext) {
  const { ctx, rect, theme, hoverX, hoverY, currentX, currentY } = context
  const buttonHeight = rect.height

  const buttonArea = drawButton(
    ctx,
    currentX,
    currentY,
    'auto',
    buttonHeight,
    props.text,
    theme,
    props.variant || 'primary',
    props.disabled || false,
    hoverX !== undefined && hoverY !== undefined
      ? { hoverX, hoverY, rectX: rect.x, rectY: rect.y }
      : false,
    props.leftIcon,
    props.rightIcon
  )

  // buttonArea содержит координаты внутренней области (buttonX, buttonY, buttonWidth, buttonHeight)
  // Но кнопка рисуется с padding, поэтому hover область должна быть от currentX до currentX + actualWidth
  // actualWidth можно получить из buttonArea.actualWidth
  const paddingX = 8
  // Внешние координаты кнопки (с padding) - используем actualWidth из buttonArea
  const buttonOuterX = currentX
  const buttonOuterY = currentY
  const buttonOuterWidth = (buttonArea as any).actualWidth || (buttonArea.x - currentX + buttonArea.width + paddingX)
  const buttonOuterHeight = buttonHeight

  // Вычисляем относительные координаты области кнопки (внешней, с padding)
  const relativeX = buttonOuterX - rect.x
  const relativeY = buttonOuterY - rect.y

  // Сохраняем область hover (внешняя область с padding)
  context.hoveredAreas.push({
    x: relativeX,
    y: relativeY,
    width: buttonOuterWidth,
    height: buttonOuterHeight,
  })

  // Сохраняем обработчик клика (внешняя область с padding)
  if (props.onClick) {
    context.clickHandlers.push({
      area: {
        x: relativeX,
        y: relativeY,
        width: buttonOuterWidth,
        height: buttonOuterHeight,
      },
      handler: props.onClick,
      componentType: 'button',
    })
  }

  // Обновляем текущую позицию (используем внешнюю ширину)
  context.currentX = buttonOuterX + buttonOuterWidth
}

function renderButtonIcon(props: ButtonIconProps, context: RenderContext) {
  const { ctx, rect, theme, hoverX, hoverY, currentX, currentY } = context
  const buttonHeight = rect.height

  const buttonArea = drawIconButton(
    ctx,
    currentX,
    currentY,
    'auto',
    buttonHeight,
    props.icon,
    theme,
    props.variant || 'secondary',
    props.disabled || false,
    hoverX !== undefined && hoverY !== undefined
      ? { hoverX, hoverY, rectX: rect.x, rectY: rect.y }
      : false
  )

  // buttonArea содержит координаты внутренней области (buttonX, buttonY, buttonWidth, buttonHeight)
  // Но кнопка рисуется с padding, поэтому hover область должна быть от currentX до currentX + actualSize
  // actualSize = iconSize + paddingX * 2, где iconSize вычисляется внутри drawIconButton
  // Мы можем вычислить actualSize как: buttonArea.x - currentX + buttonArea.width + paddingX
  const paddingX = 8
  // Внешние координаты кнопки (с padding)
  const buttonOuterX = currentX
  const buttonOuterY = currentY
  // Вычисляем actualSize: внутренняя ширина + padding с обеих сторон
  // buttonArea.x = currentX + paddingX, buttonArea.width = iconSize
  // actualSize = buttonArea.width + paddingX * 2 = (buttonArea.x - currentX - paddingX) + buttonArea.width + paddingX
  // Упрощаем: actualSize = buttonArea.x - currentX + buttonArea.width + paddingX
  const buttonOuterWidth = buttonArea.x - currentX + buttonArea.width + paddingX
  const buttonOuterHeight = buttonHeight

  // Вычисляем относительные координаты области кнопки (внешней, с padding)
  const relativeX = buttonOuterX - rect.x
  const relativeY = buttonOuterY - rect.y

  // Сохраняем область hover (внешняя область с padding)
  context.hoveredAreas.push({
    x: relativeX,
    y: relativeY,
    width: buttonOuterWidth,
    height: buttonOuterHeight,
  })

  // Сохраняем обработчик клика (внешняя область с padding)
  if (props.onClick) {
    context.clickHandlers.push({
      area: {
        x: relativeX,
        y: relativeY,
        width: buttonOuterWidth,
        height: buttonOuterHeight,
      },
      handler: props.onClick,
      componentType: 'buttonIcon',
    })
  }

  // Обновляем текущую позицию (используем внешнюю ширину)
  context.currentX = buttonOuterX + buttonOuterWidth
}

function renderText(props: TextProps, context: RenderContext) {
  const { ctx, rect, theme, currentX, currentY } = context

  ctx.font = theme.baseFontFull
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = props.color || theme.textDark

  const textY = currentY + rect.height / 2
  ctx.fillText(props.text, currentX, textY)

  // Измеряем ширину текста для обновления позиции
  const textMetrics = ctx.measureText(props.text)
  context.currentX = currentX + textMetrics.width
}

function renderTag(props: TagProps, context: RenderContext) {
  const { ctx, rect, theme, currentX, currentY } = context
  const centerY = currentY + rect.height / 2
  const tagArea = drawTag(
    ctx,
    currentX,
    centerY,
    rect.height,
    props.text,
    theme,
    props.color,
    props.background
  )

  context.currentX = currentX + tagArea.width
}

function renderContainer(children: CanvasComponent[], props: ContainerProps, context: RenderContext) {
  const { gap = 0, padding = 0, marginLeft = 0, marginRight = 0 } = props

  // Применяем margin и padding слева
  context.currentX += marginLeft + padding
  context.currentY += padding

  // Рендерим дочерние компоненты
  for (let i = 0; i < children.length; i++) {
    if (i > 0) {
      context.currentX += gap
    }
    renderComponent(children[i], context)
  }

  // Добавляем margin справа
  context.currentX += marginRight
}


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

type PaddingInput =
  | number
  | Partial<{
      top: number
      right: number
      bottom: number
      left: number
    }>

export type JustifyContent = 'start' | 'center' | 'end' | 'space-between' | 'space-around'

export interface LayoutRowDefinition {
  components: CanvasComponent[]
  gap?: number
  justify?: JustifyContent
  height?: number
  weight?: number
}

export interface LayoutProps {
  rowGap?: number
  padding?: PaddingInput
  width?: number | 'fill' | 'content'
  marginLeft?: number
  marginRight?: number
}

export interface LayoutMetadata {
  preferredHeight: number
}

type LayoutComponent = {
  type: 'layout'
  rows: LayoutRowDefinition[]
  props?: LayoutProps
  meta: LayoutMetadata
}

const MIN_LAYOUT_ROW_HEIGHT = 20

// Типы для компонентов
export type CanvasComponent = 
  | { type: 'button'; props: ButtonProps }
  | { type: 'buttonIcon'; props: ButtonIconProps }
  | { type: 'text'; props: TextProps }
  | { type: 'tag'; props: TagProps }
  | { type: 'container'; children: CanvasComponent[]; props: ContainerProps }
  | LayoutComponent

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
  lineHeight?: number
  measureOnly?: boolean
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

type LayoutRowInput = CanvasComponent[] | LayoutRowDefinition

export function layoutRow(children: CanvasComponent[], props: Omit<LayoutRowDefinition, 'components'> = {}): LayoutRowDefinition {
  return {
    components: children,
    ...props,
  }
}

export function layout(rows: LayoutRowInput[], props: LayoutProps = {}): LayoutComponent {
  const normalizedRows = rows.map((row) => {
    if (Array.isArray(row)) {
      return layoutRow(row)
    }
    return row
  })
  const preferredHeight = calculateLayoutPreferredHeight(normalizedRows, props)

  return {
    type: 'layout',
    rows: normalizedRows,
    props,
    meta: { preferredHeight },
  }
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
    lineHeight: rect.height,
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
    case 'layout':
      renderLayoutComponent(component, context)
      break
  }
}

function renderButton(props: ButtonProps, context: RenderContext) {
  const { ctx, rect, theme, hoverX, hoverY, measureOnly } = context
  const startX = context.currentX
  const startY = context.currentY
  const buttonHeight = context.lineHeight ?? rect.height
  const buttonOuterWidth = measureButtonOuterWidth(props, context, buttonHeight)

  if (!measureOnly) {
    drawButton(
      ctx,
      startX,
      startY,
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

    const relativeX = startX - rect.x
    const relativeY = startY - rect.y

    context.hoveredAreas.push({
      x: relativeX,
      y: relativeY,
      width: buttonOuterWidth,
      height: buttonHeight,
    })

    if (props.onClick) {
      context.clickHandlers.push({
        area: {
          x: relativeX,
          y: relativeY,
          width: buttonOuterWidth,
          height: buttonHeight,
        },
        handler: props.onClick,
        componentType: 'button',
      })
    }
  }

  context.currentX = startX + buttonOuterWidth
}

function renderButtonIcon(props: ButtonIconProps, context: RenderContext) {
  const { ctx, rect, theme, hoverX, hoverY, measureOnly } = context
  const startX = context.currentX
  const startY = context.currentY
  const buttonHeight = context.lineHeight ?? rect.height
  const buttonOuterWidth = measureButtonIconOuterWidth(buttonHeight)

  if (!measureOnly) {
    drawIconButton(
      ctx,
      startX,
      startY,
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

    const relativeX = startX - rect.x
    const relativeY = startY - rect.y

    context.hoveredAreas.push({
      x: relativeX,
      y: relativeY,
      width: buttonOuterWidth,
      height: buttonHeight,
    })

    if (props.onClick) {
      context.clickHandlers.push({
        area: {
          x: relativeX,
          y: relativeY,
          width: buttonOuterWidth,
          height: buttonHeight,
        },
        handler: props.onClick,
        componentType: 'buttonIcon',
      })
    }
  }

  context.currentX = startX + buttonOuterWidth
}

function renderText(props: TextProps, context: RenderContext) {
  const { ctx, rect, theme, measureOnly } = context
  const startX = context.currentX
  const lineHeight = context.lineHeight ?? rect.height

  ctx.font = theme.baseFontFull
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = props.color || theme.textDark

  const textMetrics = ctx.measureText(props.text)
  const textY = context.currentY + lineHeight / 2

  if (!measureOnly) {
    ctx.fillText(props.text, startX, textY)
  }

  context.currentX = startX + textMetrics.width
}

function renderTag(props: TagProps, context: RenderContext) {
  const { ctx, rect, theme, measureOnly } = context
  const startX = context.currentX
  const lineHeight = context.lineHeight ?? rect.height

  ctx.font = theme.baseFontFull
  const metrics = ctx.measureText(props.text)
  const paddingX = 10
  const tagWidth = Math.ceil(metrics.width + paddingX * 2)
  const centerY = context.currentY + lineHeight / 2

  if (!measureOnly) {
    drawTag(ctx, startX, centerY, lineHeight, props.text, theme, props.color, props.background)
  }

  context.currentX = startX + tagWidth
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

const BUTTON_PADDING_X = 0
const BUTTON_PADDING_Y = 4
const BUTTON_ICON_SPACING = 6
const BUTTON_EXTRA_WIDTH = 4
const ICON_BUTTON_EXTRA_SPACE = 8

function measureButtonOuterWidth(props: ButtonProps, context: RenderContext, height: number): number {
  const { ctx, theme } = context
  ctx.font = theme.baseFontFull
  const textMetrics = ctx.measureText(props.text)
  const textWidth = textMetrics.width
  const iconSize = Math.max(0, Math.min(height - BUTTON_PADDING_Y * 2 - 4, 16))
  let iconsWidth = 0
  if (props.leftIcon) {
    iconsWidth += iconSize + BUTTON_ICON_SPACING
  }
  if (props.rightIcon) {
    iconsWidth += iconSize + BUTTON_ICON_SPACING
  }
  return Math.max(0, textWidth + iconsWidth + BUTTON_PADDING_X * 2 + BUTTON_EXTRA_WIDTH)
}

function measureButtonIconOuterWidth(height: number): number {
  const iconSize = Math.max(0, Math.min(height - BUTTON_PADDING_Y * 2 - 4, 20))
  return iconSize + ICON_BUTTON_EXTRA_SPACE
}

type PreparedLayoutRow = {
  config: LayoutRowDefinition
  height: number
  contentWidth: number
  baseWidth: number
}

function renderLayoutComponent(component: LayoutComponent, context: RenderContext) {
  if (!component.rows.length) {
    return
  }

  const { rect } = context
  const props = component.props ?? {}
  const padding = normalizePadding(props.padding)
  const rowGap = props.rowGap ?? 4
  const marginLeft = props.marginLeft ?? 0
  const marginRight = props.marginRight ?? 0
  const layoutStartX = context.currentX + marginLeft
  const layoutStartY = context.currentY
  const availableHeight = (context.lineHeight ?? rect.height) - (padding.top + padding.bottom)
  const totalGapHeight = rowGap * Math.max(0, component.rows.length - 1)
  const fixedHeight = component.rows.reduce((sum, row) => sum + (row.height ?? 0), 0)
  const flexUnits = component.rows.reduce((sum, row) => (row.height ? sum : sum + (row.weight ?? 1)), 0)
  const remainingHeight = Math.max(0, availableHeight - fixedHeight - totalGapHeight)
  const unitHeight = flexUnits > 0 ? remainingHeight / flexUnits : 0

  const preparedRows: PreparedLayoutRow[] = component.rows.map((row) => {
    const flexibleHeight = Math.max(MIN_LAYOUT_ROW_HEIGHT, (row.weight ?? 1) * unitHeight || MIN_LAYOUT_ROW_HEIGHT)
    const resolvedHeight = row.height ?? flexibleHeight
    const contentWidth = measureRowContentWidth(row.components, context, Math.max(resolvedHeight, 1))
    const baseWidth = contentWidth + (row.gap ?? 8) * Math.max(0, row.components.length - 1)
    return {
      config: row,
      height: resolvedHeight,
      contentWidth,
      baseWidth,
    }
  })

  let layoutWidth: number
  if (typeof props.width === 'number') {
    layoutWidth = props.width
  } else if (props.width === 'content') {
    const maxRowWidth = preparedRows.reduce((max, row) => Math.max(max, row.baseWidth), 0)
    layoutWidth = maxRowWidth + padding.left + padding.right
  } else {
    const rightBoundary = rect.x + rect.width - marginRight
    layoutWidth = Math.max(0, rightBoundary - layoutStartX)
  }

  const contentWidth = Math.max(0, layoutWidth - padding.left - padding.right)
  let cursorY = layoutStartY + padding.top
  const previousLineHeight = context.lineHeight
  const previousY = context.currentY

  for (const row of preparedRows) {
    const rowRect = {
      x: layoutStartX + padding.left,
      y: cursorY,
      width: contentWidth,
      height: row.height,
    }
    renderLayoutRow(row, rowRect, context)
    cursorY += row.height + rowGap
  }

  context.currentX = layoutStartX + layoutWidth + marginRight
  context.currentY = previousY
  context.lineHeight = previousLineHeight
}

function renderLayoutRow(row: PreparedLayoutRow, rect: { x: number; y: number; width: number; height: number }, context: RenderContext) {
  const { config, contentWidth } = row
  if (!config.components.length || rect.height <= 0 || rect.width <= 0) {
    return
  }

  const itemCount = config.components.length
  const baseGap = config.gap ?? 8
  const justify = config.justify ?? 'start'
  const widthWithoutGaps = contentWidth
  const widthWithBaseGap = contentWidth + baseGap * Math.max(0, itemCount - 1)

  let gapBetween = baseGap
  let startX = rect.x

  switch (justify) {
    case 'center':
      startX = rect.x + Math.max(0, (rect.width - widthWithBaseGap) / 2)
      break
    case 'end':
      startX = rect.x + Math.max(0, rect.width - widthWithBaseGap)
      break
    case 'space-between':
      if (itemCount > 1) {
        gapBetween = Math.max(0, (rect.width - widthWithoutGaps) / (itemCount - 1))
      } else {
        startX = rect.x + Math.max(0, (rect.width - widthWithoutGaps) / 2)
        gapBetween = 0
      }
      break
    case 'space-around':
      if (itemCount > 0) {
        gapBetween = Math.max(0, (rect.width - widthWithoutGaps) / itemCount)
        startX = rect.x + gapBetween / 2
      }
      break
    default:
      break
  }

  const previousLineHeight = context.lineHeight
  const previousX = context.currentX
  const previousY = context.currentY

  context.lineHeight = rect.height
  context.currentX = startX
  context.currentY = rect.y

  renderRowChildren(config.components, context, gapBetween)

  context.lineHeight = previousLineHeight
  context.currentX = previousX
  context.currentY = previousY
}

function renderRowChildren(children: CanvasComponent[], context: RenderContext, gap: number) {
  for (let i = 0; i < children.length; i++) {
    if (i > 0) {
      context.currentX += gap
    }
    renderComponent(children[i], context)
  }
}

function measureRowContentWidth(children: CanvasComponent[], context: RenderContext, lineHeight: number): number {
  const measureContext = createMeasureContext(context, {
    currentX: 0,
    currentY: 0,
    lineHeight,
  })
  const startX = measureContext.currentX
  renderRowChildren(children, measureContext, 0)
  return measureContext.currentX - startX
}

function createMeasureContext(
  context: RenderContext,
  overrides: Partial<Pick<RenderContext, 'currentX' | 'currentY' | 'lineHeight'>> = {}
): RenderContext {
  return {
    ...context,
    currentX: overrides.currentX ?? context.currentX,
    currentY: overrides.currentY ?? context.currentY,
    lineHeight: overrides.lineHeight ?? context.lineHeight,
    measureOnly: true,
    hoveredAreas: [],
    clickHandlers: [],
  }
}

type Padding = { top: number; right: number; bottom: number; left: number }

function normalizePadding(padding?: PaddingInput): Padding {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding }
  }

  return {
    top: padding?.top ?? 0,
    right: padding?.right ?? 0,
    bottom: padding?.bottom ?? 0,
    left: padding?.left ?? 0,
  }
}

function calculateLayoutPreferredHeight(rows: LayoutRowDefinition[], props: LayoutProps): number {
  const padding = normalizePadding(props.padding)
  const rowGap = props.rowGap ?? 4
  const totalGapHeight = rowGap * Math.max(0, rows.length - 1)
  const rowsHeight = rows.reduce((sum, row) => sum + Math.max(row.height ?? MIN_LAYOUT_ROW_HEIGHT, MIN_LAYOUT_ROW_HEIGHT), 0)
  return padding.top + padding.bottom + rowsHeight + totalGapHeight
}


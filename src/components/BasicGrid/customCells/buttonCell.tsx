import { GridCellKind, type CustomCell, type CustomRenderer } from '@glideapps/glide-data-grid'
import type { GridTheme } from '../types'

export const BUTTON_CELL_KIND = 'button-cell'

const DEFAULT_VARIANT = 'primary' as const
const DEFAULT_ACCENT_FG = '#ffffff'
const DANGER_COLOR = '#d32f2f'
const SECONDARY_HOVER_LIGHT = 'rgba(30, 136, 229, 0.1)'
const SECONDARY_HOVER_DARK = 'rgba(30, 136, 229, 0.08)'
const BUTTON_PADDING_X = 8
const BUTTON_PADDING_Y = 4
const BUTTON_RADIUS = 4
const BUTTON_BORDER_WIDTH = 1
const DARKEN_AMOUNT = 20
const LIGHTEN_AMOUNT = 15
const HEX_COLOR_PREFIX = '#'
const CURSOR_POINTER = 'pointer'
const CURSOR_NOT_ALLOWED = 'not-allowed'

interface HoverState {
  hovered: boolean
}

const hoverStateMap = new WeakMap<ButtonCellData, HoverState>()

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
  variant: 'primary' | 'secondary' | 'danger' = DEFAULT_VARIANT,
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

interface ButtonColors {
  bg: string
  border: string
  text: string
  cursor: string
}

function getButtonColors(
  variant: 'primary' | 'secondary' | 'danger',
  theme: GridTheme,
  disabled: boolean,
  hovered: boolean,
  pressed: boolean
): ButtonColors {
  if (disabled) {
    return {
      bg: theme.bgCell,
      border: theme.borderColor,
      text: theme.textLight,
      cursor: CURSOR_NOT_ALLOWED,
    }
  }

  const baseColors = getBaseColors(variant, theme)

  if (pressed) {
    return getPressedColors(variant, baseColors, theme)
  }

  if (hovered) {
    return getHoverColors(variant, baseColors, theme)
  }

  return {
    ...baseColors,
    cursor: CURSOR_POINTER,
  }
}

function getBaseColors(variant: 'primary' | 'secondary' | 'danger', theme: GridTheme): Omit<ButtonColors, 'cursor'> {
  switch (variant) {
    case 'primary':
      return {
        bg: theme.accentColor,
        border: theme.accentColor,
        text: theme.accentFg || DEFAULT_ACCENT_FG,
      }
    case 'secondary':
      return {
        bg: theme.bgCell,
        border: theme.accentColor,
        text: theme.accentColor,
      }
    case 'danger':
      return {
        bg: DANGER_COLOR,
        border: DANGER_COLOR,
        text: DEFAULT_ACCENT_FG,
      }
    default:
      return {
        bg: theme.accentColor,
        border: theme.accentColor,
        text: theme.accentFg || DEFAULT_ACCENT_FG,
      }
  }
}

function getPressedColors(
  variant: 'primary' | 'secondary' | 'danger',
  baseColors: Omit<ButtonColors, 'cursor'>,
  theme: GridTheme
): ButtonColors {
  if (variant === 'secondary') {
    return {
      ...baseColors,
      bg: theme.accentLight || SECONDARY_HOVER_LIGHT,
      cursor: CURSOR_POINTER,
    }
  }
  return {
    ...baseColors,
    bg: darkenColor(baseColors.bg, DARKEN_AMOUNT),
    border: darkenColor(baseColors.border, DARKEN_AMOUNT),
    cursor: CURSOR_POINTER,
  }
}

function getHoverColors(
  variant: 'primary' | 'secondary' | 'danger',
  baseColors: Omit<ButtonColors, 'cursor'>,
  theme: GridTheme
): ButtonColors {
  if (variant === 'secondary') {
    return {
      ...baseColors,
      bg: theme.accentLight || SECONDARY_HOVER_DARK,
      cursor: CURSOR_POINTER,
    }
  }
  return {
    ...baseColors,
    bg: lightenColor(baseColors.bg, LIGHTEN_AMOUNT),
    border: lightenColor(baseColors.border, LIGHTEN_AMOUNT),
    cursor: CURSOR_POINTER,
  }
}

function darkenColor(color: string, amount: number): string {
  if (!color.startsWith(HEX_COLOR_PREFIX)) {
    return color
  }
  const num = parseInt(color.slice(1), 16)
  const r = Math.max(0, ((num >> 16) & 0xff) - amount)
  const g = Math.max(0, ((num >> 8) & 0xff) - amount)
  const b = Math.max(0, (num & 0xff) - amount)
  return `${HEX_COLOR_PREFIX}${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function lightenColor(color: string, amount: number): string {
  if (!color.startsWith(HEX_COLOR_PREFIX)) {
    return color
  }
  const num = parseInt(color.slice(1), 16)
  const r = Math.min(255, ((num >> 16) & 0xff) + amount)
  const g = Math.min(255, ((num >> 8) & 0xff) + amount)
  const b = Math.min(255, (num & 0xff) + amount)
  return `${HEX_COLOR_PREFIX}${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function isPointInButton(
  relativeX: number,
  relativeY: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  const buttonX = BUTTON_PADDING_X
  const buttonY = BUTTON_PADDING_Y
  const buttonWidth = rect.width - BUTTON_PADDING_X * 2
  const buttonHeight = rect.height - BUTTON_PADDING_Y * 2

  return (
    relativeX >= buttonX &&
    relativeX <= buttonX + buttonWidth &&
    relativeY >= buttonY &&
    relativeY <= buttonY + buttonHeight
  )
}

/** Click arguments from glide-data-grid */
interface ButtonClickArgs {
  cell: ButtonCell
  bounds: { x: number; y: number; width: number; height: number }
  posX?: number
  posY?: number
  x?: number
  y?: number
  location?: [number, number]
}

/** Draw arguments from glide-data-grid */
interface ButtonDrawArgs {
  ctx: CanvasRenderingContext2D
  rect: { x: number; y: number; width: number; height: number }
  theme: GridTheme
  cell: ButtonCell
  hoverX?: number
  hoverY?: number
  overrideCursor?: (cursor: 'pointer' | 'not-allowed' | 'default') => void
}

export const buttonCellRenderer: CustomRenderer<ButtonCell> = {
  kind: GridCellKind.Custom,
  isMatch: (cell): cell is ButtonCell => (cell.data as ButtonCellData)?.kind === BUTTON_CELL_KIND,
  needsHover: true,
  needsHoverPosition: true,
  onClick: (args) => {
    const typedArgs = args as unknown as ButtonClickArgs
    const cell = typedArgs.cell
    const { onClick, disabled, onMouseUp, onMouseDown } = cell.data

    if (disabled || !onClick) {
      return undefined
    }

    const rect = typedArgs.bounds
    const clickPoint = resolveClickPoint(typedArgs)

    if (!clickPoint) {
      return undefined
    }

    const relativePoint = normalizeClickPoint(clickPoint, rect)
    if (!isPointInButton(relativePoint.x, relativePoint.y, rect)) {
      return undefined
    }

    onMouseDown?.()
    onClick()
    onMouseUp?.()

    return cell
  },
  draw: (args, cell) => {
    const typedArgs = args as unknown as ButtonDrawArgs
    const { ctx, rect, theme, hoverX, hoverY } = typedArgs
    const {
      label,
      variant = DEFAULT_VARIANT,
      disabled = false,
      onMouseEnter,
      onMouseLeave,
    } = cell.data

    const isHoverOverButton = checkHoverOverButton(hoverX, hoverY, rect)

    updateCursor(typedArgs, disabled, isHoverOverButton)
    updateHoverState(cell.data, isHoverOverButton && !disabled, onMouseEnter, onMouseLeave)

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.clip()

    const buttonBounds = calculateButtonBounds(rect)
    const colors = getButtonColors(variant, theme, disabled, isHoverOverButton && !disabled, false)

    drawButtonBackground(ctx, buttonBounds, colors)
    drawButtonText(ctx, label, buttonBounds, colors, theme)

    ctx.restore()
  },
  onPaste: () => undefined,
}

function resolveClickPoint(args: ButtonClickArgs): { x: number; y: number } | null {
  if (args.posX !== undefined && args.posY !== undefined) {
    return { x: args.posX, y: args.posY }
  }
  if (args.x !== undefined && args.y !== undefined) {
    return { x: args.x, y: args.y }
  }
  if (args.location && Array.isArray(args.location)) {
    return { x: args.location[0], y: args.location[1] }
  }
  return null
}

function normalizeClickPoint(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): { x: number; y: number } {
  if (point.x >= rect.x && point.x <= rect.x + rect.width &&
      point.y >= rect.y && point.y <= rect.y + rect.height) {
    return { x: point.x - rect.x, y: point.y - rect.y }
  }
  return point
}

function checkHoverOverButton(
  hoverX: number | undefined,
  hoverY: number | undefined,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  if (hoverX === undefined || hoverY === undefined) {
    return false
  }

  let relativeX: number
  let relativeY: number

  if (hoverX >= rect.x && hoverX <= rect.x + rect.width &&
      hoverY >= rect.y && hoverY <= rect.y + rect.height) {
    relativeX = hoverX - rect.x
    relativeY = hoverY - rect.y
  } else {
    relativeX = hoverX
    relativeY = hoverY
  }

  return isPointInButton(relativeX, relativeY, rect)
}

function updateCursor(args: ButtonDrawArgs, disabled: boolean, isHoverOverButton: boolean): void {
  if (disabled) {
    args.overrideCursor?.(CURSOR_NOT_ALLOWED)
  } else if (isHoverOverButton) {
    args.overrideCursor?.(CURSOR_POINTER)
  }
}

function updateHoverState(
  cellData: ButtonCellData,
  isHovered: boolean,
  onMouseEnter?: () => void,
  onMouseLeave?: () => void
): void {
  const currentState = hoverStateMap.get(cellData)
  const wasHovered = currentState?.hovered ?? false

  if (isHovered && !wasHovered) {
    hoverStateMap.set(cellData, { hovered: true })
    onMouseEnter?.()
  } else if (!isHovered && wasHovered) {
    hoverStateMap.set(cellData, { hovered: false })
    onMouseLeave?.()
  }
}

function calculateButtonBounds(rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: rect.x + BUTTON_PADDING_X,
    y: rect.y + BUTTON_PADDING_Y,
    width: rect.width - BUTTON_PADDING_X * 2,
    height: rect.height - BUTTON_PADDING_Y * 2,
  }
}

function drawButtonBackground(ctx: CanvasRenderingContext2D, bounds: ReturnType<typeof calculateButtonBounds>, colors: ButtonColors): void {
  ctx.fillStyle = colors.bg
  ctx.strokeStyle = colors.border
  ctx.lineWidth = BUTTON_BORDER_WIDTH

  ctx.beginPath()
  ctx.moveTo(bounds.x + BUTTON_RADIUS, bounds.y)
  ctx.lineTo(bounds.x + bounds.width - BUTTON_RADIUS, bounds.y)
  ctx.quadraticCurveTo(bounds.x + bounds.width, bounds.y, bounds.x + bounds.width, bounds.y + BUTTON_RADIUS)
  ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height - BUTTON_RADIUS)
  ctx.quadraticCurveTo(
    bounds.x + bounds.width,
    bounds.y + bounds.height,
    bounds.x + bounds.width - BUTTON_RADIUS,
    bounds.y + bounds.height
  )
  ctx.lineTo(bounds.x + BUTTON_RADIUS, bounds.y + bounds.height)
  ctx.quadraticCurveTo(bounds.x, bounds.y + bounds.height, bounds.x, bounds.y + bounds.height - BUTTON_RADIUS)
  ctx.lineTo(bounds.x, bounds.y + BUTTON_RADIUS)
  ctx.quadraticCurveTo(bounds.x, bounds.y, bounds.x + BUTTON_RADIUS, bounds.y)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

function drawButtonText(
  ctx: CanvasRenderingContext2D,
  label: string,
  bounds: ReturnType<typeof calculateButtonBounds>,
  colors: ButtonColors,
  theme: GridTheme
): void {
  ctx.font = theme.baseFontFull
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillStyle = colors.text
  ctx.fillText(label, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
}
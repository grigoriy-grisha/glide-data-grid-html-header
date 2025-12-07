import React, {ReactElement, ReactNode, useLayoutEffect} from 'react'
import {CanvasContainer} from '../core/CanvasContainer'
import {CanvasAbsoluteContainer} from '../core/CanvasAbsoluteContainer'
import {CanvasEvent, CanvasFlexStyle, CanvasNode} from '../core/CanvasNode'
import {CanvasText, CanvasTextOptions} from '../primitives/CanvasText'
import {CanvasIcon} from '../primitives/CanvasIcon'
import {CanvasButton} from '../primitives/CanvasButton'
import {CanvasIconButton} from '../primitives/CanvasIconButton'
import {CanvasRect} from '../primitives/CanvasRect'
import {CanvasBadge, type BadgeView, type BadgeSize} from '../primitives/CanvasBadge'
import type {FlexBoxOptions} from '../miniflex'
import {preloadIconSprites, type ButtonIcon} from '../cells/iconSprites'
import {SIZE_CONFIG, type ButtonView, type ButtonSize} from '../cells/buttons'


interface ContainerProps extends Omit<FlexBoxOptions, 'columnGap' | 'rowGap'> {
  children?: ReactNode
  style?: Partial<CanvasFlexStyle>
  id?: string
  gap?: number
  columnGap?: number
  rowGap?: number
  portalHoverEnabled?: boolean
}

interface AbsoluteContainerProps extends ContainerProps {
  x?: number
  y?: number
  width?: number
  height?: number
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  onClick?: (event: CanvasEvent<CanvasAbsoluteContainer>) => void
  onMouseEnter?: (event: CanvasEvent<CanvasAbsoluteContainer>) => void
  onMouseLeave?: (event: CanvasEvent<CanvasAbsoluteContainer>) => void
}

interface TextProps
  extends Omit<CanvasTextOptions, 'font' | 'color'> {
  children?: ReactNode
  font?: string
  color?: string
  style?: Partial<CanvasFlexStyle>
  id?: string
  portalHoverEnabled?: boolean
}

interface IconProps {
  icon: ButtonIcon
  size?: number
  color?: string
  style?: Partial<CanvasFlexStyle>
  backgroundColor?: string
  onClick?: (event: CanvasEvent<CanvasIcon>) => void
  onMouseEnter?: (event: CanvasEvent<CanvasIcon>) => void
  onMouseLeave?: (event: CanvasEvent<CanvasIcon>) => void
  onMouseDown?: (event: CanvasEvent<CanvasIcon>) => void
  id?: string
  portalHoverEnabled?: boolean
}

interface ButtonProps {
  children: string
  /** @deprecated Use `view` instead */
  variant?: 'primary' | 'secondary' | 'danger'
  /** Button view style based on sdds_finai__light theme */
  view?: ButtonView
  /** Button size */
  size?: ButtonSize
  /** Left icon (SVG string or image) */
  leftIcon?: ButtonIcon
  /** Right icon (SVG string or image) */
  rightIcon?: ButtonIcon
  disabled?: boolean
  onClick?: (event: CanvasEvent<CanvasButton>) => void
  style?: Partial<CanvasFlexStyle>
  id?: string
  portalHoverEnabled?: boolean
}

interface IconButtonProps {
  icon: ButtonIcon
  /** @deprecated Use `buttonSize` with ButtonSize type instead */
  size?: number | 'auto'
  /** @deprecated Use `view` instead */
  variant?: 'primary' | 'secondary' | 'danger'
  /** Button view style based on sdds_finai__light theme */
  view?: ButtonView
  /** Button size */
  buttonSize?: ButtonSize
  disabled?: boolean
  onClick?: (event: CanvasEvent<CanvasIconButton>) => void
  style?: Partial<CanvasFlexStyle>
  id?: string
  portalHoverEnabled?: boolean
}

interface RectProps {
  color?: string
  borderColor?: string
  borderWidth?: number
  style?: Partial<CanvasFlexStyle>
  id?: string
  portalHoverEnabled?: boolean
}

interface BadgeProps {
  /** Badge text content */
  text: string
  /** Badge view style */
  view?: BadgeView
  /** Badge size */
  size?: BadgeSize
  /** Use transparent background */
  transparent?: boolean
  /** No background, only text */
  clear?: boolean
  /** Left icon (SVG string or image) */
  leftIcon?: ButtonIcon
  /** Right icon (SVG string or image) */
  rightIcon?: ButtonIcon
  style?: Partial<CanvasFlexStyle>
  id?: string
  portalHoverEnabled?: boolean
}

type CanvasComponentType =
  | 'Container'
  | 'AbsoluteContainer'
  | 'Text'
  | 'Icon'
  | 'Button'
  | 'IconButton'
  | 'Rect'
  | 'Badge'

type CanvasComponentMarker = { __canvasType: CanvasComponentType }

type CanvasComponent<P> = ((props: P) => ReactElement | null) &
  CanvasComponentMarker

const createCanvasComponent = <P extends object>(
  type: CanvasComponentType
): CanvasComponent<P> => {
  const Component = (_props: P) => null
  ;(Component as CanvasComponent<P>).__canvasType = type
  return Component as CanvasComponent<P>
}

export interface RootBridgeProps {
    cellId: string
    renderContent: () => ReactElement
    nodeRegistry: React.MutableRefObject<Map<string, ReactElement>>
    onRegistryChange?: () => void
}

export const RootBridge = React.memo(function RootBridge({
    cellId,
    renderContent,
    nodeRegistry,
    onRegistryChange
}: RootBridgeProps) {
    const content = renderContent()
    const lastCellIdRef = React.useRef<string | null>(null)

    useLayoutEffect(() => {
        const registry = nodeRegistry.current
        const previousCellId = lastCellIdRef.current

        if (previousCellId && previousCellId !== cellId) {
            registry.delete(previousCellId)
        }

        const previousContent = registry.get(cellId)
        const hasPrevious = previousContent !== undefined

        registry.set(cellId, content)

        if (hasPrevious && previousContent !== content) {
            onRegistryChange?.()
        }

        lastCellIdRef.current = cellId
    }, [cellId, content, nodeRegistry, onRegistryChange])

    useLayoutEffect(() => {
        return () => {
            const registry = nodeRegistry.current
            if (lastCellIdRef.current) {
                registry.delete(lastCellIdRef.current)
                lastCellIdRef.current = null
            }
        }
    }, [nodeRegistry])

    return null
})

const ContainerComponent = createCanvasComponent<ContainerProps>('Container')
const AbsoluteContainerComponent = createCanvasComponent<AbsoluteContainerProps>('AbsoluteContainer')
const TextComponent = createCanvasComponent<TextProps>('Text')
const IconComponent = createCanvasComponent<IconProps>('Icon')
const ButtonComponent = createCanvasComponent<ButtonProps>('Button')
const IconButtonComponent =
  createCanvasComponent<IconButtonProps>('IconButton')
const RectComponent = createCanvasComponent<RectProps>('Rect')
const BadgeComponent = createCanvasComponent<BadgeProps>('Badge')

export const Canvas = {
  Container: ContainerComponent,
  AbsoluteContainer: AbsoluteContainerComponent,
  Text: TextComponent,
  Icon: IconComponent,
  Button: ButtonComponent,
  IconButton: IconButtonComponent,
  Rect: RectComponent,
  Badge: BadgeComponent,
}

function wrapEventHandler<T extends CanvasNode>(
  handler: ((event: CanvasEvent<T>) => void) | undefined,
  _node: T
): ((event: CanvasEvent<T>) => void) | undefined {
  if (!handler) {
    return undefined
  }

  return function(this: T, event: CanvasEvent<T>) {
    handler.call(this, event)
  }
}

type IconToPreload = { icon: ButtonIcon; size: number }

export function buildCanvasTree(
  element: ReactElement,
  idPrefix = 'root'
): CanvasNode {
  const iconsToPreload: IconToPreload[] = []
  const node = buildNode(element, idPrefix, 0, iconsToPreload)
  
  if (iconsToPreload.length > 0) {
    const bySize = new Map<number, ButtonIcon[]>()
    for (const { icon, size } of iconsToPreload) {
      if (!icon) continue
      const list = bySize.get(size) ?? []
      list.push(icon)
      bySize.set(size, list)
    }
    
    bySize.forEach((icons, size) => {
      preloadIconSprites(icons, { size })
    })
  }
  
  return node
}

function extractTextFromChildren(children: ReactNode): string {
    if (children === null || children === undefined) return ''
    if (typeof children === 'string' || typeof children === 'number') return String(children)
    if (Array.isArray(children)) {
        return children.map(extractTextFromChildren).join('')
    }

    return ''
}

function buildNode(
  element: ReactElement,
  idPrefix: string,
  index: number,
  iconsToPreload: IconToPreload[]
): CanvasNode {
  if (!element || !React.isValidElement(element)) {
    throw new Error('Invalid element. Use Canvas.* components.')
  }

  const elementType = element.type as any
  const canvasType = elementType.__canvasType as CanvasComponentType | undefined

  if (!canvasType) {
    throw new Error(`Unknown canvas component. Use Canvas.* components. Got: ${elementType?.name || elementType}`)
  }

  const props = element.props as Record<string, any>
  const elementKey = element.key != null ? String(element.key) : null
  const nodeSuffix = elementKey ?? index
  const nodeId = props.id ?? `${idPrefix}-${canvasType.toLowerCase()}-${nodeSuffix}`

  // Collect icons for preloading
  if (canvasType === 'Icon' && props.icon) {
    iconsToPreload.push({ icon: props.icon, size: props.size ?? 16 })
  } else if (canvasType === 'IconButton' && props.icon) {
    const buttonSize: ButtonSize = props.buttonSize ?? 's'
    const iconSize = SIZE_CONFIG[buttonSize].iconSize
    iconsToPreload.push({ icon: props.icon, size: iconSize })
  } else if (canvasType === 'Button') {
    const buttonSize: ButtonSize = props.size ?? 's'
    const iconSize = SIZE_CONFIG[buttonSize].iconSize
    if (props.leftIcon) iconsToPreload.push({ icon: props.leftIcon, size: iconSize })
    if (props.rightIcon) iconsToPreload.push({ icon: props.rightIcon, size: iconSize })
  } else if (canvasType === 'Badge') {
    // Badge icon sizes: xs=10, s=12, m=14, l=16
    const badgeSize = props.size ?? 's'
    const iconSizeMap: Record<string, number> = { xs: 10, s: 12, m: 14, l: 16 }
    const iconSize = iconSizeMap[badgeSize] ?? 12
    if (props.leftIcon) iconsToPreload.push({ icon: props.leftIcon, size: iconSize })
    if (props.rightIcon) iconsToPreload.push({ icon: props.rightIcon, size: iconSize })
  }

  const node = createNode(canvasType, nodeId, props)

  if (props.portalHoverEnabled) {
    node.portalHoverEnabled = true
  }

  if (props.style) {
    node.style = props.style
  }

  const children = props.children
  if (children && node instanceof CanvasContainer) {
    const childArray = React.Children.toArray(children)
    childArray.forEach((child, i) => {
      if (React.isValidElement(child)) {
        const childNode = buildNode(child, nodeId, i, iconsToPreload)
        node.addChild(childNode)
      }
    })
  }

  return node
}

function createNode(type: string, id: string, props: Record<string, any>): CanvasNode {
  switch (type) {
    case 'Container': {
      const { id: _, gap, columnGap, rowGap, portalHoverEnabled: _phe, ...restFlexOptions } = props
      const flexOptions = {
        ...restFlexOptions,
        columnGap: columnGap ?? gap ?? 0,
        rowGap: rowGap ?? gap ?? 0,
      }
      return new CanvasContainer(id, flexOptions)
    }

    case 'AbsoluteContainer': {
      const { 
        id: _, 
        gap, 
        columnGap, 
        rowGap, 
        x, 
        y, 
        width, 
        height, 
        backgroundColor, 
        borderColor, 
        borderWidth,
        onClick,
        onMouseEnter,
        onMouseLeave,
        portalHoverEnabled: _phe, 
        ...restFlexOptions 
      } = props
      const flexOptions = {
        ...restFlexOptions,
        columnGap: columnGap ?? gap ?? 0,
        rowGap: rowGap ?? gap ?? 0,
      }
      const node = new CanvasAbsoluteContainer(id, flexOptions)
      if (x !== undefined) node.rect.x = x
      if (y !== undefined) node.rect.y = y
      if (width !== undefined) node.rect.width = width
      if (height !== undefined) node.rect.height = height
      if (backgroundColor) node.backgroundColor = backgroundColor
      if (borderColor) node.borderColor = borderColor
      if (borderWidth !== undefined) node.borderWidth = borderWidth
      const click = wrapEventHandler(onClick, node)
      const enter = wrapEventHandler(onMouseEnter, node)
      const leave = wrapEventHandler(onMouseLeave, node)
      if (click) node.onClick = click
      if (enter) node.onMouseEnter = enter
      if (leave) node.onMouseLeave = leave
      return node
    }

    case 'Text': {
      const { children, style: _style, id: _, font, color, wordWrap, lineHeight, portalHoverEnabled: _phe } = props
      const text = extractTextFromChildren(children)
      return new CanvasText(id, text, {
        font: font ?? '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color,
        wordWrap,
        lineHeight
      })
    }

    case 'Icon': {
      const { icon, size, color, backgroundColor, onClick, onMouseEnter, onMouseLeave, onMouseDown, portalHoverEnabled: _phe } = props
      const node = new CanvasIcon(id, icon, { size, color })
      if (backgroundColor) node.backgroundColor = backgroundColor
      const click = wrapEventHandler(onClick, node)
      const enter = wrapEventHandler(onMouseEnter, node)
      const leave = wrapEventHandler(onMouseLeave, node)
      const down = wrapEventHandler(onMouseDown, node)
      if (click) node.onClick = click
      if (enter) node.onMouseEnter = enter
      if (leave) node.onMouseLeave = leave
      if (down) node.onMouseDown = down
      return node
    }

    case 'Button': {
      const { children, variant, view, size, leftIcon, rightIcon, disabled, onClick, portalHoverEnabled: _phe } = props
      const text = typeof children === 'string' ? children : ''
      const node = new CanvasButton(id, text, { variant, view, size, leftIcon, rightIcon, disabled })
      const click = wrapEventHandler(onClick, node)
      if (click) node.onClick = click
      return node
    }

    case 'IconButton': {
      const { icon, size, variant, view, buttonSize, disabled, onClick, portalHoverEnabled: _phe } = props
      const node = new CanvasIconButton(id, icon, { size, variant, view, buttonSize, disabled })
      const click = wrapEventHandler(onClick, node)
      if (click) node.onClick = click
      return node
    }

    case 'Rect': {
      const { color, borderColor, borderWidth, portalHoverEnabled: _phe } = props
      const node = new CanvasRect(id, color)
      if (borderColor) node.borderColor = borderColor
      if (borderWidth) node.borderWidth = borderWidth
      return node
    }

    case 'Badge': {
      const { text, view, size, transparent, clear, leftIcon, rightIcon, portalHoverEnabled: _phe } = props
      return new CanvasBadge(id, text, { view, size, transparent, clear, leftIcon, rightIcon })
    }

    default:
      throw new Error(`Unknown canvas component type: ${type}`)
  }
}

export type {
  ContainerProps as CanvasContainerProps,
  AbsoluteContainerProps as CanvasAbsoluteContainerProps,
  TextProps as CanvasTextProps,
  IconProps as CanvasIconProps,
  ButtonProps as CanvasButtonProps,
  IconButtonProps as CanvasIconButtonProps,
  RectProps as CanvasRectProps,
  BadgeProps as CanvasBadgeProps,
}

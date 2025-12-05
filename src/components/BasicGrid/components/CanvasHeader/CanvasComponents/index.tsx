import React, {ReactElement, ReactNode, useLayoutEffect} from 'react'
import {CanvasContainer} from '../core/CanvasContainer'
import {CanvasEvent, CanvasFlexStyle, CanvasNode} from '../core/CanvasNode'
import {CanvasText, CanvasTextOptions} from '../primitives/CanvasText'
import {CanvasIcon} from '../primitives/CanvasIcon'
import {CanvasButton} from '../primitives/CanvasButton'
import {CanvasIconButton} from '../primitives/CanvasIconButton'
import {CanvasRect} from '../primitives/CanvasRect'
import {CanvasTag, CanvasTagOptions} from '../primitives/CanvasTag'
import type {FlexBoxOptions} from '../../../miniflex'
import type {ButtonIcon} from '../../../customCells/canvasCell/iconSprites'


interface ContainerProps extends Omit<FlexBoxOptions, 'columnGap' | 'rowGap'> {
  children?: ReactNode
  style?: Partial<CanvasFlexStyle>
  id?: string
  gap?: number
  columnGap?: number
  rowGap?: number
  portalHoverEnabled?: boolean
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
  id?: string
  portalHoverEnabled?: boolean
}

interface ButtonProps {
  children: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  onClick?: (event: CanvasEvent<CanvasButton>) => void
  style?: Partial<CanvasFlexStyle>
  id?: string
  portalHoverEnabled?: boolean
}

interface IconButtonProps {
  icon: ButtonIcon
  size?: number | 'auto'
  variant?: 'primary' | 'secondary' | 'danger'
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

interface TagProps extends CanvasTagOptions {
  children: ReactNode
  style?: Partial<CanvasFlexStyle>
  id?: string
  portalHoverEnabled?: boolean
}

type CanvasComponentType =
  | 'Container'
  | 'Text'
  | 'Icon'
  | 'Button'
  | 'IconButton'
  | 'Rect'
  | 'Tag'

type CanvasComponentMarker = {__canvasType: CanvasComponentType}

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
const TextComponent = createCanvasComponent<TextProps>('Text')
const IconComponent = createCanvasComponent<IconProps>('Icon')
const ButtonComponent = createCanvasComponent<ButtonProps>('Button')
const IconButtonComponent =
  createCanvasComponent<IconButtonProps>('IconButton')
const RectComponent = createCanvasComponent<RectProps>('Rect')
const TagComponent = createCanvasComponent<TagProps>('Tag')

export const Canvas = {
  Container: ContainerComponent,
  Text: TextComponent,
  Icon: IconComponent,
  Button: ButtonComponent,
  IconButton: IconButtonComponent,
  Rect: RectComponent,
  Tag: TagComponent,
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

export function buildCanvasTree(
  element: ReactElement,
  idPrefix = 'root'
): CanvasNode {
  return buildNode(element, idPrefix, 0)
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
  index: number
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
        const childNode = buildNode(child, nodeId, i)
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

    case 'Text': {
      const { children, style: _style, id: _, font, color, wordWrap, lineHeight, portalHoverEnabled: _phe } = props
      const text = extractTextFromChildren(children)
      const node = new CanvasText(id, text, {
        font: font ?? '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color,
        wordWrap,
        lineHeight
      })
      return node
    }

    case 'Icon': {
      const { icon, size, color, backgroundColor, onClick, onMouseEnter, onMouseLeave, portalHoverEnabled: _phe } = props
      const node = new CanvasIcon(id, icon, { size, color })
      if (backgroundColor) node.backgroundColor = backgroundColor
      const click = wrapEventHandler(onClick, node)
      const enter = wrapEventHandler(onMouseEnter, node)
      const leave = wrapEventHandler(onMouseLeave, node)
      if (click) node.onClick = click
      if (enter) node.onMouseEnter = enter
      if (leave) node.onMouseLeave = leave
      return node
    }

    case 'Button': {
      const { children, variant, disabled, onClick, portalHoverEnabled: _phe } = props
      const text = typeof children === 'string' ? children : ''
      const node = new CanvasButton(id, text, { variant, disabled })
      const click = wrapEventHandler(onClick, node)
      if (click) node.onClick = click
      return node
    }

    case 'IconButton': {
      const { icon, size, variant, disabled, onClick, portalHoverEnabled: _phe } = props
      const node = new CanvasIconButton(id, icon, { size, variant, disabled })
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

    case 'Tag': {
      const { children, font, textColor, backgroundColor, paddingX, paddingY, borderRadius, portalHoverEnabled: _phe } = props
      const text = extractTextFromChildren(children)
      return new CanvasTag(id, text, {
        font,
        textColor,
        backgroundColor,
        paddingX,
        paddingY,
        borderRadius,
      })
    }

    default:
      throw new Error(`Unknown canvas component type: ${type}`)
  }
}

export type {
  ContainerProps as CanvasContainerProps,
  TextProps as CanvasTextProps,
  IconProps as CanvasIconProps,
  ButtonProps as CanvasButtonProps,
  IconButtonProps as CanvasIconButtonProps,
  RectProps as CanvasRectProps,
  TagProps as CanvasTagProps,
}

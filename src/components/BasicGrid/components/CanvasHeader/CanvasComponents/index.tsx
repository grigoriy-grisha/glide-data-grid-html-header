import React, {ReactElement, ReactNode} from 'react'
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
import { useLayoutEffect } from 'react'


// ─────────────────────────────────────────────────────────────────────────────
// Component Props
// ─────────────────────────────────────────────────────────────────────────────

interface ContainerProps extends Omit<FlexBoxOptions, 'columnGap' | 'rowGap'> {
  children?: ReactNode
  style?: Partial<CanvasFlexStyle>
  id?: string
  /** Universal gap between items (sets both columnGap and rowGap) */
  gap?: number
  /** Gap between columns (horizontal spacing in row direction) */
  columnGap?: number
  /** Gap between rows (vertical spacing in column direction) */
  rowGap?: number
  /** Enables hover portal feedback for this node */
  portalHoverEnabled?: boolean
}

interface TextProps extends Omit<CanvasTextOptions, 'font' | 'color'> {
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

// ─────────────────────────────────────────────────────────────────────────────
// RootBridge - Connects React components to Canvas rendering
// ─────────────────────────────────────────────────────────────────────────────

export interface RootBridgeProps {
    cellId: string
    renderContent: () => ReactElement
    nodeRegistry: React.MutableRefObject<Map<string, ReactElement>>
    onRegistryChange?: () => void
}

/**
 * Bridge component that captures JSX from renderContent and stores it
 * in the registry for Canvas rendering. Triggers onRegistryChange when
 * content is added or removed.
 */
export const RootBridge = React.memo(function RootBridge({
    cellId,
    renderContent,
    nodeRegistry,
    onRegistryChange
}: RootBridgeProps) {
    const content = renderContent()

    useLayoutEffect(() => {
        nodeRegistry.current.set(cellId, content)
        onRegistryChange?.()

        return () => {
            nodeRegistry.current.delete(cellId)
            onRegistryChange?.()
        }
    })

    return null
})

// ─────────────────────────────────────────────────────────────────────────────
// JSX Component Functions
// Return null (valid React element) but attach descriptor for buildCanvasTree
// ─────────────────────────────────────────────────────────────────────────────

function ContainerComponent(_props: ContainerProps): ReactElement | null {
  return null
}
// Attach descriptor factory
(ContainerComponent as any).__canvasType = 'Container'

function TextComponent(_props: TextProps): ReactElement | null {
  return null
}
(TextComponent as any).__canvasType = 'Text'

function IconComponent(_props: IconProps): ReactElement | null {
  return null
}
(IconComponent as any).__canvasType = 'Icon'

function ButtonComponent(_props: ButtonProps): ReactElement | null {
  return null
}
(ButtonComponent as any).__canvasType = 'Button'

function IconButtonComponent(_props: IconButtonProps): ReactElement | null {
  return null
}
(IconButtonComponent as any).__canvasType = 'IconButton'

function RectComponent(_props: RectProps): ReactElement | null {
  return null
}
(RectComponent as any).__canvasType = 'Rect'

function TagComponent(_props: TagProps): ReactElement | null {
  return null
}
(TagComponent as any).__canvasType = 'Tag'

// ─────────────────────────────────────────────────────────────────────────────
// Canvas Namespace
// ─────────────────────────────────────────────────────────────────────────────

export const Canvas = {
  Container: ContainerComponent,
  Text: TextComponent,
  Icon: IconComponent,
  Button: ButtonComponent,
  IconButton: IconButtonComponent,
  Rect: RectComponent,
  Tag: TagComponent,
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper to wrap event handlers and preserve node context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps an event handler to ensure it receives the node as `this` context.
 * Arrow functions ignore `.bind()`, so this wrapper creates a regular function
 * that can be properly bound to the node.
 */
function wrapEventHandler<T extends CanvasNode>(
  handler: ((event: CanvasEvent<T>) => void) | undefined,
  _node: T
): (event: CanvasEvent<T>) => void {
  if (!handler) {
    // Return a no-op function if handler is undefined
    return () => {}
  }
  
  // Create a regular function that calls the handler with node as `this`
  // This allows the handler to access the node via `this` when bound
  // Note: Arrow functions will still ignore `this`, so use `event.currentTarget` instead
  return function(this: T, event: CanvasEvent<T>) {
    handler.call(this, event)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build Canvas Tree from JSX
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert JSX element tree to actual CanvasNode tree.
 * 
 * @example
 * ```tsx
 * const tree = buildCanvasTree(
 *   <Canvas.Container direction="row" columnGap={8}>
 *     <Canvas.Text color="#333">Hello</Canvas.Text>
 *     <Canvas.Button variant="primary" onClick={() => {}}>Click</Canvas.Button>
 *   </Canvas.Container>,
 *   'my-cell'
 * )
 * ```
 */
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
    // React Element (not supported inside Text, but return empty string to be safe)
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
  const canvasType = elementType.__canvasType as string | undefined
  
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

  // Apply style if provided - let the node's setter handle defaults (like cursor)
  if (props.style) {
    node.style = props.style
  }

  // Process children for containers
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
      const { children, style, id: _, gap, columnGap, rowGap, portalHoverEnabled: _phe, ...restFlexOptions } = props
      // Universal gap: if gap is set, use it for both axes unless specific gap is provided
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
      node.onClick = wrapEventHandler(onClick, node) as any
      node.onMouseEnter = wrapEventHandler(onMouseEnter, node) as any
      node.onMouseLeave = wrapEventHandler(onMouseLeave, node) as any
      return node
    }

    case 'Button': {
      const { children, variant, disabled, onClick, portalHoverEnabled: _phe } = props
      const text = typeof children === 'string' ? children : ''
      const node = new CanvasButton(id, text, { variant, disabled })
      node.onClick = wrapEventHandler(onClick, node) as any
      return node
    }

    case 'IconButton': {
      const { icon, size, variant, disabled, onClick, portalHoverEnabled: _phe } = props
      const node = new CanvasIconButton(id, icon, { size, variant, disabled })
      node.onClick = wrapEventHandler(onClick, node) as any
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

// Re-export types for convenience
export type {
  ContainerProps as CanvasContainerProps,
  TextProps as CanvasTextProps,
  IconProps as CanvasIconProps,
  ButtonProps as CanvasButtonProps,
  IconButtonProps as CanvasIconButtonProps,
  RectProps as CanvasRectProps,
  TagProps as CanvasTagProps,
}

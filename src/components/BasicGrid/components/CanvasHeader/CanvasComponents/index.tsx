import React, { ReactElement, ReactNode, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { CanvasContainer } from '../core/CanvasContainer'
import { CanvasNode, CanvasFlexStyle, CanvasEvent } from '../core/CanvasNode'
import { CanvasText, CanvasTextOptions } from '../primitives/CanvasText'
import { CanvasIcon } from '../primitives/CanvasIcon'
import { CanvasButton } from '../primitives/CanvasButton'
import { CanvasIconButton } from '../primitives/CanvasIconButton'
import { CanvasRect } from '../primitives/CanvasRect'
import type { FlexBoxOptions } from '../../../miniflex'
import type { ButtonIcon } from '../../../customCells/canvasCell/iconSprites'


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
}

interface TextProps extends Omit<CanvasTextOptions, 'font' | 'color'> {
  children?: ReactNode
  font?: string
  color?: string
  style?: Partial<CanvasFlexStyle>
  id?: string
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
}

interface ButtonProps {
  children: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  onClick?: (event: CanvasEvent<CanvasButton>) => void
  style?: Partial<CanvasFlexStyle>
  id?: string
}

interface IconButtonProps {
  icon: ButtonIcon
  size?: number | 'auto'
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  onClick?: (event: CanvasEvent<CanvasIconButton>) => void
  style?: Partial<CanvasFlexStyle>
  id?: string
}

interface RectProps {
  color?: string
  borderColor?: string
  borderWidth?: number
  style?: Partial<CanvasFlexStyle>
  id?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Context & Hooks for React-Managed Nodes
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasContextValue {
    parent: CanvasContainer | null
    requestRender?: () => void
}

const CanvasContext = React.createContext<CanvasContextValue>({ parent: null })

export interface RootBridgeProps {
    children: ReactNode
    onNodeCreated: (node: CanvasNode) => void
    requestRender?: () => void
}

export function RootBridge({ children, onNodeCreated, requestRender }: RootBridgeProps) {
    // RootBridge acts as the "Context Provider" for the first level
    // It receives the root node from its first child and passes it up via onNodeCreated
    
    // We use a "Fake" parent that captures the child
    const fakeParent = useMemo(() => {
        const p = new CanvasContainer('root-bridge', {})
        // Override addChild to capture the node
        p.addChild = (child: CanvasNode) => {
             onNodeCreated(child)
        }
        return p
    }, [onNodeCreated])

    const contextValue = useMemo(() => ({
        parent: fakeParent,
        requestRender
    }), [fakeParent, requestRender])

    return (
        <CanvasContext.Provider value={contextValue}>
            {children}
        </CanvasContext.Provider>
    )
}

function useCanvasNode<T extends CanvasNode>(
  type: string,
  createFn: () => T,
  updateFn: (node: T) => void,
  deps: any[]
): T | null {
  const { parent, requestRender } = useContext(CanvasContext)

  // If no parent, we are in "Immediate Mode" (JSX -> buildCanvasTree), so return null
  if (!parent) return null

  // We are in "Retained Mode" (React managing nodes)
  const node = useMemo(createFn, []) // Create once

  // Update properties on every render
  useLayoutEffect(() => {
      updateFn(node)
      requestRender?.()
  })

  // Manage parent-child relationship
  useLayoutEffect(() => {
    parent.addChild(node)
    requestRender?.()
    return () => {
      parent.removeChild(node) // Assuming removeChild exists or we handle cleanup
      // If removeChild is not implemented in CanvasContainer, we might need to check
      // But usually for this architecture we want cleanup.
      // Let's assume standard scene graph behavior.
      if (parent.children) {
          const idx = parent.children.indexOf(node)
          if (idx !== -1) parent.children.splice(idx, 1)
      }
      requestRender?.()
    }
  }, [parent, node, requestRender])

  return node
}


// ─────────────────────────────────────────────────────────────────────────────
// JSX Component Functions
// ─────────────────────────────────────────────────────────────────────────────

function ContainerComponent(props: ContainerProps): ReactElement | null {
  const { children, id, columnGap, rowGap, gap, style, ...rest } = props
  
  const node = useCanvasNode(
      'Container',
      () => new CanvasContainer(id ?? `container-${Math.random().toString(36).substr(2, 9)}`, {}),
      (n) => {
          n.style = style || {}
          // Update FlexOptions
           const flexOptions = {
            ...rest,
            columnGap: columnGap ?? gap ?? 0,
            rowGap: rowGap ?? gap ?? 0,
          }
          // IMPORTANT: We must update flexOptions property to trigger internal layout invalidation
          if (n instanceof CanvasContainer) {
               n.setFlexOptions({
                   direction: rest.direction,
                   alignItems: rest.alignItems,
                   justifyContent: rest.justifyContent,
                   wrap: rest.wrap,
                   padding: rest.padding,
                   columnGap: flexOptions.columnGap,
                   rowGap: flexOptions.rowGap
               })
          }
      },
      [props]
  )

  if (node) {
      // If node exists, we are in "Retained Mode", so we render children wrapped in Context
      // We also pass down the requestRender from parent context
      const { requestRender } = useContext(CanvasContext)
      const contextValue = useMemo(() => ({
          parent: node,
          requestRender
      }), [node, requestRender])

      return (
          <CanvasContext.Provider value={contextValue}>
              {children}
          </CanvasContext.Provider>
      )
  }
  return null
}
(ContainerComponent as any).__canvasType = 'Container'

function extractTextFromChildren(children: ReactNode): string {
    if (children === null || children === undefined) return ''
    if (typeof children === 'string' || typeof children === 'number') return String(children)
    if (Array.isArray(children)) {
        return children.map(extractTextFromChildren).join('')
    }
    // React Element (not supported inside Text, but return empty string to be safe)
    return ''
}

const DEFAULT_FONT = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

function TextComponent(props: TextProps): ReactElement | null {
  const { children, id, font, color, wordWrap, lineHeight, style } = props
  const text = extractTextFromChildren(children)
  
  useCanvasNode(
      'Text',
      () => new CanvasText(id ?? `text-${Math.random()}`, text, { 
          font: font ?? DEFAULT_FONT, 
          color, 
          wordWrap, 
          lineHeight 
      }),
      (n) => {
          n.text = text
          n.font = font ?? DEFAULT_FONT
          if (color) n.color = color
          if (wordWrap !== undefined) n.wordWrap = wordWrap
          if (lineHeight !== undefined) n.lineHeight = lineHeight
          if (style) n.style = style
      },
      [props]
  )
  return null
}
(TextComponent as any).__canvasType = 'Text'

function IconComponent(props: IconProps): ReactElement | null {
  const { icon, size, color, backgroundColor, onClick, onMouseEnter, onMouseLeave, style, id } = props
  
  useCanvasNode(
      'Icon',
      () => new CanvasIcon(id ?? `icon-${Math.random()}`, icon, { size, color }),
      (n) => {
          n.icon = icon
          if (size) n.size = size
          if (color) n.color = color
          if (backgroundColor) n.backgroundColor = backgroundColor
          if (style) n.style = style
          
          // Event handlers need special wrapping to preserve 'this'
          // reuse wrapEventHandler from below? It's not exported but available in module scope
          n.onClick = wrapEventHandler(onClick, n) as any
          n.onMouseEnter = wrapEventHandler(onMouseEnter, n) as any
          n.onMouseLeave = wrapEventHandler(onMouseLeave, n) as any
      },
      [props]
  )
  return null
}
(IconComponent as any).__canvasType = 'Icon'

function ButtonComponent(props: ButtonProps): ReactElement | null {
  const { children, variant, disabled, onClick, style, id } = props
  const text = typeof children === 'string' ? children : ''

  useCanvasNode(
      'Button',
      () => new CanvasButton(id ?? `btn-${Math.random()}`, text, { variant, disabled }),
      (n) => {
          n.text = text
          if (variant) n.variant = variant
          if (disabled !== undefined) n.disabled = disabled
          if (style) n.style = style
          n.onClick = wrapEventHandler(onClick, n) as any
      },
      [props]
  )
  return null
}
(ButtonComponent as any).__canvasType = 'Button'

function IconButtonComponent(props: IconButtonProps): ReactElement | null {
  const { icon, size, variant, disabled, onClick, style, id } = props

  useCanvasNode(
      'IconButton',
      () => new CanvasIconButton(id ?? `icon-btn-${Math.random()}`, icon, { size, variant, disabled }),
      (n) => {
          n.icon = icon
          if (size) n.size = size
          if (variant) n.variant = variant
          if (disabled !== undefined) n.disabled = disabled
          if (style) n.style = style
          n.onClick = wrapEventHandler(onClick, n) as any
      },
      [props]
  )
  return null
}
(IconButtonComponent as any).__canvasType = 'IconButton'

function RectComponent(props: RectProps): ReactElement | null {
  const { color, borderColor, borderWidth, style, id } = props

  useCanvasNode(
      'Rect',
      () => new CanvasRect(id ?? `rect-${Math.random()}`, color),
      (n) => {
          n.color = color
          if (borderColor) n.borderColor = borderColor
          if (borderWidth) n.borderWidth = borderWidth
          if (style) n.style = style
      },
      [props]
  )
  return null
}
(RectComponent as any).__canvasType = 'Rect'

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
  const nodeId = props.id ?? `${idPrefix}-${canvasType.toLowerCase()}-${index}`

  const node = createNode(canvasType, nodeId, props)

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
      const { children, style, id: _, gap, columnGap, rowGap, ...restFlexOptions } = props
      // Universal gap: if gap is set, use it for both axes unless specific gap is provided
      const flexOptions = {
        ...restFlexOptions,
        columnGap: columnGap ?? gap ?? 0,
        rowGap: rowGap ?? gap ?? 0,
      }
      const node = new CanvasContainer(id, flexOptions)
      return node
    }

    case 'Text': {
      const { children, style: _style, id: _, font, color, wordWrap, lineHeight } = props
      const text = extractTextFromChildren(children)
      const node = new CanvasText(id, text, { 
          font: font ?? DEFAULT_FONT, 
          color, 
          wordWrap, 
          lineHeight 
      })
      return node
    }

    case 'Icon': {
      const { icon, size, color, backgroundColor, onClick, onMouseEnter, onMouseLeave } = props
      const node = new CanvasIcon(id, icon, { size, color })
      if (backgroundColor) node.backgroundColor = backgroundColor
      node.onClick = wrapEventHandler(onClick, node) as any
      node.onMouseEnter = wrapEventHandler(onMouseEnter, node) as any
      node.onMouseLeave = wrapEventHandler(onMouseLeave, node) as any
      return node
    }

    case 'Button': {
      const { children, variant, disabled, onClick } = props
      const text = typeof children === 'string' ? children : ''
      const node = new CanvasButton(id, text, { variant, disabled })
      node.onClick = wrapEventHandler(onClick, node) as any
      return node
    }

    case 'IconButton': {
      const { icon, size, variant, disabled, onClick } = props
      const node = new CanvasIconButton(id, icon, { size, variant, disabled })
      node.onClick = wrapEventHandler(onClick, node) as any
      return node
    }

    case 'Rect': {
      const { color, borderColor, borderWidth } = props
      const node = new CanvasRect(id, color)
      if (borderColor) node.borderColor = borderColor
      if (borderWidth) node.borderWidth = borderWidth
      return node
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
}

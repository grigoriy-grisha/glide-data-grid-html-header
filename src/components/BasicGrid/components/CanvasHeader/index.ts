// CanvasHeader component
export { CanvasHeader } from './CanvasHeader'

// Re-export from the canvas library
export {
  // Core
  CanvasNode,
  CanvasLeaf,
  CanvasContainer,
  CanvasAbsoluteContainer,
  CanvasRoot,
  DrawBatcher,
  defaultBatcher,
  CanvasHoverController,
  CanvasRegistry,
  resolvePaddingBox,
  
  // Primitives
  CanvasButton,
  CanvasText,
  CanvasRect,
  CanvasIcon,
  CanvasFlex,
  CanvasIconButton,
  CanvasBadge,
  CanvasChevron,
  
  // JSX Components
  Canvas,
  buildCanvasTree,
  RootBridge,
  
  // Cells
  CANVAS_CELL_KIND,
  createCanvasCell,
  isCanvasCell,
  canvasCellRenderer,
  drawButton,
  drawIconButton,
  drawIcon,
  CellCanvasRoot,
  preloadIconSprites,
  registerIconDefinitions,
  
  // Utils
  CANVAS_PORTAL_EVENT,
  dispatchCanvasPortalHover,
  subscribeToCanvasPortalHover,
  
  // Miniflex
  FlexBox,
  FlexElement,
  RootFlexBox,
  flexBoxLayout,
} from '../../lib/canvas'

export type {
  // Core types
  CanvasFlexStyle,
  DimensionValue,
  Rect,
  CanvasEvent,
  PaddingBox,
  CanvasHoverControllerOptions,
  RegistryListener,
  DrawCommand,
  TextBaseline,
  TextAlign,
  
  // Primitive types
  CanvasTextOptions,
  CanvasButtonOptions,
  CanvasIconOptions,
  CanvasIconButtonOptions,
  CanvasBadgeOptions,
  BadgeView,
  BadgeSize,
  CanvasChevronOptions,
  
  // Component types
  CanvasContainerProps,
  CanvasAbsoluteContainerProps,
  CanvasTextProps,
  CanvasIconProps,
  CanvasButtonProps,
  CanvasIconButtonProps,
  CanvasRectProps,
  RootBridgeProps,
  
  // Cell types
  CanvasCell,
  CanvasCellData,
  CanvasRenderResult,
  RectBounds,
  ButtonIcon,
  IconSpriteOptions,
  IconDefinition,
  HoverState,
  
  // Miniflex types
  FlexStyle,
  FlexBoxOptions,
  Size,
  Position,
  Direction,
  FlexBoxItem,
  
  // Portal types
  CanvasPortalSource,
  CanvasPortalHoverDetail,
  CanvasPortalHoverListener,
} from '../../lib/canvas'

// Hooks
export { useNodeRegistry } from './hooks/useNodeRegistry'
export { useVisibleCells } from './hooks/useVisibleCells'
export { useHeaderScene } from './hooks/useHeaderScene'
export type { NodeRegistry, SubscribeFn, UnsubscribeFn } from './hooks/useNodeRegistry'
export type { UseHeaderSceneProps } from './hooks/useHeaderScene'

// Scene Builder
export { HeaderSceneBuilder, createCustomContentGetter } from './scene/HeaderSceneBuilder'
export type { GripIconHandlers, BuildSceneConfig } from './scene/HeaderSceneBuilder'
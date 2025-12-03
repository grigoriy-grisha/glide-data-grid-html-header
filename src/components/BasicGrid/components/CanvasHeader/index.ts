// Core exports
export { CanvasHeader } from './CanvasHeader'
export { CanvasNode } from './core/CanvasNode'
export { CanvasLeaf } from './core/CanvasLeaf'
export { CanvasContainer } from './core/CanvasContainer'
export { CanvasAbsoluteContainer } from './core/CanvasAbsoluteContainer'

// Primitives
export { CanvasButton } from './primitives/CanvasButton'
export { CanvasText } from './primitives/CanvasText'
export { CanvasRect } from './primitives/CanvasRect'
export { CanvasIcon } from './primitives/CanvasIcon'
export { CanvasFlex } from './primitives/CanvasFlex'
export { CanvasIconButton } from './primitives/CanvasIconButton'
export { CanvasTag } from './primitives/CanvasTag'

// JSX Components
export { Canvas, buildCanvasTree, RootBridge } from './CanvasComponents'
export type {
  CanvasContainerProps,
  CanvasTextProps,
  CanvasIconProps,
  CanvasButtonProps,
  CanvasIconButtonProps,
  CanvasRectProps,
  RootBridgeProps,
} from './CanvasComponents'

// Hooks
export { useNodeRegistry } from './hooks/useNodeRegistry'
export { useVisibleCells } from './hooks/useVisibleCells'
export { useHeaderScene } from './hooks/useHeaderScene'
export type { NodeRegistry, SubscribeFn, UnsubscribeFn } from './hooks/useNodeRegistry'
export type { UseHeaderSceneProps } from './hooks/useHeaderScene'

// Scene Builder
export { HeaderSceneBuilder, createCustomContentGetter } from './scene/HeaderSceneBuilder'
export type { CachedCellData, GripIconHandlers, BuildSceneConfig } from './scene/HeaderSceneBuilder'
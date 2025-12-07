// Core exports
export {
  DrawBatcher,
  defaultBatcher,
  CanvasNode,
  CanvasLeaf,
  CanvasContainer,
  CanvasAbsoluteContainer,
  CanvasRoot,
  CanvasHoverController,
  CanvasRegistry,
  resolvePaddingBox,
} from './core'
export type {
  DrawCommand,
  TextBaseline,
  TextAlign,
  CanvasFlexStyle,
  DimensionValue,
  Rect,
  CanvasEvent,
  PaddingBox,
  CanvasHoverControllerOptions,
  RegistryListener,
} from './core'

// Primitives
export {
  CanvasText,
  CanvasButton,
  CanvasIcon,
  CanvasIconButton,
  CanvasRect,
  CanvasBadge,
  CanvasChevron,
} from './primitives'
export type {
  CanvasTextOptions,
  CanvasButtonOptions,
  CanvasIconOptions,
  CanvasIconButtonOptions,
  CanvasBadgeOptions,
  BadgeView,
  BadgeSize,
  CanvasChevronOptions,
} from './primitives'

// Cells
export {
  CANVAS_CELL_KIND,
  createCanvasCell,
  isCanvasCell,
  canvasCellRenderer,
  drawButton,
  drawButtonWithView,
  drawIconButton,
  drawIconButtonWithView,
  drawIcon,
  BUTTON_PADDING_Y,
  ICON_SIZE_ADJUSTMENT,
  SIZE_CONFIG,
  VIEW_COLORS,
  preloadIconSprites,
  registerIconDefinitions,
  resetIconSpriteCache,
  getIconSpriteStats,
  getIconSprite,
  getIconImageDirect,
  onAnyIconLoad,
  isPointInArea,
  getCellIndices,
  buildCellId,
  resolveClickPoint,
  toRelativePoint,
  normalizeHoverPoint,
  isHoveringBounds,
  CellCanvasRoot,
  storeRenderData,
  retrieveRenderData,
  updateHoverState,
  getHoverState,
} from './cells'
export type {
  CanvasCell,
  CanvasCellData,
  CanvasRenderResult,
  RectBounds,
  Point,
  CellIndices,
  HoverMeta,
  HoverState,
  RenderClickHandler,
  CanvasCellRendererConfig,
  ButtonIcon,
  IconSpriteOptions,
  IconDefinition,
  IconSpriteStats,
  ButtonView,
  ButtonSize,
  SizeConfig,
  ViewColors,
} from './cells'

// Utils
export {
  CANVAS_PORTAL_EVENT,
  dispatchCanvasPortalHover,
  subscribeToCanvasPortalHover,
  lockPortalHover,
  isPortalHoverLocked,
  subscribeToPortalHoverLock,
  // Icon utilities
  reactIconToSvg,
  isReactIcon,
  normalizeIcon,
  clearIconCache,
  getIconCacheSize,
} from './utils'
export type {
  CanvasPortalSource,
  CanvasPortalHoverDetail,
  CanvasPortalHoverListener,
} from './utils'

// Miniflex
export {
  FlexBox,
  FlexElement,
  RootFlexBox,
  resolvePaddingBox as resolveFlexPaddingBox,
  flexBoxLayout,
} from './miniflex'
export type {
  FlexStyle,
  FlexBoxOptions,
  Size,
  Position,
  Direction,
  Justify,
  Align,
  AlignContent,
  FlexBoxItem,
} from './miniflex'

// Components
export { Canvas, buildCanvasTree, RootBridge } from './components'
export type {
  CanvasContainerProps,
  CanvasAbsoluteContainerProps,
  CanvasTextProps,
  CanvasIconProps,
  CanvasButtonProps,
  CanvasIconButtonProps,
  CanvasRectProps,
  CanvasBadgeProps,
  RootBridgeProps,
} from './components'

// Hooks
export { useCanvasRegistry } from './hooks'

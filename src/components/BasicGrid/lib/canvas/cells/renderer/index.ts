// Re-export types
export type {
  PointerKeyX,
  PointerKeyY,
  PointerKeyPair,
  RelativePoint,
  RendererDrawArgs,
  RendererClickArgs,
  CursorType,
  CanvasCellRendererConfig,
} from './types'

// Re-export constants
export {
  RELATIVE_COORD_TOLERANCE,
  POINTER_CANDIDATE_KEYS,
  DEFAULT_CURSOR,
  LEGACY_HOVER_CURSOR,
} from './constants'

// Re-export pointer utilities
export {
  getRelativePointerPosition,
  isAbsoluteCoords,
  isRelativeCoords,
} from './pointerUtils'

// Re-export click handlers
export {
  handleCanvasRootClick,
  handleClickHandlers,
  handleCellClick,
} from './clickHandlers'

// Re-export hover handlers
export {
  handleCanvasRootHover,
  updateHoverStateIfNeeded,
} from './hoverHandlers'

// Re-export main renderer
export { canvasCellRenderer } from './canvasCellRenderer'



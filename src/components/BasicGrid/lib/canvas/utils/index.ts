export {
  CANVAS_PORTAL_EVENT,
  dispatchCanvasPortalHover,
  subscribeToCanvasPortalHover,
  lockPortalHover,
  isPortalHoverLocked,
  subscribeToPortalHoverLock,
} from './portalHoverEvents'
export type {
  CanvasPortalSource,
  CanvasPortalHoverDetail,
  CanvasPortalHoverListener,
} from './portalHoverEvents'

export {
  reactIconToSvg,
  isReactIcon,
  normalizeIcon,
  clearIconCache,
  getIconCacheSize,
} from './iconUtils'


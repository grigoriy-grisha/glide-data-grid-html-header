import styled, { css, keyframes } from 'styled-components'

// ═══════════════════════════════════════════════════════════════════════════
// Design Tokens
// ═══════════════════════════════════════════════════════════════════════════

const colors = {
  // Base
  white: '#ffffff',
  border: '#e0e0e0',
  borderLight: '#d0dbef',
  
  // Text
  textPrimary: '#0f172a',
  textSecondary: '#61718a',
  textMuted: '#90a4c3',
  
  // Primary (Blue)
  primary: '#1e88e5',
  primaryDark: '#1565c0',
  primaryLight: '#42a5f5',
  primaryBg: '#eef4ff',
  primaryBorderLight: '#90c2ff',
  
  // Backgrounds
  headerBg: 'linear-gradient(180deg, #e7f1ff 0%, #d5e7ff 100%)',
  markerBg: '#f3f6fc',
  
  // Shadows
  shadowLight: 'rgba(15, 23, 42, 0.08)',
  shadowMedium: 'rgba(15, 23, 42, 0.12)',
  shadowDark: 'rgba(15, 23, 42, 0.18)',
  
  // Gradients for icons
  gradientBlue: 'linear-gradient(135deg, #1565c0, #42a5f5)',
  gradientPurple: 'linear-gradient(135deg, #7e57c2, #ab47bc)',
  gradientAmber: 'linear-gradient(135deg, #fb8c00, #ffb74d)',
  gradientGreen: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
  gradientTeal: 'linear-gradient(135deg, #00897b, #26c6da)',
  
  // Chip colors
  chipGreen: '#2e7d32',
  chipAmber: '#ffb300',
  chipAmberText: '#2f1b00',
  chipPurple: '#7e57c2',
  chipTeal: '#00897b',
  
  // Scrollbar
  scrollbarThumb: '#adb8cf',
} as const

const spacing = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
} as const

const radius = {
  sm: '4px',
  md: '6px',
  lg: '10px',
  xl: '16px',
  full: '999px',
} as const

const shadows = {
  card: `0 12px 30px ${colors.shadowLight}`,
  overlay: `0 20px 35px ${colors.shadowDark}, 0 4px 12px ${colors.shadowLight}`,
  header: `0 8px 20px ${colors.shadowMedium}, 0 2px 6px ${colors.shadowLight}`,
  drag: `0 12px 20px rgba(21, 101, 192, 0.2), 0 4px 8px rgba(21, 101, 192, 0.12)`,
} as const

const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  smooth: '0.18s ease',
} as const

const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const

// ═══════════════════════════════════════════════════════════════════════════
// Animations
// ═══════════════════════════════════════════════════════════════════════════

const overlayEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

// ═══════════════════════════════════════════════════════════════════════════
// Main Container & Wrapper
// ═══════════════════════════════════════════════════════════════════════════

export const GridContainer = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: 0 ${spacing.lg} ${spacing.xxxl};
  display: flex;
  flex-direction: column;
  gap: ${spacing.xl};
`

export const GridWrapper = styled.div`
  width: 100%;
  border: 1px solid ${colors.border};
  border-radius: ${radius.xl};
  background: ${colors.white};
  box-shadow: ${shadows.card};
  position: relative;
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;

  /* Hide glide-data-grid horizontal scrollbar */
  .dvn-scrollbar-horizontal {
    display: none !important;
  }

  /* Hide glide-data-grid header (we use custom) */
  .dvn-header,
  .dvn-header-cell {
    opacity: 0 !important;
    pointer-events: none !important;
    border: none !important;
  }

  /* Optimize shadow elements */
  #shadow-y,
  #shadow-x {
    contain: strict !important;
    will-change: opacity, transform !important;
  }
`

// ═══════════════════════════════════════════════════════════════════════════
// Grid Body
// ═══════════════════════════════════════════════════════════════════════════

export const GridBody = styled.div`
  position: relative;
  overflow: visible;
  min-height: 0;
`

// ═══════════════════════════════════════════════════════════════════════════
// Header Overlay (Sticky Header Container)
// ═══════════════════════════════════════════════════════════════════════════

export const HeaderOverlay = styled.div<{ $hasShadow?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  overflow: hidden;
  z-index: 10;
  background: ${colors.white};
  contain: strict;

  ${({ $hasShadow }) =>
    $hasShadow &&
    css`
      box-shadow: ${shadows.header};
    `}
`

// ═══════════════════════════════════════════════════════════════════════════
// Row Overlay
// ═══════════════════════════════════════════════════════════════════════════

export const RowOverlayWrapper = styled.div`
  position: absolute;
  left: ${spacing.lg};
  right: ${spacing.lg};
  z-index: 5;
  pointer-events: none;
  animation: ${overlayEnter} ${transitions.normal};
`

export const RowOverlayContent = styled.div`
  pointer-events: auto;
  background: ${colors.white};
  border-radius: ${radius.xl};
  border: 1px solid ${colors.shadowLight};
  box-shadow: ${shadows.overlay};
  padding: ${spacing.xxl};
`

export const RowOverlayCloseButton = styled.button`
  position: absolute;
  top: -14px;
  right: ${spacing.sm};
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(15, 23, 42, 0.8);
  color: ${colors.white};
  font-size: 18px;
  cursor: pointer;
  opacity: 0.85;
  transform: translateY(-50%);
  transition: opacity ${transitions.fast}, transform ${transitions.normal};

  &:hover {
    opacity: 1;
    transform: translateY(-50%) scale(1.05);
  }
`

// ═══════════════════════════════════════════════════════════════════════════
// Virtual Resize Line
// ═══════════════════════════════════════════════════════════════════════════

export const VirtualResizeLineStyled = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: rgba(21, 101, 192, 0.8);
  pointer-events: none;
  z-index: 1000;
`

// ═══════════════════════════════════════════════════════════════════════════
// Canvas Header
// ═══════════════════════════════════════════════════════════════════════════

export const CanvasHeaderContainer = styled.div`
  display: flex;
`

export const CanvasHeaderMarker = styled.div`
  background: ${colors.headerBg};
  border-right: 1px solid ${colors.borderLight};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const CanvasHeaderMain = styled.div`
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
`

export const CanvasHeaderCanvas = styled.canvas`
  display: block;
`

// ═══════════════════════════════════════════════════════════════════════════
// Checkbox (for row selection)
// ═══════════════════════════════════════════════════════════════════════════

export const HeaderCheckbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1px solid ${colors.primaryBorderLight};
  background: ${colors.primaryBg};
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  transition: border-color ${transitions.fast}, background-color ${transitions.fast},
    box-shadow ${transitions.fast};

  &:hover {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.2);
  }

  &:checked {
    background-color: ${colors.primary};
    border-color: ${colors.primary};

    &::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid ${colors.white};
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }

  &:indeterminate {
    background-color: ${colors.primary};
    border-color: ${colors.primary};

    &::after {
      content: '';
      position: absolute;
      left: 4px;
      right: 4px;
      top: 8px;
      height: 2px;
      border-radius: ${radius.full};
      background: ${colors.white};
    }
  }

  &:focus-visible {
    outline: 2px solid rgba(30, 136, 229, 0.4);
    outline-offset: 2px;
  }
`

// ═══════════════════════════════════════════════════════════════════════════
// Drag Overlays
// ═══════════════════════════════════════════════════════════════════════════

export const DragIndicator = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background-color: ${colors.primary};
  z-index: 100;
  pointer-events: none;
  will-change: transform;
`

export const DragGhost = styled.div`
  position: absolute;
  top: 4px;
  left: 0;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid ${colors.primary};
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 101;
  pointer-events: none;
  display: flex;
  align-items: center;
  padding-left: ${spacing.md};
  border-radius: ${radius.sm};
  font-family: ${typography.fontFamily};
  font-size: 13px;
  color: ${colors.primary};
  font-weight: 600;
  will-change: transform;
  opacity: 0.5;
  overflow: hidden;
`

export const DragSnapshot = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.9;
`

export const DragSnapshotCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.9;
`

// ═══════════════════════════════════════════════════════════════════════════
// Resize Handle
// ═══════════════════════════════════════════════════════════════════════════

export const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  cursor: col-resize;
  z-index: 10;
  will-change: transform;
  transform: translate(var(--x), var(--y));
  height: var(--h);
`

// ═══════════════════════════════════════════════════════════════════════════
// Portal Overlay (Canvas hover highlight)
// ═══════════════════════════════════════════════════════════════════════════

export const CanvasPortalOverlayStyled = styled.div`
  position: fixed;
  pointer-events: none;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  border: 1px solid rgba(30, 136, 229, 0.8);
  border-radius: ${radius.md};
  background-color: rgba(30, 136, 229, 0.12);
  box-sizing: border-box;
  z-index: 2147483600;
  opacity: 0;
  transition: opacity 120ms ease;
`

// ═══════════════════════════════════════════════════════════════════════════
// Hidden React Layer (for headless rendering)
// ═══════════════════════════════════════════════════════════════════════════

export const CanvasReactLayer = styled.div`
  display: none;
`

// ═══════════════════════════════════════════════════════════════════════════
// Header Cell Styles (for HTML header if used)
// ═══════════════════════════════════════════════════════════════════════════

export const HeaderCell = styled.div<{
  $clickable?: boolean
  $sorted?: boolean
  $selected?: boolean
  $draggable?: boolean
  $dragging?: boolean
  $placeholder?: boolean
  $dropBefore?: boolean
  $dropAfter?: boolean
}>`
  position: absolute;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing.xs};
  border-right: 1px solid ${colors.border};
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 ${spacing.md};
  transition: background-color ${transitions.normal}, box-shadow ${transitions.normal},
    transform ${transitions.smooth};
  will-change: transform;

  ${({ $clickable }) =>
    $clickable &&
    css`
      cursor: pointer;
      user-select: none;

      &:hover {
        box-shadow: inset 0 0 0 999px rgba(21, 101, 192, 0.08);
      }

      &:focus-visible {
        outline: 2px solid ${colors.primaryDark};
        outline-offset: 2px;
      }
    `}

  ${({ $sorted }) =>
    $sorted &&
    css`
      box-shadow: inset 0 -2px 0 ${colors.primaryDark};
    `}

  ${({ $selected }) =>
    $selected &&
    css`
      outline: 2px solid ${colors.primary};
      outline-offset: -2px;
    `}

  ${({ $draggable }) =>
    $draggable &&
    css`
      cursor: grab;
    `}

  ${({ $dragging }) =>
    $dragging &&
    css`
      cursor: grabbing;
      opacity: 0.85;
      box-shadow: ${shadows.drag};
      transform: scale(1.02) translateY(-2px);
      z-index: 2;
    `}

  ${({ $placeholder }) =>
    $placeholder &&
    css`
      opacity: 0.45;
      transform: scale(0.98);
      filter: blur(0.1px);
    `}

  ${({ $dropBefore }) =>
    $dropBefore &&
    css`
      &::before {
        content: '';
        position: absolute;
        top: 6px;
        bottom: 6px;
        left: 2px;
        width: 3px;
        border-radius: ${radius.full};
        background-color: ${colors.primary};
      }
    `}

  ${({ $dropAfter }) =>
    $dropAfter &&
    css`
      &::after {
        content: '';
        position: absolute;
        top: 6px;
        bottom: 6px;
        right: 2px;
        width: 3px;
        border-radius: ${radius.full};
        background-color: ${colors.primary};
      }
    `}
`

// ═══════════════════════════════════════════════════════════════════════════
// Header Card Components (for complex header content)
// ═══════════════════════════════════════════════════════════════════════════

export const HeaderCard = styled.div<{ $stacked?: boolean; $compact?: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};

  ${({ $stacked }) =>
    $stacked &&
    css`
      align-items: flex-start;
    `}

  ${({ $compact }) =>
    $compact &&
    css`
      gap: ${spacing.xs};
    `}
`

export const HeaderCardMain = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${spacing.md};
  flex-wrap: wrap;
`

type IconColorVariant = 'blue' | 'purple' | 'amber' | 'green' | 'teal'

const iconGradients: Record<IconColorVariant, string> = {
  blue: colors.gradientBlue,
  purple: colors.gradientPurple,
  amber: colors.gradientAmber,
  green: colors.gradientGreen,
  teal: colors.gradientTeal,
}

export const HeaderCardIcon = styled.div<{ $color?: IconColorVariant; $compact?: boolean }>`
  width: ${({ $compact }) => ($compact ? '26px' : '30px')};
  height: ${({ $compact }) => ($compact ? '26px' : '30px')};
  border-radius: ${({ $compact }) => ($compact ? spacing.md : radius.lg)};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $compact }) => ($compact ? '12px' : '14px')};
  font-weight: 600;
  color: ${colors.white};
  flex: 0 0 auto;
  background: ${({ $color = 'blue' }) => iconGradients[$color]};
`

export const HeaderCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.2;
  min-width: 0;
  flex: 1 1 auto;
`

export const HeaderCardTitle = styled.div<{ $compact?: boolean }>`
  font-size: ${({ $compact }) => ($compact ? '11px' : '12px')};
  font-weight: 600;
  color: ${colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const HeaderCardSubtitle = styled.div<{ $compact?: boolean }>`
  font-size: ${({ $compact }) => ($compact ? '9px' : '10px')};
  color: ${colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

// ═══════════════════════════════════════════════════════════════════════════
// Chips & Tags
// ═══════════════════════════════════════════════════════════════════════════

type ChipColor = 'blue' | 'green' | 'amber' | 'purple' | 'teal'

const chipColors: Record<ChipColor, { bg: string; text: string }> = {
  blue: { bg: colors.primary, text: colors.white },
  green: { bg: colors.chipGreen, text: colors.white },
  amber: { bg: colors.chipAmber, text: colors.chipAmberText },
  purple: { bg: colors.chipPurple, text: colors.white },
  teal: { bg: colors.chipTeal, text: colors.white },
}

export const HeaderChip = styled.span<{ $color?: ChipColor; $inMain?: boolean }>`
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 2px ${spacing.sm};
  border-radius: ${radius.full};
  white-space: nowrap;
  flex: 0 0 auto;
  background-color: ${({ $color = 'blue' }) => chipColors[$color].bg};
  color: ${({ $color = 'blue' }) => chipColors[$color].text};

  ${({ $inMain }) =>
    $inMain &&
    css`
      margin-left: auto;
    `}
`

export const HeaderTag = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 2px ${spacing.sm};
  border-radius: ${radius.full};
  background-color: ${colors.primary};
  color: ${colors.white};
`

// ═══════════════════════════════════════════════════════════════════════════
// Header Metrics
// ═══════════════════════════════════════════════════════════════════════════

export const HeaderMetrics = styled.div`
  display: flex;
  gap: ${radius.lg};
  flex-wrap: wrap;
`

export const HeaderMetric = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 52px;
`

export const HeaderMetricValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textPrimary};
`

export const HeaderMetricLabel = styled.span`
  font-size: 9px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${colors.textMuted};
`

// ═══════════════════════════════════════════════════════════════════════════
// Header With Icon
// ═══════════════════════════════════════════════════════════════════════════

export const HeaderWithIcon = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${spacing.sm};
`

// ═══════════════════════════════════════════════════════════════════════════
// Sort Indicator
// ═══════════════════════════════════════════════════════════════════════════

export const SortIndicator = styled.span`
  font-size: 12px;
  line-height: 1;
`

// ═══════════════════════════════════════════════════════════════════════════
// HTML Header (virtualized, if still used)
// ═══════════════════════════════════════════════════════════════════════════

export const HtmlHeader = styled.div`
  display: flex;
  border-top: 1px solid ${colors.border};
  border-bottom: 1px solid ${colors.border};
  margin: 0;
  padding: 0;
  background: ${colors.white};
  font-family: ${typography.fontFamily};
  pointer-events: auto;
  box-sizing: border-box;
`

export const HtmlHeaderRowMarker = styled.div`
  background: ${colors.markerBg};
  border-right: 1px solid ${colors.border};
  width: 47px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 ${spacing.sm};
`

export const HtmlHeaderContent = styled.div`
  overflow: hidden;
  box-sizing: border-box;
`

export const HtmlHeaderContentInner = styled.div`
  position: relative;
  height: 100%;
  will-change: transform;
`

export const HtmlHeaderLevel = styled.div`
  position: absolute;
  width: 100%;
  border-bottom: 1px solid ${colors.border};

  &:last-child {
    border-bottom: none;
  }
`

export const SelectionHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

// ═══════════════════════════════════════════════════════════════════════════
// Top Scroll (if used for dual scrollbar)
// ═══════════════════════════════════════════════════════════════════════════

export const TopScroll = styled.div`
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  height: 18px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 ${spacing.lg};
  box-sizing: border-box;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${colors.scrollbarThumb};
    border-radius: ${radius.full};
  }
`

export const TopScrollContent = styled.div`
  height: 12px;
`

// ═══════════════════════════════════════════════════════════════════════════
// Resize Handle for HTML Header
// ═══════════════════════════════════════════════════════════════════════════

export const HtmlHeaderResizeHandle = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: '';
    width: 2px;
    height: 50%;
    border-radius: ${radius.full};
    background-color: transparent;
    transition: background-color ${transitions.fast};
  }

  &:hover::after,
  &:active::after {
    background-color: rgba(21, 101, 192, 0.4);
  }
`


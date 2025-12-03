import React from 'react'
import type { GridHeaderCell } from '../../models/GridHeaderCell'
import type { GridColumn } from '../../models/GridColumn'
import { useHeaderVirtualization } from '../../context/HeaderVirtualizationContext'
import { useCanvasLifecycle } from './hooks/useCanvasLifecycle'
import { useHeaderDragDrop } from './hooks/useHeaderDragDrop'
import { useHeaderScene } from './hooks/useHeaderScene'
import { useNodeRegistry } from './hooks/useNodeRegistry'
import { ResizeHandles } from './components/ResizeHandles'
import { DragOverlays } from './components/DragOverlays'
import { HeadlessHeaderRenderer } from './components/HeadlessHeaderRenderer'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasHeaderProps {
  width: number
  height: number
  headerCells: GridHeaderCell[]
  orderedColumns: GridColumn<any>[]
  columnPositions: number[]
  columnWidths: number[]
  levelCount: number
  headerRowHeight: number
  markerWidth?: number
  showRowMarkers?: boolean
  scrollLeft?: number
  canvasHeaderRef?: React.RefObject<HTMLCanvasElement>
  handleResizeMouseDown?: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  handleResizeDoubleClick?: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  getColumnWidth?: (columnIndex: number) => number
  setColumnWidths?: (updates: Array<{ columnId: string; width: number }>) => void
  onVirtualResizeChange?: (x: number | null, columnIndex: number | null) => void
  enableColumnReorder?: boolean
  onColumnReorder?: (sourceIndex: number, targetIndex: number) => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onColumnSort?: (columnId: string, direction: 'asc' | 'desc' | undefined) => void
  dataAreaWidth?: number
  debugMode?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Visibility Hook
// ─────────────────────────────────────────────────────────────────────────────

function useIntersectionVisibility(
  targetRef: React.RefObject<HTMLElement | null>
): boolean {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    
    const target = targetRef.current
    if (!target) return

    // Используем rootMargin чтобы считать элемент видимым даже когда он
    // частично за пределами viewport (для плавного сворачивания хедера)
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Считаем видимым если элемент пересекается с viewport
        // или находится близко к нему (в пределах 100px)
        setIsVisible(entry?.isIntersecting ?? true)
      },
      { root: null, threshold: 0, rootMargin: '100px 0px 100px 0px' }
    )
    
    observer.observe(target)
    return () => observer.disconnect()
  }, [targetRef])

  return isVisible
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const CanvasHeader = React.memo<CanvasHeaderProps>(({
  width,
  height,
  headerCells,
  orderedColumns,
  columnPositions,
  columnWidths,
  headerRowHeight,
  markerWidth = 0,
  showRowMarkers = false,
  scrollLeft = 0,
  canvasHeaderRef,
  handleResizeMouseDown,
  handleResizeDoubleClick,
  enableColumnReorder,
  onColumnReorder,
  sortColumn,
  sortDirection,
  onColumnSort,
  debugMode
}) => {
  const { visibleIndices } = useHeaderVirtualization()
  const markerWidthValue = showRowMarkers ? markerWidth : 0
  const [isHovered, setIsHovered] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Node registry for React-managed content
  const { registryRef, notifyChange, subscribe } = useNodeRegistry()

  // Canvas lifecycle
  const { canvasRef, rootRef } = useCanvasLifecycle({
    width,
    height,
    canvasHeaderRef,
    isActive: true,
  })

  // Visibility detection - observe container, not canvas
  // This ensures visibility is tracked correctly even when header is collapsing
  // Always render when header height > 0 to prevent issues during collapse/expand
  const intersectionVisible = useIntersectionVisibility(containerRef)
  const isVisible = intersectionVisible || height > 0

  // Drag and drop
  const { dragState, handleDragStart, ghostRef, dropIndicatorRef } = useHeaderDragDrop({
    canvasRef,
    columnCount: orderedColumns.length,
    columnPositions,
    columnWidths,
    scrollLeft,
    enableColumnReorder,
    onColumnReorder
  })

  // Scene construction
  useHeaderScene({
    rootRef,
    canvasRef,
    visibleIndices,
    headerCells,
    orderedColumns,
    columnPositions,
    columnWidths,
    scrollLeft,
    headerRowHeight,
    markerWidthValue,
    enableColumnReorder,
    dragState,
    handleDragStart,
    sortColumn,
    sortDirection,
    onColumnSort,
    debugMode,
    isVisible,
    nodeRegistry: registryRef,
    subscribeToRegistryChange: subscribe,
  })

  const headerStyle = React.useMemo(() => ({
    '--canvas-header-width': `${width + markerWidthValue}px`,
    '--canvas-header-height': `${height}px`,
    '--canvas-marker-width': `${markerWidthValue + 1}px`,
    '--canvas-main-width': `${width}px`,
  } as React.CSSProperties), [width, height, markerWidthValue])

  return (
    <div className="canvas-header" style={headerStyle} ref={containerRef}>
      {/* Headless Renderer for React Components */}
      {isVisible && (
        <HeadlessHeaderRenderer
          visibleIndices={visibleIndices}
          headerCells={headerCells}
          orderedColumns={orderedColumns}
          nodeRegistry={registryRef}
          onRegistryChange={notifyChange}
        />
      )}

      {/* Row Marker Column */}
      {showRowMarkers && (
        <div
          className="canvas-header__marker"
          style={{
            width: 'var(--canvas-marker-width)',
            height: 'var(--canvas-header-height)',
          }}
        />
      )}

      {/* Main Canvas Area */}
      <div
        className="canvas-header__main"
        style={{
          width: 'var(--canvas-main-width)',
          height: 'var(--canvas-header-height)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <canvas
          ref={canvasRef}
          className="canvas-header__canvas"
          style={{
            width: 'var(--canvas-main-width)',
            height: 'var(--canvas-header-height)',
          }}
        />

        {/* Resize Handles */}
        {handleResizeMouseDown && isHovered && isVisible && (
          <ResizeHandles
            visibleIndices={visibleIndices}
            orderedColumns={orderedColumns}
            columnWidths={columnWidths}
            columnPositions={columnPositions}
            scrollLeft={scrollLeft}
            width={width}
            handleResizeMouseDown={handleResizeMouseDown}
            handleResizeDoubleClick={handleResizeDoubleClick}
          />
        )}

        {/* Drag Overlays */}
        {isVisible && (
          <DragOverlays
            dragState={dragState}
            height={height}
            dropIndicatorRef={dropIndicatorRef}
            ghostRef={ghostRef}
          />
        )}
      </div>
    </div>
  )
})

import React from 'react'
import { GridHeaderCell } from '../../models/GridHeaderCell'
import type { GridHeaderCell as GridHeaderCellType } from '../../models/GridHeaderCell'
import type { GridColumn } from '../../models/GridColumn'
import { SELECTION_COLUMN_ID } from '../../constants'
import { useHeaderVirtualization } from '../../context/HeaderVirtualizationContext'
import { useCanvasLifecycle } from './hooks/useCanvasLifecycle'
import { useHeaderDragDrop } from './hooks/useHeaderDragDrop'
import { useHeaderScene } from './hooks/useHeaderScene'
import { useNodeRegistry } from './hooks/useNodeRegistry'
import { ResizeHandles } from './components/ResizeHandles'
import { DragOverlays } from './components/DragOverlays'
import { HeadlessHeaderRenderer } from './components/HeadlessHeaderRenderer'
import { CanvasPortalOverlay } from './components/CanvasPortalOverlay'
import { SortButtonOverlay } from './components/SortButtonOverlay'
import type { CanvasEvent, CanvasNode } from '../../lib/canvas'
import { dispatchCanvasPortalHover } from '../../lib/canvas'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasHeaderProps {
  width: number
  height: number
  headerCells: GridHeaderCellType[]
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
  // Row selection props
  enableRowSelection?: boolean
  isAllRowsSelected?: boolean
  hasPartialRowSelection?: boolean
  onSelectAllChange?: (checked: boolean) => void
  // Column selection props
  selectedColumns?: Set<number>
  onColumnClick?: (startIndex: number, colSpan: number, ctrlKey: boolean) => void
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
  debugMode,
  enableRowSelection = false,
  isAllRowsSelected = false,
  hasPartialRowSelection = false,
  onSelectAllChange,
  selectedColumns,
  onColumnClick,
}) => {
  const { visibleIndices } = useHeaderVirtualization()
  const markerWidthValue = showRowMarkers ? markerWidth : 0
  const [isHovered, setIsHovered] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const selectAllCheckboxRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = hasPartialRowSelection
    }
  }, [hasPartialRowSelection])

  // Node registry for React-managed content
  const { registryRef, notifyChange, subscribe } = useNodeRegistry()

  const {
    canvasWidth,
    effectiveMarkerWidth,
    headerCells: canvasHeaderCells,
    orderedColumns: canvasOrderedColumns,
    columnPositions: canvasColumnPositions,
    columnWidths: canvasColumnWidths,
    visibleIndices: canvasVisibleIndices,
  } = useSelectionAdjustedHeaderData({
    width,
    headerCells,
    orderedColumns,
    columnPositions,
    columnWidths,
    visibleIndices,
    enableRowSelection,
    showRowMarkers,
    markerWidthValue,
  })

  const { canvasRef, rootRef } = useCanvasLifecycle({
    width: canvasWidth,
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
    visibleIndices: canvasVisibleIndices,
    headerCells: canvasHeaderCells,
    orderedColumns: canvasOrderedColumns,
    columnPositions: canvasColumnPositions,
    columnWidths: canvasColumnWidths,
    scrollLeft,
    headerRowHeight,
    markerWidthValue: effectiveMarkerWidth,
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
    selectedColumns,
    onColumnClick,
  })

  const rootInstance = rootRef.current
  const canvasElement = canvasRef.current

  React.useEffect(() => {
    if (!rootInstance || !canvasElement) {
      return
    }

    let lastOriginId: string | null = null

    const handlePortalHoverChange = (node: CanvasNode | null, _event: CanvasEvent | null) => {
      if (!node) {
        dispatchCanvasPortalHover({
          node,
          visible: false,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          originId: lastOriginId ?? undefined,
          source: 'header',
        })
        return
      }

      const canvasBounds = canvasElement.getBoundingClientRect()
      lastOriginId = node.id
      dispatchCanvasPortalHover({
        node,
        visible: true,
        x: canvasBounds.left + node.rect.x,
        y: canvasBounds.top + node.rect.y,
        width: node.rect.width,
        height: node.rect.height,
        nodeId: node.id,
        originId: node.id,
        source: 'header',
      })
    }

    rootInstance.onPortalHoverTargetChange = handlePortalHoverChange

    return () => {
      if (rootInstance.onPortalHoverTargetChange === handlePortalHoverChange) {
        rootInstance.onPortalHoverTargetChange = undefined
      }
      dispatchCanvasPortalHover({
        node: null,
        visible: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        originId: lastOriginId ?? undefined,
        source: 'header',
      })
    }
  }, [rootInstance, canvasElement])

  // Selection column width (first column when row selection is enabled)
  const headerStyle = React.useMemo(() => ({
    '--canvas-header-width': `${canvasWidth + effectiveMarkerWidth}px`,
    '--canvas-header-height': `${height}px`,
    '--canvas-marker-width': `${effectiveMarkerWidth + 1}px`,
    '--canvas-main-width': `${canvasWidth}px`,
  } as React.CSSProperties), [canvasWidth, height, effectiveMarkerWidth])

  return (
    <div className="canvas-header" style={headerStyle} ref={containerRef}>
      {isVisible && (
        <HeadlessHeaderRenderer
          visibleIndices={canvasVisibleIndices}
          headerCells={canvasHeaderCells}
          orderedColumns={canvasOrderedColumns}
          nodeRegistry={registryRef}
          onRegistryChange={notifyChange}
        />
      )}
      {(showRowMarkers || enableRowSelection) && (
        <div
          className="canvas-header__marker"
          style={{
            width: 'var(--canvas-marker-width)',
            height: 'var(--canvas-header-height)',
          }}
        >
          {enableRowSelection && (
            <input
              ref={selectAllCheckboxRef}
              type="checkbox"
              className="basic-grid-header-row-checkbox"
              checked={isAllRowsSelected}
              onChange={(e) => onSelectAllChange?.(e.target.checked)}
              aria-label="Выбрать все строки"
            />
          )}
        </div>
      )}
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
        {handleResizeMouseDown && isHovered && isVisible && (
          <ResizeHandles
            visibleIndices={canvasVisibleIndices}
            orderedColumns={canvasOrderedColumns}
            columnWidths={canvasColumnWidths}
            columnPositions={canvasColumnPositions}
            scrollLeft={scrollLeft}
            width={canvasWidth}
            handleResizeMouseDown={handleResizeMouseDown}
            handleResizeDoubleClick={handleResizeDoubleClick}
          />
        )}
        {isVisible && (
          <DragOverlays
            dragState={dragState}
            height={height}
            dropIndicatorRef={dropIndicatorRef}
            ghostRef={ghostRef}
          />
        )}
      </div>
      <CanvasPortalOverlay />
      <SortButtonOverlay
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onColumnSort={onColumnSort}
      />
    </div>
  )
})

interface SelectionAdjustedHeaderInput {
  width: number
  headerCells: GridHeaderCellType[]
  orderedColumns: GridColumn<any>[]
  columnPositions: number[]
  columnWidths: number[]
  visibleIndices: { start: number; end: number }
  enableRowSelection: boolean
  showRowMarkers: boolean
  markerWidthValue: number
}

interface SelectionAdjustedHeaderData {
  canvasWidth: number
  effectiveMarkerWidth: number
  headerCells: GridHeaderCellType[]
  orderedColumns: GridColumn<any>[]
  columnPositions: number[]
  columnWidths: number[]
  visibleIndices: { start: number; end: number }
}

function useSelectionAdjustedHeaderData({
  width,
  headerCells,
  orderedColumns,
  columnPositions,
  columnWidths,
  visibleIndices,
  enableRowSelection,
  showRowMarkers,
  markerWidthValue,
}: SelectionAdjustedHeaderInput): SelectionAdjustedHeaderData {
  return React.useMemo(() => {
    const selectionColumnWidth = enableRowSelection && columnWidths.length > 0 ? columnWidths[0] : 0
    const canvasWidth = width - (enableRowSelection ? selectionColumnWidth : 0)
    const effectiveMarkerWidth = showRowMarkers ? markerWidthValue : (enableRowSelection ? selectionColumnWidth : 0)

    if (!enableRowSelection) {
      return {
        canvasWidth,
        effectiveMarkerWidth,
        headerCells,
        orderedColumns,
        columnPositions,
        columnWidths,
        visibleIndices,
      }
    }

    const adjustedColumns = orderedColumns.filter((column) => column.id !== SELECTION_COLUMN_ID)
    const adjustedColumnWidths = columnWidths.slice(1)
    const offset = selectionColumnWidth
    const adjustedPositions = columnPositions.slice(1).map((pos) => pos - offset)
    const adjustedVisibleIndices = {
      start: Math.max(0, visibleIndices.start - 1),
      end: Math.max(0, visibleIndices.end - 1),
    }

    const adjustedHeaderCells: GridHeaderCellType[] = []
    for (const cell of headerCells) {
      if (cell.columnIndex === 0) {
        continue
      }

      const adjustedStartIndex = Math.max(0, cell.startIndex - 1)
      const adjustedColSpan = cell.startIndex === 0 ? cell.colSpan - 1 : cell.colSpan
      if (adjustedColSpan <= 0) {
        continue
      }

      const adjustedColumnIndex =
        typeof cell.columnIndex === 'number' ? cell.columnIndex - 1 : cell.columnIndex

      adjustedHeaderCells.push(
        new GridHeaderCell(
          cell.title,
          cell.level,
          cell.rowSpan,
          adjustedColSpan,
          adjustedStartIndex,
          adjustedColumnIndex,
          cell.isLeaf,
          cell.content,
          cell.renderColumnContent
        )
      )
    }

    return {
      canvasWidth,
      effectiveMarkerWidth,
      headerCells: adjustedHeaderCells,
      orderedColumns: adjustedColumns,
      columnPositions: adjustedPositions,
      columnWidths: adjustedColumnWidths,
      visibleIndices: adjustedVisibleIndices,
    }
  }, [
    width,
    headerCells,
    orderedColumns,
    columnPositions,
    columnWidths,
    visibleIndices,
    enableRowSelection,
    showRowMarkers,
    markerWidthValue,
  ])
}

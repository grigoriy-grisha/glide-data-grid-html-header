import React from 'react'
import type { GridHeaderCell } from '../../models/GridHeaderCell'
import type { GridColumn } from '../../models/GridColumn'
import { useHeaderVirtualization } from '../../context/HeaderVirtualizationContext'
import { useCanvasLifecycle } from './hooks/useCanvasLifecycle'
import { useHeaderDragDrop } from './hooks/useHeaderDragDrop'
import { useHeaderScene } from './hooks/useHeaderScene'
import { ResizeHandles } from './components/ResizeHandles'
import { DragOverlays } from './components/DragOverlays'

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

  // 1. Canvas Lifecycle & Ref Management
  const { canvasRef, rootRef } = useCanvasLifecycle({
    width,
    height,
    canvasHeaderRef
  })

  // 2. Drag and Drop State & Logic
  const { dragState, handleDragStart, ghostRef, dropIndicatorRef } = useHeaderDragDrop({
    canvasRef,
    orderedColumns,
    columnPositions,
    columnWidths,
    scrollLeft,
    enableColumnReorder,
    onColumnReorder
  })

  // 3. Scene Construction (Canvas Render Logic)
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
    debugMode
  })

  return (
    <div
      style={{
        display: 'flex',
        width: `${width + markerWidthValue}px`,
        height: `${height}px`,
      }}
    >
      {showRowMarkers && (
        <div
          style={{
            width: `${markerWidthValue + 1}px`,
            height: `${height}px`,
            backgroundColor: '#f3f6fc',
            borderRight: '1px solid #e0e0e0',
            flexShrink: 0,
          }}
        />
      )}
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: `${width}px`,
            height: `${height}px`,
          }}
        />

        {handleResizeMouseDown && isHovered && (
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

        <DragOverlays
          dragState={dragState}
          height={height}
          dropIndicatorRef={dropIndicatorRef}
          ghostRef={ghostRef}
        />
      </div>
    </div>
  )
})

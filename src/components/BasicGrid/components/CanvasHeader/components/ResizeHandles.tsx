import React from 'react'
import { GridColumn } from '../../../models/GridColumn'
import { SELECTION_COLUMN_ID } from '../../../constants'

interface ResizeHandlesProps {
  visibleIndices: { start: number; end: number } | null
  orderedColumns: GridColumn<any>[]
  columnWidths: number[]
  columnPositions: number[]
  scrollLeft: number
  width: number
  handleResizeMouseDown: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  handleResizeDoubleClick?: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = React.memo(({
  visibleIndices,
  orderedColumns,
  columnWidths,
  columnPositions,
  scrollLeft,
  width,
  handleResizeMouseDown,
  handleResizeDoubleClick,
}) => {
  if (!visibleIndices) return null

  const { start, end } = visibleIndices
  // Buffer handles slightly to ensure edges are reachable
  const buffer = 2
  const safeStart = Math.max(0, start - buffer)
  const safeEnd = Math.min(orderedColumns.length, end + buffer)

  const handles: React.ReactNode[] = []

  for (let i = safeStart; i < safeEnd; i++) {
    const col = orderedColumns[i]
    if (col.id === SELECTION_COLUMN_ID) continue

    const colWidth = columnWidths[i] ?? col.baseWidth ?? 0
    const x = (columnPositions[i] ?? 0) + colWidth
    const relativeX = x - scrollLeft

    // Only show handle if it's within the visible area (roughly)
    if (relativeX < -10 || relativeX > width + 10) continue

    handles.push(
      <div
        key={`resize-${col.id}-${i}`}
        className="basic-grid-resize-handle"
        style={{
          position: 'absolute',
          left: `${relativeX - 5}px`,
          top: 0,
          bottom: 0,
          width: '10px',
          cursor: 'col-resize',
          zIndex: 10,
        }}
        onMouseDown={(e) => {
          handleResizeMouseDown(e, i, 1)
        }}
        onDoubleClick={(e) => {
          handleResizeDoubleClick?.(e, i, 1)
        }}
      />
    )
  }
  return <>{handles}</>
})

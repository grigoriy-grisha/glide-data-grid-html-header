import React from 'react'
import { GridColumn } from '../../../models/GridColumn'
import { SELECTION_COLUMN_ID } from '../../../constants'

const HANDLE_BUFFER = 2
const HANDLE_OFFSET = 5
const VISIBILITY_THRESHOLD = 10

interface ResizeHandlesProps {
  visibleIndices: { start: number; end: number } | null
  orderedColumns: GridColumn<Record<string, unknown>>[]
  columnWidths: number[]
  columnPositions: number[]
  scrollLeft: number
  width: number
  handleResizeMouseDown: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  handleResizeDoubleClick?: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
}

interface ResizeHandleData {
  columnIndex: number
  columnId: string
  position: number
}

function calculateVisibleRange(
  visibleIndices: { start: number; end: number },
  totalColumns: number
): { start: number; end: number } {
  return {
    start: Math.max(0, visibleIndices.start - HANDLE_BUFFER),
    end: Math.min(totalColumns, visibleIndices.end + HANDLE_BUFFER),
  }
}

function isHandleVisible(relativeX: number, containerWidth: number): boolean {
  return relativeX >= -VISIBILITY_THRESHOLD && relativeX <= containerWidth + VISIBILITY_THRESHOLD
}

function createResizeHandleData(
  columnIndex: number,
  column: GridColumn<Record<string, unknown>>,
  columnWidths: number[],
  columnPositions: number[],
  scrollLeft: number
): ResizeHandleData | null {
  if (column.id === SELECTION_COLUMN_ID) {
    return null
  }

  const colWidth = columnWidths[columnIndex] ?? column.baseWidth ?? 0
  const x = (columnPositions[columnIndex] ?? 0) + colWidth
  const relativeX = x - scrollLeft

  return {
    columnIndex,
    columnId: column.id,
    position: relativeX - HANDLE_OFFSET,
  }
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
  if (!visibleIndices) {
    return null
  }

  const { start, end } = calculateVisibleRange(visibleIndices, orderedColumns.length)
  const handles: React.ReactNode[] = []

  for (let i = start; i < end; i++) {
    const column = orderedColumns[i]
    if (!column) continue

    const handleData = createResizeHandleData(
      i,
      column,
      columnWidths,
      columnPositions,
      scrollLeft
    )

    if (!handleData) continue

    const relativeX = handleData.position + HANDLE_OFFSET
    if (!isHandleVisible(relativeX, width)) continue

    handles.push(
      <div
        key={`resize-${handleData.columnId}-${handleData.columnIndex}`}
        className="resize-handle"
        style={{ left: `${handleData.position}px` }}
        onMouseDown={(e) => handleResizeMouseDown(e, handleData.columnIndex, 1)}
        onDoubleClick={(e) => handleResizeDoubleClick?.(e, handleData.columnIndex, 1)}
      />
    )
  }

  return <>{handles}</>
})


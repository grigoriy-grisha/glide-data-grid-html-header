import type React from 'react'

import type { GridHeaderCell } from '../models/GridHeaderCell'
import type { GridColumn } from '../models/GridColumn'
import type { SortDirection } from '../types'
import { SELECTION_COLUMN_ID } from '../constants'

type SortState = { columnId: string; direction: SortDirection } | null

interface SelectedBounds {
  start: number
  end: number
}

interface GridHeaderProps<RowType extends Record<string, unknown>> {
  columnPositions: number[]
  columnWidths: number[]
  headerCells: GridHeaderCell[]
  orderedColumns: GridColumn<RowType>[]
  levelCount: number
  headerRowHeight: number
  markerWidth: number
  showRowMarkers: boolean
  dataViewportWidth: number
  dataAreaWidth: number
  viewportWidth: number
  scrollbarReserve: number
  scrollLeft: number
  headerInnerRef: React.RefObject<HTMLDivElement>
  selectRange: (startIndex: number, span: number) => void
  selectedBounds: SelectedBounds | null
  handleColumnSort: (columnIndex: number) => void
  sortState: SortState
  enableColumnReorder: boolean
  handleHeaderDragStart: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number) => void
  dragState: { sourceIndex: number; targetIndex: number } | null
  hasActiveDrag: boolean
  handleResizeMouseDown: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  handleResizeDoubleClick: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  isAllRowsSelected: boolean
  handleSelectAllChange: (checked: boolean) => void
  selectAllCheckboxRef: React.RefObject<HTMLInputElement>
}

const HEADER_COLORS = ['#e3f2fd', '#f5f5f5', '#fafafa']
const HEADER_TEXT_COLORS = ['#1565c0', '#333333', '#666666']
const HEADER_FONT_SIZES = [14, 13, 12]

export function GridHeader<RowType extends Record<string, unknown>>({
  columnPositions,
  columnWidths,
  headerCells,
  orderedColumns,
  levelCount,
  headerRowHeight,
  markerWidth,
  showRowMarkers,
  dataViewportWidth,
  dataAreaWidth,
  viewportWidth,
  scrollbarReserve,
  scrollLeft,
  headerInnerRef,
  selectRange,
  selectedBounds,
  handleColumnSort,
  sortState,
  enableColumnReorder,
  handleHeaderDragStart,
  dragState,
  hasActiveDrag,
  handleResizeMouseDown,
  handleResizeDoubleClick,
  isAllRowsSelected,
  handleSelectAllChange,
  selectAllCheckboxRef,
}: GridHeaderProps<RowType>) {
  if (columnPositions.length === 0 || levelCount === 0) {
    return null
  }

  const headerHeight = levelCount * headerRowHeight

  return (
    <div
      className="basic-grid-html-header"
      style={{
        width: `${viewportWidth}px`,
        paddingRight: `${scrollbarReserve}px`,
        boxSizing: 'border-box',
      }}
    >
      {showRowMarkers && (
        <div className="basic-grid-header-row-marker" style={{ width: `${markerWidth}px` }} />
      )}
      <div
        className="basic-grid-header-content"
        style={{
          width: `${dataViewportWidth}px`,
          paddingRight: `${scrollbarReserve}px`,
          boxSizing: 'border-box',
        }}
      >
        <div
          className="basic-grid-header-content-inner"
          ref={headerInnerRef}
          style={{
            width: `${dataAreaWidth}px`,
            height: `${headerHeight}px`,
            transform: `translateX(-${scrollLeft}px)`,
          }}
        >
          {Array.from({ length: levelCount }).map((_, levelIndex) => (
            <div
              key={`level-${levelIndex}`}
              className="basic-grid-header-level"
              style={{
                position: 'absolute',
                top: `${levelIndex * headerRowHeight}px`,
                height: `${headerRowHeight}px`,
                width: '100%',
              }}
            />
          ))}

          {headerCells.map((cell) => {
            const startX = columnPositions[cell.startIndex] ?? 0
            const totalWidth = cell.getSpanWidth(columnWidths)
            const bgColor = HEADER_COLORS[cell.level] ?? HEADER_COLORS[HEADER_COLORS.length - 1]
            const textColor = HEADER_TEXT_COLORS[cell.level] ?? HEADER_TEXT_COLORS[HEADER_TEXT_COLORS.length - 1]
            const fontSize = HEADER_FONT_SIZES[cell.level] ?? HEADER_FONT_SIZES[HEADER_FONT_SIZES.length - 1]
            const fontWeight = cell.level <= 1 ? 'bold' : 'normal'
            const columnIndex = cell.columnIndex
            const resolvedColumnIndex = columnIndex ?? -1
            const targetColumn = resolvedColumnIndex >= 0 ? orderedColumns[resolvedColumnIndex] : undefined
            const isLeafColumn = cell.isLeaf && targetColumn != null
            const isSelectionColumn = targetColumn?.id === SELECTION_COLUMN_ID
            const isSortable = isLeafColumn && targetColumn?.sortable !== false && !isSelectionColumn
            const isSorted = isLeafColumn && sortState && targetColumn?.id === sortState.columnId
            const isSelectable = cell.colSpan > 0 && !isSelectionColumn
            const isCellSelected =
              isSelectable &&
              selectedBounds != null &&
              cell.startIndex >= selectedBounds.start &&
              cell.startIndex + cell.colSpan - 1 <= selectedBounds.end
            const cellClasses = ['basic-grid-header-cell']
            const isReorderable = enableColumnReorder && isLeafColumn && !isSelectionColumn
            const isDragging = isReorderable && dragState?.sourceIndex === resolvedColumnIndex
            const hasDropTarget = dragState != null && dragState.targetIndex !== dragState.sourceIndex
            const dropBefore =
              isReorderable && hasDropTarget && dragState?.targetIndex === resolvedColumnIndex
            const dropAfter =
              isReorderable && hasDropTarget && dragState?.targetIndex === resolvedColumnIndex + 1
            const showDropIndicator = dropBefore || dropAfter
            const isGhosted = hasActiveDrag && isReorderable && !isDragging
            if (isSelectable) {
              cellClasses.push('basic-grid-header-cell--clickable')
            }
            if (isSorted) {
              cellClasses.push('basic-grid-header-cell--sorted')
            }
            if (isCellSelected) {
              cellClasses.push('basic-grid-header-cell--selected')
            }
            if (isReorderable) {
              cellClasses.push('basic-grid-header-cell--draggable')
            }
            if (isDragging) {
              cellClasses.push('basic-grid-header-cell--dragging')
            }
            if (dropBefore) {
              cellClasses.push('basic-grid-header-cell--drop-before')
            } else if (dropAfter) {
              cellClasses.push('basic-grid-header-cell--drop-after')
            }
            if (showDropIndicator) {
              cellClasses.push('basic-grid-header-cell--drop-indicator')
            }
            if (isGhosted) {
              cellClasses.push('basic-grid-header-cell--drag-placeholder')
            }

            const resizeStartIndex = cell.isLeaf ? resolvedColumnIndex : cell.startIndex
            const resizeSpan = Math.max(1, cell.colSpan)
            const canResizeCell = resizeStartIndex != null && resizeStartIndex >= 0 && resizeSpan > 0

            const handleCellActivate = () => {
              if (!isSelectable) {
                return
              }
              selectRange(cell.startIndex, cell.colSpan)
              if (isSortable && columnIndex != null) {
                handleColumnSort(columnIndex)
              }
            }

            const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
              if (!isSelectable) {
                return
              }
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleCellActivate()
              }
            }

            return (
              <div
                key={`${cell.level}-${cell.startIndex}-${cell.title}`}
                className={cellClasses.join(' ')}
                style={{
                  left: `${startX}px`,
                  width: `${totalWidth}px`,
                  height: `${cell.rowSpan * headerRowHeight}px`,
                  top: `${cell.level * headerRowHeight}px`,
                  backgroundColor: bgColor,
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  fontWeight,
                  zIndex: 1,
                }}
                onClick={isSelectable ? handleCellActivate : undefined}
                onMouseDown={
                  isReorderable && resolvedColumnIndex >= 0
                    ? (event) => handleHeaderDragStart(event, resolvedColumnIndex)
                    : undefined
                }
                onKeyDown={handleKeyDown}
                role={isSelectable ? 'button' : undefined}
                tabIndex={isSelectable ? 0 : undefined}
                aria-sort={
                  isSorted ? (sortState?.direction === 'asc' ? 'ascending' : 'descending') : undefined
                }
                aria-pressed={isSelectable ? isCellSelected : undefined}
              >
                {isSelectionColumn ? (
                  <div className="basic-grid-selection-header">
                    <input
                      ref={selectAllCheckboxRef}
                      type="checkbox"
                      className="basic-grid-header-row-checkbox"
                      checked={isAllRowsSelected}
                      onChange={(event) => handleSelectAllChange(event.target.checked)}
                      aria-label="Выбрать все строки"
                    />
                  </div>
                ) : (
                  cell.content ?? cell.title
                )}
                {canResizeCell && (
                  <div
                    className="basic-grid-header-resize-handle"
                    onMouseDown={(event) => handleResizeMouseDown(event, resizeStartIndex, resizeSpan)}
                    onDoubleClick={(event) => handleResizeDoubleClick(event, resizeStartIndex, resizeSpan)}
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize column"
                  />
                )}
                {isSorted && (
                  <span className="basic-grid-header-sort-indicator" aria-hidden="true">
                    {sortState?.direction === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


import React, { useCallback, useMemo } from 'react'

import type { GridHeaderCell } from '../models/GridHeaderCell'
import type { GridColumn } from '../models/GridColumn'
import { HeaderCell } from './HeaderCell'
import { useHeaderVirtualization } from '../context/HeaderVirtualizationContext'
import type { SortState, SelectedBounds } from './headerTypes'

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
  headerInnerRef: React.RefObject<HTMLDivElement>
  selectRange: (startIndex: number, span: number) => void
  selectedBounds: SelectedBounds | null
  handleColumnSort: (columnIndex: number) => void
  sortState: SortState
  enableColumnReorder: boolean
  handleHeaderDragStart: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number) => void
  registerHeaderCell: (columnIndex: number, element: HTMLElement | null) => void
  handleResizeMouseDown: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  handleResizeDoubleClick: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  isAllRowsSelected: boolean
  handleSelectAllChange: (checked: boolean) => void
  selectAllCheckboxRef: React.RefObject<HTMLInputElement>
}

export const GridHeader = React.memo(function GridHeader<RowType extends Record<string, unknown>>({
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
  headerInnerRef,
  selectRange,
  selectedBounds,
  handleColumnSort,
  sortState,
  enableColumnReorder,
  handleHeaderDragStart,
  registerHeaderCell,
  handleResizeMouseDown,
  handleResizeDoubleClick,
  isAllRowsSelected,
  handleSelectAllChange,
  selectAllCheckboxRef,
}: GridHeaderProps<RowType>) {
  const { visibleIndices } = useHeaderVirtualization()

  const headerHeight = levelCount * headerRowHeight

  // Memoize visible cells filtering
  const visibleCells = useMemo(() => {
    if (!visibleIndices) return headerCells

    const { start, end } = visibleIndices
    return headerCells.filter(cell => {
      const cellEndIndex = cell.startIndex + cell.colSpan
      // Check if cell overlaps with visible range
      return cellEndIndex > start && cell.startIndex < end
    })
  }, [headerCells, visibleIndices])

  // Memoize header wrapper style
  const headerWrapperStyle = useMemo(
    () => ({
      width: `${viewportWidth}px`,
      paddingRight: `${scrollbarReserve}px`,
      boxSizing: 'border-box' as const,
    }),
    [viewportWidth, scrollbarReserve]
  )

  // Memoize header content style
  const headerContentStyle = useMemo(
    () => ({
      width: `${dataViewportWidth}px`,
      paddingRight: `${scrollbarReserve}px`,
      boxSizing: 'border-box' as const,
    }),
    [dataViewportWidth, scrollbarReserve]
  )

  // Memoize header inner style
  const headerInnerStyle = useMemo(
    () => ({
      width: `${dataAreaWidth}px`,
      height: `${headerHeight}px`,
      willChange: 'transform' as const,
    }),
    [dataAreaWidth, headerHeight]
  )

  // Memoize row marker style
  const rowMarkerStyle = useMemo(() => ({ width: `${markerWidth}px` }), [markerWidth])

  // Memoize level styles
  const levelStyles = useMemo(
    () =>
      Array.from({ length: levelCount }).map((_, levelIndex) => ({
        position: 'absolute' as const,
        top: `${levelIndex * headerRowHeight}px`,
        height: `${headerRowHeight}px`,
        width: '100%',
      })),
    [levelCount, headerRowHeight]
  )

  // Memoize cell selection check function
  const isCellSelected = useCallback(
    (cell: GridHeaderCell) => {
      if (!selectedBounds || cell.colSpan === 0) {
        return false
      }
      return (
        cell.startIndex >= selectedBounds.start &&
        cell.startIndex + cell.colSpan - 1 <= selectedBounds.end
      )
    },
    [selectedBounds]
  )

  if (columnPositions.length === 0 || levelCount === 0 || headerCells.length === 0) {
    return null
  }

  return (
    <div className="basic-grid-html-header" style={headerWrapperStyle}>
      {showRowMarkers && (
        <div className="basic-grid-header-row-marker" style={rowMarkerStyle} />
      )}
      <div className="basic-grid-header-content" style={headerContentStyle}>
        <div className="basic-grid-header-content-inner" ref={headerInnerRef} style={headerInnerStyle}>
          {levelStyles.map((style, levelIndex) => (
            <div
              key={`level-${levelIndex}`}
              className="basic-grid-header-level"
              style={style}
            />
          ))}

          {visibleCells.map((cell) => (
            <HeaderCell
              key={`${cell.level}-${cell.startIndex}-${cell.title}`}
              cell={cell}
              columnPositions={columnPositions}
              columnWidths={columnWidths}
              orderedColumns={orderedColumns}
              headerRowHeight={headerRowHeight}
              sortState={sortState}
              enableColumnReorder={enableColumnReorder}
              isCellSelected={isCellSelected(cell)}
              selectRange={selectRange}
              handleColumnSort={handleColumnSort}
              handleHeaderDragStart={handleHeaderDragStart}
              registerHeaderCell={registerHeaderCell}
              handleResizeMouseDown={handleResizeMouseDown}
              handleResizeDoubleClick={handleResizeDoubleClick}
              isAllRowsSelected={isAllRowsSelected}
              handleSelectAllChange={handleSelectAllChange}
              selectAllCheckboxRef={selectAllCheckboxRef}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

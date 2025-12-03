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

  // Memoize header wrapper style - dynamic dimensions only
  const headerWrapperStyle = useMemo(
    () => ({
      width: `${viewportWidth}px`,
      paddingRight: `${scrollbarReserve}px`,
    }),
    [viewportWidth, scrollbarReserve]
  )

  // Memoize header content style - dynamic dimensions only
  const headerContentStyle = useMemo(
    () => ({
      width: `${dataViewportWidth}px`,
      paddingRight: `${scrollbarReserve}px`,
    }),
    [dataViewportWidth, scrollbarReserve]
  )

  // Memoize header inner style - dynamic dimensions only
  const headerInnerStyle = useMemo(
    () => ({
      width: `${dataAreaWidth}px`,
      height: `${headerHeight}px`,
    }),
    [dataAreaWidth, headerHeight]
  )

  // Memoize row marker style - dynamic width only
  const rowMarkerStyle = useMemo(() => ({ width: `${markerWidth}px` }), [markerWidth])

  // Memoize level styles - dynamic positions only
  const levelStyles = useMemo(
    () =>
      Array.from({ length: levelCount }).map((_, levelIndex) => ({
        top: `${levelIndex * headerRowHeight}px`,
        height: `${headerRowHeight}px`,
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
    <div className="basic-grid-html-header basic-grid-html-header--styled" style={headerWrapperStyle}>
      {showRowMarkers && (
        <div className="basic-grid-header-row-marker" style={rowMarkerStyle} />
      )}
      <div className="basic-grid-header-content basic-grid-header-content--styled" style={headerContentStyle}>
        <div className="basic-grid-header-content-inner basic-grid-header-content-inner--styled" ref={headerInnerRef} style={headerInnerStyle}>
          {levelStyles.map((style, levelIndex) => (
            <div
              key={`level-${levelIndex}`}
              className="basic-grid-header-level basic-grid-header-level--styled"
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

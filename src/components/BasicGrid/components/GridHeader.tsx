import React from 'react'
import { CanvasHeader } from './CanvasHeader'
import type { GridColumn } from '../models/GridColumn'
import type { GridHeaderCell } from '../models/GridHeaderCell'

interface GridHeaderProps<RowType extends Record<string, unknown>> {
  width: number
  height: number
  effectiveHeight: number
  headerLayerStyle: React.CSSProperties | undefined
  headerCells: GridHeaderCell[]
  orderedColumns: GridColumn<RowType>[]
  columnPositions: number[]
  columnWidths: number[]
  levelCount: number
  headerRowHeight: number
  markerWidth: number
  showRowMarkers: boolean
  scrollLeft: number
  canvasHeaderRef: React.RefObject<HTMLCanvasElement>
  handleResizeMouseDown: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  handleResizeDoubleClick: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  getColumnWidth: (columnIndex: number) => number
  setColumnWidths: (updates: Array<{ columnId: string; width: number }>) => void
  onVirtualResizeChange: (x: number | null, columnIndex: number | null) => void
  enableColumnReorder: boolean
  onColumnReorder: (sourceIndex: number, targetBoundary: number) => void
  dataAreaWidth: number
  sortColumn: string | undefined
  sortDirection: 'asc' | 'desc' | undefined
  onColumnSort: (columnId: string, direction?: 'asc' | 'desc' | undefined) => void
  enableRowSelection: boolean
  isAllRowsSelected: boolean
  hasPartialRowSelection: boolean
  onSelectAllChange: (checked: boolean) => void
}

export function GridHeader<RowType extends Record<string, unknown>>({
  width,
  height,
  effectiveHeight,
  headerLayerStyle,
  headerCells,
  orderedColumns,
  columnPositions,
  columnWidths,
  levelCount,
  headerRowHeight,
  markerWidth,
  showRowMarkers,
  scrollLeft,
  canvasHeaderRef,
  handleResizeMouseDown,
  handleResizeDoubleClick,
  getColumnWidth,
  setColumnWidths,
  onVirtualResizeChange,
  enableColumnReorder,
  onColumnReorder,
  dataAreaWidth,
  sortColumn,
  sortDirection,
  onColumnSort,
  enableRowSelection,
  isAllRowsSelected,
  hasPartialRowSelection,
  onSelectAllChange,
}: GridHeaderProps<RowType>) {
  if (columnPositions.length === 0 || levelCount === 0) {
    return null
  }

  return (
    <div
      className="basic-grid-header-overlay"
      style={{
        height: effectiveHeight,
        ...(headerLayerStyle ?? {}),
      }}
    >
      <CanvasHeader
        width={width}
        height={height}
        headerCells={headerCells}
        orderedColumns={orderedColumns}
        columnPositions={columnPositions}
        columnWidths={columnWidths}
        levelCount={levelCount}
        headerRowHeight={headerRowHeight}
        markerWidth={markerWidth}
        showRowMarkers={showRowMarkers}
        scrollLeft={scrollLeft}
        canvasHeaderRef={canvasHeaderRef}
        handleResizeMouseDown={handleResizeMouseDown}
        handleResizeDoubleClick={handleResizeDoubleClick}
        getColumnWidth={getColumnWidth}
        setColumnWidths={setColumnWidths}
        onVirtualResizeChange={onVirtualResizeChange}
        enableColumnReorder={enableColumnReorder}
        onColumnReorder={onColumnReorder}
        dataAreaWidth={dataAreaWidth}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onColumnSort={onColumnSort}
        debugMode={false}
        enableRowSelection={enableRowSelection}
        isAllRowsSelected={isAllRowsSelected}
        hasPartialRowSelection={hasPartialRowSelection}
        onSelectAllChange={onSelectAllChange}
      />
    </div>
  )
}


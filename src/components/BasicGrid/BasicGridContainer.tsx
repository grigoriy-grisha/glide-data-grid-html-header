import { useMemo, useRef, type RefObject } from 'react'
import type { DataEditorProps, DataEditorRef } from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'

import './BasicGrid.css'
import type { BasicGridProps } from './types'
import {
  DEFAULT_HEADER_ROW_HEIGHT,
  DEFAULT_ROW_MARKER_WIDTH,
  DEFAULT_SCROLLBAR_RESERVE,
} from './constants'
import { DataEditorWithVirtualization } from './components/DataEditorWithVirtualization'
import { VirtualResizeLine } from './components/VirtualResizeLine'
import { RowOverlay } from './components/RowOverlay'
import { GridHeader } from './components/GridHeader'
import { useContainerWidth } from './hooks/useContainerWidth'
import { useGridColumnsController } from './hooks/useGridColumnsController'
import { useGridSorting } from './hooks/useGridSorting'
import { useColumnSelection } from './hooks/useColumnSelection'
import { useHorizontalScroll } from './hooks/useHorizontalScroll'
import { useGridTree } from './hooks/useGridTree'
import { useRowSelectionState } from './hooks/useRowSelectionState'
import { useGridCellContent } from './hooks/useGridCellContent'
import { useCellEditing } from './hooks/useCellEditing'
import { HeaderVirtualizationProvider } from './context/HeaderVirtualizationContext'
import { useStickyHeader } from './hooks/useStickyHeader'
import { useGridBodyInteractions } from './hooks/useGridBodyInteractions'
import { useRowOverlay } from './hooks/useRowOverlay'
import { useCustomRenderers } from './hooks/useCustomRenderers'
import { useGridTheme } from './hooks/useGridTheme'
import { useColumnResize } from './hooks/useColumnResize'
import { useVirtualResizeLine } from './hooks/useVirtualResizeLine'
import { useRowHeight } from './hooks/useRowHeight'
import { useGridEventHandlers } from './hooks/useGridEventHandlers'

interface BasicGridContainerProps<RowType extends Record<string, unknown>>
  extends BasicGridProps<RowType> {
  dataEditorRef: RefObject<DataEditorRef>
}

export function BasicGridContainer<RowType extends Record<string, unknown>>({
  columns,
  rows,
  summaryRows,
  height = 400,
  headerRowHeight = DEFAULT_HEADER_ROW_HEIGHT,
  stickyHeader = true,
  rowHeight: rowHeightProp,
  rowMarkerWidth = DEFAULT_ROW_MARKER_WIDTH,
  showRowMarkers = true,
  scrollbarReserve: scrollbarReserveProp,
  className,
  enableColumnReorder = false,
  columnOrder,
  onColumnOrderChange,
  treeOptions,
  editable = false,
  onCellChange,
  enableRowSelection = false,
  onRowSelectionChange,
  getRowSelectable,
  getRowId,
  rowOverlayRowId,
  renderRowOverlay,
  onRowOverlayClose,
  sortModel,
  onSortChange,
  dataEditorRef,
}: BasicGridContainerProps<RowType>) {
  const gridRef = useRef<HTMLDivElement>(null)
  const gridBodyRef = useRef<HTMLDivElement>(null)
  const headerInnerRef = useRef<HTMLDivElement>(null)
  const canvasHeaderRef = useRef<HTMLCanvasElement>(null)

  const stickyHeaderEnabled = Boolean(stickyHeader)
  const scrollbarReserve = scrollbarReserveProp ?? DEFAULT_SCROLLBAR_RESERVE
  const containerWidth = useContainerWidth(gridRef)
  const gridTheme = useGridTheme()

  const {
    markerWidth,
    columnCollection,
    orderedColumns,
    headerCells,
    levelCount,
    columnWidths,
    columnPositions,
    dataAreaWidth,
    selectionColumnId,
    setColumnWidths,
    clearColumnWidths,
    reorderColumns,
  } = useGridColumnsController<RowType>({
    columns,
    enableRowSelection,
    rowMarkerWidth,
    showRowMarkers,
    containerWidth,
    columnOrder,
    onColumnOrderChange,
  })

  const {
    treeEnabled,
    treeColumnId,
    displayRows,
    nodesByRowIndex,
    customRenderers: treeCustomRenderers,
    decorateCell,
    toggleRowByIndex,
  } = useGridTree({
    rows,
    treeOptions,
    defaultTreeColumnId: columnCollection.leafColumns[0]?.id,
  })

  const { gridRows, sortState, handleColumnSort } = useGridSorting(displayRows, orderedColumns, {
    disabled: treeEnabled,
    sortModel,
    onSortChange,
  })

  const rowSelectionEnabled = Boolean(enableRowSelection)

  const {
    getSelectionStateForRow,
    toggleRowSelection,
    hasPartialRowSelection,
    isAllRowsSelected,
    handleSelectAllChange,
  } = useRowSelectionState({
    gridRows,
    rowSelectionEnabled,
    getRowSelectable,
    onRowSelectionChange,
    nodesByRowIndex,
    treeEnabled,
  })

  const customRenderers = useCustomRenderers({
    orderedColumns,
    editable,
    treeCustomRenderers,
  })

  const headerHeightPx = levelCount * headerRowHeight

  const {
    headerLayerStyle,
    handleVirtualScroll,
    updateStickyMetrics,
    virtualOffset,
  } = useStickyHeader({
    enabled: stickyHeaderEnabled,
    gridRef,
    headerHeight: headerHeightPx,
  })

  const effectiveHeaderHeight = headerHeightPx - virtualOffset

  const { resolvedRowHeight, estimatedRowHeight } = useRowHeight({
    rowHeight: rowHeightProp,
    gridRows,
  })

  const columnSelection = useColumnSelection(gridRows.length, orderedColumns.length)
  const { highlightRegions, clearSelection } = columnSelection

  const { handleVisibleRegionChanged, viewportWidth, dataViewportWidth, scrollLeft } =
    useHorizontalScroll({
      dataAreaWidth,
      rowMarkerWidth: markerWidth,
      containerWidth,
      columnPositions,
      headerElementRef: headerInnerRef,
      canvasHeaderRef,
    })

  const effectiveViewportWidth = Math.max(0, viewportWidth - scrollbarReserve)
  const effectiveDataViewportWidth = Math.max(0, dataViewportWidth - scrollbarReserve)

  const {
    virtualResizeState,
    virtualResizeLineStyle,
    handleVirtualResizeChange,
    handleResizeProgress,
    handleResizeEnd,
  } = useVirtualResizeLine({
    scrollLeft,
    markerWidth,
    effectiveDataViewportWidth,
    columnPositions,
    orderedColumns,
    setColumnWidths,
  })

  const getColumnWidthByIndex = useMemo(() => {
    return (columnIndex: number) => {
      return columnWidths[columnIndex] ?? orderedColumns[columnIndex]?.baseWidth ?? 0
    }
  }, [columnWidths, orderedColumns])

  const { handleResizeMouseDown, handleResizeDoubleClick } = useColumnResize({
    columns: orderedColumns,
    getColumnWidth: getColumnWidthByIndex,
    setColumnWidths,
    clearColumnWidths,
    onResizeProgress: handleResizeProgress,
    onResizeEnd: handleResizeEnd,
  })

  const getCellContent = useGridCellContent({
    orderedColumns,
    gridRows,
    rowSelectionEnabled,
    getRowSelectable,
    getSelectionStateForRow,
    editable,
    decorateCell,
    selectionColumnId,
    summaryRows,
    treeEnabled,
    nodesByRowIndex,
    treeColumnId,
    onTreeToggle: toggleRowByIndex,
  })

  const handleCellEdited = useCellEditing({
    editable,
    orderedColumns,
    gridRows,
    onCellChange,
  })

  const {
    overlayRow,
    overlayContent,
    overlayPosition,
    overlayPaddingBottom,
    updateOverlayPosition,
  } = useRowOverlay({
    gridRows,
    orderedColumnsLength: orderedColumns.length,
    renderRowOverlay,
    rowOverlayRowId,
    getRowId,
    gridBodyRef,
    dataEditorRef,
    overlayRef: useRef<HTMLDivElement>(null),
  })

  const { handleCellClicked, handleHeaderSort, handleDataEditorHeaderClick } = useGridEventHandlers({
    orderedColumns,
    rowSelectionEnabled,
    selectionColumnId,
    toggleRowSelection,
    treeEnabled,
    treeColumnId,
    clearSelection,
    handleColumnSort,
  })

  const containerClassName = ['basic-grid-container', className].filter(Boolean).join(' ')
  const rowMarkersSetting: DataEditorProps['rowMarkers'] = showRowMarkers ? 'number' : 'none'

  const dataEditorColumns = useMemo(
    () =>
      orderedColumns.map((column, index) => ({
        title: column.title,
        width: columnWidths[index] ?? column.baseWidth,
      })),
    [orderedColumns, columnWidths],
  )

  const { handleVisibleRegionChangedWithOverlay, gridBodyStyle } = useGridBodyInteractions({
    estimatedRowHeight,
    stickyHeaderEnabled,
    overlayPaddingBottom,
    overlayRow,
    overlayContent,
    handleVisibleRegionChanged,
    updateOverlayPosition,
    handleVirtualScroll,
    updateStickyMetrics,
  })

  return (
    <HeaderVirtualizationProvider>
      <div className={containerClassName}>
        <div className="basic-grid-wrapper" ref={gridRef}>
          {virtualResizeState && virtualResizeLineStyle && (
            <VirtualResizeLine style={virtualResizeLineStyle} />
          )}

          <GridHeader
            width={effectiveDataViewportWidth}
            height={headerHeightPx}
            effectiveHeight={effectiveHeaderHeight}
            headerLayerStyle={headerLayerStyle ?? undefined}
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
            getColumnWidth={getColumnWidthByIndex}
            setColumnWidths={setColumnWidths}
            onVirtualResizeChange={handleVirtualResizeChange}
            enableColumnReorder={enableColumnReorder}
            onColumnReorder={reorderColumns}
            dataAreaWidth={dataAreaWidth}
            sortColumn={sortState?.columnId}
            sortDirection={sortState?.direction}
            onColumnSort={handleHeaderSort}
            enableRowSelection={rowSelectionEnabled}
            isAllRowsSelected={isAllRowsSelected}
            hasPartialRowSelection={hasPartialRowSelection}
            onSelectAllChange={handleSelectAllChange}
          />

          <div className="basic-grid-body" ref={gridBodyRef} style={gridBodyStyle}>
            <DataEditorWithVirtualization
              ref={dataEditorRef}
              getCellContent={getCellContent}
              columns={[...dataEditorColumns]}
              rows={gridRows.length + (summaryRows?.length ?? 0)}
              freezeTrailingRows={summaryRows?.length ?? 0}
              width={effectiveViewportWidth}
              height={height + headerHeightPx}
              theme={gridTheme}
              customRenderers={customRenderers}
              onVisibleRegionChanged={handleVisibleRegionChangedWithOverlay}
              onHeaderClicked={handleDataEditorHeaderClick}
              onCellClicked={handleCellClicked}
              onCellEdited={editable ? handleCellEdited : undefined}
              highlightRegions={highlightRegions}
              rowMarkers={rowMarkersSetting}
              rowMarkerWidth={markerWidth}
              rowHeight={resolvedRowHeight}
              rowSelectionMode={rowSelectionEnabled ? 'multi' : undefined}
              rowSelect={rowSelectionEnabled ? 'multi' : undefined}
              smoothScrollX={true}
              smoothScrollY={true}
              headerHeight={effectiveHeaderHeight}
            />
            <RowOverlay
              overlayRow={overlayRow}
              overlayContent={overlayContent}
              overlayPosition={overlayPosition}
              onOverlayClose={onRowOverlayClose}
            />
          </div>
        </div>
      </div>
    </HeaderVirtualizationProvider>
  )
}



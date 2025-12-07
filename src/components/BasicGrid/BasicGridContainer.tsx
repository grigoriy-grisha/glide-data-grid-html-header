import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import type { DataEditorProps, DataEditorRef } from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'

import './BasicGrid.css'
import type { BasicGridProps } from './types'
import { onAnyIconLoad } from './lib/canvas'
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
import { getScrollbarWidth } from './utils/getScrollbarWidth'

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
  onColumnResize,
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
  const { selectedColumns, toggleColumn, highlightRegions, clearSelection } = columnSelection

  // When row selection is enabled, header indices are offset by -1 (selection column is removed from header)
  // We need to adjust indices when communicating between header and body
  const selectionColumnOffset = rowSelectionEnabled ? 1 : 0

  // Wrapper that adds offset when header reports a click (header uses adjusted indices)
  const handleHeaderColumnClick = useCallback(
    (startIndex: number, colSpan: number, ctrlKey: boolean) => {
      toggleColumn(startIndex + selectionColumnOffset, colSpan, ctrlKey)
    },
    [toggleColumn, selectionColumnOffset]
  )

  // Adjusted selectedColumns for header (subtract offset from each index)
  const headerSelectedColumns = useMemo(() => {
    if (selectionColumnOffset === 0 || selectedColumns.size === 0) {
      return selectedColumns
    }
    const adjusted = new Set<number>()
    for (const idx of selectedColumns) {
      const adjustedIdx = idx - selectionColumnOffset
      if (adjustedIdx >= 0) {
        adjusted.add(adjustedIdx)
      }
    }
    return adjusted
  }, [selectedColumns, selectionColumnOffset])

  const { handleVisibleRegionChanged, viewportWidth, dataViewportWidth, scrollLeft } =
    useHorizontalScroll({
      dataAreaWidth,
      rowMarkerWidth: markerWidth,
      containerWidth,
      columnPositions,
      headerElementRef: headerInnerRef,
      canvasHeaderRef,
    })

  // Calculate vertical scrollbar width to adjust header overlay width
  const verticalScrollbarWidth = useMemo(() => getScrollbarWidth(), [])

  // Determine if vertical scrollbar is actually visible (content exceeds container)
  const hasVerticalScrollbar = useMemo(() => {
    const totalContentHeight = gridRows.length * estimatedRowHeight
    return totalContentHeight > height
  }, [gridRows.length, estimatedRowHeight, height])

  // Only reserve space for scrollbar if it's actually visible
  const actualScrollbarReserve = hasVerticalScrollbar ? scrollbarReserve : 0

  const effectiveViewportWidth = Math.max(0, viewportWidth - actualScrollbarReserve)
  const effectiveDataViewportWidth = Math.max(0, dataViewportWidth - actualScrollbarReserve)

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
    onColumnResize,
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
    selectedColumns,
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

  // Subscribe to icon load events to trigger grid redraw when icons are loaded
  // Uses requestAnimationFrame to batch multiple icon loads into a single redraw
  useEffect(() => {
    let pendingFrame: number | null = null
    
    const unsubscribe = onAnyIconLoad(() => {
      // Skip if already scheduled
      if (pendingFrame !== null) return
      
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = null
        
        const ref = dataEditorRef.current
        if (!ref) return
        
        // Only redraw first N visible rows to minimize impact
        const numRows = Math.min(30, gridRows.length)
        const numCols = orderedColumns.length
        const cells: Array<{ cell: [number, number] }> = []
        
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            cells.push({ cell: [col, row] })
          }
        }
        
        if (cells.length > 0) {
          ref.updateCells(cells)
        }
      })
    })
    
    return () => {
      unsubscribe()
      if (pendingFrame !== null) {
        cancelAnimationFrame(pendingFrame)
      }
    }
  }, [dataEditorRef, gridRows.length, orderedColumns.length])

  return (
    <HeaderVirtualizationProvider>
      <div className={containerClassName}>
        <div className="basic-grid-wrapper" ref={gridRef}>
          {virtualResizeState && virtualResizeLineStyle && (
            <VirtualResizeLine style={virtualResizeLineStyle} />
          )}

          <GridHeader
            width={effectiveViewportWidth - 6}
            scrollbarWidth={verticalScrollbarWidth}
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
            selectedColumns={headerSelectedColumns}
            onColumnClick={handleHeaderColumnClick}
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



import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import {
  type CellClickedEventArgs,
  type DataEditorProps,
  type DataEditorRef,
  type Item,
} from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'

import './BasicGrid.css'
import type { BasicGridProps } from './types'
import {
  DEFAULT_HEADER_ROW_HEIGHT,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_ROW_MARKER_WIDTH,
  DEFAULT_SCROLLBAR_RESERVE,
} from './constants'
import { CanvasHeader } from './components/CanvasHeader'
import { DataEditorWithVirtualization } from './components/DataEditorWithVirtualization'
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
  const overlayRef = useRef<HTMLDivElement>(null)

  const headerInnerRef = useRef<HTMLDivElement>(null)
  const canvasHeaderRef = useRef<HTMLCanvasElement>(null)
  const virtualResizeLineRef = useRef<HTMLDivElement>(null)

  const [virtualResizeState, setVirtualResizeState] = useState<{
    x: number
    columnIndex: number
  } | null>(null)

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
    getColumnWidth,
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

  const resolvedRowHeight = useMemo<
    number | ((rowIndex: number) => number) | undefined
  >(() => {
    const baseNumber = typeof rowHeightProp === 'number' ? rowHeightProp : undefined
    const baseFunction = typeof rowHeightProp === 'function' ? rowHeightProp : undefined

    if (baseFunction) {
      return (rowIndex: number) => {
        const row = gridRows[rowIndex]
        if (!row) {
          return baseNumber ?? DEFAULT_ROW_HEIGHT
        }
        const value = baseFunction(row, rowIndex)
        return typeof value === 'number' && !Number.isNaN(value) ? value : DEFAULT_ROW_HEIGHT
      }
    }

    return baseNumber
  }, [gridRows, rowHeightProp])

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

  const { handleResizeMouseDown, handleResizeDoubleClick } = useColumnResize({
    columns: orderedColumns,
    getColumnWidth,
    setColumnWidths,
    clearColumnWidths,
    onResizeProgress: (updates) => {
      if (updates.length === 0) {
        return
      }

      const firstColId = updates[0].columnId
      const firstIndex = orderedColumns.findIndex((c) => c.id === firstColId)
      if (firstIndex === -1) {
        return
      }

      const startX = columnPositions[firstIndex] ?? 0
      const totalWidth = updates.reduce((sum, u) => sum + u.width, 0)

      setVirtualResizeState({
        x: startX + totalWidth,
        columnIndex: firstIndex,
      })
    },
    onResizeEnd: (updates) => {
      setColumnWidths(updates)
      setVirtualResizeState(null)
    },
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
    overlayRef,
  })

  const overlayVisibleRef = useRef(false)
  useEffect(() => {
    const hasOverlay = Boolean(overlayRow && overlayContent && overlayPosition)
    if (overlayVisibleRef.current && !hasOverlay) {
      onRowOverlayClose?.()
    }
    overlayVisibleRef.current = hasOverlay
  }, [onRowOverlayClose, overlayContent, overlayPosition, overlayRow])

  const handleCellClicked = useCallback(
    (cell: Item, event?: CellClickedEventArgs) => {
      const [colIndex, rowIndex] = cell
      const column = orderedColumns[colIndex]
      if (!column) {
        return
      }

      if (rowSelectionEnabled && column.id === selectionColumnId) {
        event?.preventDefault?.()
        toggleRowSelection(rowIndex)
        return
      }

      if (treeEnabled && treeColumnId && column.id === treeColumnId) {
        return
      }

      if (treeEnabled) {
        clearSelection()
      }
    },
    [
      clearSelection,
      orderedColumns,
      rowSelectionEnabled,
      selectionColumnId,
      toggleRowSelection,
      treeColumnId,
      treeEnabled,
    ]
  )

  const containerClassName = ['basic-grid-container', className].filter(Boolean).join(' ')
  const rowMarkersSetting: DataEditorProps['rowMarkers'] = showRowMarkers ? 'number' : 'none'

  const dataEditorColumns = useMemo(
    () =>
      orderedColumns.map((column, index) => ({
        title: column.title,
        width: columnWidths[index] ?? column.baseWidth,
      })),
    [orderedColumns, columnWidths]
  )

  const virtualResizeLineStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!virtualResizeState) {
      return { display: 'none' }
    }

    const relativeX = virtualResizeState.x - scrollLeft + markerWidth
    const isVisible = relativeX >= 0 && relativeX <= effectiveDataViewportWidth + markerWidth

    return {
      left: `${relativeX}px`,
      display: isVisible ? 'block' : 'none',
    }
  }, [effectiveDataViewportWidth, markerWidth, scrollLeft, virtualResizeState])

  const handleVirtualResizeChange = useCallback((x: number | null, columnIndex: number | null) => {
    if (x !== null && columnIndex !== null) {
      setVirtualResizeState({ x, columnIndex })
    } else {
      setVirtualResizeState(null)
    }
  }, [])

  const estimatedRowHeight = useMemo(() => {
    if (typeof rowHeightProp === 'number' && Number.isFinite(rowHeightProp)) {
      return rowHeightProp
    }
    if (typeof resolvedRowHeight === 'number' && Number.isFinite(resolvedRowHeight)) {
      return resolvedRowHeight
    }
    return DEFAULT_ROW_HEIGHT
  }, [resolvedRowHeight, rowHeightProp])

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

  const handleHeaderSort = useCallback(
    (columnId: string, direction: 'asc' | 'desc' | undefined) => {
      const index = orderedColumns.findIndex((c) => c.id === columnId)
      if (index >= 0) {
        handleColumnSort(index, direction ?? null)
      }
    },
    [orderedColumns, handleColumnSort]
  )

  const handleDataEditorHeaderClick = useCallback<NonNullable<DataEditorProps['onHeaderClicked']>>(
    (columnIndex, _event) => {
      handleColumnSort(columnIndex)
    },
    [handleColumnSort]
  )

  return (
    <HeaderVirtualizationProvider>
      <div className={containerClassName}>
        <div className="basic-grid-wrapper" ref={gridRef}>
          {virtualResizeState && (
            <div
              ref={virtualResizeLineRef}
              className="basic-grid-virtual-resize-line"
              style={virtualResizeLineStyle}
            />
          )}

          {columnPositions.length > 0 && levelCount > 0 && (
            <div
              className="basic-grid-header-overlay"
              style={{
                height: effectiveHeaderHeight,
                ...headerLayerStyle,
              }}
            >
              <CanvasHeader
                width={effectiveDataViewportWidth}
                height={headerHeightPx}
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
                onVirtualResizeChange={handleVirtualResizeChange}
                enableColumnReorder={enableColumnReorder}
                onColumnReorder={reorderColumns}
                dataAreaWidth={dataAreaWidth}
                sortColumn={sortState?.columnId}
                sortDirection={sortState?.direction}
                onColumnSort={handleHeaderSort}
                debugMode={false}
                enableRowSelection={rowSelectionEnabled}
                isAllRowsSelected={isAllRowsSelected}
                hasPartialRowSelection={hasPartialRowSelection}
                onSelectAllChange={handleSelectAllChange}
              />
            </div>
          )}

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
            {overlayRow && overlayContent && overlayPosition && (
              <div className="basic-grid-row-overlay" style={{ top: overlayPosition.top }} ref={overlayRef}>
                <div className="basic-grid-row-overlay-content">{overlayContent}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </HeaderVirtualizationProvider>
  )
}



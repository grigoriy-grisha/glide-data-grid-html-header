import React, {useCallback, useMemo, useRef, useState} from 'react'
import {
  type CellClickedEventArgs,
  type Item,
  type DataEditorProps,
  type DataEditorRef,
} from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'

import './BasicGrid.css'
import type { BasicGridColumn, BasicGridProps } from './types'
import {
  DEFAULT_HEADER_ROW_HEIGHT,
  DEFAULT_MIN_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_ROW_MARKER_WIDTH,
  SELECTION_COLUMN_ID,
} from './constants'
import { CanvasHeader } from './components/CanvasHeader'
import { DataEditorWithVirtualization } from './components/DataEditorWithVirtualization'
import { useContainerWidth } from './hooks/useContainerWidth'
import { useNormalizedColumnsData } from './hooks/useNormalizedColumnsData'
import { useColumnMetrics } from './hooks/useColumnMetrics'
import { useGridSorting } from './hooks/useGridSorting'
import { useColumnSelection } from './hooks/useColumnSelection'
import { useHorizontalScroll } from './hooks/useHorizontalScroll'
import { useColumnOrdering } from './hooks/useColumnOrdering'
import { useColumnResize } from './hooks/useColumnResize'
import { useGridTree } from './hooks/useGridTree'
import { useRowSelectionState } from './hooks/useRowSelectionState'
import { useGridCellContent } from './hooks/useGridCellContent'
import { useCellEditing } from './hooks/useCellEditing'
import { HeaderVirtualizationProvider } from './context/HeaderVirtualizationContext'
import { useStickyHeader } from './hooks/useStickyHeader'
import { useGridBodyInteractions } from './hooks/useGridBodyInteractions'
import { useRowOverlay } from './hooks/useRowOverlay'
import { useCustomRenderers } from './hooks/useCustomRenderers'
export function BasicGrid<RowType extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  rows,
  summaryRows,
  height = 400,
  headerRowHeight = DEFAULT_HEADER_ROW_HEIGHT,
  stickyHeader = true,
  rowHeight: rowHeightProp,
  rowMarkerWidth = DEFAULT_ROW_MARKER_WIDTH,
  showRowMarkers = true,
  scrollbarReserve: _scrollbarReserveProp,
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
  onRowOverlayClose: _onRowOverlayClose,
  sortModel,
  onSortChange,
}: BasicGridProps<RowType>) {
  const gridRef = useRef<HTMLDivElement>(null)
  const gridBodyRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dataEditorRef = useRef<DataEditorRef>(null)

  const headerInnerRef = useRef<HTMLDivElement>(null)
  const canvasHeaderRef = useRef<HTMLCanvasElement>(null)
  const virtualResizeLineRef = useRef<HTMLDivElement>(null)

  const [virtualResizeState, setVirtualResizeState] = useState<{
    x: number
    columnIndex: number
  } | null>(null)
  const stickyHeaderEnabled = Boolean(stickyHeader)


  const containerWidth = useContainerWidth(gridRef)
  const columnsWithSelection = useMemo(() => {
    if (!enableRowSelection) {
      return columns
    }
    const selectionColumn: BasicGridColumn<RowType> = {
      id: SELECTION_COLUMN_ID,
      dataType: 'string',
      title: '',
      width: Math.max(36, rowMarkerWidth),
      minWidth: Math.max(36, rowMarkerWidth),
      sortable: false,
      headerContent: null,
      valueGetter: () => null,
    }
    return [selectionColumn, ...columns]
  }, [columns, enableRowSelection, rowMarkerWidth])

  const markerWidth = showRowMarkers ? rowMarkerWidth : 0

  const { columnCollection } = useNormalizedColumnsData(columnsWithSelection)
  const { orderedColumns, headerCells, levelCount, reorderColumns } = useColumnOrdering({
    columns: columnCollection.leafColumns,
    columnOrder,
    onColumnOrderChange,
  })



  const [columnWidthOverrides, setColumnWidthOverrides] = useState<Record<string, number>>({})
  const { columnWidths, columnPositions, dataAreaWidth } = useColumnMetrics(
    orderedColumns,
    containerWidth,
    markerWidth,
    columnWidthOverrides
  )

  const fallbackTreeColumnId = columnCollection.leafColumns[0]?.id
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
    defaultTreeColumnId: fallbackTreeColumnId,
  })

  const { gridRows, sortState, handleColumnSort } = useGridSorting(displayRows, orderedColumns, {
    disabled: treeEnabled,
    sortModel,
    onSortChange,
  })
  const rowSelectionEnabled = Boolean(enableRowSelection)
  const { getSelectionStateForRow, toggleRowSelection, hasPartialRowSelection, isAllRowsSelected, handleSelectAllChange } =
    useRowSelectionState({
      gridRows,
      rowSelectionEnabled,
      getRowSelectable,
      onRowSelectionChange,
      nodesByRowIndex,
      treeEnabled,
    })

  const gridTheme = useMemo(
    () => ({
      accentColor: '#1e88e5',
      accentLight: 'rgba(30, 136, 229, 0.16)',
      accentFg: '#ffffff',
    }),
    []
  )

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

  // Эффективная высота хедера (уменьшается при сворачивании)
  const effectiveHeaderHeight = headerHeightPx - virtualOffset



  const resolvedRowHeight = useMemo<number | ((rowIndex: number) => number) | undefined>(() => {
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

  const columnSelection = useColumnSelection(
    gridRows.length,
    orderedColumns.length
  )
  const { highlightRegions, clearSelection } = columnSelection
  const { handleVisibleRegionChanged, viewportWidth, dataViewportWidth, scrollLeft } = useHorizontalScroll({
    dataAreaWidth,
    rowMarkerWidth: markerWidth,
    containerWidth,
    columnPositions,
    headerElementRef: headerInnerRef,
    canvasHeaderRef,
  })


  const getColumnWidth = useCallback(
    (index: number) => columnWidths[index] ?? orderedColumns[index]?.baseWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
    [columnWidths, orderedColumns]
  )

  const setColumnWidths = useCallback((updates: Array<{ columnId: string; width: number }>) => {
    if (updates.length === 0) {
      return
    }
    setColumnWidthOverrides((prev) => {
      let changed = false
      let next = prev
      for (const { columnId, width } of updates) {
        if (next[columnId] !== width) {
          if (!changed) {
            next = { ...next }
          }
          next[columnId] = width
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [])

  const clearColumnWidths = useCallback((columnIds: string[]) => {
    if (columnIds.length === 0) {
      return
    }
    setColumnWidthOverrides((prev) => {
      let changed = false
      let next = prev
      for (const columnId of columnIds) {
        if (columnId in next) {
          if (!changed) {
            next = { ...next }
          }
          delete next[columnId]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [])


  const { handleResizeMouseDown, handleResizeDoubleClick } = useColumnResize({
    columns: orderedColumns,
    getColumnWidth,
    setColumnWidths,
    clearColumnWidths,
    onResizeProgress: (updates) => {
      if (updates.length === 0) return

      const firstColId = updates[0].columnId
      const firstIndex = orderedColumns.findIndex((c) => c.id === firstColId)
      if (firstIndex === -1) return

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
    selectionColumnId: SELECTION_COLUMN_ID,
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


  const handleCellClicked = useCallback(
    (cell: Item, event?: CellClickedEventArgs) => {
      if (event) {
        const pageX = event.bounds.x + event.localEventX
        const pageY = event.bounds.y + event.localEventY
        console.log('[BasicGrid] cell click', { cell, pageX, pageY })
      } else {
        console.log('[BasicGrid] cell click (no event)', { cell })
      }
      const [colIndex, rowIndex] = cell
      const column = orderedColumns[colIndex]
      if (!column) {
        return
      }

      if (rowSelectionEnabled && column.id === SELECTION_COLUMN_ID) {
        event?.preventDefault?.()
        toggleRowSelection(rowIndex)
        return
      }

      if (treeEnabled && treeColumnId && column.id === treeColumnId) {
        // toggleRowByIndex(rowIndex) -> Moved to Chevron click handler
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
      toggleRowSelection,
      treeColumnId,
      treeEnabled,
      toggleRowByIndex,
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
    const isVisible = relativeX >= 0 && relativeX <= dataViewportWidth + markerWidth

    return {
      left: `${relativeX}px`,
      display: isVisible ? 'block' : 'none',
    }
  }, [virtualResizeState, scrollLeft, markerWidth, dataViewportWidth])

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

  const handleHeaderSort = useCallback((columnId: string, direction: 'asc' | 'desc' | undefined) => {
    const index = orderedColumns.findIndex((c) => c.id === columnId)
    if (index >= 0) {
      handleColumnSort(index, direction ?? null)
    }
  }, [orderedColumns, handleColumnSort])

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

          {/*
            Хедер позиционируется абсолютно поверх body.
            При сворачивании уменьшается высота хедера, body "выглядывает" из-под него.
            DataEditor всегда имеет полную высоту = height + headerHeight.
          */}
          {columnPositions.length > 0 && levelCount > 0 && (
            <div
              className="basic-grid-header-overlay"
              style={{
                height: effectiveHeaderHeight,
                ...headerLayerStyle,
              }}
            >
              <CanvasHeader
                width={dataViewportWidth}
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
              width={viewportWidth}
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

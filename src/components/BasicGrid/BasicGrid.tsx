import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import DataEditor, {
  type CellClickedEventArgs,
  type CustomRenderer,
  type Item,
  type DataEditorProps,
  type DataEditorRef,
} from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'

import './BasicGrid.css'
import type {
  BasicGridColumn,
  BasicGridProps,
} from './types'
import {
  DEFAULT_HEADER_ROW_HEIGHT,
  DEFAULT_MIN_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_ROW_MARKER_WIDTH,
  SELECTION_COLUMN_ID,
} from './constants'
import { CanvasHeader } from './components/CanvasHeader'
import { useContainerWidth } from './hooks/useContainerWidth'
import { useNormalizedColumnsData } from './hooks/useNormalizedColumnsData'
import { useColumnMetrics } from './hooks/useColumnMetrics'
import { useGridSorting } from './hooks/useGridSorting'
import { useColumnSelection } from './hooks/useColumnSelection'
import { useHorizontalScroll } from './hooks/useHorizontalScroll'
import { useColumnOrdering } from './hooks/useColumnOrdering'
import { useColumnResize } from './hooks/useColumnResize'
import { useGridTree } from './hooks/useGridTree'
import { selectCellRenderer } from './customCells/selectCell'
import { buttonCellRenderer } from './customCells/buttonCell'
import { canvasCellRenderer } from './customCells/canvasCell/index'
import { useRowSelectionState } from './hooks/useRowSelectionState'
import { useGridCellContent } from './hooks/useGridCellContent'
import { useCellEditing } from './hooks/useCellEditing'
import { HeaderVirtualizationProvider, useHeaderVirtualization } from './context/HeaderVirtualizationContext'
import { useStickyHeader } from './hooks/useStickyHeader'
import { useGridBodyInteractions } from './hooks/useGridBodyInteractions'

// Internal component that uses context to update visible indices
// Defined outside to prevent recreation on each render
const DataEditorWithVirtualization = React.memo(
  React.forwardRef<DataEditorRef, DataEditorProps>(function DataEditorWithVirtualization(
    { onVisibleRegionChanged, ...dataEditorProps },
    ref
  ) {
    const { updateVisibleIndices } = useHeaderVirtualization()

    const handleVisibleRegionChanged = useCallback<NonNullable<DataEditorProps['onVisibleRegionChanged']>>(
      (range, tx = 0, _ty = 0, _extras) => {
        onVisibleRegionChanged?.(range, tx, _ty, _extras)

        const start = Math.floor(range.x)
        const end = Math.ceil(range.x + range.width)
        const buffer = 5
        const newStart = Math.max(0, start - buffer)
        const newEnd = end + buffer

        updateVisibleIndices({ start: newStart, end: newEnd })
      },
      [onVisibleRegionChanged, updateVisibleIndices]
    )

    return <DataEditor ref={ref} {...dataEditorProps} onVisibleRegionChanged={handleVisibleRegionChanged} />
  })
)


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
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)
  const virtualResizeLineRef = useRef<HTMLDivElement>(null)

  // Состояние виртуальной линии resize
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
  const { getSelectionStateForRow, toggleRowSelection, hasPartialRowSelection } =
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

  const hasSelectColumns = useMemo(
    () => editable && orderedColumns.some((column) => column.isSelect()),
    [editable, orderedColumns]
  )

  const hasButtonColumns = useMemo(
    () => orderedColumns.some((column) => column.isButton()),
    [orderedColumns]
  )

  const hasCanvasColumns = useMemo(
    () => orderedColumns.some((column) => column.isCanvas() || column.hasRenderCellContent()),
    [orderedColumns]
  )

  const headerHeightPx = levelCount * headerRowHeight

  const { headerLayerStyle, bodyStyle: stickyBodyStyle, handleVirtualScroll, updateStickyMetrics } = useStickyHeader({
    enabled: stickyHeaderEnabled,
    gridRef,
    headerHeight: headerHeightPx,
  })



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


  const customRenderers = useMemo(() => {
    const renderers: CustomRenderer<any>[] = []
    if (treeCustomRenderers) {
      renderers.push(...treeCustomRenderers)
    }
    if (hasSelectColumns) {
      renderers.push(selectCellRenderer)
    }
    if (hasButtonColumns) {
      renderers.push(buttonCellRenderer)
    }
    if (hasCanvasColumns) {
      renderers.push(canvasCellRenderer)
    }
    return renderers.length > 0 ? renderers : undefined
  }, [treeCustomRenderers, hasSelectColumns, hasButtonColumns, hasCanvasColumns])

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
  })

  const handleCellEdited = useCellEditing({
    editable,
    orderedColumns,
    gridRows,
    onCellChange,
  })

  const resolveRowId = useCallback(
    (row: RowType, index: number) => {
      if (getRowId) {
        return getRowId(row, index)
      }
      const candidate = (row as Record<string, unknown> | undefined)?.['id']
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        return candidate
      }
      return index
    },
    [getRowId]
  )

  const overlayRowIndex = useMemo(() => {
    if (!renderRowOverlay || rowOverlayRowId == null) {
      return -1
    }
    return gridRows.findIndex((row, index) => resolveRowId(row, index) === rowOverlayRowId)
  }, [gridRows, renderRowOverlay, resolveRowId, rowOverlayRowId])

  const overlayRow = overlayRowIndex >= 0 ? gridRows[overlayRowIndex] : null
  const overlayContent = useMemo(() => {
    if (!overlayRow || overlayRowIndex < 0 || !renderRowOverlay) {
      return null
    }
    return renderRowOverlay(overlayRow, overlayRowIndex)
  }, [overlayRow, overlayRowIndex, renderRowOverlay])

  const [overlayPosition, setOverlayPosition] = useState<{ top: number } | null>(null)
  const [overlayPaddingBottom, setOverlayPaddingBottom] = useState(0)

  const updateOverlayPosition = useCallback(() => {
    if (!overlayRow || overlayRowIndex < 0 || !gridBodyRef.current || !dataEditorRef.current) {
      setOverlayPosition(null)
      return
    }
    if (orderedColumns.length === 0) {
      setOverlayPosition(null)
      return
    }
    const bounds = dataEditorRef.current.getBounds(0, overlayRowIndex)
    if (!bounds) {
      setOverlayPosition(null)
      return
    }
    const bodyRect = gridBodyRef.current.getBoundingClientRect()
    const nextTop = bounds.y - bodyRect.top + bounds.height
    setOverlayPosition((prev) => {
      if (prev && Math.abs(prev.top - nextTop) < 0.5) {
        return prev
      }
      return { top: nextTop }
    })
  }, [overlayRow, overlayRowIndex, orderedColumns.length])

  useLayoutEffect(() => {
    if (!overlayRow || !overlayContent) {
      setOverlayPosition(null)
      if (overlayPaddingBottom !== 0) {
        setOverlayPaddingBottom(0)
      }
      return
    }
    updateOverlayPosition()
  }, [overlayRow, overlayContent, overlayPaddingBottom, updateOverlayPosition])

  useEffect(() => {
    if (!overlayRow) {
      return
    }
    const handleResize = () => updateOverlayPosition()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [overlayRow, updateOverlayPosition])

  useLayoutEffect(() => {
    if (!overlayRow || !overlayPosition || !gridBodyRef.current) {
      if (overlayPaddingBottom !== 0) {
        setOverlayPaddingBottom(0)
      }
      return
    }
    const overlayHeight = overlayRef.current?.offsetHeight ?? 0
    if (overlayHeight === 0) {
      return
    }
    const currentPadding = overlayPaddingBottom
    const body = gridBodyRef.current
    const baseBodyHeight = body.clientHeight - currentPadding
    const overflow = overlayPosition.top + overlayHeight + 16 - baseBodyHeight
    const nextPadding = overflow > 0 ? overflow : 0
    if (Math.abs(nextPadding - currentPadding) > 0.5) {
      setOverlayPaddingBottom(nextPadding)
    }
  }, [overlayPaddingBottom, overlayPosition, overlayRow])


  const handleCellClicked = useCallback(
    (cell: Item, event?: CellClickedEventArgs) => {
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
        toggleRowByIndex(rowIndex)
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

  useEffect(() => {
    if (!rowSelectionEnabled) {
      if (selectAllCheckboxRef.current) {
        selectAllCheckboxRef.current.indeterminate = false
      }
      return
    }
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = hasPartialRowSelection
    }
  }, [hasPartialRowSelection, rowSelectionEnabled])

  const containerClassName = ['basic-grid-container', className].filter(Boolean).join(' ')
  const rowMarkersSetting: DataEditorProps['rowMarkers'] = showRowMarkers ? 'number' : 'none'

  // Memoize columns array to prevent unnecessary re-renders during drag n drop
  const dataEditorColumns = useMemo(
    () =>
      orderedColumns.map((column, index) => ({
        title: column.title,
        width: columnWidths[index] ?? column.baseWidth,
      })),
    [orderedColumns, columnWidths]
  )

  // Вычисляем позицию виртуальной линии resize
  const virtualResizeLineStyle = useMemo(() => {
    if (!virtualResizeState) {
      return { display: 'none' }
    }

    const relativeX = virtualResizeState.x - scrollLeft + markerWidth

    return {
      position: 'absolute' as const,
      left: `${relativeX}px`,
      top: '0',
      bottom: '0',
      width: '2px',
      backgroundColor: 'rgba(21, 101, 192, 0.8)',
      pointerEvents: 'none' as const,
      zIndex: 1000,
      display: relativeX >= 0 && relativeX <= dataViewportWidth + markerWidth ? 'block' : 'none',
    }
  }, [virtualResizeState, scrollLeft, markerWidth, dataViewportWidth])

  const handleVirtualResizeChange = useCallback((x: number | null, columnIndex: number | null) => {
    if (x !== null && columnIndex !== null) {
      setVirtualResizeState({ x, columnIndex })
    } else {
      setVirtualResizeState(null)
    }
  }, [])

  const headerShellStyle = useMemo(() => {
    if (headerHeightPx <= 0) {
      return undefined
    }
    return { height: `${headerHeightPx}px` }
  }, [headerHeightPx])

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
    stickyBodyStyle,
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
        <div className="basic-grid-wrapper" ref={gridRef} style={{ position: 'relative' }}>
          {/* Виртуальная линия resize на всю высоту таблицы */}
          {virtualResizeState && (
            <div
              ref={virtualResizeLineRef}
              className="basic-grid-virtual-resize-line"
              style={virtualResizeLineStyle}
            />
          )}

          {columnPositions.length > 0 && levelCount > 0 && (
            <div className="basic-grid-header-shell" style={headerShellStyle}>
              <div className="basic-grid-header-layer" style={headerLayerStyle}>
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
                  // debugMode
                />
              </div>
            </div>
          )}

          <div className="basic-grid-body" ref={gridBodyRef} style={gridBodyStyle}>
            <DataEditorWithVirtualization
              ref={dataEditorRef}
              getCellContent={getCellContent}
              columns={dataEditorColumns}
              rows={gridRows.length + (summaryRows?.length ?? 0)}
              freezeTrailingRows={summaryRows?.length ?? 0}
              width={viewportWidth}
              height={height}
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
              headerHeight={0}
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

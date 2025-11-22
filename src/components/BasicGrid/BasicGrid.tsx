import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DataEditor, {
  type CellClickedEventArgs,
  type CustomRenderer,
  type Item,
  type DataEditorProps,
} from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'

import './BasicGrid.css'
import type { BasicGridColumn, BasicGridProps } from './types'
import {
  DEFAULT_HEADER_ROW_HEIGHT,
  DEFAULT_MIN_COLUMN_WIDTH,
  DEFAULT_ROW_MARKER_WIDTH,
  DEFAULT_SCROLLBAR_RESERVE,
  SELECTION_COLUMN_ID,
} from './constants'
import { GridHeader } from './components/GridHeader'
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
import { useRowSelectionState } from './hooks/useRowSelectionState'
import { useColumnReorderDrag } from './hooks/useColumnReorderDrag'
import { useGridCellContent } from './hooks/useGridCellContent'
import { useCellEditing } from './hooks/useCellEditing'

export function BasicGrid<RowType extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  rows,
  height = 400,
  headerRowHeight = DEFAULT_HEADER_ROW_HEIGHT,
  rowMarkerWidth = DEFAULT_ROW_MARKER_WIDTH,
  showRowMarkers = true,
  scrollbarReserve = DEFAULT_SCROLLBAR_RESERVE,
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
}: BasicGridProps<RowType>) {
  const gridRef = useRef<HTMLDivElement>(null)
  const headerInnerRef = useRef<HTMLDivElement>(null)
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)
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
  })
  const rowSelectionEnabled = Boolean(enableRowSelection)
  const { getSelectionStateForRow, toggleRowSelection, handleSelectAllChange, isAllRowsSelected, hasPartialRowSelection } =
    useRowSelectionState({
      gridRows,
      rowSelectionEnabled,
      getRowSelectable,
      onRowSelectionChange,
      nodesByRowIndex,
      treeEnabled,
    })

  const hasSelectColumns = useMemo(
    () => editable && orderedColumns.some((column) => column.isSelect()),
    [editable, orderedColumns]
  )

  const { selectRange, selectedBounds, highlightRegions, clearSelection } = useColumnSelection(
    gridRows.length,
    orderedColumns.length
  )
  const { scrollLeft, handleVisibleRegionChanged, viewportWidth, dataViewportWidth } = useHorizontalScroll({
    dataAreaWidth,
    rowMarkerWidth: markerWidth,
    containerWidth,
    columnPositions,
  })

  const customRenderers = useMemo(() => {
    const renderers: CustomRenderer<any>[] = []
    if (treeCustomRenderers) {
      renderers.push(...treeCustomRenderers)
    }
    if (hasSelectColumns) {
      renderers.push(selectCellRenderer)
    }
    return renderers.length > 0 ? renderers : undefined
  }, [treeCustomRenderers, hasSelectColumns])

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
  })

  const { dragState, hasActiveDrag, handleHeaderDragStart } = useColumnReorderDrag({
    enableColumnReorder,
    orderedColumns,
    columnPositions,
    columnWidths,
    headerInnerRef,
    dataAreaWidth,
    reorderColumns,
  })

  const gridTheme = useMemo(
    () => ({
      accentColor: '#1e88e5',
      accentLight: 'rgba(30, 136, 229, 0.16)',
      accentFg: '#ffffff',
    }),
    []
  )



  const getCellContent = useGridCellContent({
    orderedColumns,
    gridRows,
    rowSelectionEnabled,
    getRowSelectable,
    getSelectionStateForRow,
    editable,
    decorateCell,
    selectionColumnId: SELECTION_COLUMN_ID,
  })

  const handleCellEdited = useCellEditing({
    editable,
    orderedColumns,
    gridRows,
    onCellChange,
  })


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

  return (
    <div className={containerClassName}>
      <div className="basic-grid-wrapper" ref={gridRef}>
        {columnPositions.length > 0 && levelCount > 0 && (
          <GridHeader
            columnPositions={columnPositions}
            columnWidths={columnWidths}
            headerCells={headerCells}
            orderedColumns={orderedColumns}
            levelCount={levelCount}
            headerRowHeight={headerRowHeight}
            markerWidth={markerWidth}
            showRowMarkers={showRowMarkers}
            dataViewportWidth={dataViewportWidth}
            dataAreaWidth={dataAreaWidth}
            viewportWidth={viewportWidth}
            scrollbarReserve={scrollbarReserve}
            scrollLeft={scrollLeft}
            headerInnerRef={headerInnerRef}
            selectRange={selectRange}
            selectedBounds={selectedBounds}
            handleColumnSort={handleColumnSort}
            sortState={sortState}
            enableColumnReorder={enableColumnReorder}
            handleHeaderDragStart={handleHeaderDragStart}
            dragState={dragState}
            hasActiveDrag={hasActiveDrag}
            handleResizeMouseDown={handleResizeMouseDown}
            handleResizeDoubleClick={handleResizeDoubleClick}
            isAllRowsSelected={isAllRowsSelected}
            handleSelectAllChange={handleSelectAllChange}
            selectAllCheckboxRef={selectAllCheckboxRef}
          />
        )}

        <div className="basic-grid-body">
          <DataEditor
            getCellContent={getCellContent}
            columns={orderedColumns.map((column, index) => ({
              title: column.title,
              width: columnWidths[index] ?? column.baseWidth,
            }))}
            rows={gridRows.length}
            width={viewportWidth}
            height={height}
            theme={gridTheme}
            customRenderers={customRenderers}
            onVisibleRegionChanged={handleVisibleRegionChanged}
            onHeaderClicked={handleColumnSort}
            onCellClicked={handleCellClicked}
            onCellEdited={editable ? handleCellEdited : undefined}
            highlightRegions={highlightRegions}
            rowMarkers={rowMarkersSetting}
            rowMarkerWidth={markerWidth}
            rowSelectionMode={rowSelectionEnabled ? 'multi' : undefined}
            rowSelect={rowSelectionEnabled ? 'multi' : undefined}
            smoothScrollX={true}
            smoothScrollY={true}
            headerHeight={0}
          />
        </div>
      </div>
    </div>
  )
}


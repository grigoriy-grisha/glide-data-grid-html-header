import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DataEditor, { GridCellKind, type CellClickedEventArgs, type GridCell, type Item } from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'

import './BasicGrid.css'
import type { BasicGridProps } from './types'
import {
  DEFAULT_HEADER_ROW_HEIGHT,
  DEFAULT_MIN_COLUMN_WIDTH,
  DEFAULT_ROW_MARKER_WIDTH,
  DEFAULT_SCROLLBAR_RESERVE,
} from './constants'
import { useNormalizedColumnsData } from './hooks/useNormalizedColumnsData'
import { useColumnMetrics } from './hooks/useColumnMetrics'
import { useGridSorting } from './hooks/useGridSorting'
import { useColumnSelection } from './hooks/useColumnSelection'
import { useHorizontalScroll } from './hooks/useHorizontalScroll'
import { useColumnOrdering } from './hooks/useColumnOrdering'
import { useColumnResize } from './hooks/useColumnResize'
import { GridCellState } from './models/GridCellState'
import { useGridTree } from './hooks/useGridTree'

const EMPTY_TEXT_CELL: GridCell = {
  kind: GridCellKind.Text,
  data: '',
  displayData: '',
  allowOverlay: false,
}
export function BasicGrid<RowType extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  rows,
  height = 400,
  headerRowHeight = DEFAULT_HEADER_ROW_HEIGHT,
  rowMarkerWidth = DEFAULT_ROW_MARKER_WIDTH,
  scrollbarReserve = DEFAULT_SCROLLBAR_RESERVE,
  className,
  enableColumnReorder = false,
  columnOrder,
  onColumnOrderChange,
  treeOptions,
}: BasicGridProps<RowType>) {
  const gridRef = useRef<HTMLDivElement>(null)
  const headerInnerRef = useRef<HTMLDivElement>(null)
  const dragCleanupRef = useRef<(() => void) | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.max(480, window.innerWidth - 80)
    }
    return 900
  })
  const { columnCollection } = useNormalizedColumnsData(columns)
  const { orderedColumns, headerCells, levelCount, reorderColumns } = useColumnOrdering({
    columns: columnCollection.leafColumns,
    columnOrder,
    onColumnOrderChange,
  })
  const [columnWidthOverrides, setColumnWidthOverrides] = useState<Record<string, number>>({})
  const [dragState, setDragState] = useState<{ sourceIndex: number; targetIndex: number } | null>(null)
  const hasActiveDrag = dragState != null
  const { columnWidths, columnPositions, dataAreaWidth } = useColumnMetrics(
    orderedColumns,
    containerWidth,
    rowMarkerWidth,
    columnWidthOverrides
  )

  const fallbackTreeColumnId = columnCollection.leafColumns[0]?.id
  const {
    treeEnabled,
    treeColumnId,
    displayRows,
    customRenderers,
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

  const { selectRange, selectedBounds, highlightRegions, clearSelection } = useColumnSelection(
    gridRows.length,
    orderedColumns.length
  )
  const { scrollLeft, handleVisibleRegionChanged, viewportWidth, dataViewportWidth } = useHorizontalScroll({
    dataAreaWidth,
    rowMarkerWidth,
    containerWidth,
    columnPositions,
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
  })

  const gridTheme = useMemo(
    () => ({
      accentColor: '#1e88e5',
      accentLight: 'rgba(30, 136, 229, 0.16)',
      accentFg: '#ffffff',
    }),
    []
  )

  const handleCellClicked = useCallback(
    (cell: Item, _event?: CellClickedEventArgs) => {
      if (!treeEnabled || !treeColumnId) {
        clearSelection()
        return
      }

      const [colIndex, rowIndex] = cell
      const column = orderedColumns[colIndex]
      if (column && column.id === treeColumnId) {
        toggleRowByIndex(rowIndex)
        return
      }

      clearSelection()
    },
    [clearSelection, treeEnabled, treeColumnId, orderedColumns, toggleRowByIndex]
  )

  const headerHeight = levelCount * headerRowHeight

  useEffect(() => {
    const parent = gridRef.current?.parentElement
    if (!parent || typeof ResizeObserver === 'undefined') {
      setContainerWidth((prev) => prev)
      return
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) {
        setContainerWidth(Math.max(480, width))
      }
    })

    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.()
    }
  }, [])

  const getDataX = useCallback(
    (clientX: number) => {
      const headerInner = headerInnerRef.current
      if (!headerInner) {
        return 0
      }
      const rect = headerInner.getBoundingClientRect()
      const relativeX = clientX - rect.left
      return Math.max(0, Math.min(relativeX, dataAreaWidth))
    },
    [dataAreaWidth]
  )

  const getTargetIndex = useCallback(
    (dataX: number) => {
      if (orderedColumns.length === 0) {
        return 0
      }
      for (let i = 0; i < orderedColumns.length; i++) {
        const start = columnPositions[i] ?? 0
        const width = columnWidths[i] ?? 0
        const midpoint = start + width / 2
        if (dataX < midpoint) {
          return i
        }
      }
      return orderedColumns.length
    },
    [columnPositions, columnWidths, orderedColumns.length]
  )

  const handleHeaderDragStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, columnIndex: number) => {
      if (!enableColumnReorder || event.button !== 0) {
        return
      }
      event.preventDefault()
      dragCleanupRef.current?.()

      setDragState({ sourceIndex: columnIndex, targetIndex: columnIndex })

      const previousUserSelect = document.body.style.userSelect

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const nextDataX = getDataX(moveEvent.clientX)
        const nextTarget = getTargetIndex(nextDataX)
        setDragState((prev) => (prev ? { ...prev, targetIndex: nextTarget } : prev))
      }

      const handleMouseUp = () => {
        setDragState((prev) => {
          if (prev) {
            reorderColumns(prev.sourceIndex, prev.targetIndex)
          }
          return null
        })
        cleanup()
      }

      const cleanup = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = previousUserSelect
        dragCleanupRef.current = null
      }

      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      dragCleanupRef.current = cleanup
    },
    [enableColumnReorder, getDataX, getTargetIndex, reorderColumns]
  )

  const getCellContent = useCallback(
    (cell: Item): GridCell => {
      const [col, row] = cell
      const column = orderedColumns[col]
      const dataRow = gridRows[row]

      if (!column || !dataRow) {
        return EMPTY_TEXT_CELL
      }

      const cellState = new GridCellState(column, dataRow)
      const baseCell = cellState.toGridCell()

      return decorateCell(baseCell, column.id, row)
    },
    [gridRows, orderedColumns, decorateCell]
  )

  const containerClassName = ['basic-grid-container', className].filter(Boolean).join(' ')

  return (
    <div className={containerClassName}>
      <div className="basic-grid-wrapper" ref={gridRef}>
        {columnPositions.length > 0 && levelCount > 0 && (
          <div
            className="basic-grid-html-header"
            style={{
              width: `${viewportWidth}px`,
              paddingRight: `${scrollbarReserve}px`,
              boxSizing: 'border-box',
            }}
          >
            <div className="basic-grid-header-row-marker" style={{ width: `${rowMarkerWidth}px` }} />
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
                  const bgColor = cell.level === 0 ? '#e3f2fd' : cell.level === 1 ? '#f5f5f5' : '#fafafa'
                  const textColor = cell.level === 0 ? '#1565c0' : cell.level === 1 ? '#333333' : '#666666'
                  const fontSize = cell.level === 0 ? 14 : cell.level === 1 ? 13 : 12
                  const fontWeight = cell.level <= 1 ? 'bold' : 'normal'
                  const columnIndex = cell.columnIndex
                  const resolvedColumnIndex = columnIndex ?? -1
                  const targetColumn =
                    resolvedColumnIndex >= 0 ? orderedColumns[resolvedColumnIndex] : undefined
                  const isLeafColumn = cell.isLeaf && targetColumn != null
                  const isSortable = isLeafColumn && targetColumn?.sortable !== false
                  const isSorted =
                    isLeafColumn && sortState && targetColumn?.id === sortState.columnId
                  const isSelectable = cell.colSpan > 0
                  const isCellSelected =
                    isSelectable &&
                    selectedBounds != null &&
                    cell.startIndex >= selectedBounds.start &&
                    cell.startIndex + cell.colSpan - 1 <= selectedBounds.end
                  const cellClasses = ['basic-grid-header-cell']
                  const isReorderable = enableColumnReorder && isLeafColumn
                  const isDragging = isReorderable && dragState?.sourceIndex === resolvedColumnIndex
                  const hasDropTarget =
                    dragState != null && dragState.targetIndex !== dragState.sourceIndex
                  const dropBefore =
                    isReorderable &&
                    hasDropTarget &&
                    dragState?.targetIndex === resolvedColumnIndex
                  const dropAfter =
                    isReorderable &&
                    hasDropTarget &&
                    dragState?.targetIndex === resolvedColumnIndex + 1
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
                      {cell.content ?? cell.title}
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
            highlightRegions={highlightRegions}
            rowMarkers="number"
            rowMarkerWidth={rowMarkerWidth}
            smoothScrollX={true}
            smoothScrollY={true}
            headerHeight={0}
          />
        </div>
      </div>
    </div>
  )
}


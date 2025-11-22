import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DataEditor, {
  CompactSelection,
  GridCellKind,
  type CellClickedEventArgs,
  type CustomRenderer,
  type EditableGridCell,
  type GridCell,
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
import { createSelectCell, isSelectCell, selectCellRenderer } from './customCells/selectCell'

const EMPTY_TEXT_CELL: GridCell = {
  kind: GridCellKind.Text,
  data: '',
  displayData: '',
  allowOverlay: false,
}

const SELECTION_COLUMN_ID = '__basic-grid-selection__'

const createRowSelectionFromIndexes = (indexes: number[]) => {
  if (indexes.length === 0) {
    return CompactSelection.empty()
  }
  const sorted = [...new Set(indexes)].sort((a, b) => a - b)
  let selection = CompactSelection.empty()
  let rangeStart = sorted[0]
  let previous = sorted[0]

  const pushRange = () => {
    if (rangeStart == null || previous == null) {
      return
    }
    if (rangeStart === previous) {
      selection = selection.add(rangeStart)
    } else {
      selection = selection.add([rangeStart, previous + 1])
    }
  }

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    if (current === previous + 1) {
      previous = current
      continue
    }
    pushRange()
    rangeStart = current
    previous = current
  }

  pushRange()
  return selection
}

type TextEditableCell = Extract<EditableGridCell, { kind: GridCellKind.Text }>
type NumberEditableCell = Extract<EditableGridCell, { kind: GridCellKind.Number }>
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
  const dragCleanupRef = useRef<(() => void) | null>(null)
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.max(480, window.innerWidth - 80)
    }
    return 900
  })
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
  const [dragState, setDragState] = useState<{ sourceIndex: number; targetIndex: number } | null>(null)
  const hasActiveDrag = dragState != null
  const [rowSelection, setRowSelection] = useState<CompactSelection>(() => CompactSelection.empty())
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
  const selectableRowIndexes = useMemo(
    () =>
      rowSelectionEnabled
        ? gridRows
            .map((row, index) => ({ row, index }))
            .filter(({ row }) => (getRowSelectable ? getRowSelectable(row) : true))
            .map(({ index }) => index)
        : [],
    [getRowSelectable, gridRows, rowSelectionEnabled]
  )
  const isAllRowsSelected =
    rowSelectionEnabled &&
    selectableRowIndexes.length > 0 &&
    selectableRowIndexes.every((index) => rowSelection.hasIndex(index))
  const hasPartialRowSelection =
    rowSelectionEnabled && selectableRowIndexes.some((index) => rowSelection.hasIndex(index)) && !isAllRowsSelected

  const getSubtreeRange = useCallback(
    (rowIndex: number): [number, number] => {
      if (!treeEnabled || !nodesByRowIndex) {
        return [rowIndex, rowIndex + 1]
      }
      const node = nodesByRowIndex[rowIndex]
      if (!node) {
        return [rowIndex, rowIndex + 1]
      }
      const currentDepth = node.depth
      let end = rowIndex + 1
      for (let i = rowIndex + 1; i < nodesByRowIndex.length; i++) {
        const candidate = nodesByRowIndex[i]
        if (candidate.depth <= currentDepth) {
          break
        }
        end = i + 1
      }
      return [rowIndex, end]
    },
    [nodesByRowIndex, treeEnabled]
  )

  const getSelectionStateForRow = useCallback(
    (rowIndex: number): 'all' | 'partial' | 'none' => {
      const [start, end] = getSubtreeRange(rowIndex)
      const totalSelectable = selectableRowIndexes.filter((index) => index >= start && index < end).length
      if (totalSelectable === 0) {
        return 'none'
      }
      const selectedCount = rowSelection
        .toArray()
        .filter((index) => index >= start && index < end && selectableRowIndexes.includes(index)).length
      if (selectedCount === 0) {
        return 'none'
      }
      if (selectedCount === totalSelectable) {
        return 'all'
      }
      return 'partial'
    },
    [getSubtreeRange, rowSelection, selectableRowIndexes]
  )

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

  const gridTheme = useMemo(
    () => ({
      accentColor: '#1e88e5',
      accentLight: 'rgba(30, 136, 229, 0.16)',
      accentFg: '#ffffff',
    }),
    []
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

      if (rowSelectionEnabled && column.id === SELECTION_COLUMN_ID) {
        if (getRowSelectable && !getRowSelectable(dataRow)) {
          return EMPTY_TEXT_CELL
        }
        const selectionState = getSelectionStateForRow(row)
        const data =
          selectionState === 'all' ? true : selectionState === 'partial' ? undefined : false
        return {
          kind: GridCellKind.Boolean,
          data,
          allowOverlay: false,
          readonly: false,
          themeOverride: {
            textMedium: '#5c9dff',
            textDark: '#1e88e5',
            accentColor: '#1e88e5',
            textLight: '#4ea4ff',
            bgCell: '#e8f1ff',
          },
        }
      }

      const cellState = new GridCellState(column, dataRow)
      const baseCell = cellState.toGridCell()

      if (column.isSelect() && editable) {
        const options = column.getSelectOptions(dataRow)
        if (options && options.length > 0) {
          const rawValue = column.getValue(dataRow)
          const stringValue = rawValue == null ? '' : String(rawValue)
          return createSelectCell(stringValue, options, column.getSelectPlaceholder())
        }
      }

      const decoratedCell = decorateCell(baseCell, column.id, row)
      const canEdit =
        editable &&
        column.getAccessorPath() &&
        (decoratedCell.kind === GridCellKind.Text || decoratedCell.kind === GridCellKind.Number)

      if (canEdit) {
        const allowOverlay = decoratedCell.allowOverlay ?? false
        const activationBehavior = decoratedCell.activationBehaviorOverride
        const isReadonly = decoratedCell.readonly ?? true

        if (!allowOverlay || activationBehavior !== 'single-click' || isReadonly) {
          return {
            ...decoratedCell,
            allowOverlay: true,
            activationBehaviorOverride: 'single-click',
            readonly: false,
          }
        }
      }

      return decoratedCell
    },
    [gridRows, orderedColumns, decorateCell, editable, getSelectionStateForRow, rowSelectionEnabled]
  )

  const handleCellEdited = useCallback(
    (cell: Item, newValue: EditableGridCell) => {
      if (!editable) {
        return
      }

      const [col, row] = cell
      const column = orderedColumns[col]
      const dataRow = gridRows[row]
      const accessorPath = column?.getAccessorPath()
      if (!column || !dataRow || !accessorPath) {
        return
      }

      const previousValue = column.getValue(dataRow)
      let nextRawValue: unknown
      let nextValueDisplay = ''

      if (newValue.kind === GridCellKind.Text) {
        const { data } = newValue as TextEditableCell
        nextRawValue = typeof data === 'string' ? data : ''
        nextValueDisplay = typeof nextRawValue === 'string' ? nextRawValue : ''
      } else if (newValue.kind === GridCellKind.Number) {
        const { data } = newValue as NumberEditableCell
        nextRawValue = data ?? null
        nextValueDisplay =
          typeof data === 'number' && Number.isFinite(data) ? String(data) : data == null ? '' : String(data)
      } else if (newValue.kind === GridCellKind.Custom && isSelectCell(newValue)) {
        nextRawValue = newValue.data.value
        nextValueDisplay = newValue.data.displayValue ?? ''
      } else {
        return
      }

      if (Object.is(previousValue, nextRawValue)) {
        return
      }

      onCellChange?.({
        columnId: column.id,
        accessorPath,
        rowIndex: row,
        row: dataRow,
        previousValue,
        nextValue: nextValueDisplay,
        nextRawValue,
      })
    },
    [editable, gridRows, onCellChange, orderedColumns]
  )

  const notifyRowSelectionChange = useCallback(
    (selection: CompactSelection) => {
      if (!rowSelectionEnabled || !onRowSelectionChange) {
        return
      }
      const rowIndexes = selection
        .toArray()
        .filter((rowIndex) => rowIndex >= 0 && rowIndex < gridRows.length)
      const selectedRows = rowIndexes.map((index) => gridRows[index]).filter(Boolean) as RowType[]
      onRowSelectionChange({
        rows: selectedRows,
        rowIndexes,
      })
    },
    [gridRows, onRowSelectionChange, rowSelectionEnabled]
  )

  const updateRowSelection = useCallback(
    (updater: (rows: CompactSelection) => CompactSelection) => {
      if (!rowSelectionEnabled) {
        return
      }
      setRowSelection((prev) => {
        const nextRows = updater(prev)
        if (nextRows === prev) {
          return prev
        }
        notifyRowSelectionChange(nextRows)
        return nextRows
      })
    },
    [notifyRowSelectionChange, rowSelectionEnabled]
  )

  const toggleRowSelection = useCallback(
    (rowIndex: number) => {
      if (getRowSelectable && !getRowSelectable(gridRows[rowIndex])) {
        return
      }
      updateRowSelection((rows) => {
        const [start, end] = getSubtreeRange(rowIndex)
        const selectableRange = selectableRowIndexes.filter((index) => index >= start && index < end)
        if (selectableRange.length === 0) {
          return rows
        }
        const range: [number, number] = [selectableRange[0], selectableRange[selectableRange.length - 1] + 1]
        return rows.hasAll(range) ? rows.remove(range) : rows.add(range)
      })
    },
    [getRowSelectable, getSubtreeRange, gridRows, selectableRowIndexes, updateRowSelection]
  )

  const setAllRowsSelection = useCallback(
    (checked: boolean) => {
      updateRowSelection(() => {
        if (!checked) {
          return CompactSelection.empty()
        }
        if (selectableRowIndexes.length === 0) {
          return CompactSelection.empty()
        }
        const ranges: [number, number][] = []
        let rangeStart = selectableRowIndexes[0]
        let prev = selectableRowIndexes[0]
        for (let i = 1; i < selectableRowIndexes.length; i++) {
          const current = selectableRowIndexes[i]
          if (current === prev + 1) {
            prev = current
            continue
          }
          ranges.push([rangeStart, prev + 1])
          rangeStart = current
          prev = current
        }
        ranges.push([rangeStart, prev + 1])
        return ranges.reduce((selection, range) => selection.add(range), CompactSelection.empty())
      })
    },
    [selectableRowIndexes, updateRowSelection]
  )

  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      setAllRowsSelection(checked)
    },
    [setAllRowsSelection]
  )

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

  useEffect(() => {
    if (!rowSelectionEnabled) {
      return
    }
    const rowIndexes = rowSelection.toArray()
    if (rowIndexes.length === 0) {
      return
    }
    const maxIndex = gridRows.length - 1
    const filteredIndexes = rowIndexes.filter((rowIndex) => rowIndex <= maxIndex)
    if (filteredIndexes.length === rowIndexes.length) {
      return
    }
    const sanitizedSelection =
      filteredIndexes.length > 0 ? createRowSelectionFromIndexes(filteredIndexes) : CompactSelection.empty()
    setRowSelection(sanitizedSelection)
    notifyRowSelectionChange(sanitizedSelection)
  }, [gridRows.length, notifyRowSelectionChange, rowSelection, rowSelectionEnabled])

  const containerClassName = ['basic-grid-container', className].filter(Boolean).join(' ')
  const rowMarkersSetting: DataEditorProps['rowMarkers'] = showRowMarkers ? 'number' : 'none'

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
            {showRowMarkers && (
              <div className="basic-grid-header-row-marker" style={{ width: `${markerWidth}px` }} />
            )}
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
                  const isSelectionColumn = targetColumn?.id === SELECTION_COLUMN_ID
                  const isSortable = isLeafColumn && targetColumn?.sortable !== false && !isSelectionColumn
                  const isSorted =
                    isLeafColumn && sortState && targetColumn?.id === sortState.columnId
                  const isSelectable = cell.colSpan > 0 && !isSelectionColumn
                  const isCellSelected =
                    isSelectable &&
                    selectedBounds != null &&
                    cell.startIndex >= selectedBounds.start &&
                    cell.startIndex + cell.colSpan - 1 <= selectedBounds.end
                  const cellClasses = ['basic-grid-header-cell']
                  const isReorderable = enableColumnReorder && isLeafColumn && !isSelectionColumn
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
                      {isSelectionColumn ? (
                        <div className="basic-grid-selection-header">
                          <input
                            ref={selectAllCheckboxRef}
                            type="checkbox"
                            className="basic-grid-header-row-checkbox"
                            checked={isAllRowsSelected}
                            onChange={(event) => handleSelectAllChange(event.target.checked)}
                            aria-label="Выбрать все строки"
                          />
                        </div>
                      ) : (
                        cell.content ?? cell.title
                      )}
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


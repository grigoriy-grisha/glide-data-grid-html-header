import React, { useCallback, useMemo } from 'react'
import { memoizeOne } from '../utils/memoizeOne'
import type { GridHeaderCell } from '../models/GridHeaderCell'
import type { GridColumn } from '../models/GridColumn'
import type { SortDirection } from '../types'
import { SELECTION_COLUMN_ID } from '../constants'

type SortState = { columnId: string; direction: SortDirection } | null

const HEADER_COLORS = ['#e3f2fd', '#f5f5f5', '#fafafa']
const HEADER_TEXT_COLORS = ['#1565c0', '#333333', '#666666']
const HEADER_FONT_SIZES = [14, 13, 12]

const getCellStyle = memoizeOne(
    (
        startX: number,
        totalWidth: number,
        rowSpan: number,
        level: number,
        headerRowHeight: number,
        bgColor: string,
        textColor: string,
        fontSize: number,
        fontWeight: string
    ) => ({
        transform: `translateX(${startX}px)`,
        width: `${totalWidth}px`,
        height: `${rowSpan * headerRowHeight}px`,
        top: `${level * headerRowHeight}px`,
        backgroundColor: bgColor,
        color: textColor,
        fontSize: `${fontSize}px`,
        fontWeight,
        zIndex: 1,
    })
)

const getCellClasses = memoizeOne(
    (isSelectable: boolean, isSorted: boolean, isCellSelected: boolean, isReorderable: boolean) => {
        const classes = ['basic-grid-header-cell']
        if (isSelectable) classes.push('basic-grid-header-cell--clickable')
        if (isSorted) classes.push('basic-grid-header-cell--sorted')
        if (isCellSelected) classes.push('basic-grid-header-cell--selected')
        if (isReorderable) classes.push('basic-grid-header-cell--draggable')
        return classes.join(' ')
    }
)

interface HeaderCellProps<RowType extends Record<string, unknown>> {
    cell: GridHeaderCell
    columnPositions: number[]
    columnWidths: number[]
    orderedColumns: GridColumn<RowType>[]
    headerRowHeight: number
    sortState: SortState
    enableColumnReorder: boolean
    isCellSelected: boolean
    selectRange: (startIndex: number, span: number) => void
    handleColumnSort: (columnIndex: number) => void
    handleHeaderDragStart: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number) => void
    registerHeaderCell: (columnIndex: number, element: HTMLElement | null) => void
    handleResizeMouseDown: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
    handleResizeDoubleClick: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
    isAllRowsSelected: boolean
    handleSelectAllChange: (checked: boolean) => void
    selectAllCheckboxRef: React.RefObject<HTMLInputElement>
}

export const HeaderCellComponent = function HeaderCell<RowType extends Record<string, unknown>>({
    cell,
    columnPositions,
    columnWidths,
    orderedColumns,
    headerRowHeight,
    sortState,
    enableColumnReorder,
    isCellSelected,
    selectRange,
    handleColumnSort,
    handleHeaderDragStart,
    registerHeaderCell,
    handleResizeMouseDown,
    handleResizeDoubleClick,
    isAllRowsSelected,
    handleSelectAllChange,
    selectAllCheckboxRef,
}: HeaderCellProps<RowType>) {
    // Memoize cell metadata
    const cellMetadata = useMemo(() => {
        const startX = columnPositions[cell.startIndex] ?? 0
        const totalWidth = cell.getSpanWidth(columnWidths)
        const bgColor = HEADER_COLORS[cell.level] ?? HEADER_COLORS[HEADER_COLORS.length - 1]
        const textColor = HEADER_TEXT_COLORS[cell.level] ?? HEADER_TEXT_COLORS[HEADER_TEXT_COLORS.length - 1]
        const fontSize = HEADER_FONT_SIZES[cell.level] ?? HEADER_FONT_SIZES[HEADER_FONT_SIZES.length - 1]
        const fontWeight = cell.level <= 1 ? 'bold' : 'normal'
        const columnIndex = cell.columnIndex
        const resolvedColumnIndex = columnIndex ?? -1
        const targetColumn = resolvedColumnIndex >= 0 ? orderedColumns[resolvedColumnIndex] : undefined
        const isLeafColumn = cell.isLeaf && targetColumn != null
        const isSelectionColumn = targetColumn?.id === SELECTION_COLUMN_ID
        const isSortable = isLeafColumn && targetColumn?.sortable !== false && !isSelectionColumn
        const isSorted = isLeafColumn && sortState && targetColumn?.id === sortState.columnId
        const isSelectable = cell.colSpan > 0 && !isSelectionColumn
        const isReorderable = enableColumnReorder && isLeafColumn && !isSelectionColumn

        const resizeStartIndex = cell.isLeaf ? resolvedColumnIndex : cell.startIndex
        const resizeSpan = Math.max(1, cell.colSpan)
        const canResizeCell = resizeStartIndex != null && resizeStartIndex >= 0 && resizeSpan > 0

        return {
            startX,
            totalWidth,
            bgColor,
            textColor,
            fontSize,
            fontWeight,
            columnIndex,
            resolvedColumnIndex,
            targetColumn,
            isLeafColumn,
            isSelectionColumn,
            isSortable,
            isSorted,
            isSelectable,
            isReorderable,
            resizeStartIndex,
            resizeSpan,
            canResizeCell,
        }
    }, [
        cell,
        columnPositions,
        columnWidths,
        orderedColumns,
        sortState,
        enableColumnReorder,
    ])

    const cellStyle = getCellStyle(
        cellMetadata.startX,
        cellMetadata.totalWidth,
        cell.rowSpan,
        cell.level,
        headerRowHeight,
        cellMetadata.bgColor,
        cellMetadata.textColor,
        cellMetadata.fontSize,
        cellMetadata.fontWeight
    )

    const cellClasses = getCellClasses(
        cellMetadata.isSelectable,
        cellMetadata.isSorted,
        Boolean(isCellSelected),
        cellMetadata.isReorderable
    )

    // Stabilize event handlers
    const handleCellActivate = useCallback(() => {
        if (!cellMetadata.isSelectable) {
            return
        }
        selectRange(cell.startIndex, cell.colSpan)
        if (cellMetadata.isSortable && cellMetadata.columnIndex != null) {
            handleColumnSort(cellMetadata.columnIndex)
        }
    }, [
        cellMetadata.isSelectable,
        cellMetadata.isSortable,
        cellMetadata.columnIndex,
        cell.startIndex,
        cell.colSpan,
        selectRange,
        handleColumnSort,
    ])

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (!cellMetadata.isSelectable) {
                return
            }
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleCellActivate()
            }
        },
        [cellMetadata.isSelectable, handleCellActivate]
    )

    const handleMouseDown = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (cellMetadata.isReorderable && cellMetadata.resolvedColumnIndex >= 0) {
                handleHeaderDragStart(event, cellMetadata.resolvedColumnIndex)
            }
        },
        [cellMetadata.isReorderable, cellMetadata.resolvedColumnIndex, handleHeaderDragStart]
    )

    const handleResizeMouseDownCallback = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (cellMetadata.canResizeCell) {
                handleResizeMouseDown(event, cellMetadata.resizeStartIndex!, cellMetadata.resizeSpan)
            }
        },
        [cellMetadata.canResizeCell, cellMetadata.resizeStartIndex, cellMetadata.resizeSpan, handleResizeMouseDown]
    )

    const handleResizeDoubleClickCallback = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (cellMetadata.canResizeCell) {
                handleResizeDoubleClick(event, cellMetadata.resizeStartIndex!, cellMetadata.resizeSpan)
            }
        },
        [cellMetadata.canResizeCell, cellMetadata.resizeStartIndex, cellMetadata.resizeSpan, handleResizeDoubleClick]
    )

    const registerCellRef = useCallback(
        (el: HTMLDivElement | null) => {
            if (cellMetadata.isReorderable && cellMetadata.resolvedColumnIndex >= 0) {
                registerHeaderCell(cellMetadata.resolvedColumnIndex, el)
            }
        },
        [cellMetadata.isReorderable, cellMetadata.resolvedColumnIndex, registerHeaderCell]
    )

    return (
        <div
            key={`${cell.level}-${cell.startIndex}-${cell.title}`}
            ref={registerCellRef}
            className={cellClasses}
            style={cellStyle}
            onClick={cellMetadata.isSelectable ? handleCellActivate : undefined}
            onMouseDown={cellMetadata.isReorderable ? handleMouseDown : undefined}
            onKeyDown={handleKeyDown}
            role={cellMetadata.isSelectable ? 'button' : undefined}
            tabIndex={cellMetadata.isSelectable ? 0 : undefined}
            aria-sort={
                cellMetadata.isSorted ? (sortState?.direction === 'asc' ? 'ascending' : 'descending') : undefined
            }
            aria-pressed={cellMetadata.isSelectable ? isCellSelected : undefined}
        >
            {cellMetadata.isSelectionColumn ? (
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
            {cellMetadata.canResizeCell && (
                <div
                    className="basic-grid-header-resize-handle"
                    onMouseDown={handleResizeMouseDownCallback}
                    onDoubleClick={handleResizeDoubleClickCallback}
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize column"
                />
            )}
            {cellMetadata.isSorted && (
                <span className="basic-grid-header-sort-indicator" aria-hidden="true">
                    {sortState?.direction === 'asc' ? '▲' : '▼'}
                </span>
            )}
        </div>
    )
}

// Custom comparison function for better performance
function arePropsEqual<RowType extends Record<string, unknown>>(
    prevProps: HeaderCellProps<RowType>,
    nextProps: HeaderCellProps<RowType>
): boolean {
    // Only re-render if these critical props change
    return (
        prevProps.cell === nextProps.cell &&
        prevProps.isCellSelected === nextProps.isCellSelected &&
        prevProps.sortState === nextProps.sortState &&
        prevProps.headerRowHeight === nextProps.headerRowHeight &&
        prevProps.enableColumnReorder === nextProps.enableColumnReorder &&
        prevProps.isAllRowsSelected === nextProps.isAllRowsSelected &&
        prevProps.columnPositions === nextProps.columnPositions &&
        prevProps.columnWidths === nextProps.columnWidths
    )
}

export const HeaderCell = React.memo(HeaderCellComponent, arePropsEqual) as <RowType extends Record<string, unknown>>(
    props: HeaderCellProps<RowType>
) => JSX.Element

import { useEffect, useMemo, useCallback } from 'react'
import { CanvasRoot } from '../core/CanvasRoot'
import { CanvasAbsoluteContainer } from '../core/CanvasAbsoluteContainer'
import { CanvasContainer } from '../core/CanvasContainer'
import { CanvasNode } from '../core/CanvasNode'
import { CanvasText } from '../primitives/CanvasText'
import { CanvasIcon } from '../primitives/CanvasIcon'
import { CanvasIconButton } from '../primitives/CanvasIconButton'
import { GridHeaderCell } from '../../../models/GridHeaderCell'
import { GridColumn } from '../../../models/GridColumn'
import { getHeaderColor, getHeaderTextColor, getHeaderFontSize, getHeaderFontWeight } from '../../headerConstants'
import { GRIP_ICON_SVG, SORT_ASC_ICON, SORT_DESC_ICON, SORT_DEFAULT_ICON } from '../utils/icons'
import { DragState } from './useHeaderDragDrop'

// Precomputed hover colors cache
const hoverColorCache = new Map<string, string>()
function getHoverColor(c: string): string {
    let cached = hoverColorCache.get(c)
    if (!cached) {
        if (c === '#e3f2fd') cached = '#bbdefb'
        else if (c === '#f5f5f5') cached = '#e0e0e0'
        else if (c === '#fafafa') cached = '#eeeeee'
        else if (c === '#ffffff') cached = '#f5f5f5'
        else cached = c
        hoverColorCache.set(c, cached)
    }
    return cached
}

interface UseHeaderSceneProps {
    rootRef: React.MutableRefObject<CanvasRoot | null>
    canvasRef: React.RefObject<HTMLCanvasElement>
    visibleIndices: { start: number; end: number } | null
    headerCells: GridHeaderCell[]
    orderedColumns: GridColumn<any>[]
    columnPositions: number[]
    columnWidths: number[]
    scrollLeft: number
    headerRowHeight: number
    markerWidthValue: number
    enableColumnReorder?: boolean
    dragState: DragState | null
    handleDragStart: (e: MouseEvent | React.MouseEvent, columnIndex: number, title: string, width: number, rect: {
        x: number,
        y: number,
        width: number,
        height: number
    }) => void
    sortColumn?: string
    sortDirection?: 'asc' | 'desc'
    onColumnSort?: (columnId: string, direction: 'asc' | 'desc' | undefined) => void
    debugMode?: boolean
    isVisible?: boolean
}

export const useHeaderScene = ({
    rootRef,
    canvasRef,
    visibleIndices,
    headerCells,
    orderedColumns,
    columnPositions,
    columnWidths,
    scrollLeft,
    headerRowHeight,
    enableColumnReorder,
    handleDragStart,
    sortColumn,
    sortDirection,
    onColumnSort,
    debugMode = false,
    isVisible = true,
}: UseHeaderSceneProps) => {

    // Update global debug mode
    useEffect(() => {
        CanvasNode.DEBUG = debugMode;
        if (rootRef.current) {
            rootRef.current.render();
        }
    }, [debugMode, rootRef]);

    const cellsByLevel = useMemo(() => {
        const groups: GridHeaderCell[][] = []
        for (const cell of headerCells) {
            if (!groups[cell.level]) {
                groups[cell.level] = []
            }
            groups[cell.level].push(cell)
        }
        return groups
    }, [headerCells])

    const visibleCells = useMemo(() => {
        if (!visibleIndices) return headerCells

        const { start, end } = visibleIndices
        const result: GridHeaderCell[] = []

        for (const levelCells of cellsByLevel) {
            if (!levelCells) continue

            // Binary search to find the first visible cell
            let left = 0
            let right = levelCells.length - 1
            let startIndex = -1

            while (left <= right) {
                const mid = (left + right) >> 1
                const cell = levelCells[mid]
                if (cell.startIndex + cell.colSpan > start) {
                    startIndex = mid
                    right = mid - 1
                } else {
                    left = mid + 1
                }
            }

            if (startIndex !== -1) {
                for (let i = startIndex; i < levelCells.length; i++) {
                    const cell = levelCells[i]
                    if (cell.startIndex >= end) break
                    result.push(cell)
                }
            }
        }
        return result
    }, [cellsByLevel, visibleIndices, headerCells])

    // Memoized grip icon factory to avoid recreating handlers
    const createGripIconHandlers = useCallback((
        cellColumnIndex: number,
        cellTitle: string,
        cellX: number,
        cellY: number,
        cellWidth: number,
        cellHeight: number
    ) => ({
        onMouseEnter: () => {
            if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
        },
        onMouseLeave: () => {
            if (canvasRef.current) canvasRef.current.style.cursor = 'default'
        },
        onMouseDown: (e: any) => {
            e.preventDefault()
            e.stopPropagation()
            handleDragStart(
                e.originalEvent,
                cellColumnIndex,
                cellTitle,
                cellWidth,
                { x: cellX, y: cellY, width: cellWidth, height: cellHeight }
            )
        }
    }), [canvasRef, handleDragStart])

    useEffect(() => {
        if (!isVisible || !rootRef.current) return

        const rootContainer = rootRef.current.rootNode as CanvasAbsoluteContainer

        // Fallback: if visibleCells is empty but headerCells exists, show all cells
        // This ensures header renders on initial mount when virtualization hasn't updated yet
        const cellsToRender = visibleCells.length > 0
            ? visibleCells
            : (headerCells.length > 0 ? headerCells : [])

        const wrappers: CanvasAbsoluteContainer[] = []

        for (const cell of cellsToRender) {
            const cellId = `cell-${cell.startIndex}-${cell.level}`

            const absoluteX = columnPositions[cell.startIndex] ?? 0
            const cellX = Math.round(absoluteX - scrollLeft)
            const cellWidth = cell.getSpanWidth(columnWidths)
            const cellY = Math.round(cell.level * headerRowHeight)
            const cellHeight = cell.rowSpan * headerRowHeight

            const normalColor = getHeaderColor(cell.level)
            const hoverColor = getHoverColor(normalColor)

            const column = cell.columnIndex !== undefined ? orderedColumns[cell.columnIndex] : undefined
            const renderContent = cell.renderColumnContent ?? column?.getRenderColumnContent()

            const wrapper = new CanvasAbsoluteContainer(`${cellId}-wrapper`)
            wrapper.rect.x = cellX
            wrapper.rect.y = cellY
            wrapper.rect.width = cellWidth
            wrapper.rect.height = cellHeight
            wrapper.backgroundColor = normalColor
            wrapper.borderColor = '#e0e0e0'
            wrapper.borderWidth = 1
            wrapper.onMouseEnter = () => { wrapper.backgroundColor = hoverColor }
            wrapper.onMouseLeave = () => { wrapper.backgroundColor = normalColor }

            const contentContainer = new CanvasContainer(`${cellId}-content`, {
                direction: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                columnGap: 6,
                padding: 12,
            })
            contentContainer.style.height = cellHeight
            contentContainer.style.width = cellWidth
            contentContainer.rect.x = cellX
            contentContainer.rect.y = cellY
            contentContainer.rect.width = Math.max(0, cellWidth * 2)
            contentContainer.rect.height = cellHeight

            const contentContainerLeft = new CanvasContainer(`${cellId}-left`, {
                direction: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                columnGap: 6,
            })
            const contentContainerRight = new CanvasContainer(`${cellId}-right`, {
                direction: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'space-between',
                columnGap: 6,
            })
            contentContainerRight.style.width = '100%'

            const insertGripIcon = (target: CanvasContainer, atStart = false) => {
                if (!enableColumnReorder || !column || cell.columnIndex === undefined) return
                const gripIcon = new CanvasIcon(`${cellId}-grip`, GRIP_ICON_SVG, { size: 12 })
                gripIcon.style = { flexShrink: 0, alignSelf: 'center' }
                const handlers = createGripIconHandlers(cell.columnIndex, cell.title, cellX, cellY, cellWidth, cellHeight)
                gripIcon.onMouseEnter = handlers.onMouseEnter
                gripIcon.onMouseLeave = handlers.onMouseLeave
                gripIcon.onMouseDown = handlers.onMouseDown
                if (atStart && typeof target.addChildStart === 'function') {
                    target.addChildStart(gripIcon)
                } else {
                    target.addChild(gripIcon)
                }
            }

            if (renderContent) {
                const customContent = renderContent(
                    { x: cellX, y: cellY, width: cellWidth, height: cellHeight }
                )

                if (customContent) {
                    contentContainerLeft.addChild(customContent)

                    if (enableColumnReorder && column && customContent instanceof CanvasContainer) {
                        insertGripIcon(contentContainerLeft, true)
                    }
                }

                contentContainer.addChild(contentContainerLeft)
                wrapper.addChild(contentContainer)
            } else {
                if (enableColumnReorder && column) {
                    insertGripIcon(contentContainerLeft)
                }

                const textNode = new CanvasText(`${cellId}-text`, cell.title, {
                    color: getHeaderTextColor(cell.level),
                    font: `${getHeaderFontWeight(cell.level)} ${getHeaderFontSize(cell.level)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
                })
                textNode.style = { flexGrow: 1 }
                contentContainerLeft.addChild(textNode)

                if (column && column.sortable) {
                    let icon = SORT_DEFAULT_ICON
                    if (sortColumn === column.id) {
                        if (sortDirection === 'asc') icon = SORT_ASC_ICON
                        else if (sortDirection === 'desc') icon = SORT_DESC_ICON
                    }

                    const sortButton = new CanvasIconButton(`${cellId}-sort`, icon, {
                        size: 20,
                        variant: 'secondary',
                    })
                    sortButton.style = { flexShrink: 0, alignSelf: 'center' }

                    const currentColumn = column
                    sortButton.onClick = () => {
                        if (onColumnSort && currentColumn) {
                            let newDirection: 'asc' | 'desc' | undefined = 'asc'
                            if (sortColumn === currentColumn.id) {
                                if (sortDirection === 'asc') newDirection = 'desc'
                                else if (sortDirection === 'desc') newDirection = undefined
                            }
                            onColumnSort(currentColumn.id, newDirection)
                        }
                    }

                    contentContainerRight.addChild(sortButton)
                }

                contentContainer.addChild(contentContainerLeft)
                contentContainer.addChild(contentContainerRight)
                wrapper.addChild(contentContainer)
            }

            wrappers.push(wrapper)
        }

        rootContainer.children = wrappers
    }, [canvasRef, columnPositions, columnWidths, createGripIconHandlers, enableColumnReorder, headerCells, headerRowHeight, isVisible, onColumnSort, orderedColumns, rootRef, scrollLeft, sortColumn, sortDirection, visibleCells])
}

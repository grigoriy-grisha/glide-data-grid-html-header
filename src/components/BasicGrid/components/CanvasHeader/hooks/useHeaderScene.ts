import { useEffect, useMemo } from 'react'
import { CanvasRoot } from '../core/CanvasRoot'
import { CanvasAbsoluteContainer } from '../core/CanvasAbsoluteContainer'
import { CanvasContainer } from '../core/CanvasContainer'
import { CanvasNode } from '../core/CanvasNode'
import { CanvasRect } from '../primitives/CanvasRect'
import { CanvasText } from '../primitives/CanvasText'
import { CanvasIcon } from '../primitives/CanvasIcon'
import { CanvasIconButton } from '../primitives/CanvasIconButton'
import { GridHeaderCell } from '../../../models/GridHeaderCell'
import { GridColumn } from '../../../models/GridColumn'
import { getHeaderColor, getHeaderTextColor, getHeaderFontSize, getHeaderFontWeight } from '../../headerConstants'
import { GRIP_ICON_SVG, SORT_ASC_ICON, SORT_DESC_ICON, SORT_DEFAULT_ICON } from '../utils/icons'
import { DragState } from './useHeaderDragDrop'

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
    onColumnSort
}: UseHeaderSceneProps) => {

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
                // Check if cell ends after the visible window starts
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
                    // Stop if cell starts after the visible window ends
                    if (cell.startIndex >= end) break
                    result.push(cell)
                }
            }
        }
        return result
    }, [cellsByLevel, visibleIndices, headerCells])

    useEffect(() => {
        if (!rootRef.current) return

        const rootContainer = rootRef.current.rootNode as CanvasAbsoluteContainer
        rootContainer.children = []

        visibleCells.forEach(cell => {
            const cellId = `cell-${cell.startIndex}-${cell.level}`

            const absoluteX = columnPositions[cell.startIndex] ?? 0
            const cellX = Math.round(absoluteX - scrollLeft)
            const cellWidth = cell.getSpanWidth(columnWidths)
            const cellY = Math.round(cell.level * headerRowHeight)
            const cellHeight = cell.rowSpan * headerRowHeight

            const cellWrapper = new CanvasAbsoluteContainer(`${cellId}-wrapper`)
            cellWrapper.rect = { x: cellX, y: cellY, width: cellWidth, height: cellHeight }
            const bgRect = new CanvasRect(`${cellId}-bg`, getHeaderColor(cell.level))
            bgRect.rect = { x: cellX, y: cellY, width: cellWidth, height: cellHeight }
            bgRect.borderColor = '#e0e0e0'
            bgRect.borderWidth = 1

            cellWrapper.addChild(bgRect)

            const normalColor = getHeaderColor(cell.level);
            const getHoverColor = (c: string) => {
                if (c === '#e3f2fd') return '#bbdefb';
                if (c === '#f5f5f5') return '#e0e0e0';
                if (c === '#fafafa') return '#eeeeee';
                if (c === '#ffffff') return '#f5f5f5';
                return c;
            };
            const hoverColor = getHoverColor(normalColor);

            cellWrapper.onMouseEnter = () => {
                bgRect.color = hoverColor;
            };
            cellWrapper.onMouseLeave = () => {
                bgRect.color = normalColor;
            };

            const column = cell.columnIndex !== undefined ? orderedColumns[cell.columnIndex] : undefined
            const renderContent = column?.getRenderColumnContent()
            let customContent: CanvasNode | undefined

            if (renderContent) {
                customContent = renderContent(
                    { x: cellX, y: cellY, width: cellWidth, height: cellHeight },
                )
            }

            const createGripIcon = (idSuffix: string) => {
                const gripIcon = new CanvasIcon(`${cellId}-${idSuffix}`, GRIP_ICON_SVG, { size: 12 })
                gripIcon.style = {
                    flexShrink: 0,
                    alignSelf: 'center',
                }

                gripIcon.onMouseEnter = () => {
                    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
                }
                gripIcon.onMouseLeave = () => {
                    if (canvasRef.current) canvasRef.current.style.cursor = 'default'
                }
                gripIcon.onMouseDown = (e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    handleDragStart(
                        e.originalEvent,
                        cell.columnIndex!,
                        cell.title,
                        cellWidth,
                        { x: cellX, y: cellY, width: cellWidth, height: cellHeight }
                    )
                }
                return gripIcon
            }

            const contentContainer = new CanvasContainer(`${cellId}-content`, {
                direction: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                columnGap: 6,
                padding: 12,
            })

            contentContainer.style = { height: cellHeight }

            contentContainer.rect = {
                x: cellX,
                y: cellY,
                width: Math.max(0, cellWidth * 2),
                height: cellHeight,
            }

            const contentContainerLeft = new CanvasContainer(`${cellId}-content`, {
                direction: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                columnGap: 6,
            })

            const contentContainerRight = new CanvasContainer(`${cellId}-content`, {
                direction: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                columnGap: 6,
            })

            if (customContent) {
                contentContainerLeft.addChild(customContent)

                if (enableColumnReorder && column && customContent instanceof CanvasContainer) {
                    const gripIcon = createGripIcon('grip-custom')
                    contentContainerLeft.addChildStart(gripIcon)
                }


                contentContainer.addChild(contentContainerLeft)
                cellWrapper.addChild(contentContainer)
            } else {
                if (enableColumnReorder && column) {
                    const gripIcon = createGripIcon('grip')
                    contentContainerLeft.addChild(gripIcon)
                }

                const text = new CanvasText(`${cellId}-text`, cell.title, {
                    color: getHeaderTextColor(cell.level),
                    font: `${getHeaderFontWeight(cell.level)} ${getHeaderFontSize(cell.level)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
                })
                text.style = { flexGrow: 1 }

                contentContainerLeft.addChild(text)

                // Add sort icon if column is sortable
                if (column && column.sortable) {
                    let icon = SORT_DEFAULT_ICON
                    if (sortColumn === column.id) {
                        if (sortDirection === 'asc') icon = SORT_ASC_ICON
                        else if (sortDirection === 'desc') icon = SORT_DESC_ICON
                    }

                    const sortButton = new CanvasIconButton(`${cellId}-sort`, icon, {
                        size: 20,
                        variant: 'secondary',
                        onClick: () => {
                            if (onColumnSort) {
                                let newDirection: 'asc' | 'desc' | undefined = 'asc'
                                if (sortColumn === column.id) {
                                    if (sortDirection === 'asc') newDirection = 'desc'
                                    else if (sortDirection === 'desc') newDirection = undefined
                                }
                                onColumnSort(column.id, newDirection)
                            }
                        }
                    })

                    sortButton.style = {
                        flexShrink: 0,
                        alignSelf: 'center',
                    }

                    contentContainerRight.addChild(sortButton)
                }

                contentContainer.addChild(contentContainerLeft)
                contentContainer.addChild(contentContainerRight)

                cellWrapper.addChild(contentContainer)
            }

            rootContainer.addChild(cellWrapper)
        })

        rootRef.current.render()

    }, [visibleCells, columnPositions, columnWidths, scrollLeft, headerRowHeight, enableColumnReorder, handleDragStart, orderedColumns, canvasRef, rootRef, sortColumn, sortDirection, onColumnSort])
}

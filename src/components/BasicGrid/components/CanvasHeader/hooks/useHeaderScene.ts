import { useEffect, useMemo, useRef, useCallback } from 'react'
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

// ─────────────────────────────────────────────────────────────────────────────
// Object Pool for Canvas Nodes
// ─────────────────────────────────────────────────────────────────────────────

interface CellNodeCache {
    wrapper: CanvasAbsoluteContainer
    contentContainer: CanvasContainer
    contentContainerLeft: CanvasContainer
    contentContainerRight: CanvasContainer
    text?: CanvasText
    gripIcon?: CanvasIcon
    sortButton?: CanvasIconButton
    customContent?: CanvasNode
}

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
    debugMode = false
}: UseHeaderSceneProps) => {

    // Object pool for reusing canvas nodes
    const nodePoolRef = useRef<Map<string, CellNodeCache>>(new Map())
    // Track which nodes are currently in use
    const activeNodesRef = useRef<Set<string>>(new Set())

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
        if (!rootRef.current) return

        const rootContainer = rootRef.current.rootNode as CanvasAbsoluteContainer
        const pool = nodePoolRef.current
        const currentActive = new Set<string>()

        // Fallback: if visibleCells is empty but headerCells exists, show all cells
        // This ensures header renders on initial mount when virtualization hasn't updated yet
        const cellsToRender = visibleCells.length > 0 
            ? visibleCells 
            : (headerCells.length > 0 ? headerCells : [])

        // Process visible cells - reuse or create nodes
        for (const cell of cellsToRender) {
            const cellId = `cell-${cell.startIndex}-${cell.level}`
            currentActive.add(cellId)

            const absoluteX = columnPositions[cell.startIndex] ?? 0
            const cellX = Math.round(absoluteX - scrollLeft)
            const cellWidth = cell.getSpanWidth(columnWidths)
            const cellY = Math.round(cell.level * headerRowHeight)
            const cellHeight = cell.rowSpan * headerRowHeight

            const normalColor = getHeaderColor(cell.level)
            const hoverColor = getHoverColor(normalColor)

            const column = cell.columnIndex !== undefined ? orderedColumns[cell.columnIndex] : undefined
            const renderContent = column?.getRenderColumnContent()

            let cached = pool.get(cellId)

            if (!cached) {
                // Create new nodes only if not in pool
                const wrapper = new CanvasAbsoluteContainer(`${cellId}-wrapper`)
                const contentContainer = new CanvasContainer(`${cellId}-content`, {
                    direction: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    columnGap: 6,
                    padding: 12,
                })
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

                cached = {
                    wrapper,
                    contentContainer,
                    contentContainerLeft,
                    contentContainerRight,
                }
                pool.set(cellId, cached)
            }

            const { wrapper, contentContainer, contentContainerLeft, contentContainerRight } = cached

            // Update wrapper properties (fast property updates)
            wrapper.rect.x = cellX
            wrapper.rect.y = cellY
            wrapper.rect.width = cellWidth
            wrapper.rect.height = cellHeight
            wrapper.backgroundColor = normalColor
            wrapper.borderColor = '#e0e0e0'
            wrapper.borderWidth = 1

            // Update hover handlers with current colors
            wrapper.onMouseEnter = () => { wrapper.backgroundColor = hoverColor }
            wrapper.onMouseLeave = () => { wrapper.backgroundColor = normalColor }

            // Update content container
            contentContainer.style.height = cellHeight
            contentContainer.style.width = cellWidth
            contentContainer.rect.x = cellX
            contentContainer.rect.y = cellY
            contentContainer.rect.width = Math.max(0, cellWidth * 2)
            contentContainer.rect.height = cellHeight

            // Clear children for rebuild (but reuse container objects)
            contentContainerLeft.children = []
            contentContainerRight.children = []
            contentContainer.children = []
            wrapper.children = []

            if (renderContent) {
                // Custom content rendering
                const customContent = renderContent(
                    { x: cellX, y: cellY, width: cellWidth, height: cellHeight }
                )
                cached.customContent = customContent

                if (customContent) {
                    contentContainerLeft.addChild(customContent)

                    if (enableColumnReorder && column && customContent instanceof CanvasContainer) {
                        if (!cached.gripIcon) {
                            cached.gripIcon = new CanvasIcon(`${cellId}-grip`, GRIP_ICON_SVG, { size: 12 })
                            cached.gripIcon.style = { flexShrink: 0, alignSelf: 'center' }
                        }
                        const handlers = createGripIconHandlers(cell.columnIndex!, cell.title, cellX, cellY, cellWidth, cellHeight)
                        cached.gripIcon.onMouseEnter = handlers.onMouseEnter
                        cached.gripIcon.onMouseLeave = handlers.onMouseLeave
                        cached.gripIcon.onMouseDown = handlers.onMouseDown
                        contentContainerLeft.addChildStart(cached.gripIcon)
                    }
                }

                contentContainer.addChild(contentContainerLeft)
                wrapper.addChild(contentContainer)
            } else {
                // Standard text content
                if (enableColumnReorder && column) {
                    if (!cached.gripIcon) {
                        cached.gripIcon = new CanvasIcon(`${cellId}-grip`, GRIP_ICON_SVG, { size: 12 })
                        cached.gripIcon.style = { flexShrink: 0, alignSelf: 'center' }
                    }
                    const handlers = createGripIconHandlers(cell.columnIndex!, cell.title, cellX, cellY, cellWidth, cellHeight)
                    cached.gripIcon.onMouseEnter = handlers.onMouseEnter
                    cached.gripIcon.onMouseLeave = handlers.onMouseLeave
                    cached.gripIcon.onMouseDown = handlers.onMouseDown
                    contentContainerLeft.addChild(cached.gripIcon)
                }

                // Reuse or create text node
                if (!cached.text) {
                    cached.text = new CanvasText(`${cellId}-text`, cell.title, {
                        color: getHeaderTextColor(cell.level),
                        font: `${getHeaderFontWeight(cell.level)} ${getHeaderFontSize(cell.level)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
                    })
                    cached.text.style = { flexGrow: 1 }
                } else {
                    // Update text if changed
                    if (cached.text.text !== cell.title) {
                        cached.text.text = cell.title
                    }
                }
                contentContainerLeft.addChild(cached.text)

                // Sort button
                if (column && column.sortable) {
                    let icon = SORT_DEFAULT_ICON
                    if (sortColumn === column.id) {
                        if (sortDirection === 'asc') icon = SORT_ASC_ICON
                        else if (sortDirection === 'desc') icon = SORT_DESC_ICON
                    }

                    if (!cached.sortButton) {
                        cached.sortButton = new CanvasIconButton(`${cellId}-sort`, icon, {
                            size: 20,
                            variant: 'secondary',
                        })
                        cached.sortButton.style = { flexShrink: 0, alignSelf: 'center' }
                    } else {
                        cached.sortButton.icon = icon
                    }

                    // Update click handler with current state
                    const currentColumn = column
                    cached.sortButton.onClick = () => {
                        if (onColumnSort) {
                            let newDirection: 'asc' | 'desc' | undefined = 'asc'
                            if (sortColumn === currentColumn.id) {
                                if (sortDirection === 'asc') newDirection = 'desc'
                                else if (sortDirection === 'desc') newDirection = undefined
                            }
                            onColumnSort(currentColumn.id, newDirection)
                        }
                    }

                    contentContainerRight.addChild(cached.sortButton)
                }

                contentContainer.addChild(contentContainerLeft)
                contentContainer.addChild(contentContainerRight)
                wrapper.addChild(contentContainer)
            }
        }

        // Update root container children efficiently
        // Always rebuild to ensure consistency (object pooling still saves allocations)
        rootContainer.children = []
        for (const cellId of currentActive) {
            const cached = pool.get(cellId)
            if (cached) {
                rootContainer.addChild(cached.wrapper)
            }
        }

        activeNodesRef.current = currentActive

        // Cleanup: remove nodes that haven't been used for a while
        // Keep pool size manageable (remove nodes not in current view)
        const maxPoolSize = currentActive.size + 20 // Keep 20 extra for buffer
        if (pool.size > maxPoolSize) {
            const toRemove: string[] = []
            for (const id of pool.keys()) {
                if (!currentActive.has(id)) {
                    toRemove.push(id)
                    if (pool.size - toRemove.length <= maxPoolSize) break
                }
            }
            for (const id of toRemove) {
                pool.delete(id)
            }
        }

        rootRef.current.render()

    }, [visibleCells, columnPositions, columnWidths, scrollLeft, headerRowHeight, enableColumnReorder, orderedColumns, canvasRef, rootRef, sortColumn, sortDirection, onColumnSort, createGripIconHandlers])
}

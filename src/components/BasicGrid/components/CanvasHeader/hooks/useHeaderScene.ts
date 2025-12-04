import { useEffect, useCallback, useRef, ReactElement } from 'react'
import { CanvasRoot } from '../core/CanvasRoot'
import { CanvasAbsoluteContainer } from '../core/CanvasAbsoluteContainer'
import { CanvasNode } from '../core/CanvasNode'
import { GridHeaderCell } from '../../../models/GridHeaderCell'
import { GridColumn } from '../../../models/GridColumn'
import { DragState } from './useHeaderDragDrop'
import { useVisibleCells } from './useVisibleCells'
import { HeaderSceneBuilder, createCustomContentGetter } from '../scene/HeaderSceneBuilder'
import type { SubscribeFn } from './useNodeRegistry'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface VisibleIndices {
    start: number
    end: number
}

export interface UseHeaderSceneProps {
    rootRef: React.MutableRefObject<CanvasRoot | null>
    canvasRef: React.RefObject<HTMLCanvasElement>
    visibleIndices: VisibleIndices | null
    headerCells: GridHeaderCell[]
    orderedColumns: GridColumn<any>[]
    columnPositions: number[]
    columnWidths: number[]
    scrollLeft: number
    headerRowHeight: number
    markerWidthValue: number
    enableColumnReorder?: boolean
    dragState: DragState | null
    handleDragStart: (
        e: MouseEvent | React.MouseEvent,
        columnIndex: number,
        title: string,
        width: number,
        rect: { x: number; y: number; width: number; height: number }
    ) => void
    sortColumn?: string
    sortDirection?: 'asc' | 'desc'
    onColumnSort?: (columnId: string, direction: 'asc' | 'desc' | undefined) => void
    debugMode?: boolean
    isVisible?: boolean
    nodeRegistry?: React.MutableRefObject<Map<string, ReactElement>>
    subscribeToRegistryChange?: SubscribeFn
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useHeaderScene({
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
    nodeRegistry,
    subscribeToRegistryChange,
}: UseHeaderSceneProps): void {
    // Scene builder instance
    const builderRef = useRef(new HeaderSceneBuilder())

    // Get visible cells using optimized hook
    const visibleCells = useVisibleCells(headerCells, visibleIndices)

    // Debug mode effect
    useEffect(() => {
        CanvasNode.DEBUG = debugMode
        rootRef.current?.render()
    }, [debugMode, rootRef])

    // Create grip icon handlers
    const createGripHandlers = useCallback((
        columnIndex: number,
        title: string,
        x: number,
        y: number,
        width: number,
        height: number
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
            handleDragStart(e.originalEvent, columnIndex, title, width, { x, y, width, height })
        }
    }), [canvasRef, handleDragStart])

    // Full scene rebuild
    const rebuildScene = useCallback(() => {
        if (!isVisible || !rootRef.current) return

        const rootContainer = rootRef.current.rootNode as CanvasAbsoluteContainer
        const builder = builderRef.current

        // Determine cells to render
        const cellsToRender = visibleCells.length > 0
            ? visibleCells
            : headerCells

        // Build scene
        const wrappers = builder.build({
            cells: cellsToRender,
            columnPositions,
            columnWidths,
            scrollLeft,
            headerRowHeight,
            orderedColumns,
            enableColumnReorder,
            sortColumn,
            sortDirection,
            onColumnSort,
            getCustomContent: createCustomContentGetter(nodeRegistry),
            createGripHandlers,
        })

        rootContainer.children = wrappers
    }, [
        columnPositions,
        columnWidths,
        createGripHandlers,
        enableColumnReorder,
        headerCells,
        headerRowHeight,
        isVisible,
        nodeRegistry,
        onColumnSort,
        orderedColumns,
        rootRef,
        scrollLeft,
        sortColumn,
        sortDirection,
        visibleCells,
    ])

    useEffect(() => {
        rebuildScene()
    }, [rebuildScene])

    // Subscribe to registry changes
    useEffect(() => {
        if (!subscribeToRegistryChange) return
        return subscribeToRegistryChange( () => {
            console.log('123')
            rebuildScene()
        })
    }, [subscribeToRegistryChange, rebuildScene])
}

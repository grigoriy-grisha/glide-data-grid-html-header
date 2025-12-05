import { useEffect, useCallback, useRef, ReactElement } from 'react'
import { CanvasRoot, CanvasAbsoluteContainer, CanvasNode } from '../../../lib/canvas'
import { GridHeaderCell } from '../../../models/GridHeaderCell'
import { GridColumn } from '../../../models/GridColumn'
import { DragState } from './useHeaderDragDrop'
import { useVisibleCells } from './useVisibleCells'
import { HeaderSceneBuilder, createCustomContentGetter } from '../scene/HeaderSceneBuilder'
import type { SubscribeFn } from './useNodeRegistry'

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
    const builderRef = useRef<HeaderSceneBuilder>()
    if (!builderRef.current) {
        builderRef.current = new HeaderSceneBuilder()
    }

    const visibleCells = useVisibleCells(headerCells, visibleIndices)

    useEffect(() => {
        CanvasNode.DEBUG = debugMode
        rootRef.current?.render()
    }, [debugMode, rootRef])

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

    const rebuildScene = useCallback(() => {
        const root = rootRef.current
        if (!isVisible || !root) return

        const rootContainer = root.rootNode as CanvasAbsoluteContainer
        const builder = builderRef.current!
        const cells = visibleCells.length > 0 ? visibleCells : headerCells

        rootContainer.children = builder.build({
            cells,
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

    useEffect(() => {
        if (!subscribeToRegistryChange) return
        return subscribeToRegistryChange(rebuildScene)
    }, [subscribeToRegistryChange, rebuildScene])
}

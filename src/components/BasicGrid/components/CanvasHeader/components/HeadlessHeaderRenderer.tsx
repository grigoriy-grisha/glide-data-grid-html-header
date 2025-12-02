import React from 'react'
import { GridHeaderCell } from '../../../models/GridHeaderCell'
import { GridColumn } from '../../../models/GridColumn'
import { RootBridge } from '../CanvasComponents'
import { CanvasNode } from '../core/CanvasNode'

interface HeadlessHeaderRendererProps {
    visibleIndices: { start: number; end: number } | null
    headerCells: GridHeaderCell[]
    orderedColumns: GridColumn<any>[]
    nodeRegistry: React.MutableRefObject<Map<string, CanvasNode>>
    requestRender?: () => void
}

export const HeadlessHeaderRenderer: React.FC<HeadlessHeaderRendererProps> = ({
    visibleIndices,
    headerCells,
    orderedColumns,
    nodeRegistry,
    requestRender
}) => {
    
    const cellsByLevel = React.useMemo(() => {
        const groups: GridHeaderCell[][] = []
        for (const cell of headerCells) {
            if (!groups[cell.level]) {
                groups[cell.level] = []
            }
            groups[cell.level].push(cell)
        }
        return groups
    }, [headerCells])

    const visibleCells = React.useMemo(() => {
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


    // If visibleCells is empty but we have headers, we might want to render something 
    // (e.g. initial load). Match useHeaderScene logic if possible.
    const cellsToRender = visibleCells.length > 0
        ? visibleCells
        : (headerCells.length > 0 ? headerCells : [])

    return (
        <>
            {cellsToRender.map((cell) => {
                const cellId = `cell-${cell.startIndex}-${cell.level}`
                const column = cell.columnIndex !== undefined ? orderedColumns[cell.columnIndex] : undefined
                const renderContent = cell.renderColumnContent ?? column?.getRenderColumnContent()

                if (!renderContent) return null

                return (
                    <RootBridge 
                        key={cellId}
                        onNodeCreated={(node) => {
                            // Register the node
                            nodeRegistry.current.set(cellId, node)
                        }}
                        requestRender={requestRender}
                    >
                        {renderContent()}
                    </RootBridge>
                )
            })}
        </>
    )
}

import React, { ReactElement } from 'react'
import { GridHeaderCell } from '../../../models/GridHeaderCell'
import { GridColumn } from '../../../models/GridColumn'
import { RootBridge } from '../CanvasComponents'
import { useVisibleCells } from '../hooks/useVisibleCells'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface HeadlessHeaderRendererProps {
    visibleIndices: { start: number; end: number } | null
    headerCells: GridHeaderCell[]
    orderedColumns: GridColumn<any>[]
    nodeRegistry: React.MutableRefObject<Map<string, ReactElement>>
    onRegistryChange?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Headless renderer that captures React component output from header cells
 * and stores the JSX in a registry for Canvas rendering.
 * 
 * This component renders nothing visible - it only executes renderColumnContent
 * functions and stores their output.
 */
export const HeadlessHeaderRenderer: React.FC<HeadlessHeaderRendererProps> = ({
    visibleIndices,
    headerCells,
    orderedColumns,
    nodeRegistry,
    onRegistryChange,
}) => {
    // Get visible cells using shared hook
    const visibleCells = useVisibleCells(headerCells, visibleIndices)

    return (
        <>
            {visibleCells.map((cell) => {
                const cellId = `cell-${cell.startIndex}-${cell.level}`
                const column = cell.columnIndex !== undefined 
                    ? orderedColumns[cell.columnIndex] 
                    : undefined
                const renderContent = cell.renderColumnContent ?? column?.getRenderColumnContent()

                if (!renderContent) return null

                return (
                    <RootBridge 
                        key={cellId}
                        cellId={cellId}
                        nodeRegistry={nodeRegistry}
                        renderContent={renderContent}
                        onRegistryChange={onRegistryChange}
                    />
                )
            })}
        </>
    )
}

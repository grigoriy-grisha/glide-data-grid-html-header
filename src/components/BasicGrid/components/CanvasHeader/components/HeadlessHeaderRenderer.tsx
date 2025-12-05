import React, { ReactElement, useMemo } from 'react'
import { RootBridge } from '../../../lib/canvas'
import { GridHeaderCell } from '../../../models/GridHeaderCell'
import { GridColumn } from '../../../models/GridColumn'
import { useVisibleCells } from '../hooks/useVisibleCells'

interface HeadlessHeaderRendererProps {
  visibleIndices: { start: number; end: number } | null
  headerCells: GridHeaderCell[]
  orderedColumns: GridColumn<any>[]
  nodeRegistry: React.MutableRefObject<Map<string, ReactElement>>
  onRegistryChange?: () => void
}

interface CellRenderData {
  cellId: string
  renderContent: () => ReactElement
}

function createCellId(startIndex: number, level: number): string {
  return `cell-${startIndex}-${level}`
}

function getRenderContent(
  cell: GridHeaderCell,
  column: GridColumn<any> | undefined
): (() => ReactElement) | null {
  return cell.renderColumnContent ?? column?.getRenderColumnContent() ?? null
}

export const HeadlessHeaderRenderer: React.FC<HeadlessHeaderRendererProps> = React.memo(({
  visibleIndices,
  headerCells,
  orderedColumns,
  nodeRegistry,
  onRegistryChange,
}) => {
  const visibleCells = useVisibleCells(headerCells, visibleIndices)

  const renderData = useMemo<CellRenderData[]>(() => {
    return visibleCells
      .map((cell) => {
        const cellId = createCellId(cell.startIndex, cell.level)
        const column = cell.columnIndex !== undefined 
          ? orderedColumns[cell.columnIndex] 
          : undefined
        const renderContent = getRenderContent(cell, column)

        if (!renderContent) {
          return null
        }

        return {
          cellId,
          renderContent,
        }
      })
      .filter((data): data is CellRenderData => data !== null)
  }, [visibleCells, orderedColumns])

  return (
    <>
      {renderData.map(({ cellId, renderContent }) => (
        <RootBridge 
          key={cellId}
          cellId={cellId}
          nodeRegistry={nodeRegistry}
          renderContent={renderContent}
          onRegistryChange={onRegistryChange}
        />
      ))}
    </>
  )
})

HeadlessHeaderRenderer.displayName = 'HeadlessHeaderRenderer'

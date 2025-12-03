import React, { memo, useEffect, useMemo, useState } from 'react'
import { CanvasRegistry } from '../canvas/CanvasRegistry'
import { useCanvasRegistry } from '../context/CanvasRegistryContext'
import { useGridVirtualization } from '../context/GridVirtualizationContext'
import { BasicGridColumn } from '../types'
import { CanvasRegistrationContext } from './CanvasHeader/CanvasComponents'
import { CanvasNode } from './CanvasHeader/core/CanvasNode'

import { GridHeaderCell } from '../models/GridHeaderCell'

interface CanvasReactLayerProps<RowType extends Record<string, unknown>> {
  columns: BasicGridColumn<RowType>[]
  rows: RowType[]
  headerCells?: GridHeaderCell[]
}

import { useRenderRequests } from '../canvas/RenderRequestRegistry'

// ... imports ...

export function CanvasReactLayer<RowType extends Record<string, unknown>>({
  columns,
  rows,
  headerCells = [],
}: CanvasReactLayerProps<RowType>) {
  // Use render requests instead of virtualization context for React lifecycle
  const requestedIds = useRenderRequests()
  const requestedIdSet = useMemo(() => new Set(requestedIds), [requestedIds])

  const { visibleIndices } = useGridVirtualization() // Keep this if needed for other logic, or remove if strictly request-driven

  // Compute visible cells based on REQUESTS (for body) and VIRTUALIZATION (for headers)
  const visibleCells = useMemo(() => {
    const cells: { col: number; row: number; column: BasicGridColumn<RowType>; dataRow: RowType; id: string, type: 'cell' | 'column', renderContent?: () => React.ReactElement }[] = []
    
    // 1. HEADERS: Use Virtualization (visibleIndices)
    const cStart = Math.max(0, visibleIndices.colStart)
    const cEnd = Math.min(columns.length, visibleIndices.colEnd)

    if (headerCells && headerCells.length > 0) {
        for (const cell of headerCells) {
             if (cell.startIndex + cell.colSpan > cStart && cell.startIndex < cEnd) {
                 if (cell.renderColumnContent) {
                     cells.push({
                         col: cell.startIndex,
                         row: -1,
                         column: columns[cell.startIndex],
                         dataRow: {} as RowType,
                         id: `header-cell-${cell.startIndex}-${cell.level}`,
                         type: 'column',
                         renderContent: cell.renderColumnContent
                     })
                 } else if (cell.columnIndex !== undefined) {
                     const col = columns[cell.columnIndex]
                     if (col && col.renderColumnContent) {
                          cells.push({
                             col: cell.startIndex,
                             row: -1,
                             column: col,
                             dataRow: {} as RowType,
                             id: `header-cell-${cell.startIndex}-${cell.level}`,
                             type: 'column',
                             renderContent: col.renderColumnContent
                         })
                     }
                 }
             }
        }
    }

    // 2. BODY CELLS: Use Requests (RenderRequestRegistry)
    const processId = (id: string) => {
        if (id.startsWith('cell-')) {
             const parts = id.split('-')
             if (parts.length === 3) {
                 const c = parseInt(parts[1], 10)
                 const r = parseInt(parts[2], 10)
                 if (c >= 0 && c < columns.length && r >= 0 && r < rows.length) {
                     const column = columns[c]
                     if (column.renderCellContent) {
                        cells.push({
                            col: c,
                            row: r,
                            column,
                            dataRow: rows[r],
                            id,
                            type: 'cell'
                        })
                     }
                 }
             }
        }
        // Header requests ignored here, handled by virtualization above
    }

    requestedIdSet.forEach(id => processId(id))
    
    return cells
  }, [requestedIdSet, visibleIndices, columns, rows, headerCells])

  return (
    <div className="canvas-react-layer">
      {visibleCells.map((cell) => (
        <CanvasCellBridge
          key={cell.id}
          id={cell.id}
          column={cell.column}
          row={cell.dataRow}
          rowIndex={cell.row}
          renderContent={cell.renderContent}
        />
      ))}
    </div>
  )
}

interface CanvasCellBridgeProps<RowType> {
  id: string
  column: BasicGridColumn<RowType>
  row: RowType
  rowIndex: number
  renderContent?: () => React.ReactElement
}

const CanvasCellBridge = memo(function CanvasCellBridge<RowType>({
  id,
  column,
  row,
  rowIndex,
  renderContent
}: CanvasCellBridgeProps<RowType>) {
  const registry = useCanvasRegistry()
  
  const registerNode = React.useCallback((node: CanvasNode) => {
    registry.register(id, node)
  }, [id, registry])

  useEffect(() => {
    return () => {
      registry.unregister(id)
    }
  }, [id, registry])

  const content = renderContent ? renderContent() : column.renderCellContent?.(row, rowIndex)

  if (!content) return null

  return (
    <CanvasRegistrationContext.Provider value={registerNode}>
      {content}
    </CanvasRegistrationContext.Provider>
  )
}) as <RowType>(props: CanvasCellBridgeProps<RowType>) => JSX.Element


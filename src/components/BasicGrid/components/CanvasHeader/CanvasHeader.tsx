import React, { useRef, useEffect, useMemo } from 'react'
import { CanvasRoot } from './core/CanvasRoot'
import { CanvasAbsoluteContainer } from './core/CanvasAbsoluteContainer'
import { CanvasContainer } from './core/CanvasContainer'
import { CanvasNode } from './core/CanvasNode'
import { CanvasText } from './primitives/CanvasText'
import { CanvasRect } from './primitives/CanvasRect'
import { getHeaderColor, getHeaderTextColor, getHeaderFontSize, getHeaderFontWeight } from '../headerConstants'
import type { GridHeaderCell } from '../../models/GridHeaderCell'
import type { GridColumn } from '../../models/GridColumn'
import { useHeaderVirtualization } from '../../context/HeaderVirtualizationContext'

interface CanvasHeaderProps {
  width: number
  height: number
  headerCells: GridHeaderCell[]
  orderedColumns: GridColumn<any>[]
  columnPositions: number[]
  columnWidths: number[]
  levelCount: number
  headerRowHeight: number
  markerWidth?: number
  showRowMarkers?: boolean
  scrollLeft?: number
  canvasHeaderRef?: React.RefObject<HTMLCanvasElement>
  handleResizeMouseDown?: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  handleResizeDoubleClick?: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  getColumnWidth?: (columnIndex: number) => number
  setColumnWidths?: (updates: Array<{ columnId: string; width: number }>) => void
  onVirtualResizeChange?: (x: number | null, columnIndex: number | null) => void
  enableColumnReorder?: boolean
  onColumnReorder?: (sourceIndex: number, targetIndex: number) => void
  dataAreaWidth?: number
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  width,
  height,
  headerCells,
  orderedColumns,
  columnPositions,
  columnWidths,
  levelCount,
  headerRowHeight,
  markerWidth = 0,
  showRowMarkers = false,
  scrollLeft = 0,
  canvasHeaderRef,
}) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = canvasHeaderRef || internalCanvasRef
  const rootRef = useRef<CanvasRoot | null>(null)
  const { visibleIndices } = useHeaderVirtualization()
  const markerWidthValue = showRowMarkers ? markerWidth : 0

  // Filter visible cells
  const visibleCells = useMemo(() => {
    if (!visibleIndices) return headerCells

    const { start, end } = visibleIndices
    return headerCells.filter(cell => {
      const cellEndIndex = cell.startIndex + cell.colSpan
      return cellEndIndex > start && cell.startIndex < end
    })
  }, [headerCells, visibleIndices])

  // Initialize CanvasRoot and handle resize
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1

    // Set initial size
    canvas.width = width * dpr
    canvas.height = height * dpr

    const rootContainer = new CanvasAbsoluteContainer('root')
    const root = new CanvasRoot(canvas, rootContainer)
    rootRef.current = root

    let rafId: number
    const loop = () => {
      root.render()
      rafId = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(rafId)
  }, []) // Run once on mount, but we need to handle updates

  // Handle size updates
  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return

    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
    }
  }, [width, height])


  // Update Tree
  useEffect(() => {
    if (!rootRef.current) return

    const rootContainer = rootRef.current.rootNode as CanvasAbsoluteContainer
    // Clear existing children
    rootContainer.children = []

    // Add visible cells
    visibleCells.forEach(cell => {
      const cellId = `cell-${cell.startIndex}-${cell.level}`

      // Calculate position
      const absoluteX = columnPositions[cell.startIndex] ?? 0
      const cellX = absoluteX - scrollLeft
      const cellWidth = cell.getSpanWidth(columnWidths)
      const cellY = cell.level * headerRowHeight
      const cellHeight = cell.rowSpan * headerRowHeight

      // Cell Wrapper (Absolute)
      const cellWrapper = new CanvasAbsoluteContainer(`${cellId}-wrapper`)
      cellWrapper.rect = { x: cellX, y: cellY, width: cellWidth, height: cellHeight }
      // Background
      const bgRect = new CanvasRect(`${cellId}-bg`, getHeaderColor(cell.level))
      bgRect.rect = { x: cellX, y: cellY, width: cellWidth, height: cellHeight }
      bgRect.borderColor = '#e0e0e0'
      bgRect.borderWidth = 1

      cellWrapper.addChild(bgRect)

      // Hover logic
      const normalColor = getHeaderColor(cell.level);
      // Simple hover color logic based on CanvasShapes.ts
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

      // Custom Content or Default
      const column = cell.columnIndex !== undefined ? orderedColumns[cell.columnIndex] : undefined
      const renderContent = column?.getRenderColumnContent()
      let customContent: CanvasNode | undefined

      if (renderContent) {
        // Try to get custom content
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) {
          const result = renderContent(
            ctx,
            { x: cellX, y: cellY, width: cellWidth, height: cellHeight },
            null,
            undefined
          )
          if (result instanceof CanvasNode) {
            customContent = result
          }
        }
      }

      if (customContent) {
        cellWrapper.addChild(customContent)
      } else {
        // Content Container (Flex)
        const contentContainer = new CanvasContainer(`${cellId}-content`, {
          direction: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        })
        // Position content container with padding
        const padding = 8
        contentContainer.rect = {
          x: cellX + padding,
          y: cellY,
          width: Math.max(0, cellWidth - padding * 2),
          height: cellHeight,
        }

        const text = new CanvasText(`${cellId}-text`, cell.title)
        text.color = getHeaderTextColor(cell.level)
        text.font = `${getHeaderFontWeight(cell.level)} ${getHeaderFontSize(cell.level)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

        contentContainer.addChild(text)
        cellWrapper.addChild(contentContainer)
      }

      rootContainer.addChild(cellWrapper)
    })

  }, [visibleCells, columnPositions, columnWidths, scrollLeft, headerRowHeight, markerWidthValue])

  return (
    <div
      style={{
        display: 'flex',
        width: `${width + markerWidthValue}px`,
        height: `${height}px`,
      }}
    >
      {showRowMarkers && (
        <div
          style={{
            width: `${markerWidthValue + 1}px`,
            height: `${height}px`,
            backgroundColor: '#f3f6fc',
            borderRight: '1px solid #e0e0e0',
            flexShrink: 0,
          }}
        />
      )}
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: `${width}px`,
            height: `${height}px`,
          }}
        />
      </div>
    </div>
  )
}

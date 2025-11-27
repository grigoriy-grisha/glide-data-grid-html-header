import React, { useRef, useEffect, useMemo, useState } from 'react'
import { CanvasRoot } from './core/CanvasRoot'
import { CanvasAbsoluteContainer } from './core/CanvasAbsoluteContainer'
import { CanvasContainer } from './core/CanvasContainer'
import { CanvasNode } from './core/CanvasNode'
import { CanvasIcon } from './primitives/CanvasIcon'
import { CanvasText } from './primitives/CanvasText'
import { CanvasRect } from './primitives/CanvasRect'
import { getHeaderColor, getHeaderTextColor, getHeaderFontSize, getHeaderFontWeight } from '../headerConstants'
import { SELECTION_COLUMN_ID } from '../../constants'
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
  headerRowHeight,
  markerWidth = 0,
  showRowMarkers = false,
  scrollLeft = 0,
  canvasHeaderRef,
  handleResizeMouseDown,
  handleResizeDoubleClick,
  enableColumnReorder,
  onColumnReorder,
}) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = canvasHeaderRef || internalCanvasRef
  const rootRef = useRef<CanvasRoot | null>(null)
  const { visibleIndices } = useHeaderVirtualization()
  const markerWidthValue = showRowMarkers ? markerWidth : 0

  const [dragState, setDragState] = useState<{
    sourceIndex: number
    columnTitle: string
    columnWidth: number
    startX: number
    initialLeft: number
  } | null>(null)

  // Ref for ghost element to avoid re-renders
  const ghostRef = useRef<HTMLDivElement>(null)
  const dropIndicatorRef = useRef<HTMLDivElement>(null)

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

    const GRIP_ICON_SVG = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4C5 4.55228 4.55228 5 4 5C3.44772 5 3 4.55228 3 4C3 3.44772 3.44772 3 4 3C4.55228 3 5 3.44772 5 4Z" fill="currentColor" fill-opacity="0.4"/><path d="M5 8C5 8.55228 4.55228 9 4 9C3.44772 9 3 8.55228 3 8C3 7.44772 3.44772 7 4 7C4.55228 7 5 7.44772 5 8Z" fill="currentColor" fill-opacity="0.4"/><path d="M5 12C5 12.5523 4.55228 13 4 13C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11C4.55228 11 5 11.4477 5 12Z" fill="currentColor" fill-opacity="0.4"/><path d="M11 4C11 4.55228 10.5523 5 10 5C9.44772 5 9 4.55228 9 4C9 3.44772 9.44772 3 10 3C10.5523 3 11 3.44772 11 4Z" fill="currentColor" fill-opacity="0.4"/><path d="M11 8C11 8.55228 10.5523 9 10 9C9.44772 9 9 8.55228 9 8C9 7.44772 9.44772 7 10 7C10.5523 7 11 7.44772 11 8Z" fill="currentColor" fill-opacity="0.4"/><path d="M11 12C11 12.5523 10.5523 13 10 13C9.44772 13 9 12.5523 9 12C9 11.4477 9.44772 11 10 11C10.5523 11 11 11.4477 11 12Z" fill="currentColor" fill-opacity="0.4"/></svg>`

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
        // Если есть customContent и разрешен реародер, мы должны попробовать добавить gripIcon внутрь customContent.
        // Это возможно только если customContent является CanvasContainer, так как CanvasLeaf не имеет детей.
        // Если это Leaf, то мы не можем добавить иконку (или должны обернуть его).
        // Для простоты: если это Container, добавляем первым элементом.

        if (enableColumnReorder && column && customContent instanceof CanvasContainer) {
            const gripIcon = new CanvasIcon(`${cellId}-grip-custom`, GRIP_ICON_SVG, { size: 12 })
            gripIcon.style = {
                flexShrink: 0,
                alignSelf: 'center',
                // Add some margin right
                marginRight: 4,
            }
            
            // Drag Logic (duplicate from below, maybe extract to helper)
            gripIcon.onMouseEnter = () => {
                if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
            }
            gripIcon.onMouseLeave = () => {
                if (canvasRef.current) canvasRef.current.style.cursor = 'default'
            }
            gripIcon.onMouseDown = (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (e.originalEvent.button !== 0) return

                const initialLeft = (columnPositions[cell.columnIndex!] ?? 0) - scrollLeft
                
                setDragState({
                    sourceIndex: cell.columnIndex!,
                    columnTitle: cell.title,
                    columnWidth: cellWidth,
                    startX: e.originalEvent.clientX,
                    initialLeft
                })
            }

            // Вставляем в начало
            customContent.children.unshift(gripIcon);
            // Need to set parent manually because unshift array doesn't do it (addChild does)
            gripIcon.parent = customContent;
        }

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

        // Drag Grip Icon
        if (enableColumnReorder && column) {
            const gripIcon = new CanvasIcon(`${cellId}-grip`, GRIP_ICON_SVG, { size: 12 })
            gripIcon.style = {
                flexShrink: 0,
                alignSelf: 'center',
            }
            // Add right margin manually since Flex implementation is minimal
            // Using an empty container as spacer
            const spacer = new CanvasRect(`${cellId}-spacer`, 'transparent')
            spacer.rect = { x: 0, y: 0, width: 4, height: 1 }
            spacer.style = { width: 4, height: 1, flexShrink: 0 }

            gripIcon.onMouseEnter = () => {
                if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
            }
            gripIcon.onMouseLeave = () => {
                if (canvasRef.current) canvasRef.current.style.cursor = 'default'
            }
            gripIcon.onMouseDown = (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (e.originalEvent.button !== 0) return

                const initialLeft = (columnPositions[cell.columnIndex!] ?? 0) - scrollLeft
                
                setDragState({
                    sourceIndex: cell.columnIndex!,
                    columnTitle: cell.title,
                    columnWidth: cellWidth,
                    startX: e.originalEvent.clientX,
                    initialLeft
                })
            }

            contentContainer.addChild(gripIcon)
            contentContainer.addChild(spacer)
        }

        const text = new CanvasText(`${cellId}-text`, cell.title)
        text.color = getHeaderTextColor(cell.level)
        text.font = `${getHeaderFontWeight(cell.level)} ${getHeaderFontSize(cell.level)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

        contentContainer.addChild(text)
        cellWrapper.addChild(contentContainer)
      }

      rootContainer.addChild(cellWrapper)
    })

  }, [visibleCells, columnPositions, columnWidths, scrollLeft, headerRowHeight, markerWidthValue, enableColumnReorder, dragState])

  // Global Drag Events
  useEffect(() => {
    if (!dragState) return

    const handleMouseMove = (e: MouseEvent) => {
        if (!ghostRef.current) return

        const deltaX = e.clientX - dragState.startX
        ghostRef.current.style.transform = `translateX(${dragState.initialLeft + deltaX}px)`

        // Calculate Drop Position
        const headerRect = canvasRef.current?.getBoundingClientRect()
        if (!headerRect) return

        const relativeX = e.clientX - headerRect.left + scrollLeft
        
        // Find target index
        let targetIndex = orderedColumns.length
        for(let i = 0; i < orderedColumns.length; i++) {
            const pos = columnPositions[i] ?? 0
            const width = columnWidths[i] ?? 0
            const center = pos + width / 2
            if (relativeX < center) {
                targetIndex = i
                break
            }
        }

        // Update Drop Indicator
        if (dropIndicatorRef.current) {
             // Calculate indicator position
             let indicatorX = 0
             if (targetIndex < orderedColumns.length) {
                 indicatorX = (columnPositions[targetIndex] ?? 0) - scrollLeft
             } else {
                 const lastIndex = orderedColumns.length - 1
                 indicatorX = (columnPositions[lastIndex] ?? 0) + (columnWidths[lastIndex] ?? 0) - scrollLeft
             }
             
             dropIndicatorRef.current.style.transform = `translateX(${indicatorX}px)`
             dropIndicatorRef.current.dataset.targetIndex = String(targetIndex)
        }
    }

    const handleMouseUp = (e: MouseEvent) => {
        if (dropIndicatorRef.current) {
            const targetIndexStr = dropIndicatorRef.current.dataset.targetIndex
            if (targetIndexStr) {
                const targetIndex = parseInt(targetIndexStr, 10)
                if (!isNaN(targetIndex) && targetIndex !== dragState.sourceIndex && targetIndex !== dragState.sourceIndex + 1) {
                     // Normalize target index: 
                     // If dragging left to right, targetIndex might be sourceIndex + 1 (no change)
                     // logic usually is: move item at sourceIndex to targetIndex.
                     onColumnReorder?.(dragState.sourceIndex, targetIndex)
                }
            }
        }

        setDragState(null)
        if (canvasRef.current) canvasRef.current.style.cursor = 'default'
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, columnPositions, columnWidths, scrollLeft, orderedColumns, onColumnReorder])

  // Resize Handles (HTML Overlay)
  const resizeHandles = useMemo(() => {
    if (!handleResizeMouseDown || !visibleIndices) return null

    const { start, end } = visibleIndices
    // Buffer handles slightly to ensure edges are reachable
    const buffer = 2
    const safeStart = Math.max(0, start - buffer)
    const safeEnd = Math.min(orderedColumns.length, end + buffer)

    const handles: React.ReactNode[] = []
    
    for (let i = safeStart; i < safeEnd; i++) {
      const col = orderedColumns[i]
      if (col.id === SELECTION_COLUMN_ID) continue

      const colWidth = columnWidths[i] ?? col.baseWidth ?? 0
      const x = (columnPositions[i] ?? 0) + colWidth
      const relativeX = x - scrollLeft
      
      // Only show handle if it's within the visible area (roughly)
      // Although overflow hidden on parent handles clipping, we optimize.
      if (relativeX < -10 || relativeX > width + 10) continue;

      handles.push(
        <div
          key={`resize-${col.id}`}
          className="basic-grid-resize-handle"
          style={{
            position: 'absolute',
            left: `${relativeX - 5}px`,
            top: 0,
            bottom: 0,
            width: '10px',
            cursor: 'col-resize',
            zIndex: 10,
            // touchAction: 'none', // might be needed for touch
          }}
          onMouseDown={(e) => {
             // Prevent default to avoid text selection etc, though hook handles some.
             handleResizeMouseDown(e, i, 1)
          }}
          onDoubleClick={(e) => {
             handleResizeDoubleClick?.(e, i, 1)
          }}
        />
      )
    }
    return handles
  }, [visibleIndices, orderedColumns, columnPositions, columnWidths, scrollLeft, width, handleResizeMouseDown, handleResizeDoubleClick])

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
        {resizeHandles}
        
        {/* Drag Overlays */}
        {dragState && (
            <>
                {/* Drop Indicator */}
                <div
                    ref={dropIndicatorRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: 2,
                        backgroundColor: '#1e88e5',
                        zIndex: 100,
                        pointerEvents: 'none',
                        willChange: 'transform'
                    }}
                />
                {/* Ghost Element */}
                <div
                    ref={ghostRef}
                    style={{
                        position: 'absolute',
                        top: 4, // padding
                        left: 0, // controlled by transform
                        width: dragState.columnWidth,
                        height: height - 8, // padding
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #1e88e5',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        zIndex: 101,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 8,
                        borderRadius: 4,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '13px',
                        color: '#1e88e5',
                        fontWeight: 600,
                        transform: `translateX(${dragState.initialLeft}px)`,
                        willChange: 'transform'
                    }}
                >
                    {dragState.columnTitle}
                </div>
            </>
        )}
      </div>
    </div>
  )
}

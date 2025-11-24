import React, { useRef, useLayoutEffect, useState, useCallback } from 'react'

import type { GridHeaderCell } from '../models/GridHeaderCell'
import type { GridColumn } from '../models/GridColumn'
import type { SortDirection } from '../types'
import { SELECTION_COLUMN_ID } from '../constants'

type SortState = { columnId: string; direction: SortDirection } | null

interface SelectedBounds {
  start: number
  end: number
}

export type HeaderIcon = string | HTMLImageElement | (() => string | HTMLImageElement)

export interface HeaderCellCustomization {
  icon?: HeaderIcon
  iconPosition?: 'left' | 'right'
  iconSize?: number
  hoverBackground?: string
  hoverTextColor?: string
  customRender?: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, isHovered: boolean) => void
}

interface GridHeaderCanvasProps<RowType extends Record<string, unknown>> {
  columnPositions: number[]
  columnWidths: number[]
  headerCells: GridHeaderCell[]
  orderedColumns: GridColumn<RowType>[]
  levelCount: number
  headerRowHeight: number
  markerWidth: number
  showRowMarkers: boolean
  dataViewportWidth: number
  dataAreaWidth: number
  viewportWidth: number
  scrollbarReserve: number
  headerInnerRef: React.RefObject<HTMLDivElement>
  selectRange: (startIndex: number, span: number) => void
  selectedBounds: SelectedBounds | null
  handleColumnSort: (columnIndex: number) => void
  sortState: SortState
  enableColumnReorder: boolean
  handleHeaderDragStart: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number) => void
  registerHeaderCell: (columnIndex: number, element: HTMLElement | null) => void
  handleResizeMouseDown: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  handleResizeDoubleClick: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  isAllRowsSelected: boolean
  handleSelectAllChange: (checked: boolean) => void
  selectAllCheckboxRef: React.RefObject<HTMLInputElement>
  visibleIndices?: { start: number; end: number }
  // Кастомизация
  headerColors?: string[]
  headerTextColors?: string[]
  headerFontSizes?: number[]
  cellCustomizations?: Map<string, HeaderCellCustomization>
  onCellHover?: (cellIndex: number, isHovered: boolean) => void
}

const DEFAULT_HEADER_COLORS = ['#f8f9fa', '#ffffff', '#fafafa', '#f5f5f5']
const DEFAULT_HEADER_TEXT_COLORS = ['#212529', '#212529', '#495057', '#6c757d']
const DEFAULT_HEADER_FONT_SIZES = [14, 13, 12, 11]

// Кэш для иконок
const iconCache = new Map<string, HTMLImageElement>()

function createSVGDataURL(svgString: string, color?: string): string {
  let processed = svgString
  if (color) {
    processed = processed.replace(/fill="[^"]*"/g, `fill="${color}"`)
    processed = processed.replace(/stroke="[^"]*"/g, `stroke="${color}"`)
  }
  const encoded = encodeURIComponent(processed)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

function getIconImage(icon: HeaderIcon, color?: string): HTMLImageElement | null {
  if (!icon) return null

  if (typeof icon === 'function') {
    icon = icon()
  }

  if (typeof icon === 'string') {
    let dataURL: string

    if (!icon.startsWith('data:') && !icon.startsWith('http')) {
      dataURL = createSVGDataURL(icon, color)
    } else {
      dataURL = icon
    }

    if (iconCache.has(dataURL)) {
      const cached = iconCache.get(dataURL)!
      if (cached.complete && cached.naturalHeight !== 0) {
        return cached
      }
    }

    const img = new Image()
    img.src = dataURL
    iconCache.set(dataURL, img)

    if (img.complete && img.naturalHeight !== 0) {
      return img
    }

    return null
  } else if (icon instanceof HTMLImageElement) {
    if (icon.complete && icon.naturalHeight !== 0) {
      return icon
    }
  }

  return null
}

function drawCheckbox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  checked: boolean,
  indeterminate: boolean
): void {
  const padding = 2
  const boxX = x + padding
  const boxY = y + padding
  const boxSize = size - padding * 2
  const radius = 5

  // Background
  ctx.fillStyle = checked || indeterminate ? '#1e88e5' : '#eef4ff'
  ctx.strokeStyle = checked || indeterminate ? '#1e88e5' : '#90c2ff'
  ctx.lineWidth = 1
  ctx.beginPath()
  
  // Use roundRect if available, otherwise draw manually
  if (ctx.roundRect) {
    ctx.roundRect(boxX, boxY, boxSize, boxSize, radius)
  } else {
    // Fallback for older browsers
    ctx.moveTo(boxX + radius, boxY)
    ctx.lineTo(boxX + boxSize - radius, boxY)
    ctx.quadraticCurveTo(boxX + boxSize, boxY, boxX + boxSize, boxY + radius)
    ctx.lineTo(boxX + boxSize, boxY + boxSize - radius)
    ctx.quadraticCurveTo(boxX + boxSize, boxY + boxSize, boxX + boxSize - radius, boxY + boxSize)
    ctx.lineTo(boxX + radius, boxY + boxSize)
    ctx.quadraticCurveTo(boxX, boxY + boxSize, boxX, boxY + boxSize - radius)
    ctx.lineTo(boxX, boxY + radius)
    ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY)
    ctx.closePath()
  }
  
  ctx.fill()
  ctx.stroke()

  // Checkmark or indeterminate
  if (checked) {
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(boxX + boxSize * 0.25, boxY + boxSize * 0.5)
    ctx.lineTo(boxX + boxSize * 0.4, boxY + boxSize * 0.65)
    ctx.lineTo(boxX + boxSize * 0.75, boxY + boxSize * 0.3)
    ctx.stroke()
  } else if (indeterminate) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(boxX + boxSize * 0.25, boxY + boxSize * 0.5 - 1, boxSize * 0.5, 2)
  }
}

export const GridHeaderCanvas = React.memo(function GridHeaderCanvas<RowType extends Record<string, unknown>>({
  columnPositions,
  columnWidths,
  headerCells,
  orderedColumns,
  levelCount,
  headerRowHeight,
  markerWidth,
  showRowMarkers,
  dataViewportWidth,
  dataAreaWidth,
  viewportWidth,
  scrollbarReserve,
  headerInnerRef,
  selectRange,
  selectedBounds,
  handleColumnSort,
  sortState,
  enableColumnReorder: _enableColumnReorder,
  handleHeaderDragStart: _handleHeaderDragStart,
  registerHeaderCell: _registerHeaderCell,
  handleResizeMouseDown,
  handleResizeDoubleClick,
  isAllRowsSelected,
  handleSelectAllChange,
  selectAllCheckboxRef: _selectAllCheckboxRef,
  visibleIndices,
  headerColors = DEFAULT_HEADER_COLORS,
  headerTextColors = DEFAULT_HEADER_TEXT_COLORS,
  headerFontSizes = DEFAULT_HEADER_FONT_SIZES,
  cellCustomizations,
  onCellHover,
}: GridHeaderCanvasProps<RowType>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hoveredCellRef = useRef<number | null>(null)
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null)
  const [hasPartialRowSelection] = useState(false)

  if (columnPositions.length === 0 || levelCount === 0 || headerCells.length === 0) {
    return null
  }

  const headerHeight = levelCount * headerRowHeight

  // Filter cells based on visibility
  const visibleCells = React.useMemo(() => {
    if (!visibleIndices) return headerCells

    return headerCells.filter(cell => {
      const cellEndIndex = cell.startIndex + cell.colSpan
      return cellEndIndex > visibleIndices.start && cell.startIndex < visibleIndices.end
    })
  }, [headerCells, visibleIndices])

  // Initialize canvas size
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = dataAreaWidth
    canvas.height = headerHeight
  }, [dataAreaWidth, headerHeight])

  // Draw canvas
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw levels (background lines) - horizontal borders between levels
    for (let levelIndex = 0; levelIndex < levelCount; levelIndex++) {
      const y = (levelIndex + 1) * headerRowHeight
      ctx.strokeStyle = '#d0d0d0'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, y - 0.5)
      ctx.lineTo(canvas.width, y - 0.5)
      ctx.stroke()
    }

    // Draw cells
    visibleCells.forEach((cell, cellIndex) => {
      const startX = columnPositions[cell.startIndex] ?? 0
      const totalWidth = cell.getSpanWidth(columnWidths)
      const bgColor = headerColors[cell.level] ?? headerColors[headerColors.length - 1]
      const textColor = headerTextColors[cell.level] ?? headerTextColors[headerTextColors.length - 1]
      const fontSize = headerFontSizes[cell.level] ?? headerFontSizes[headerFontSizes.length - 1]
      const fontWeight = cell.level <= 1 ? 'bold' : 'normal'

      const columnIndex = cell.columnIndex
      const resolvedColumnIndex = columnIndex ?? -1
      const targetColumn = resolvedColumnIndex >= 0 ? orderedColumns[resolvedColumnIndex] : undefined
      const isSelectionColumn = targetColumn?.id === SELECTION_COLUMN_ID
      const isSelectable = cell.colSpan > 0 && !isSelectionColumn
      const isCellSelected =
        isSelectable &&
        selectedBounds != null &&
        cell.startIndex >= selectedBounds.start &&
        cell.startIndex + cell.colSpan - 1 <= selectedBounds.end

      const isLeafColumn = cell.isLeaf && targetColumn != null
      const isSorted = isLeafColumn && sortState && targetColumn?.id === sortState.columnId
      const isHovered = hoveredCellIndex === cellIndex && isSelectable

      // Get customization
      const customization = targetColumn?.id ? cellCustomizations?.get(targetColumn.id) : undefined

      // Draw cell background
      ctx.fillStyle = bgColor
      ctx.fillRect(startX, cell.level * headerRowHeight, totalWidth, cell.rowSpan * headerRowHeight)

      // Draw hover effect
      if (isHovered) {
        const hoverBg = customization?.hoverBackground || 'rgba(21, 101, 192, 0.08)'
        ctx.fillStyle = hoverBg
        ctx.fillRect(startX, cell.level * headerRowHeight, totalWidth, cell.rowSpan * headerRowHeight)
      }

      // Draw selection outline
      if (isCellSelected) {
        ctx.strokeStyle = '#1e88e5'
        ctx.lineWidth = 2
        ctx.strokeRect(startX + 1, cell.level * headerRowHeight + 1, totalWidth - 2, cell.rowSpan * headerRowHeight - 2)
      }

      // Draw sort indicator line
      if (isSorted && isLeafColumn) {
        ctx.fillStyle = '#1565c0'
        const indicatorY = (cell.level + cell.rowSpan) * headerRowHeight - 3
        ctx.fillRect(startX, indicatorY, totalWidth, 3)
      }

      // Draw borders
      ctx.strokeStyle = '#d0d0d0'
      ctx.lineWidth = 1
      
      // Right border
      ctx.beginPath()
      ctx.moveTo(startX + totalWidth - 0.5, cell.level * headerRowHeight)
      ctx.lineTo(startX + totalWidth - 0.5, (cell.level + cell.rowSpan) * headerRowHeight)
      ctx.stroke()
      
      // Left border for first cell
      if (cell.startIndex === 0 || columnPositions[cell.startIndex - 1] === undefined) {
        ctx.beginPath()
        ctx.moveTo(startX + 0.5, cell.level * headerRowHeight)
        ctx.lineTo(startX + 0.5, (cell.level + cell.rowSpan) * headerRowHeight)
        ctx.stroke()
      }

      const cellTop = cell.level * headerRowHeight
      const cellHeight = cell.rowSpan * headerRowHeight
      const cellCenterY = cellTop + cellHeight / 2
      const padding = 8

      // Draw selection checkbox
      if (isSelectionColumn) {
        const checkboxSize = 18
        const checkboxX = startX + (totalWidth - checkboxSize) / 2
        const checkboxY = cellCenterY - checkboxSize / 2
        drawCheckbox(ctx, checkboxX, checkboxY, checkboxSize, isAllRowsSelected, hasPartialRowSelection)
      } else {
        // Draw icon and text
        let textX = startX + padding
        const textY = cellCenterY
        const iconSize = customization?.iconSize || 16
        const iconPosition = customization?.iconPosition || 'left'

        // Draw icon
        if (customization?.icon) {
          const iconImg = getIconImage(customization.icon)
          if (iconImg) {
            const iconY = cellCenterY - iconSize / 2
            
            if (iconPosition === 'left') {
              ctx.drawImage(iconImg, textX, iconY, iconSize, iconSize)
              textX += iconSize + 6
            } else {
              // Right position - will draw after text
            }
          }
        }

        // Draw text
        if (!cell.content && cell.title) {
          const finalTextColor = isHovered && customization?.hoverTextColor 
            ? customization.hoverTextColor 
            : textColor || '#212529'
          
          ctx.fillStyle = finalTextColor
          ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
          ctx.textAlign = iconPosition === 'right' ? 'right' : 'left'
          ctx.textBaseline = 'middle'
          
          const maxTextWidth = totalWidth - padding * 2 - (customization?.icon ? iconSize + 6 : 0)
          let displayText = cell.title
          const textMetrics = ctx.measureText(displayText)
          
          if (textMetrics.width > maxTextWidth) {
            // Truncate text
            while (ctx.measureText(displayText + '...').width > maxTextWidth && displayText.length > 0) {
              displayText = displayText.slice(0, -1)
            }
            displayText += '...'
          }
          
          const finalTextX = iconPosition === 'right' ? startX + totalWidth - padding : textX
          ctx.fillText(displayText, finalTextX, textY)

          // Draw icon on right if needed
          if (iconPosition === 'right' && customization?.icon) {
            const iconImg = getIconImage(customization.icon)
            if (iconImg) {
              const iconX = startX + totalWidth - padding - iconSize
              const iconY = cellCenterY - iconSize / 2
              ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)
            }
          }
        }

        // Draw sort indicator
        if (isSorted) {
          ctx.fillStyle = '#1565c0'
          ctx.font = `bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const sortX = startX + totalWidth - 16
          const sortY = cellCenterY
          ctx.fillText(sortState?.direction === 'asc' ? '▲' : '▼', sortX, sortY)
        }

        // Custom render
        if (customization?.customRender) {
          customization.customRender(ctx, startX, cellTop, totalWidth, cellHeight, isHovered)
        }
      }
    })
  }, [
    visibleCells,
    columnPositions,
    columnWidths,
    levelCount,
    headerRowHeight,
    headerHeight,
    dataAreaWidth,
    headerColors,
    headerTextColors,
    headerFontSizes,
    orderedColumns,
    selectedBounds,
    sortState,
    hoveredCellIndex,
    isAllRowsSelected,
    hasPartialRowSelection,
    cellCustomizations,
  ])

  // Handle mouse events
  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Find hovered cell
      let newHoveredCellIndex: number | null = null
      let hoveredResizeHandle: { columnIndex: number; span: number } | null = null
      
      for (let i = 0; i < visibleCells.length; i++) {
        const cell = visibleCells[i]
        const startX = columnPositions[cell.startIndex] ?? 0
        const totalWidth = cell.getSpanWidth(columnWidths)
        const cellTop = cell.level * headerRowHeight
        const cellBottom = cellTop + cell.rowSpan * headerRowHeight

        if (x >= startX && x <= startX + totalWidth && y >= cellTop && y <= cellBottom) {
          // Check if hovering over resize handle
          const resizeHandleWidth = 4
          if (cell.isLeaf && x >= startX + totalWidth - resizeHandleWidth) {
            const columnIndex = cell.columnIndex ?? -1
            if (columnIndex >= 0) {
              hoveredResizeHandle = { columnIndex, span: cell.colSpan }
            }
          }
          
          newHoveredCellIndex = i
          break
        }
      }

      // Update hover state
      if (newHoveredCellIndex !== hoveredCellRef.current) {
        if (hoveredCellRef.current !== null && onCellHover) {
          onCellHover(hoveredCellRef.current, false)
        }
        if (newHoveredCellIndex !== null && onCellHover) {
          onCellHover(newHoveredCellIndex, true)
        }
        hoveredCellRef.current = newHoveredCellIndex
        setHoveredCellIndex(newHoveredCellIndex)
      }

      // Update cursor
      if (hoveredResizeHandle) {
        canvas.style.cursor = 'col-resize'
      } else if (newHoveredCellIndex !== null) {
        const cell = visibleCells[newHoveredCellIndex]
        const columnIndex = cell.columnIndex ?? -1
        const targetColumn = columnIndex >= 0 ? orderedColumns[columnIndex] : undefined
        const isSelectionColumn = targetColumn?.id === SELECTION_COLUMN_ID
        const isSelectable = cell.colSpan > 0 && !isSelectionColumn
        canvas.style.cursor = isSelectable ? 'pointer' : 'default'
      } else {
        canvas.style.cursor = 'default'
      }
    },
    [visibleCells, columnPositions, columnWidths, headerRowHeight, orderedColumns, onCellHover]
  )

  const handleCanvasMouseLeave = useCallback(() => {
    if (hoveredCellRef.current !== null && onCellHover) {
      onCellHover(hoveredCellRef.current, false)
    }
    hoveredCellRef.current = null
    setHoveredCellIndex(null)
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.cursor = 'default'
    }
  }, [onCellHover])

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Find clicked cell
      for (const cell of visibleCells) {
        const startX = columnPositions[cell.startIndex] ?? 0
        const totalWidth = cell.getSpanWidth(columnWidths)
        const cellTop = cell.level * headerRowHeight
        const cellBottom = cellTop + cell.rowSpan * headerRowHeight

        if (x >= startX && x <= startX + totalWidth && y >= cellTop && y <= cellBottom) {
          const columnIndex = cell.columnIndex
          const resolvedColumnIndex = columnIndex ?? -1
          const targetColumn = resolvedColumnIndex >= 0 ? orderedColumns[resolvedColumnIndex] : undefined
          const isSelectionColumn = targetColumn?.id === SELECTION_COLUMN_ID

          // Check if click is on resize handle
          const resizeHandleWidth = 4
          if (cell.isLeaf && x >= startX + totalWidth - resizeHandleWidth) {
            const resizeStartIndex = cell.isLeaf ? resolvedColumnIndex : cell.startIndex
            const resizeSpan = Math.max(1, cell.colSpan)
            if (resizeStartIndex >= 0) {
              // Create synthetic event for resize
              const syntheticEvent = {
                ...event,
                currentTarget: event.currentTarget as unknown as HTMLDivElement,
                stopPropagation: () => {},
                preventDefault: () => {},
              } as unknown as React.MouseEvent<HTMLDivElement>
              handleResizeMouseDown(syntheticEvent, resizeStartIndex, resizeSpan)
            }
            return
          }

          // Check if click is on checkbox
          if (isSelectionColumn) {
            handleSelectAllChange(!isAllRowsSelected)
            return
          }

          const isSelectable = cell.colSpan > 0 && !isSelectionColumn
          if (isSelectable) {
            selectRange(cell.startIndex, cell.colSpan)
            const isLeafColumn = cell.isLeaf && targetColumn != null
            const isSortable = isLeafColumn && targetColumn?.sortable !== false && !isSelectionColumn
            if (isSortable && columnIndex != null) {
              handleColumnSort(columnIndex)
            }
          }
          break
        }
      }
    },
    [visibleCells, columnPositions, columnWidths, headerRowHeight, orderedColumns, selectRange, handleColumnSort, isAllRowsSelected, handleSelectAllChange, handleResizeMouseDown]
  )

  const handleCanvasDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Find double-clicked cell for resize
      for (const cell of visibleCells) {
        const startX = columnPositions[cell.startIndex] ?? 0
        const totalWidth = cell.getSpanWidth(columnWidths)
        const cellTop = cell.level * headerRowHeight
        const cellBottom = cellTop + cell.rowSpan * headerRowHeight

        if (x >= startX && x <= startX + totalWidth && y >= cellTop && y <= cellBottom) {
          const resizeHandleWidth = 4
          if (cell.isLeaf && x >= startX + totalWidth - resizeHandleWidth) {
            const columnIndex = cell.columnIndex ?? -1
            const resizeStartIndex = cell.isLeaf ? columnIndex : cell.startIndex
            const resizeSpan = Math.max(1, cell.colSpan)
            if (resizeStartIndex >= 0) {
              const syntheticEvent = {
                ...event,
                currentTarget: event.currentTarget as unknown as HTMLDivElement,
                stopPropagation: () => {},
                preventDefault: () => {},
              } as unknown as React.MouseEvent<HTMLDivElement>
              handleResizeDoubleClick(syntheticEvent, resizeStartIndex, resizeSpan)
            }
            break
          }
        }
      }
    },
    [visibleCells, columnPositions, columnWidths, headerRowHeight, handleResizeDoubleClick]
  )

  return (
    <div
      className="basic-grid-html-header"
      style={{
        width: `${viewportWidth}px`,
        paddingRight: `${scrollbarReserve}px`,
        boxSizing: 'border-box',
      }}
    >
      {showRowMarkers && (
        <div className="basic-grid-header-row-marker" style={{ width: `${markerWidth}px` }} />
      )}
      <div
        className="basic-grid-header-content"
        style={{
          width: `${dataViewportWidth}px`,
          paddingRight: `${scrollbarReserve}px`,
          boxSizing: 'border-box',
        }}
      >
        <div
          className="basic-grid-header-content-inner"
          ref={headerInnerRef}
          style={{
            width: `${dataAreaWidth}px`,
            height: `${headerHeight}px`,
            willChange: 'transform',
            position: 'relative',
          }}
        >
          {/* Canvas layer - everything rendered here */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${dataAreaWidth}px`,
              height: `${headerHeight}px`,
              pointerEvents: 'auto',
              zIndex: 1,
            }}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
          />
        </div>
      </div>
    </div>
  )
})

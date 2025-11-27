import { useEffect, useMemo } from 'react'
import { CanvasRoot } from '../core/CanvasRoot'
import { CanvasAbsoluteContainer } from '../core/CanvasAbsoluteContainer'
import { CanvasContainer } from '../core/CanvasContainer'
import { CanvasNode } from '../core/CanvasNode'
import { CanvasRect } from '../primitives/CanvasRect'
import { CanvasText } from '../primitives/CanvasText'
import { CanvasIcon } from '../primitives/CanvasIcon'
import { GridHeaderCell } from '../../../models/GridHeaderCell'
import { GridColumn } from '../../../models/GridColumn'
import { getHeaderColor, getHeaderTextColor, getHeaderFontSize, getHeaderFontWeight } from '../../headerConstants'
import { GRIP_ICON_SVG } from '../utils/icons'
import { DragState } from './useHeaderDragDrop'

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
  handleDragStart: (e: MouseEvent | React.MouseEvent, columnIndex: number, title: string, width: number, rect: { x: number, y: number, width: number, height: number }) => void
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
  dragState,
  handleDragStart
}: UseHeaderSceneProps) => {

  // Filter visible cells
  const visibleCells = useMemo(() => {
    if (!visibleIndices) return headerCells

    const { start, end } = visibleIndices
    return headerCells.filter(cell => {
      const cellEndIndex = cell.startIndex + cell.colSpan
      return cellEndIndex > start && cell.startIndex < end
    })
  }, [headerCells, visibleIndices])

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

      // Helper to create grip icon
      const createGripIcon = (idSuffix: string) => {
        const gripIcon = new CanvasIcon(`${cellId}-${idSuffix}`, GRIP_ICON_SVG, { size: 12 })
        gripIcon.style = {
            flexShrink: 0,
            alignSelf: 'center',
        }
        
        gripIcon.onMouseEnter = () => {
            if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
        }
        gripIcon.onMouseLeave = () => {
            if (canvasRef.current) canvasRef.current.style.cursor = 'default'
        }
        gripIcon.onMouseDown = (e) => {
            e.preventDefault()
            e.stopPropagation()
            
            handleDragStart(
                e.originalEvent, 
                cell.columnIndex!, 
                cell.title, 
                cellWidth,
                { x: cellX, y: cellY, width: cellWidth, height: cellHeight }
            )
        }
        return gripIcon
      }

      if (customContent) {
        // Inject grip icon into custom content if needed
        if (enableColumnReorder && column && customContent instanceof CanvasContainer) {
            const gripIcon = createGripIcon('grip-custom')
            
            // Spacer for margin
            const spacer = new CanvasRect(`${cellId}-grip-spacer`, 'transparent')
            spacer.rect = { x: 0, y: 0, width: 4, height: 1 }
            spacer.style = { width: 4, height: 1, flexShrink: 0 }

            customContent.children.unshift(spacer);
            spacer.parent = customContent;
            
            customContent.children.unshift(gripIcon);
            gripIcon.parent = customContent;
        }

        cellWrapper.addChild(customContent)
      } else {
        // Default Content Container (Flex)
        const contentContainer = new CanvasContainer(`${cellId}-content`, {
          direction: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        })
        
        const padding = 8
        contentContainer.rect = {
          x: cellX + padding,
          y: cellY,
          width: Math.max(0, cellWidth - padding * 2),
          height: cellHeight,
        }

        if (enableColumnReorder && column) {
            const gripIcon = createGripIcon('grip')
            const spacer = new CanvasRect(`${cellId}-spacer`, 'transparent')
            spacer.rect = { x: 0, y: 0, width: 4, height: 1 }
            spacer.style = { width: 4, height: 1, flexShrink: 0 }

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

  }, [
      visibleCells, columnPositions, columnWidths, scrollLeft, 
      headerRowHeight, enableColumnReorder, dragState, 
      handleDragStart, orderedColumns, canvasRef
  ])
}


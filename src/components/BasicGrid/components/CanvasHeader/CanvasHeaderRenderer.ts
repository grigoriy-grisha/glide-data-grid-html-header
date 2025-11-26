import { CanvasShapes } from './CanvasShapes'
import { CanvasText } from './CanvasText'
import { sortHeaderCells, roundCoordinates, isCellHovered } from './utils'
import { DEFAULT_BORDER_STYLE, createHideBorderStyle } from './borderStyles'
import {
  getHeaderColor,
  getHeaderTextColor,
  getHeaderFontSize,
  getHeaderFontWeight,
  HEADER_BACKGROUND_COLOR,
  HEADER_TEXT_PADDING,
} from '../headerConstants'
import type { GridHeaderCell } from '../../models/GridHeaderCell'

export interface HeaderCellRect {
  x: number
  y: number
  width: number
  height: number
}

import type { GridColumn } from '../../models/GridColumn'

export interface HeaderRenderContext {
  ctx: CanvasRenderingContext2D
  rect: HeaderCellRect
  headerCells: GridHeaderCell[]
  orderedColumns: GridColumn<any>[]
  columnPositions: number[]
  columnWidths: number[]
  levelCount: number
  headerRowHeight: number
  scrollLeft: number
  mousePosition: { x: number; y: number } | null
  theme: any
}

export interface ClickableArea {
  rect: { x: number; y: number; width: number; height: number }
  onClick: () => void
}

export class CanvasHeaderRenderer {
  private ctx: CanvasRenderingContext2D | null = null
  private shapes: CanvasShapes = new CanvasShapes()
  private clickableAreas: ClickableArea[] = []
  private onRerenderRequested: (() => void) | null = null

  setContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx
    this.shapes.setContext(ctx)
  }

  getContext(): CanvasRenderingContext2D | null {
    return this.ctx
  }

  getClickableAreas(): ClickableArea[] {
    return this.clickableAreas
  }

  // Устанавливает колбэк для запроса перерисовки
  setOnRerenderRequested(callback: (() => void) | null): void {
    this.onRerenderRequested = callback
  }

  render(context: HeaderRenderContext): void {
    const { ctx } = context
    
    if (!ctx) {
      return
    }

    this.setContext(ctx)
    this.drawLayout(context)
  }

  private drawLayout(context: HeaderRenderContext): void {
    if (!this.ctx) {
      return
    }

    const { rect, headerCells, columnPositions, columnWidths, headerRowHeight } = context

    this.ctx.clearRect(0, 0, rect.width, rect.height)
    this.clickableAreas = [] // Сбрасываем кликабельные области

    this.shapes.drawRect(rect, {
      fillColor: HEADER_BACKGROUND_COLOR,
    })

    const sortedCells = sortHeaderCells(headerCells)

    for (const cell of sortedCells) {
      this.drawHeaderCell(cell, columnPositions, columnWidths, headerRowHeight, context.scrollLeft, context.mousePosition, context)
    }
  }

  private drawHeaderCell(
    cell: GridHeaderCell,
    columnPositions: number[],
    columnWidths: number[],
    headerRowHeight: number,
    scrollLeft: number,
    mousePosition: { x: number; y: number } | null,
    context: HeaderRenderContext
  ): void {
    if (!this.ctx) {
      return
    }

    // Вычисляем позицию ячейки относительно видимого viewport
    // Используем точные вычисления для стабильности
    const absoluteX = columnPositions[cell.startIndex] ?? 0
    const relativeX = absoluteX - scrollLeft
    const startX = Math.round(relativeX)
    const totalWidth = cell.getSpanWidth(columnWidths)
    const levelY = Math.round(cell.level * headerRowHeight)
    const cellHeight = cell.rowSpan * headerRowHeight

    // Пропускаем ячейки, которые полностью вне видимой области
    const dpr = window.devicePixelRatio || 1
    const viewportWidth = Math.round(this.ctx.canvas.width / dpr)
    if (startX + totalWidth < 0 || startX > viewportWidth) {
      return
    }

    // Обрезаем ячейки по границам viewport
    const clippedX = Math.max(0, startX)
    const clippedWidth = Math.min(totalWidth - (clippedX - startX), viewportWidth - clippedX)

    const bgColor = getHeaderColor(cell.level)
    const hoverBgColor = this.shapes.adjustColorForHover(bgColor)
    const textColor = getHeaderTextColor(cell.level)
    const fontSize = getHeaderFontSize(cell.level)
    const fontWeight = getHeaderFontWeight(cell.level)

    // Координаты мыши уже включают scrollLeft (абсолютные), нужно вычесть для сравнения с clippedX
    // clippedX вычислен относительно viewport (absoluteX - scrollLeft)
    const adjustedMousePosition = mousePosition ? {
      x: mousePosition.x - scrollLeft,
      y: mousePosition.y,
    } : null

    this.shapes.drawRect(
      {
        x: clippedX,
        y: levelY,
        width: clippedWidth,
        height: cellHeight,
      },
      {
        fillColor: bgColor,
        hover: {
          fillColor: hoverBgColor,
        },
        mousePosition: adjustedMousePosition,
      }
    )

    const isHovered = isCellHovered(
      adjustedMousePosition,
      clippedX,
      levelY,
      clippedWidth,
      cellHeight,
      cell.colSpan
    )

    const finalBgColor = isHovered ? hoverBgColor : bgColor
    this.drawCellBorders(clippedX, levelY, clippedWidth, cellHeight, cell, columnPositions, scrollLeft, finalBgColor)

    // Текст рисуем только если ячейка видна
    if (clippedX < viewportWidth && clippedX + clippedWidth > 0) {
      // Проверяем, есть ли renderColumnContent для этой колонки
      const column = cell.columnIndex !== undefined ? context.orderedColumns[cell.columnIndex] : undefined
      const renderColumnContent = column?.getRenderColumnContent()
      
      if (renderColumnContent && cell.isLeaf && this.ctx) {
        // Рисуем кастомный canvas компонент через функцию рендеринга
        const renderRect = {
          x: clippedX,
          y: levelY,
          width: clippedWidth,
          height: cellHeight,
        }
        
        // Создаем колбэк для перерисовки после загрузки иконок
        const rerenderCallback = () => {
          if (this.onRerenderRequested) {
            this.onRerenderRequested()
          }
        }
        
        // Передаем колбэк через специальную обертку для renderColumnContent
        // Иконки будут использовать этот колбэк при загрузке
        const clickableAreas = renderColumnContent(this.ctx, renderRect, adjustedMousePosition, rerenderCallback)
        
        // Сохраняем кликабельные области, преобразуя координаты в абсолютные (с учетом scrollLeft)
        if (clickableAreas && Array.isArray(clickableAreas)) {
          const cellAbsoluteX = columnPositions[cell.startIndex] ?? 0
          for (const area of clickableAreas) {
            // area.rect.x относительно renderRect.x (который = clippedX)
            // renderRect.x начинается с clippedX, поэтому area.rect.x уже включает clippedX
            // Чтобы получить абсолютную координату: нужно вычесть clippedX и добавить cellAbsoluteX
            // absoluteAreaX = area.rect.x - clippedX + cellAbsoluteX
            // Но если clippedX = 0 (обрезано), то area.rect.x уже относительно начала viewport, и нужно просто добавить cellAbsoluteX
            // Упрощенно: absoluteAreaX = (area.rect.x - clippedX) + cellAbsoluteX
            const absoluteAreaX = area.rect.x - clippedX + cellAbsoluteX
            this.clickableAreas.push({
              rect: {
                x: absoluteAreaX,
                y: area.rect.y,
                width: area.rect.width,
                height: area.rect.height,
              },
              onClick: area.onClick,
            })
          }
        }
      } else {
        // Обычный текст
        const textElement = new CanvasText(
          cell.title,
          {
            x: clippedX + HEADER_TEXT_PADDING,
            y: levelY + cellHeight / 2,
          },
          {
            color: textColor,
            fontSize,
            fontWeight,
            textBaseline: 'middle',
          }
        )
        textElement.setContext(this.ctx)
        textElement.draw()
      }
    }
  }

  private drawCellBorders(
    x: number,
    y: number,
    width: number,
    height: number,
    cell: GridHeaderCell,
    columnPositions: number[],
    scrollLeft: number,
    bgColor: string
  ): void {
    if (!this.ctx) {
      return
    }

    const { x: roundedX, y: roundedY, width: roundedWidth, height: roundedHeight } = roundCoordinates(x, y, width, height)

    this.ctx.imageSmoothingEnabled = false

    if (cell.level === 0) {
      this.shapes.drawLine({
        x1: roundedX,
        y1: roundedY + 0.5,
        x2: roundedX + roundedWidth,
        y2: roundedY + 0.5,
      }, DEFAULT_BORDER_STYLE)
    }

    this.shapes.drawLine({
      x1: roundedX,
      y1: roundedY + roundedHeight - 0.5,
      x2: roundedX + roundedWidth,
      y2: roundedY + roundedHeight - 0.5,
    }, DEFAULT_BORDER_STYLE)

    this.shapes.drawLine({
      x1: roundedX + 0.5,
      y1: roundedY,
      x2: roundedX + 0.5,
      y2: roundedY + roundedHeight,
    }, DEFAULT_BORDER_STYLE)

    this.shapes.drawLine({
      x1: roundedX + roundedWidth - 0.5,
      y1: roundedY,
      x2: roundedX + roundedWidth - 0.5,
      y2: roundedY + roundedHeight,
    }, DEFAULT_BORDER_STYLE)

    if (cell.colSpan > 1) {
      const hideBorderStyle = createHideBorderStyle(bgColor)
      const viewportWidth = this.ctx.canvas.width / (window.devicePixelRatio || 1)

      for (let i = 1; i < cell.colSpan; i++) {
        const absoluteBorderX = columnPositions[cell.startIndex + i] ?? 0
        const borderX = Math.round(absoluteBorderX - scrollLeft)
        
        // Пропускаем границы вне видимой области или вне обрезанной ячейки
        if (borderX < x || borderX > x + width || borderX < 0 || borderX > viewportWidth) {
          continue
        }
        
        this.shapes.drawLine({
          x1: borderX - 1,
          y1: roundedY,
          x2: borderX - 1,
          y2: roundedY + roundedHeight,
        }, hideBorderStyle)
        
        this.shapes.drawLine({
          x1: borderX,
          y1: roundedY,
          x2: borderX,
          y2: roundedY + roundedHeight,
        }, hideBorderStyle)
        
        this.shapes.drawLine({
          x1: borderX + 1,
          y1: roundedY,
          x2: borderX + 1,
          y2: roundedY + roundedHeight,
        }, hideBorderStyle)
      }
    }
  }
}


import { CanvasShapes } from './CanvasShapes'
import { CanvasText } from './CanvasText'
import { CanvasLines } from './CanvasLines'
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

export interface HeaderRenderContext {
  ctx: CanvasRenderingContext2D
  rect: HeaderCellRect
  headerCells: GridHeaderCell[]
  columnPositions: number[]
  columnWidths: number[]
  levelCount: number
  headerRowHeight: number
  scrollLeft: number
  mousePosition: { x: number; y: number } | null
  theme: any
}

export class CanvasHeaderRenderer {
  private ctx: CanvasRenderingContext2D | null = null
  private shapes: CanvasShapes = new CanvasShapes()
  private text: CanvasText = new CanvasText()
  private lines: CanvasLines = new CanvasLines()

  setContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx
    this.shapes.setContext(ctx)
    this.text.setContext(ctx)
    this.lines.setContext(ctx)
  }

  getContext(): CanvasRenderingContext2D | null {
    return this.ctx
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

    this.shapes.drawRect(rect, {
      fillColor: HEADER_BACKGROUND_COLOR,
    })

    const sortedCells = sortHeaderCells(headerCells)

    for (const cell of sortedCells) {
      this.drawHeaderCell(cell, columnPositions, columnWidths, headerRowHeight, context.scrollLeft, context.mousePosition)
    }
  }

  private drawHeaderCell(
    cell: GridHeaderCell,
    columnPositions: number[],
    columnWidths: number[],
    headerRowHeight: number,
    scrollLeft: number,
    mousePosition: { x: number; y: number } | null
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
      this.text.drawText(cell.title, {
        x: clippedX + HEADER_TEXT_PADDING,
        y: levelY + cellHeight / 2,
      }, {
        color: textColor,
        fontSize,
        fontWeight,
        textBaseline: 'middle',
      })
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
      this.lines.drawLine({
        x1: roundedX,
        y1: roundedY + 0.5,
        x2: roundedX + roundedWidth,
        y2: roundedY + 0.5,
      }, DEFAULT_BORDER_STYLE)
    }

    this.lines.drawLine({
      x1: roundedX,
      y1: roundedY + roundedHeight - 0.5,
      x2: roundedX + roundedWidth,
      y2: roundedY + roundedHeight - 0.5,
    }, DEFAULT_BORDER_STYLE)

    this.lines.drawLine({
      x1: roundedX + 0.5,
      y1: roundedY,
      x2: roundedX + 0.5,
      y2: roundedY + roundedHeight,
    }, DEFAULT_BORDER_STYLE)

    this.lines.drawLine({
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
        
        this.lines.drawLine({
          x1: borderX - 1,
          y1: roundedY,
          x2: borderX - 1,
          y2: roundedY + roundedHeight,
        }, hideBorderStyle)
        
        this.lines.drawLine({
          x1: borderX,
          y1: roundedY,
          x2: borderX,
          y2: roundedY + roundedHeight,
        }, hideBorderStyle)
        
        this.lines.drawLine({
          x1: borderX + 1,
          y1: roundedY,
          x2: borderX + 1,
          y2: roundedY + roundedHeight,
        }, hideBorderStyle)
      }
    }
  }
}


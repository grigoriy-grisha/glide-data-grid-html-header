import { ReactElement } from 'react'
import {
  CanvasAbsoluteContainer,
  CanvasContainer,
  CanvasNode,
  CanvasText,
  CanvasIcon,
  CanvasIconButton,
  buildCanvasTree,
} from '../../../lib/canvas'
import { GridHeaderCell } from '../../../models/GridHeaderCell'
import { GridColumn } from '../../../models/GridColumn'
import { getHeaderColor, getHeaderTextColor, getHeaderFontSize, getHeaderFontWeight } from '../../headerConstants'
import { GRIP_ICON_SVG, SORT_ASC_ICON, SORT_DESC_ICON, SORT_DEFAULT_ICON } from '../utils/icons'

const DEFAULT_BORDER_COLOR = '#e0e0e0'
const DEFAULT_BORDER_WIDTH = 1
const CONTENT_COLUMN_GAP = 6
const CONTENT_PADDING = 12
const GRIP_ICON_SIZE = 12
const SORT_BUTTON_SIZE = 20
const CONTENT_WIDTH_MULTIPLIER = 2
const CELL_ID_PREFIX = 'cell'

const HOVER_COLOR_MAP: Record<string, string> = {
    '#e3f2fd': '#bbdefb',
    '#f5f5f5': '#e0e0e0',
    '#fafafa': '#eeeeee',
    '#ffffff': '#f5f5f5',
};

export interface GripIconHandlers {
    onMouseEnter: () => void
    onMouseLeave: () => void
    onMouseDown: (e: any) => void
}

export interface BuildSceneConfig {
    cells: GridHeaderCell[]
    columnPositions: number[]
    columnWidths: number[]
    scrollLeft: number
    headerRowHeight: number
    orderedColumns: GridColumn<any>[]
    enableColumnReorder?: boolean
    sortColumn?: string
    sortDirection?: 'asc' | 'desc'
    onColumnSort?: (columnId: string, direction: 'asc' | 'desc' | undefined) => void
    getCustomContent: (cellId: string) => CanvasNode | null
    createGripHandlers: (
        columnIndex: number,
        title: string,
        x: number,
        y: number,
        width: number,
        height: number
    ) => GripIconHandlers
}

function getHoverColor(color: string): string {
    return HOVER_COLOR_MAP[color] ?? color
}

function getCellId(cell: GridHeaderCell): string {
    return `${CELL_ID_PREFIX}-${cell.startIndex}-${cell.level}`
}

export class HeaderSceneBuilder {
    build(config: BuildSceneConfig): CanvasAbsoluteContainer[] {
        return config.cells.map((cell) => this.buildCell(cell, config))
    }

    private buildCell(cell: GridHeaderCell, config: BuildSceneConfig): CanvasAbsoluteContainer {
        const { columnPositions, columnWidths, scrollLeft, headerRowHeight, orderedColumns } = config
        const cellId = getCellId(cell)

        const dimensions = this.calculateCellDimensions(cell, columnPositions, columnWidths, scrollLeft, headerRowHeight)
        const colors = this.getCellColors(cell.level)
        const column = this.getColumn(cell, orderedColumns)

        const wrapper = this.createWrapper(cellId, dimensions, colors)
        const contentContainer = this.createContentContainer(cellId, dimensions)
        const { left, right } = this.createContentSections(cellId)

        const hasCustomContent = this.populateContent(
            cell, cellId, column, left, right, config, dimensions
        )

        this.assembleHierarchy(contentContainer, wrapper, left, right, hasCustomContent)

        return wrapper
    }

    private calculateCellDimensions(
        cell: GridHeaderCell,
        columnPositions: number[],
        columnWidths: number[],
        scrollLeft: number,
        headerRowHeight: number
    ) {
        const absoluteX = columnPositions[cell.startIndex] ?? 0
        return {
            x: Math.round(absoluteX - scrollLeft),
            y: Math.round(cell.level * headerRowHeight),
            width: cell.getSpanWidth(columnWidths),
            height: cell.rowSpan * headerRowHeight,
        }
    }

    private getCellColors(level: number) {
        const normalColor = getHeaderColor(level)
        return {
            normal: normalColor,
            hover: getHoverColor(normalColor),
        }
    }

    private getColumn(cell: GridHeaderCell, orderedColumns: GridColumn<any>[]): GridColumn<any> | undefined {
        return cell.columnIndex !== undefined ? orderedColumns[cell.columnIndex] : undefined
    }

    private assembleHierarchy(
        contentContainer: CanvasContainer,
        wrapper: CanvasAbsoluteContainer,
        left: CanvasContainer,
        right: CanvasContainer,
        hasCustomContent: boolean
    ): void {
        contentContainer.addChild(left)
        if (!hasCustomContent) {
            contentContainer.addChild(right)
        }
        wrapper.addChild(contentContainer)
    }

    private createWrapper(
        cellId: string,
        dimensions: { x: number; y: number; width: number; height: number },
        colors: { normal: string; hover: string }
    ): CanvasAbsoluteContainer {
        const wrapper = new CanvasAbsoluteContainer(`${cellId}-wrapper`)
        wrapper.rect.x = dimensions.x
        wrapper.rect.y = dimensions.y
        wrapper.rect.width = dimensions.width
        wrapper.rect.height = dimensions.height
        wrapper.backgroundColor = colors.normal
        wrapper.borderColor = DEFAULT_BORDER_COLOR
        wrapper.borderWidth = DEFAULT_BORDER_WIDTH
        wrapper.onMouseEnter = () => { wrapper.backgroundColor = colors.hover }
        wrapper.onMouseLeave = () => { wrapper.backgroundColor = colors.normal }
        return wrapper
    }

    private createContentContainer(
        cellId: string,
        dimensions: { x: number; y: number; width: number; height: number }
    ): CanvasContainer {
        const container = new CanvasContainer(`${cellId}-content`, {
            direction: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: CONTENT_COLUMN_GAP,
            padding: CONTENT_PADDING,
        })
        container.style.height = dimensions.height
        container.style.width = dimensions.width
        container.rect.x = dimensions.x
        container.rect.y = dimensions.y
        container.rect.width = Math.max(0, dimensions.width * CONTENT_WIDTH_MULTIPLIER)
        container.rect.height = dimensions.height
        return container
    }

    private createContentSections(cellId: string): { left: CanvasContainer; right: CanvasContainer } {
        const left = new CanvasContainer(`${cellId}-left`, {
            direction: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: CONTENT_COLUMN_GAP,
        })

        const right = new CanvasContainer(`${cellId}-right`, {
            direction: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: CONTENT_COLUMN_GAP,
        })
        right.style.width = '100%'

        return { left, right }
    }

    private populateContent(
        cell: GridHeaderCell,
        cellId: string,
        column: GridColumn<any> | undefined,
        left: CanvasContainer,
        right: CanvasContainer,
        config: BuildSceneConfig,
        dimensions: { x: number; y: number; width: number; height: number }
    ): boolean {
        const renderContent = cell.renderColumnContent ?? column?.renderColumnContent

        if (renderContent) {
            return this.populateCustomContent(cellId, column, left, config, dimensions, cell)
        } else {
            this.populateDefaultContent(cell, cellId, column, left, right, config, dimensions)
            return false
        }
    }

    private populateCustomContent(
        cellId: string,
        column: GridColumn<any> | undefined,
        left: CanvasContainer,
        config: BuildSceneConfig,
        dimensions: { x: number; y: number; width: number; height: number },
        cell: GridHeaderCell
    ): boolean {
        const customContent = config.getCustomContent(cellId)
        if (!customContent) return false

        left.addChild(customContent)

        if (config.enableColumnReorder && column && customContent instanceof CanvasContainer) {
            this.insertGripIcon(left, cellId, cell, config, dimensions, true)
        }

        return true
    }

    private populateDefaultContent(
        cell: GridHeaderCell,
        cellId: string,
        column: GridColumn<any> | undefined,
        left: CanvasContainer,
        right: CanvasContainer,
        config: BuildSceneConfig,
        dimensions: { x: number; y: number; width: number; height: number }
    ): void {
        if (config.enableColumnReorder && column) {
            this.insertGripIcon(left, cellId, cell, config, dimensions, false)
        }

        this.addTextNode(left, cellId, cell)
        
        if (column?.sortable) {
            this.addSortButton(right, cellId, column, config)
        }
    }

    private addTextNode(container: CanvasContainer, cellId: string, cell: GridHeaderCell): void {
        const textNode = new CanvasText(`${cellId}-text`, cell.title, {
            color: getHeaderTextColor(cell.level),
            font: this.buildHeaderFont(cell.level),
        })
        textNode.style = { flexGrow: 1 }
        container.addChild(textNode)
    }

    private buildHeaderFont(level: number): string {
        const fontWeight = getHeaderFontWeight(level)
        const fontSize = getHeaderFontSize(level)
        return `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    }

    private insertGripIcon(
        target: CanvasContainer,
        cellId: string,
        cell: GridHeaderCell,
        config: BuildSceneConfig,
        dimensions: { x: number; y: number; width: number; height: number },
        atStart: boolean
    ): void {
        if (cell.columnIndex === undefined) return

        const gripIcon = new CanvasIcon(`${cellId}-grip`, GRIP_ICON_SVG, { size: GRIP_ICON_SIZE })
        gripIcon.style = { flexShrink: 0, alignSelf: 'center' }

        const handlers = config.createGripHandlers(
            cell.columnIndex,
            cell.title,
            dimensions.x,
            dimensions.y,
            dimensions.width,
            dimensions.height
        )
        gripIcon.onMouseEnter = handlers.onMouseEnter
        gripIcon.onMouseLeave = handlers.onMouseLeave
        gripIcon.onMouseDown = handlers.onMouseDown

        if (atStart && typeof target.addChildStart === 'function') {
            target.addChildStart(gripIcon)
        } else {
            target.addChild(gripIcon)
        }
    }

    private addSortButton(
        container: CanvasContainer,
        cellId: string,
        column: GridColumn<any>,
        config: BuildSceneConfig
    ): void {
        const { sortColumn, sortDirection, onColumnSort } = config
        const icon = this.getSortIcon(sortColumn, column.id, sortDirection)

        const sortButton = new CanvasIconButton(`${cellId}-sort`, icon, {
            size: SORT_BUTTON_SIZE,
            variant: 'secondary',
        })
        sortButton.style = { flexShrink: 0, alignSelf: 'center' }

        if (onColumnSort) {
            sortButton.onClick = () => {
                const newDirection = this.calculateNextSortDirection(sortColumn, column.id, sortDirection)
                onColumnSort(column.id, newDirection)
            }
        }

        container.addChild(sortButton)
    }

    private getSortIcon(sortColumn: string | undefined, columnId: string, sortDirection: 'asc' | 'desc' | undefined): string {
        if (sortColumn !== columnId) {
            return SORT_DEFAULT_ICON
        }
        return sortDirection === 'asc' ? SORT_ASC_ICON
             : sortDirection === 'desc' ? SORT_DESC_ICON
             : SORT_DEFAULT_ICON
    }

    private calculateNextSortDirection(
        sortColumn: string | undefined,
        columnId: string,
        currentDirection: 'asc' | 'desc' | undefined
    ): 'asc' | 'desc' | undefined {
        if (sortColumn !== columnId) {
            return 'asc'
        }
        if (currentDirection === 'asc') {
            return 'desc'
        }
        if (currentDirection === 'desc') {
            return undefined
        }
        return 'asc'
    }
}

export function createCustomContentGetter(
    registryRef: React.MutableRefObject<Map<string, ReactElement>> | undefined
): (cellId: string) => CanvasNode | null {
    return (cellId: string) => {
        if (!registryRef) return null

        const jsx = registryRef.current.get(cellId)
        if (!jsx) return null

        try {
            return buildCanvasTree(jsx, cellId)
        } catch (e) {
            console.warn('Failed to build canvas tree for cell', cellId, e)
            return null
        }
    }
}

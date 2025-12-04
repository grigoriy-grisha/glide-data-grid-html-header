import { ReactElement } from 'react'
import { CanvasAbsoluteContainer } from '../core/CanvasAbsoluteContainer'
import { CanvasContainer } from '../core/CanvasContainer'
import { CanvasNode } from '../core/CanvasNode'
import { CanvasText } from '../primitives/CanvasText'
import { CanvasIcon } from '../primitives/CanvasIcon'
import { CanvasIconButton } from '../primitives/CanvasIconButton'
import { GridHeaderCell } from '../../../models/GridHeaderCell'
import { GridColumn } from '../../../models/GridColumn'
import { getHeaderColor, getHeaderTextColor, getHeaderFontSize, getHeaderFontWeight } from '../../headerConstants'
import { GRIP_ICON_SVG, SORT_ASC_ICON, SORT_DESC_ICON, SORT_DEFAULT_ICON } from '../utils/icons'
import { buildCanvasTree } from '../CanvasComponents'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function getHoverColor(color: string): string {
    const colorMap: Record<string, string> = {
        '#e3f2fd': '#bbdefb',
        '#f5f5f5': '#e0e0e0',
        '#fafafa': '#eeeeee',
        '#ffffff': '#f5f5f5',
    }
    return colorMap[color] ?? color
}

function getCellId(cell: GridHeaderCell): string {
    return `cell-${cell.startIndex}-${cell.level}`
}

export class HeaderSceneBuilder {
    /**
     * Build the complete header scene.
     */
    build(config: BuildSceneConfig): CanvasAbsoluteContainer[] {
        return config.cells.map((cell) => this.buildCell(cell, config))
    }

    private buildCell(
        cell: GridHeaderCell,
        config: BuildSceneConfig
    ): CanvasAbsoluteContainer {
        const {
            columnPositions,
            columnWidths,
            scrollLeft,
            headerRowHeight,
            orderedColumns,
        } = config

        const cellId = getCellId(cell)

        // Calculate dimensions
        const absoluteX = columnPositions[cell.startIndex] ?? 0
        const cellX = Math.round(absoluteX - scrollLeft)
        const cellWidth = cell.getSpanWidth(columnWidths)
        const cellY = Math.round(cell.level * headerRowHeight)
        const cellHeight = cell.rowSpan * headerRowHeight

        // Colors
        const normalColor = getHeaderColor(cell.level)
        const hoverColor = getHoverColor(normalColor)

        // Column reference
        const column = cell.columnIndex !== undefined
            ? orderedColumns[cell.columnIndex]
            : undefined

        // Build wrapper
        const wrapper = this.createWrapper(cellId, cellX, cellY, cellWidth, cellHeight, normalColor, hoverColor)
        
        // Build content containers
        const contentContainer = this.createContentContainer(cellId, cellX, cellY, cellWidth, cellHeight)
        const { left, right } = this.createContentSections(cellId)

        // Populate content
        const hasCustomContent = this.populateContent(
            cell, cellId, column, left, right, config, cellX, cellY, cellWidth, cellHeight
        )

        // Assemble hierarchy
        if (hasCustomContent) {
            contentContainer.addChild(left)
        } else {
            contentContainer.addChild(left)
            contentContainer.addChild(right)
        }
        wrapper.addChild(contentContainer)

        return wrapper
    }

    private createWrapper(
        cellId: string,
        x: number,
        y: number,
        width: number,
        height: number,
        normalColor: string,
        hoverColor: string
    ): CanvasAbsoluteContainer {
        const wrapper = new CanvasAbsoluteContainer(`${cellId}-wrapper`)
        wrapper.rect.x = x
        wrapper.rect.y = y
        wrapper.rect.width = width
        wrapper.rect.height = height
        wrapper.backgroundColor = normalColor
        wrapper.borderColor = '#e0e0e0'
        wrapper.borderWidth = 1
        wrapper.onMouseEnter = () => { wrapper.backgroundColor = hoverColor }
        wrapper.onMouseLeave = () => { wrapper.backgroundColor = normalColor }
        return wrapper
    }

    private createContentContainer(
        cellId: string,
        x: number,
        y: number,
        width: number,
        height: number
    ): CanvasContainer {
        const container = new CanvasContainer(`${cellId}-content`, {
            direction: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: 6,
            padding: 12,
        })
        container.style.height = height
        container.style.width = width
        container.rect.x = x
        container.rect.y = y
        container.rect.width = Math.max(0, width * 2)
        container.rect.height = height
        return container
    }

    private createContentSections(cellId: string): { left: CanvasContainer; right: CanvasContainer } {
        const left = new CanvasContainer(`${cellId}-left`, {
            direction: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 6,
        })

        const right = new CanvasContainer(`${cellId}-right`, {
            direction: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: 6,
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
        cellX: number,
        cellY: number,
        cellWidth: number,
        cellHeight: number
    ): boolean {
        const renderContent = cell.renderColumnContent ?? column?.getRenderColumnContent()

        if (renderContent) {
            return this.populateCustomContent(
                cellId, column, left, config, cellX, cellY, cellWidth, cellHeight, cell
            )
        } else {
            this.populateDefaultContent(
                cell, cellId, column, left, right, config, cellX, cellY, cellWidth, cellHeight
            )
            return false
        }
    }

    private populateCustomContent(
        cellId: string,
        column: GridColumn<any> | undefined,
        left: CanvasContainer,
        config: BuildSceneConfig,
        cellX: number,
        cellY: number,
        cellWidth: number,
        cellHeight: number,
        cell: GridHeaderCell
    ): boolean {
        const customContent = config.getCustomContent(cellId)
        if (!customContent) return false

        left.addChild(customContent)

        if (config.enableColumnReorder && column && customContent instanceof CanvasContainer) {
            this.insertGripIcon(left, cellId, cell, config, cellX, cellY, cellWidth, cellHeight, true)
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
        cellX: number,
        cellY: number,
        cellWidth: number,
        cellHeight: number
    ): void {
        // Grip icon
        if (config.enableColumnReorder && column) {
            this.insertGripIcon(left, cellId, cell, config, cellX, cellY, cellWidth, cellHeight, false)
        }

        // Title text
        const textNode = new CanvasText(`${cellId}-text`, cell.title, {
            color: getHeaderTextColor(cell.level),
            font: `${getHeaderFontWeight(cell.level)} ${getHeaderFontSize(cell.level)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        })
        textNode.style = { flexGrow: 1 }
        left.addChild(textNode)

        // Sort button
        if (column?.sortable) {
            this.addSortButton(right, cellId, column, config)
        }
    }

    private insertGripIcon(
        target: CanvasContainer,
        cellId: string,
        cell: GridHeaderCell,
        config: BuildSceneConfig,
        cellX: number,
        cellY: number,
        cellWidth: number,
        cellHeight: number,
        atStart: boolean
    ): void {
        if (cell.columnIndex === undefined) return

        const gripIcon = new CanvasIcon(`${cellId}-grip`, GRIP_ICON_SVG, { size: 12 })
        gripIcon.style = { flexShrink: 0, alignSelf: 'center' }

        const handlers = config.createGripHandlers(
            cell.columnIndex, cell.title, cellX, cellY, cellWidth, cellHeight
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

        let icon = SORT_DEFAULT_ICON
        if (sortColumn === column.id) {
            icon = sortDirection === 'asc' ? SORT_ASC_ICON
                 : sortDirection === 'desc' ? SORT_DESC_ICON
                 : SORT_DEFAULT_ICON
        }

        const sortButton = new CanvasIconButton(`${cellId}-sort`, icon, {
            size: 20,
            variant: 'secondary',
        })
        sortButton.style = { flexShrink: 0, alignSelf: 'center' }

        sortButton.onClick = () => {
            if (!onColumnSort) return

            let newDirection: 'asc' | 'desc' | undefined = 'asc'
            if (sortColumn === column.id) {
                if (sortDirection === 'asc') newDirection = 'desc'
                else if (sortDirection === 'desc') newDirection = undefined
            }
            onColumnSort(column.id, newDirection)
        }

        container.addChild(sortButton)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Content Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a function that retrieves and builds custom content from registry
 */
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

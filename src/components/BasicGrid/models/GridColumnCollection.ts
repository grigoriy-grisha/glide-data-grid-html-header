import type React from 'react'

import type { BasicGridColumn } from '../types'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_MIN_COLUMN_WIDTH } from '../constants'
import { GridColumn, type GridHeaderSegment } from './GridColumn'
import { GridHeaderCell } from './GridHeaderCell'

interface HeaderCellDescriptor {
  title: string
  level: number
  rowSpan: number
  colSpan: number
  startIndex: number
  columnIndex?: number
  isLeaf: boolean
  content?: React.ReactNode
}

export class GridColumnCollection<RowType extends Record<string, unknown>> {
  readonly leafColumns: GridColumn<RowType>[]
  readonly levelCount: number
  readonly headerCells: GridHeaderCell[]

  private constructor(params: {
    leafColumns: GridColumn<RowType>[]
    levelCount: number
    headerCells: GridHeaderCell[]
  }) {
    this.leafColumns = params.leafColumns
    this.levelCount = params.levelCount
    this.headerCells = params.headerCells
  }

  static fromConfig<RowType extends Record<string, unknown>>(columns: BasicGridColumn<RowType>[]) {
    let autoId = 0
    const getAutoId = () => `column-${autoId++}`
    const leaves: GridColumn<RowType>[] = []

    const visit = (cols: BasicGridColumn<RowType>[], parentSegments: GridHeaderSegment[] = []) => {
      cols.forEach((column) => {
        const hasChildren = Boolean(column.children?.length)
        const fallbackTitle =
          column.title ??
          column.headerOptions?.columnGroupText ??
          column.id ??
          (typeof column.accessor === 'string' ? column.accessor : `Column ${autoId + 1}`)

        const accessor = column.accessor
        const accessorPath = typeof accessor === 'string' && accessor.length > 0 ? accessor : undefined
        const resolvedId = column.id ?? accessorPath ?? getAutoId()

        const groupSegment = column.headerOptions?.columnGroupText
          ? {
              title: column.headerOptions.columnGroupText,
              content: column.headerOptions.columnGroupContent,
            }
          : undefined
        const headerParentSegments = groupSegment ? [...parentSegments, groupSegment] : parentSegments
        const selfSegment: GridHeaderSegment = {
          title: fallbackTitle,
          content: column.headerContent,
        }

        const valueGetter =
          column.valueGetter ??
          (accessorPath
            ? (row: RowType) => resolveAccessorValue(row as Record<string, unknown>, accessorPath)
            : undefined)

        // Button ячейки не требуют valueGetter, так как данные берутся из buttonOptions
        // Колонки с renderColumnContent тоже могут не иметь accessor
        const isButton = column.dataType === 'button'
        const hasRenderColumnContent = Boolean(column.renderColumnContent)
        const canRenderLeaf = Boolean(valueGetter) || isButton || hasRenderColumnContent

        if (canRenderLeaf) {
          // Для button ячеек и колонок с renderColumnContent создаем пустой valueGetter, если его нет
          const finalValueGetter = valueGetter ?? (() => null)
          const minWidth = column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH
          const baseWidth = Math.max(minWidth, column.width ?? DEFAULT_COLUMN_WIDTH)
          leaves.push(
            new GridColumn<RowType>({
              id: resolvedId,
              title: fallbackTitle,
              dataType: column.dataType ?? 'string',
              headerPath: [...headerParentSegments, selfSegment],
              minWidth,
              baseWidth,
              grow: column.grow ?? 0,
              sortable: column.sortable ?? true,
              formatter: column.formatter,
              valueGetter: finalValueGetter,
              sortValueGetter: column.sortValueGetter,
              sortComparator: column.sortComparator,
              accessorPath,
              selectOptionsAccessor:
                column.selectOptionsAccessor != null
                  ? String(column.selectOptionsAccessor)
                  : undefined,
              selectOptionsGetter: column.selectOptionsGetter,
              selectPlaceholder: column.selectPlaceholder,
              buttonOptions: column.buttonOptions,
              canvasOptions: column.canvasOptions,
              renderColumnContent: column.renderColumnContent,
            })
          )
        }

        if (hasChildren) {
          const nextParentSegments = column.headerOptions?.columnGroupText
            ? [...parentSegments, ...(groupSegment ? [groupSegment] : [])]
            : column.title
            ? [...parentSegments, selfSegment]
            : parentSegments

          visit(column.children ?? [], nextParentSegments)
        }
      })
    }

    visit(columns)

    const { levelCount, cells } = GridColumnCollection.buildHeaderLayout(leaves)

    return new GridColumnCollection<RowType>({
      leafColumns: leaves,
      levelCount,
      headerCells: cells,
    })
  }

  getColumn(index: number) {
    return this.leafColumns[index]
  }

  get length() {
    return this.leafColumns.length
  }

  static buildHeaderLayout<RowType extends Record<string, unknown>>(columns: GridColumn<RowType>[]) {
    return GridColumnCollection.createHeaderLayout(columns)
  }

  private static createHeaderLayout<RowType extends Record<string, unknown>>(columns: GridColumn<RowType>[]) {
    if (columns.length === 0) {
      return { levelCount: 0, cells: [] as GridHeaderCell[] }
    }

    const levelCount = columns.reduce((max, column) => Math.max(max, column.headerPath.length), 0)
    const matrix: (HeaderCellDescriptor | null)[][] = Array.from({ length: levelCount }, () =>
      Array(columns.length).fill(null)
    )

    columns.forEach((column, columnIndex) => {
      column.headerPath.forEach((segment, level) => {
        const isLeaf = level === column.headerPath.length - 1
        const remainingLevels = levelCount - (level + 1)

        matrix[level][columnIndex] = {
          title: segment.title,
          content: segment.content,
          level,
          rowSpan: isLeaf ? Math.max(1, remainingLevels + 1) : 1,
          colSpan: 1,
          startIndex: columnIndex,
          columnIndex: isLeaf ? columnIndex : undefined,
          isLeaf,
        }
      })
    })

    const cells: GridHeaderCell[] = []

    for (let level = 0; level < levelCount; level++) {
      const row = matrix[level]
      let current: HeaderCellDescriptor | null = null

      for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
        const stub = row[columnIndex]

        if (!stub) {
          if (current) {
            cells.push(GridColumnCollection.createHeaderCell(current))
            current = null
          }
          continue
        }

        if (
          current &&
          !stub.isLeaf &&
          !current.isLeaf &&
          current.title === stub.title &&
          current.rowSpan === stub.rowSpan &&
          current.startIndex + current.colSpan === columnIndex
        ) {
          current.colSpan += 1
          continue
        }

        if (current) {
          cells.push(GridColumnCollection.createHeaderCell(current))
        }

        current = { ...stub }
      }

      if (current) {
        cells.push(GridColumnCollection.createHeaderCell(current))
      }
    }

    return { levelCount, cells }
  }

  private static createHeaderCell(descriptor: HeaderCellDescriptor) {
    return new GridHeaderCell(
      descriptor.title,
      descriptor.level,
      descriptor.rowSpan,
      descriptor.colSpan,
      descriptor.startIndex,
      descriptor.columnIndex,
      descriptor.isLeaf,
      descriptor.content
    )
  }
}

const resolveAccessorValue = (row: Record<string, unknown>, accessor: string | number | symbol) => {
  if (typeof accessor === 'string' && accessor.includes('.')) {
    return accessor.split('.').reduce<unknown>((acc, key) => {
      if (acc == null || typeof acc !== 'object') {
        return undefined
      }
      return (acc as Record<string, unknown>)[key]
    }, row)
  }

  return (row as Record<string, unknown>)[accessor as keyof typeof row]
}


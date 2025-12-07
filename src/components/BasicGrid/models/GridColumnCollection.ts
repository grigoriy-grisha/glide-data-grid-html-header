import type { ReactElement } from 'react'
import type { BasicGridColumn } from '../types'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_MIN_COLUMN_WIDTH } from '../constants'
import { GridColumn, type GridHeaderSegment } from './GridColumn'
import { GridHeaderCell } from './GridHeaderCell'
import { resolveAccessorValue } from './utils'

interface HeaderCellDescriptor {
  title: string
  level: number
  rowSpan: number
  colSpan: number
  startIndex: number
  columnIndex?: number
  isLeaf: boolean
  content?: React.ReactNode
  renderColumnContent?: () => ReactElement
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

  static fromConfig<RowType extends Record<string, unknown>>(
    columns: BasicGridColumn<RowType>[]
  ): GridColumnCollection<RowType> {
    const leaves = extractLeafColumns<RowType>(columns)
    const { levelCount, cells } = buildHeaderLayout(leaves)

    return new GridColumnCollection<RowType>({
      leafColumns: leaves,
      levelCount,
      headerCells: cells,
    })
  }

  getColumn(index: number): GridColumn<RowType> | undefined {
    return this.leafColumns[index]
  }

  get length(): number {
    return this.leafColumns.length
  }

  /**
   * Builds header layout from leaf columns.
   * @deprecated Use fromConfig instead, this is exposed for legacy compatibility.
   */
  static buildHeaderLayout<RowType extends Record<string, unknown>>(
    columns: GridColumn<RowType>[]
  ): { levelCount: number; cells: GridHeaderCell[] } {
    return buildHeaderLayout(columns)
  }
}

// ============================================================================
// Header Layout Building
// ============================================================================

function buildHeaderLayout<RowType extends Record<string, unknown>>(
  columns: GridColumn<RowType>[]
): { levelCount: number; cells: GridHeaderCell[] } {
  if (columns.length === 0) {
    return { levelCount: 0, cells: [] }
  }

  const levelCount = columns.reduce((max, col) => Math.max(max, col.headerPath.length), 0)
  const matrix = createHeaderMatrix(columns, levelCount)
  const cells = mergeMatrixIntoCells(matrix, levelCount)

  return { levelCount, cells }
}

function createHeaderMatrix<RowType extends Record<string, unknown>>(
  columns: GridColumn<RowType>[],
  levelCount: number
): (HeaderCellDescriptor | null)[][] {
  const matrix: (HeaderCellDescriptor | null)[][] = Array.from({ length: levelCount }, () =>
    Array(columns.length).fill(null)
  )

  for (const [columnIndex, column] of columns.entries()) {
    for (const [level, segment] of column.headerPath.entries()) {
      const isLeaf = level === column.headerPath.length - 1
      const remainingLevels = levelCount - (level + 1)

      matrix[level][columnIndex] = {
        title: segment.title,
        content: segment.content,
        renderColumnContent: segment.renderColumnContent,
        level,
        rowSpan: isLeaf ? Math.max(1, remainingLevels + 1) : 1,
        colSpan: 1,
        startIndex: columnIndex,
        columnIndex: isLeaf ? columnIndex : undefined,
        isLeaf,
      }
    }
  }

  return matrix
}

function mergeMatrixIntoCells(
  matrix: (HeaderCellDescriptor | null)[][],
  levelCount: number
): GridHeaderCell[] {
  const cells: GridHeaderCell[] = []

  for (let level = 0; level < levelCount; level++) {
    const row = matrix[level]
    let current: HeaderCellDescriptor | null = null

    for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
      const stub = row[columnIndex]

      if (!stub) {
        if (current) {
          cells.push(createHeaderCell(current))
          current = null
        }
        continue
      }

      const canMerge =
        current !== null &&
        !stub.isLeaf &&
        !current.isLeaf &&
        current.title === stub.title &&
        current.rowSpan === stub.rowSpan &&
        current.startIndex + current.colSpan === columnIndex

      if (canMerge && current !== null) {
        current.colSpan += 1
        continue
      }

      if (current) {
        cells.push(createHeaderCell(current))
      }

      current = { ...stub }
    }

    if (current) {
      cells.push(createHeaderCell(current))
    }
  }

  return cells
}

function createHeaderCell(descriptor: HeaderCellDescriptor): GridHeaderCell {
  return new GridHeaderCell(
    descriptor.title,
    descriptor.level,
    descriptor.rowSpan,
    descriptor.colSpan,
    descriptor.startIndex,
    descriptor.columnIndex,
    descriptor.isLeaf,
    descriptor.content,
    descriptor.renderColumnContent
  )
}

// ============================================================================
// Column Extraction
// ============================================================================

function extractLeafColumns<RowType extends Record<string, unknown>>(
  columns: BasicGridColumn<RowType>[]
): GridColumn<RowType>[] {
  let autoId = 0
  const getAutoId = () => `column-${autoId++}`
  const leaves: GridColumn<RowType>[] = []

  const visit = (cols: BasicGridColumn<RowType>[], parentSegments: GridHeaderSegment[] = []) => {
    for (const column of cols) {
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
        renderColumnContent: column.renderColumnContent,
      }

      const valueGetter =
        column.valueGetter ??
        (accessorPath
          ? (row: RowType) => resolveAccessorValue(row as Record<string, unknown>, accessorPath)
          : undefined)

      const hasRenderColumnContent = Boolean(column.renderColumnContent)
      const hasRenderCellContent = Boolean(column.renderCellContent)
      const canRenderLeaf =
        (Boolean(valueGetter) || hasRenderColumnContent || hasRenderCellContent) &&
        !hasChildren

      if (canRenderLeaf) {
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
            valueGetter: valueGetter ?? (() => null),
            sortValueGetter: column.sortValueGetter,
            sortComparator: column.sortComparator,
            accessorPath,
            canvasOptions: column.canvasOptions,
            renderColumnContent: column.renderColumnContent,
            renderCellContent: column.renderCellContent,
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
    }
  }

  visit(columns)
  return leaves
}

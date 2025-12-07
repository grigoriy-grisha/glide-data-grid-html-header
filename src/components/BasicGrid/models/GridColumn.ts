import type { ReactElement } from 'react'
import type { BasicGridDataType, CanvasCellOptions, SortDirection } from '../types'

export interface GridHeaderSegment {
  title: string
  content?: React.ReactNode
  renderColumnContent?: () => ReactElement
}

export interface GridColumnOptions<RowType extends Record<string, unknown>> {
  id: string
  title: string
  dataType: BasicGridDataType
  headerPath: GridHeaderSegment[]
  minWidth: number
  baseWidth: number
  grow: number
  sortable: boolean
  formatter?: (value: unknown, row: RowType) => string
  valueGetter: (row: RowType) => unknown
  sortValueGetter?: (row: RowType) => string | number | null | undefined
  sortComparator?: (a: RowType, b: RowType) => number
  accessorPath?: string
  canvasOptions?: CanvasCellOptions<RowType>
  renderColumnContent?: () => ReactElement
  renderCellContent?: (row: RowType, rowIndex: number) => ReactElement
}

const NUMERIC_DATA_TYPES: BasicGridDataType[] = ['number', 'percent']

export class GridColumn<RowType extends Record<string, unknown>> {
  readonly id: string
  readonly title: string
  readonly dataType: BasicGridDataType
  readonly headerPath: GridHeaderSegment[]
  readonly minWidth: number
  readonly baseWidth: number
  readonly grow: number
  readonly sortable: boolean
  readonly accessorPath?: string
  readonly canvasOptions?: CanvasCellOptions<RowType>
  readonly renderColumnContent?: () => ReactElement
  readonly renderCellContent?: (row: RowType, rowIndex: number) => ReactElement

  private readonly formatter?: (value: unknown, row: RowType) => string
  private readonly valueGetter: (row: RowType) => unknown
  private readonly sortValueGetter?: (row: RowType) => string | number | null | undefined
  private readonly sortComparator?: (a: RowType, b: RowType) => number

  constructor(options: GridColumnOptions<RowType>) {
    this.id = options.id
    this.title = options.title
    this.dataType = options.dataType
    this.headerPath = options.headerPath
    this.minWidth = options.minWidth
    this.baseWidth = options.baseWidth
    this.grow = options.grow
    this.sortable = options.sortable
    this.accessorPath = options.accessorPath
    this.canvasOptions = options.canvasOptions
    this.renderColumnContent = options.renderColumnContent
    this.renderCellContent = options.renderCellContent
    this.formatter = options.formatter
    this.valueGetter = options.valueGetter
    this.sortValueGetter = options.sortValueGetter
    this.sortComparator = options.sortComparator
  }

  isNumeric(): boolean {
    return NUMERIC_DATA_TYPES.includes(this.dataType)
  }

  isCanvas(): boolean {
    return this.dataType === 'canvas'
  }

  getValue(row: RowType): unknown {
    return this.valueGetter(row)
  }

  formatValue(row: RowType, rawValue: unknown): string | undefined {
    return this.formatter?.(rawValue, row)
  }

  sortRows(rows: RowType[], direction: SortDirection): RowType[] {
    if (!this.sortable) {
      return rows
    }

    const multiplier = direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => this.compareRows(a, b) * multiplier)
  }

  private getSortValue(row: RowType): string | number | null | undefined {
    if (this.sortValueGetter) {
      return this.sortValueGetter(row)
    }

    const value = this.getValue(row)

    if (value === null || value === undefined) {
      return value
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return value
    }

    return String(value)
  }

  private compareRows(a: RowType, b: RowType): number {
    if (this.sortComparator) {
      return this.sortComparator(a, b)
    }

    const aValue = this.getSortValue(a)
    const bValue = this.getSortValue(b)

    if (this.isNumeric()) {
      const aNumber = typeof aValue === 'number' ? aValue : Number(aValue ?? 0)
      const bNumber = typeof bValue === 'number' ? bValue : Number(bValue ?? 0)
      return aNumber - bNumber
    }

    return String(aValue ?? '').localeCompare(String(bValue ?? ''), 'ru', { sensitivity: 'base' })
  }
}

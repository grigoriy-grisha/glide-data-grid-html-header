import type { ReactElement } from 'react'
import type { BasicGridDataType, BasicGridSelectOption, ButtonCellOptions, CanvasCellOptions, SortDirection } from '../types'
import { resolveAccessorValue } from './utils'

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
  selectOptionsAccessor?: string
  selectOptionsGetter?: (row: RowType) => BasicGridSelectOption[] | undefined
  selectPlaceholder?: string
  buttonOptions?: ButtonCellOptions<RowType>
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
  readonly selectOptionsAccessor?: string
  readonly selectOptionsGetter?: (row: RowType) => BasicGridSelectOption[] | undefined
  readonly selectPlaceholder?: string
  readonly buttonOptions?: ButtonCellOptions<RowType>
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
    this.selectOptionsAccessor = options.selectOptionsAccessor
    this.selectOptionsGetter = options.selectOptionsGetter
    this.selectPlaceholder = options.selectPlaceholder
    this.buttonOptions = options.buttonOptions
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

  isSelect(): boolean {
    return this.dataType === 'select'
  }

  isButton(): boolean {
    return this.dataType === 'button'
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

  getSelectOptions(row: RowType): BasicGridSelectOption[] | undefined {
    if (!this.isSelect()) {
      return undefined
    }

    if (this.selectOptionsGetter) {
      return normalizeSelectOptions(this.selectOptionsGetter(row))
    }

    if (this.selectOptionsAccessor) {
      const source = resolveAccessorValue(row as Record<string, unknown>, this.selectOptionsAccessor)
      return normalizeSelectOptions(source)
    }

    return undefined
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

function normalizeSelectOptions(source: unknown): BasicGridSelectOption[] | undefined {
  if (!source || !Array.isArray(source)) {
    return undefined
  }

  const options: BasicGridSelectOption[] = []

  for (const option of source) {
    if (typeof option === 'string') {
      options.push({ label: option, value: option })
      continue
    }

    if (option && typeof option === 'object') {
      const label = 'label' in option ? String(option.label) : undefined
      const value =
        'value' in option
          ? String(option.value)
          : label ?? String((option as Record<string, unknown>)[0] ?? '')

      if (label || value) {
        options.push({ label: label ?? value, value })
      }
    }
  }

  return options.length > 0 ? options : undefined
}

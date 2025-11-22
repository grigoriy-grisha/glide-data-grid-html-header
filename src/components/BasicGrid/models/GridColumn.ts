import type React from 'react'

import type { BasicGridDataType, SortDirection } from '../types'

export interface GridHeaderSegment {
  title: string
  content?: React.ReactNode
}

interface GridColumnOptions<RowType extends Record<string, unknown>> {
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
}

export class GridColumn<RowType extends Record<string, unknown>> {
  readonly id: string
  readonly title: string
  readonly dataType: BasicGridDataType
  readonly headerPath: GridHeaderSegment[]
  readonly minWidth: number
  readonly baseWidth: number
  readonly grow: number
  readonly sortable: boolean
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
    this.formatter = options.formatter
    this.valueGetter = options.valueGetter
    this.sortValueGetter = options.sortValueGetter
    this.sortComparator = options.sortComparator
  }

  isNumeric() {
    return this.dataType === 'number' || this.dataType === 'percent'
  }

  getValue(row: RowType) {
    return this.valueGetter(row)
  }

  formatValue(row: RowType, rawValue: unknown) {
    return this.formatter ? this.formatter(rawValue, row) : undefined
  }

  private getSortValue(row: RowType) {
    return this.sortValueGetter ? this.sortValueGetter(row) : this.getValue(row)
  }

  private compareRows(a: RowType, b: RowType) {
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

  sortRows(rows: RowType[], direction: SortDirection) {
    if (!this.sortable) {
      return rows
    }

    const multiplier = direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => this.compareRows(a, b) * multiplier)
  }
}


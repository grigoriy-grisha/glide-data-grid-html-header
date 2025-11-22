import type React from 'react'

export type BasicGridDataType = 'string' | 'number' | 'percent'

export interface BasicGridHeaderOptions {
  columnGroupText?: string
  columnGroupContent?: React.ReactNode
}

export interface BasicGridColumn<RowType = Record<string, unknown>> {
  id?: string
  accessor?: keyof RowType | string
  title?: string
  headerContent?: React.ReactNode
  dataType?: BasicGridDataType
  width?: number
  minWidth?: number
  grow?: number
  formatter?: (value: unknown, row: RowType) => string
  valueGetter?: (row: RowType) => unknown
  sortValueGetter?: (row: RowType) => string | number | null | undefined
  sortComparator?: (a: RowType, b: RowType) => number
  sortable?: boolean
  headerOptions?: BasicGridHeaderOptions
  children?: BasicGridColumn<RowType>[]
}

export interface BasicGridProps<RowType = Record<string, unknown>> {
  columns: BasicGridColumn<RowType>[]
  rows: RowType[]
  height?: number
  headerRowHeight?: number
  rowMarkerWidth?: number
  scrollbarReserve?: number
  className?: string
  enableColumnReorder?: boolean
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
}

export type SortDirection = 'asc' | 'desc'

export interface ColumnSelectionRange {
  start: number
  length: number
}


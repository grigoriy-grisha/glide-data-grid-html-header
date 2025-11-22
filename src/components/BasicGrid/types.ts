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

export interface BasicGridTreeOptions<RowType = Record<string, unknown>> {
  /**
   * Column id that should render the tree control. Defaults to the first leaf column.
   */
  treeColumnId?: string
  /**
   * Property name (dot notation is supported) that contains child rows. Defaults to "items".
   */
  childrenKey?: string
  /**
   * Optional accessor for child rows for each node.
   */
  getChildren?: (row: RowType) => RowType[] | undefined
  /**
   * Custom function to resolve a unique identifier for each row. Defaults to using the "id" field or the path index.
   */
  getRowId?: (row: RowType, path: readonly number[]) => string
  /**
   * How many tree levels should be expanded by default. 1 means only roots are expanded.
   */
  defaultExpandedDepth?: number
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
  treeOptions?: BasicGridTreeOptions<RowType>
}

export type SortDirection = 'asc' | 'desc'

export interface ColumnSelectionRange {
  start: number
  length: number
}


import type React from 'react'

export type BasicGridDataType = 'string' | 'number' | 'percent' | 'select' | 'button' | 'canvas'

export interface BasicGridSelectOption {
  label: string
  value: string
}

export interface BasicGridHeaderOptions {
  columnGroupText?: string
  columnGroupContent?: React.ReactNode
}

export interface ButtonCellOptions<RowType = Record<string, unknown>> {
  label?: string | ((row: RowType) => string)
  onClick?: (row: RowType, rowIndex: number) => void
  onMouseEnter?: (row: RowType, rowIndex: number) => void
  onMouseLeave?: (row: RowType, rowIndex: number) => void
  onMouseDown?: (row: RowType, rowIndex: number) => void
  onMouseUp?: (row: RowType, rowIndex: number) => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean | ((row: RowType) => boolean)
}

export interface CanvasCellOptions<RowType = Record<string, unknown>> {
  render: (
    ctx: CanvasRenderingContext2D,
    rect: { x: number; y: number; width: number; height: number },
    theme: any,
    hoverX: number | undefined,
    hoverY: number | undefined,
    row: RowType,
    rowIndex: number
  ) => { hoveredAreas?: Array<{ x: number; y: number; width: number; height: number }> }
  onClick?: (
    x: number,
    y: number,
    rect: { x: number; y: number; width: number; height: number },
    row: RowType,
    rowIndex: number,
    renderData?: any
  ) => boolean
  onMouseEnter?: (row: RowType, rowIndex: number) => void
  onMouseLeave?: (row: RowType, rowIndex: number) => void
  copyData?: string | ((row: RowType) => string)
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
  selectOptionsAccessor?: keyof RowType | string
  selectOptionsGetter?: (row: RowType) => BasicGridSelectOption[] | undefined
  selectPlaceholder?: string
  buttonOptions?: ButtonCellOptions<RowType>
  canvasOptions?: CanvasCellOptions<RowType>
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
  showRowMarkers?: boolean
  scrollbarReserve?: number
  className?: string
  enableColumnReorder?: boolean
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
  treeOptions?: BasicGridTreeOptions<RowType>
  editable?: boolean
  onCellChange?: (change: BasicGridCellChange<RowType>) => void
  enableRowSelection?: boolean
  onRowSelectionChange?: (selection: BasicGridRowSelectionChange<RowType>) => void
  getRowSelectable?: (row: RowType) => boolean
}

export interface BasicGridCellChange<RowType> {
  columnId: string
  accessorPath?: string
  rowIndex: number
  row: RowType
  previousValue: unknown
  nextValue: string
  nextRawValue: unknown
}

export type SortDirection = 'asc' | 'desc'

export interface BasicGridRowSelectionChange<RowType = Record<string, unknown>> {
  rows: RowType[]
  rowIndexes: number[]
}

export interface ColumnSelectionRange {
  start: number
  length: number
}


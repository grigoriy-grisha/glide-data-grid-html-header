import { GridCellKind, type GridCell } from '@glideapps/glide-data-grid'
import type { GridColumn } from './GridColumn'

/**
 * Converts a row value to a GridCell for rendering.
 */
export function createGridCell<RowType extends Record<string, unknown>>(
  column: GridColumn<RowType>,
  row: RowType
): GridCell {
  const rawValue = column.getValue(row)
  const formatted = column.formatValue(row, rawValue)

  if (column.isNumeric()) {
    return createNumericCell(rawValue, formatted, column.dataType)
  }

  return createTextCell(rawValue, formatted)
}

function createNumericCell(
  rawValue: unknown,
  formatted: string | undefined,
  dataType: string
): GridCell {
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0)
  const safeNumber = Number.isFinite(numericValue) ? numericValue : 0

  const displayValue =
    formatted != null
      ? String(formatted)
      : dataType === 'percent'
        ? `${safeNumber}%`
        : safeNumber.toString()

  return {
    kind: GridCellKind.Number,
    data: safeNumber,
    displayData: displayValue,
    allowOverlay: false,
  }
}

function createTextCell(rawValue: unknown, formatted: string | undefined): GridCell {
  const text = formatted != null ? String(formatted) : rawValue == null ? '' : String(rawValue)

  return {
    kind: GridCellKind.Text,
    data: text,
    displayData: text,
    allowOverlay: false,
  }
}

/**
 * @deprecated Use createGridCell function instead.
 */
export class GridCellState<RowType extends Record<string, unknown>> {
  constructor(
    private readonly column: GridColumn<RowType>,
    private readonly row: RowType
  ) {}

  toGridCell(): GridCell {
    return createGridCell(this.column, this.row)
  }
}

import { GridCellKind, type GridCell } from '@glideapps/glide-data-grid'

import { GridColumn } from './GridColumn'

export class GridCellState<RowType extends Record<string, unknown>> {
  constructor(
    private readonly column: GridColumn<RowType>,
    private readonly row: RowType
  ) {}

  toGridCell(): GridCell {
    const rawValue = this.column.getValue(this.row)
    const formatted = this.column.formatValue(this.row, rawValue)

    if (this.column.isNumeric()) {
      const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0)
      const safeNumber = Number.isFinite(numericValue) ? numericValue : 0
      const displayValue =
        formatted != null
          ? String(formatted)
          : this.column.dataType === 'percent'
          ? `${safeNumber}%`
          : safeNumber.toString()

      return {
        kind: GridCellKind.Number,
        data: safeNumber,
        displayData: displayValue,
        allowOverlay: false,
      }
    }

    const text = formatted != null ? String(formatted) : rawValue == null ? '' : String(rawValue)

    return {
      kind: GridCellKind.Text,
      data: text,
      displayData: text,
      allowOverlay: false,
    }
  }
}


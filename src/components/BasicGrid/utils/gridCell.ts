import type { GridCell } from '@glideapps/glide-data-grid'

/**
 * Safely resolves display text for any basic grid cell.
 */
export function getGridCellDisplayText(cell: GridCell): string {
  if ('displayData' in cell && typeof (cell as { displayData?: unknown }).displayData === 'string') {
    return (cell as { displayData?: string }).displayData ?? ''
  }

  if ('data' in cell && typeof (cell as { data?: unknown }).data === 'string') {
    return (cell as { data?: string }).data ?? ''
  }

  return ''
}



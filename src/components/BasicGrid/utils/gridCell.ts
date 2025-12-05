import type { GridCell } from '@glideapps/glide-data-grid'

interface CellWithDisplayData {
  displayData?: string
}

interface CellWithData {
  data?: string
}

export function getGridCellDisplayText(cell: GridCell): string {
  if ('displayData' in cell) {
    const cellWithDisplay = cell as CellWithDisplayData
    if (typeof cellWithDisplay.displayData === 'string') {
      return cellWithDisplay.displayData ?? ''
    }
  }

  if ('data' in cell) {
    const cellWithData = cell as CellWithData
    if (typeof cellWithData.data === 'string') {
      return cellWithData.data ?? ''
    }
  }

  return ''
}



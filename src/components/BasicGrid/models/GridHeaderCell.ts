import type React from 'react'
import type { CanvasNode } from '../components/CanvasHeader/core/CanvasNode'

export class GridHeaderCell {
  constructor(
    public readonly title: string,
    public readonly level: number,
    public readonly rowSpan: number,
    public readonly colSpan: number,
    public readonly startIndex: number,
    public readonly columnIndex: number | undefined,
    public readonly isLeaf: boolean,
    public readonly content?: React.ReactNode,
    public readonly renderColumnContent?: (
      rect: { x: number; y: number; width: number; height: number },
    ) => CanvasNode
  ) {}

  getSpanWidth(columnWidths: number[]) {
    let total = 0
    for (let offset = 0; offset < this.colSpan; offset++) {
      total += columnWidths[this.startIndex + offset] ?? 0
    }
    return total
  }
}


import { GridCellKind, type CustomCell, type CustomRenderer, type GridCell } from '@glideapps/glide-data-grid'

import type { GridTreeNode } from '../models/GridTree'

export const TREE_VIEW_CELL_KIND = 'tree-view-cell'

export interface TreeViewCellData {
  kind: typeof TREE_VIEW_CELL_KIND
  text: string
  depth: number
  hasChildren: boolean
  isExpanded: boolean
}

export type TreeViewCell = CustomCell<TreeViewCellData>

export const treeViewCellRenderer: CustomRenderer<TreeViewCell> = {
  kind: GridCellKind.Custom,
  isMatch: (cell): cell is TreeViewCell =>
    (cell.data as Partial<TreeViewCellData>)?.kind === TREE_VIEW_CELL_KIND,
  draw: (args, cell) => {
    const { ctx, rect, theme, highlighted, cellFillColor } = args
    const { text, depth, hasChildren, isExpanded } = cell.data

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.clip()

    ctx.fillStyle = cellFillColor
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

    const padding = 8
    const indent = depth * 18
    const baseX = rect.x + padding + indent
    const centerY = rect.y + rect.height / 2
    const caretSize = 10

    if (hasChildren) {
      const caretX = baseX
      const caretY = centerY
      ctx.fillStyle = theme.textMedium
      ctx.beginPath()
      if (isExpanded) {
        ctx.moveTo(caretX - caretSize / 2, caretY - caretSize / 4)
        ctx.lineTo(caretX + caretSize / 2, caretY - caretSize / 4)
        ctx.lineTo(caretX, caretY + caretSize / 2)
      } else {
        ctx.moveTo(caretX - caretSize / 4, caretY - caretSize / 2)
        ctx.lineTo(caretX - caretSize / 4, caretY + caretSize / 2)
        ctx.lineTo(caretX + caretSize / 2, caretY)
      }
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.fillStyle = theme.textLight
      ctx.beginPath()
      ctx.arc(baseX, centerY, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = highlighted ? theme.textMedium : theme.textDark
    ctx.font = theme.baseFontFull
    ctx.textBaseline = 'middle'
    const textX = baseX + (hasChildren ? caretSize + 6 : 10)
    const textY = centerY
    const textContent = text ?? ''
    ctx.fillText(textContent, textX, textY)

    ctx.restore()
  },
}

export function createTreeViewCell<RowType>(
  text: string,
  node: GridTreeNode<RowType>
): GridCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    copyData: text,
    data: {
      kind: TREE_VIEW_CELL_KIND,
      text,
      depth: node.depth,
      hasChildren: node.hasChildren,
      isExpanded: node.isExpanded,
    },
  }
}



import { GridCellKind, type CustomCell, type CustomRenderer, type GridCell } from '@glideapps/glide-data-grid'

import type { GridTreeNode } from '../models/GridTree'
import { animateNumericValue, easeInOutCubic } from '../utils/cellAnimations'

export const TREE_VIEW_CELL_KIND = 'tree-view-cell'

export interface TreeViewCellData {
  kind: typeof TREE_VIEW_CELL_KIND
  text: string
  depth: number
  hasChildren: boolean
  isExpanded: boolean
  rowId: string
}

export type TreeViewCell = CustomCell<TreeViewCellData>

const TREE_ICON_WIDTH = 14
const TREE_ICON_GAP = 8
const TREE_TOGGLE_DURATION = 100
const CHEVRON_SVG_PATH = 'M -3.5 -4.25 L 2.75 0 L -3.5 4.25'
let cachedChevronPath: Path2D | null = null

function getChevronPath(): Path2D | null {
  if (typeof Path2D === 'undefined') {
    return null
  }
  if (!cachedChevronPath) {
    cachedChevronPath = new Path2D(CHEVRON_SVG_PATH)
  }
  return cachedChevronPath
}

function strokeChevron(ctx: CanvasRenderingContext2D) {
  const path = getChevronPath()
  if (path) {
    ctx.stroke(path)
    return
  }
  ctx.beginPath()
  ctx.moveTo(-3.5, -4.25)
  ctx.lineTo(2.75, 0)
  ctx.lineTo(-3.5, 4.25)
  ctx.stroke()
}

export const treeViewCellRenderer: CustomRenderer<TreeViewCell> = {
  kind: GridCellKind.Custom,
  needsHoverPosition: true,
  isMatch: (cell): cell is TreeViewCell =>
    (cell.data as Partial<TreeViewCellData>)?.kind === TREE_VIEW_CELL_KIND,
  draw: (args, cell) => {
    const { ctx, rect, theme, highlighted } = args
    const { text, depth, hasChildren, isExpanded, rowId } = cell.data

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.clip()

    const padding = 8
    const indent = depth * 18
    const baseX = rect.x + padding + indent
    const centerY = rect.y + rect.height / 2
    const iconSlotWidth = hasChildren ? TREE_ICON_WIDTH + TREE_ICON_GAP : 12

    if (hasChildren) {
      args.overrideCursor?.('pointer')
      const toggleProgress = animateNumericValue(
        args,
        rowId,
        'tree-toggle',
        isExpanded ? 1 : 0,
        {
          duration: TREE_TOGGLE_DURATION,
          easing: easeInOutCubic,
          initialValue: isExpanded ? 1 : 0,
        }
      )
      const iconCenterX = baseX + TREE_ICON_WIDTH / 2
      const iconCenterY = centerY
      const accentColor = highlighted ? theme.accentColor ?? theme.textMedium : theme.textMedium

      ctx.save()
      ctx.translate(iconCenterX, iconCenterY)
      ctx.rotate(toggleProgress * (Math.PI / 2))
      ctx.strokeStyle = accentColor
      ctx.lineWidth = 1.8
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      strokeChevron(ctx)
      ctx.restore()
    } else {
      ctx.fillStyle = theme.textLight
      ctx.beginPath()
      ctx.arc(baseX + 2, centerY, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = highlighted ? theme.textMedium : theme.textDark
    ctx.font = theme.baseFontFull
    ctx.textBaseline = 'middle'
    const textX = baseX + iconSlotWidth
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
      rowId: node.rowId,
    },
  }
}



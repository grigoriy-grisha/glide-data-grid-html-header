import type { GridCell } from '@glideapps/glide-data-grid'
import { createCanvasCell } from '../customCells/canvasCell/factory'
import { CellCanvasRoot } from '../customCells/canvasCell/CellCanvasRoot'
import { CanvasContainer } from '../components/CanvasHeader/core/CanvasContainer'
import { CanvasText } from '../components/CanvasHeader/primitives/CanvasText'
import { CanvasChevron } from '../components/CanvasHeader/primitives/CanvasChevron'
import { CanvasRect } from '../components/CanvasHeader/primitives/CanvasRect'
import { animateNumericValue, easeInOutCubic } from '../utils/cellAnimations'
import type { GridTreeNode } from '../models/GridTree'
import { buildCanvasTree } from '../components/CanvasHeader/CanvasComponents'

export function createTreeViewCanvasCell<RowType>(
  text: string,
  node: GridTreeNode<RowType>,
  onToggle: () => void,
  renderContent?: (row: RowType) => JSX.Element | null,
  row?: RowType,
): GridCell {
  let cachedCanvasRoot: CellCanvasRoot | null = null

  return createCanvasCell((_ctx, _rect, theme, _hoverX, _hoverY, args) => {
    const { depth, hasChildren, isExpanded, rowId } = node

    let canvasRoot: CellCanvasRoot | null =
      args?.canvasRoot instanceof CellCanvasRoot ? args.canvasRoot : cachedCanvasRoot

    let toggleProgress = isExpanded ? 1 : 0
    if (args && hasChildren) {
      toggleProgress = animateNumericValue(args, rowId, 'tree-toggle', isExpanded ? 1 : 0, {
        duration: 100,
        easing: easeInOutCubic,
        initialValue: isExpanded ? 1 : 0,
      })
    }

    const root = new CanvasContainer('root', {
      direction: 'row',
      alignItems: 'center',
      padding: { left: 8 },
    })
    root.style = { height: _rect.height }

    if (depth > 0) {
      const spacer = new CanvasRect('spacer')
      spacer.style = { width: depth * 18, height: 1 }
      root.addChild(spacer)
    }

    if (hasChildren) {
      const chevronContainer = new CanvasContainer('chevron-container', {
        alignItems: 'center',
        justifyContent: 'center',
      })
      chevronContainer.style = {
        width: 24,
        height: 24,
        flexShrink: 0,
        cursor: 'pointer',
        marginRight: 4,
      }

      chevronContainer.onMouseEnter = () => {
        chevronContainer.backgroundColor = 'rgba(0, 0, 0, 0.06)'
      }
      chevronContainer.onMouseLeave = () => {
        chevronContainer.backgroundColor = 'transparent'
      }

      chevronContainer.onClick = (e) => {
        e.stopPropagation()
        onToggle()
      }

      chevronContainer.onPaint = (batcher, ctx) => {
        if (chevronContainer.backgroundColor !== 'transparent') {
          const { x, y, width, height } = chevronContainer.rect
          const cx = x + width / 2
          const cy = y + height / 2
          const radius = width / 2

          batcher.custom((ctx) => {
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.fillStyle = chevronContainer.backgroundColor
            ctx.fill()
          })
        }

        for (const child of chevronContainer.children) {
          child.paint(batcher, ctx)
        }
      }

      const chevron = new CanvasChevron('chevron', {
        rotation: toggleProgress,
        color: theme.textMedium,
      })
      chevron.hitTest = () => []

      chevronContainer.addChild(chevron)
      root.addChild(chevronContainer)

      const gap = new CanvasRect('chevron-gap')
      gap.style = { width: 4, height: 1 }
      root.addChild(gap)
    } else {
      const spacer = new CanvasRect('placeholder')
      spacer.style = { width: 24 + 4, height: 1, flexShrink: 0 }
      root.addChild(spacer)
    }

    if (renderContent && row) {
      const jsxElement = renderContent(row)
      if (jsxElement) {
        const contentNode = buildCanvasTree(jsxElement, `tree-content-${rowId}`)
        contentNode.style = { flexGrow: 1 }
        root.addChild(contentNode)
      } else {
        const label = new CanvasText('label', text, {
          font: theme.baseFontFull,
          color: theme.textDark,
        })
        label.style = { flexGrow: 1 }
        root.addChild(label)
      }
    } else {
      const label = new CanvasText('label', text, {
        font: theme.baseFontFull,
        color: theme.textDark,
      })
      label.style = { flexGrow: 1 }
      root.addChild(label)
    }

    const originId = `tree-cell-${rowId}`

    if (!canvasRoot) {
      canvasRoot = new CellCanvasRoot(root, originId)
    } else {
      canvasRoot.setRootNode(root)
      canvasRoot.setOriginId(originId)
    }
    cachedCanvasRoot = canvasRoot

    const canvasRect = _ctx.canvas.getBoundingClientRect()
    const absoluteBounds = {
      x: canvasRect.left + _rect.x,
      y: canvasRect.top + _rect.y,
      width: _rect.width,
      height: _rect.height,
    }

    canvasRoot.render(
      _ctx,
      _rect,
      _hoverX !== undefined && _hoverY !== undefined ? { x: _hoverX, y: _hoverY } : undefined,
      absoluteBounds,
    )

    return {
      canvasRoot,
    }
  }, undefined, text)
}

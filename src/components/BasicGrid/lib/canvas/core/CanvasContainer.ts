import { CanvasNode } from './CanvasNode'
import { DrawBatcher } from './DrawBatcher'
import {
    RootFlexBox,
    FlexBox,
    FlexBoxOptions,
    FlexElement,
    FlexStyle,
    PaddingBox,
} from '../miniflex'

const LAYOUT_EPSILON = 0.5
const MAX_LAYOUT_PASSES = 3

const ZERO_PADDING: PaddingBox = { top: 0, right: 0, bottom: 0, left: 0 }

const _addChildStyle: FlexStyle = {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 0,
    alignSelf: 'auto',
    width: undefined,
    height: undefined,
}

const isRowDirection = (direction: FlexBoxOptions['direction'] | undefined): boolean => {
    return direction === undefined || direction === 'row' || direction === 'row-reverse'
}

const resolvePaddingBox = (padding: FlexBoxOptions['padding'] | undefined): PaddingBox => {
    if (padding === undefined) {
        return ZERO_PADDING
    }
    if (typeof padding === 'number') {
        return { top: padding, right: padding, bottom: padding, left: padding }
    }
    return {
        top: padding.top ?? 0,
        right: padding.right ?? 0,
        bottom: padding.bottom ?? 0,
        left: padding.left ?? 0,
    }
}

const computeIntrinsicSize = (
    children: CanvasNode[],
    isRow: boolean,
    gap: number
): { width: number; height: number } => {
    let width = 0
    let height = 0
    const len = children.length

    if (len === 0) {
        return { width, height }
    }

    if (isRow) {
        for (let i = 0; i < len; i++) {
            const childRect = children[i].rect
            width += childRect.width
            if (childRect.height > height) {
                height = childRect.height
            }
        }
        if (len > 1) {
            width += gap * (len - 1)
        }
        return { width, height }
    }

    for (let i = 0; i < len; i++) {
        const childRect = children[i].rect
        height += childRect.height
        if (childRect.width > width) {
            width = childRect.width
        }
    }
    if (len > 1) {
        height += gap * (len - 1)
    }

    return { width, height }
}

export class CanvasContainer extends CanvasNode {
    private _flexOptions: FlexBoxOptions

    private _cachedPadding: PaddingBox = ZERO_PADDING
    private _cachedIsRow: boolean = true
    private _cachedGap: number = 0
    private _optionsCacheValid: boolean = false

    constructor(id: string, flexOptions: FlexBoxOptions = {}) {
        super(id)
        this._flexOptions = flexOptions
        this._invalidateOptionsCache()
    }

    get flexOptions(): FlexBoxOptions {
        return this._flexOptions
    }

    set flexOptions(value: FlexBoxOptions) {
        this._flexOptions = value
        this._invalidateOptionsCache()
        this.markLayoutDirty()
    }

    setFlexOptions(options: Partial<FlexBoxOptions>) {
        Object.assign(this._flexOptions, options)
        this._invalidateOptionsCache()
        this.markLayoutDirty()
    }

    private _invalidateOptionsCache() {
        this._optionsCacheValid = false
    }

    private _ensureOptionsCache() {
        if (this._optionsCacheValid) return

        const opts = this._flexOptions
        this._cachedIsRow = isRowDirection(opts.direction)
        this._cachedGap = this._cachedIsRow ? (opts.columnGap ?? 0) : (opts.rowGap ?? 0)
        this._cachedPadding = resolvePaddingBox(opts.padding)
        this._optionsCacheValid = true
    }

    measure(ctx: CanvasRenderingContext2D) {
        const children = this.children
        const len = children.length

        for (let i = 0; i < len; i++) {
            children[i].measure(ctx)
        }

        this._ensureOptionsCache()
        const { width: contentWidth, height: contentHeight } = computeIntrinsicSize(
            children,
            this._cachedIsRow,
            this._cachedGap
        )
        const padding = this._cachedPadding

        const intrinsicWidth = contentWidth + padding.left + padding.right
        const intrinsicHeight = contentHeight + padding.top + padding.bottom

        this._intrinsicWidth = intrinsicWidth
        this._intrinsicHeight = intrinsicHeight

        const style = this.style
        const styleWidth = style.width
        const styleHeight = style.height

        this.rect.width = typeof styleWidth === 'number' ? styleWidth : intrinsicWidth
        this.rect.height = typeof styleHeight === 'number' ? styleHeight : intrinsicHeight

        if (typeof styleWidth !== 'number') {
            this._clampWidthToParent()
        }

        this.clearMeasureDirty()
    }
    performLayout(ctx: CanvasRenderingContext2D) {
        this.measure(ctx)

        if (this.children.length === 0) {
            this.clearLayoutDirty()
            return
        }

        const root = new RootFlexBox(this.rect.width, this.rect.height, this._flexOptions)
        this._buildFlexTree(this, root)

        let pass = 0
        let needsAnotherPass: boolean
        do {
            root.build()
            needsAnotherPass = this._reconcileLayout(ctx, this, root)
            pass++
        } while (needsAnotherPass && pass < MAX_LAYOUT_PASSES)

        this.clearLayoutDirty()
    }

    private _clampWidthToParent() {
        const parent = this.parent
        if (parent === null || parent.rect.width <= 0) {
            return
        }

        let availableWidth = parent.rect.width
        if (parent instanceof CanvasContainer) {
            parent._ensureOptionsCache()
            const padding = parent._cachedPadding
            availableWidth -= padding.left + padding.right
        }

        availableWidth = Math.max(0, availableWidth)

        if (this.rect.width > availableWidth) {
            this.rect.width = availableWidth
        }
    }

    private _buildFlexTree(cNode: CanvasNode, fBox: FlexBox) {
        const children = cNode.children
        const len = children.length
        const dir = fBox.direction
        const isHorizontal = dir === 'row' || dir === 'row-reverse'
        const parentWidth = fBox.size.width
        const parentHeight = fBox.size.height

        for (let i = 0; i < len; i++) {
            const child = children[i]
            const childStyle = child.style

            const csWidth = childStyle.width
            const csHeight = childStyle.height
            let flexGrow = childStyle.flexGrow ?? 0
            let flexShrink = childStyle.flexShrink ?? 1
            let flexBasis = childStyle.flexBasis ?? 0
            const alignSelf = childStyle.alignSelf ?? 'auto'
            let width: number | undefined = typeof csWidth === 'number' ? csWidth : undefined
            let height: number | undefined = typeof csHeight === 'number' ? csHeight : undefined

            if (csWidth === '100%') {
                if (isHorizontal) {
                    width = undefined
                    if (flexGrow === 0) flexGrow = 1
                } else {
                    width = parentWidth
                }
            }

            if (csHeight === '100%') {
                if (!isHorizontal) {
                    height = undefined
                    if (flexGrow === 0) flexGrow = 1
                } else {
                    height = parentHeight
                }
            }

            if (flexBasis === 0) {
                flexBasis = isHorizontal ? child.rect.width : child.rect.height
            }

            _addChildStyle.flexGrow = flexGrow
            _addChildStyle.flexShrink = flexShrink
            _addChildStyle.flexBasis = flexBasis
            _addChildStyle.alignSelf = alignSelf
            _addChildStyle.width = width
            _addChildStyle.height = height

            if (child instanceof CanvasContainer) {
                const childBox = new FlexBox(0, 0, child._flexOptions)
                childBox.size.width = child.rect.width
                childBox.size.height = child.rect.height

                fBox.addChild(childBox, _addChildStyle)

                this._buildFlexTree(child, childBox)
            } else {
                const leaf = fBox.addChild(_addChildStyle)
                leaf.size.width = child.rect.width
                leaf.size.height = child.rect.height
            }
        }
    }

    private _reconcileLayout(ctx: CanvasRenderingContext2D, cNode: CanvasNode, fNode: FlexElement | FlexBox): boolean {
        let dirty = false

        const parent = cNode.parent
        const parentRect = parent !== null ? parent.rect : this.rect
        const fPos = fNode.position
        const fSize = fNode.size

        const cRect = cNode.rect
        if (cNode !== this) {
            cRect.x = parentRect.x + fPos.x
            cRect.y = parentRect.y + fPos.y
        }
        cRect.width = fSize.width
        cRect.height = fSize.height

        const cChildren = cNode.children
        const hasChildren = cChildren.length > 0
        
        if (hasChildren && fNode instanceof FlexBox) {
            const fChildren = fNode.children
            const len = cChildren.length

            for (let i = 0; i < len; i++) {
                if (this._reconcileLayout(ctx, cChildren[i], fChildren[i] as FlexElement | FlexBox)) {
                    dirty = true
                }
            }

            if (this._updateSizeFromContent(cNode as CanvasContainer, fNode)) {
                const heightDiff = fSize.height - cRect.height
                const widthDiff = fSize.width - cRect.width

                if (Math.abs(heightDiff) > LAYOUT_EPSILON) {
                    fSize.height = cRect.height
                    dirty = true
                }
                if (Math.abs(widthDiff) > LAYOUT_EPSILON) {
                    fSize.width = cRect.width
                    dirty = true
                }
            }
        } else if (!hasChildren) {
            const prevHeight = cRect.height
            const enforcedWidth = cRect.width

            cNode.measure(ctx)
            cRect.width = enforcedWidth

            const heightDiff = cRect.height - prevHeight
            if (Math.abs(heightDiff) > LAYOUT_EPSILON) {
                fSize.height = cRect.height
                dirty = true
            }
        }

        return dirty
    }

    private _updateSizeFromContent(container: CanvasContainer, box: FlexBox | RootFlexBox): boolean {
        container._ensureOptionsCache()
        const rowLayout = container._cachedIsRow
        const padding = container._cachedPadding

        const boxChildren = box.children
        const len = boxChildren.length
        let maxExtent = 0

        if (rowLayout) {
            for (let i = 0; i < len; i++) {
                const child = boxChildren[i]
                const end = child.position.y + child.size.height
                if (end > maxExtent) maxExtent = end
            }

            const contentHeight = maxExtent > 0 ? maxExtent + padding.bottom : 0
            const styleHeight = container.style.height
            const minHeight = typeof styleHeight === 'number' ? styleHeight : 0
            const targetHeight = contentHeight > minHeight ? contentHeight : minHeight

            if (targetHeight > container.rect.height + LAYOUT_EPSILON) {
                container.rect.height = targetHeight
                return true
            }
        } else {
            for (let i = 0; i < len; i++) {
                const child = boxChildren[i]
                const end = child.position.x + child.size.width
                if (end > maxExtent) maxExtent = end
            }

            const contentWidth = maxExtent > 0 ? maxExtent + padding.right : 0
            const styleWidth = container.style.width
            const minWidth = typeof styleWidth === 'number' ? styleWidth : 0
            const targetWidth = contentWidth > minWidth ? contentWidth : minWidth

            if (targetWidth > container.rect.width + LAYOUT_EPSILON) {
                container.rect.width = targetWidth
                return true
            }
        }

        return false
    }
    onPaint(batcher: DrawBatcher, ctx: CanvasRenderingContext2D) {
        for (let i = 0, children = this.children, len = children.length; i < len; i++) {
            children[i].paint(batcher, ctx)
        }
    }
}
export { resolvePaddingBox }
export type { PaddingBox }

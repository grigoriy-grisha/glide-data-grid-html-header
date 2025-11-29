import { CanvasFlexStyle, CanvasNode } from './CanvasNode';
import {
    RootFlexBox,
    FlexBox,
    FlexBoxOptions,
    FlexElement,
    PaddingBox,
} from '../../../miniflex';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LAYOUT_EPSILON = 0.5;
const MAX_LAYOUT_PASSES = 3;

// Zero padding singleton to avoid allocations
const ZERO_PADDING: PaddingBox = { top: 0, right: 0, bottom: 0, left: 0 };

// Reusable style object to avoid allocations in normalizePercentStyle
const _tempStyle: CanvasFlexStyle = {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 0,
    alignSelf: 'auto',
    width: undefined,
    height: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
// Inlined Helper Functions (avoid function call overhead in hot paths)
// ─────────────────────────────────────────────────────────────────────────────

// Faster than optional chaining + nullish coalescing
const isRowDirection = (direction: FlexBoxOptions['direction'] | undefined): boolean => {
    // Direct comparison is faster than startsWith
    return direction === undefined || direction === 'row' || direction === 'row-reverse';
};

// Inline resolvePaddingBox to avoid function call and object creation
const resolvePaddingBox = (padding: FlexBoxOptions['padding'] | undefined): PaddingBox => {
    if (padding === undefined) {
        return ZERO_PADDING;
    }
    if (typeof padding === 'number') {
        // Only create new object when needed
        return { top: padding, right: padding, bottom: padding, left: padding };
    }
    return {
        top: padding.top ?? 0,
        right: padding.right ?? 0,
        bottom: padding.bottom ?? 0,
        left: padding.left ?? 0,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// CanvasContainer
// ─────────────────────────────────────────────────────────────────────────────

export class CanvasContainer extends CanvasNode {
    private _flexOptions: FlexBoxOptions;

    // Cached values to avoid recalculation
    private _cachedPadding: PaddingBox = ZERO_PADDING;
    private _cachedIsRow: boolean = true;
    private _cachedGap: number = 0;
    private _optionsCacheValid: boolean = false;

    constructor(id: string, flexOptions: FlexBoxOptions = {}) {
        super(id);
        this._flexOptions = flexOptions;
        this._invalidateOptionsCache();
    }

    get flexOptions(): FlexBoxOptions {
        return this._flexOptions;
    }

    set flexOptions(value: FlexBoxOptions) {
        this._flexOptions = value;
        this._invalidateOptionsCache();
        this.markLayoutDirty();
    }

    setFlexOptions(options: Partial<FlexBoxOptions>) {
        Object.assign(this._flexOptions, options);
        this._invalidateOptionsCache();
        this.markLayoutDirty();
    }

    private _invalidateOptionsCache() {
        this._optionsCacheValid = false;
    }

    private _ensureOptionsCache() {
        if (this._optionsCacheValid) return;

        const opts = this._flexOptions;
        this._cachedIsRow = isRowDirection(opts.direction);
        this._cachedGap = this._cachedIsRow ? (opts.columnGap ?? 0) : (opts.rowGap ?? 0);
        this._cachedPadding = resolvePaddingBox(opts.padding);
        this._optionsCacheValid = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Measurement
    // ─────────────────────────────────────────────────────────────────────────

    measure(ctx: CanvasRenderingContext2D) {
        const children = this.children;
        const len = children.length;

        // Measure all children first
        for (let i = 0; i < len; i++) {
            children[i].measure(ctx);
        }

        this._ensureOptionsCache();
        const isRow = this._cachedIsRow;
        const gap = this._cachedGap;
        const padding = this._cachedPadding;

        // Compute intrinsic content size inline
        let contentWidth = 0;
        let contentHeight = 0;

        if (len > 0) {
            if (isRow) {
                for (let i = 0; i < len; i++) {
                    const childRect = children[i].rect;
                    contentWidth += childRect.width;
                    if (childRect.height > contentHeight) {
                        contentHeight = childRect.height;
                    }
                }
                // Add gaps (len - 1 gaps)
                if (len > 1) {
                    contentWidth += gap * (len - 1);
                }
            } else {
                for (let i = 0; i < len; i++) {
                    const childRect = children[i].rect;
                    contentHeight += childRect.height;
                    if (childRect.width > contentWidth) {
                        contentWidth = childRect.width;
                    }
                }
                if (len > 1) {
                    contentHeight += gap * (len - 1);
                }
            }
        }

        const intrinsicWidth = contentWidth + padding.left + padding.right;
        const intrinsicHeight = contentHeight + padding.top + padding.bottom;

        // Cache intrinsic size
        this._intrinsicWidth = intrinsicWidth;
        this._intrinsicHeight = intrinsicHeight;

        // Check explicit dimensions (inline for speed)
        const styleWidth = this.style.width;
        const styleHeight = this.style.height;
        const explicitWidth = typeof styleWidth === 'number' ? styleWidth : undefined;
        const explicitHeight = typeof styleHeight === 'number' ? styleHeight : undefined;

        this.rect.width = explicitWidth !== undefined ? explicitWidth : intrinsicWidth;
        this.rect.height = explicitHeight !== undefined ? explicitHeight : intrinsicHeight;

        if (explicitWidth === undefined) {
            this._clampWidthToParent();
        }

        this.clearMeasureDirty();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Layout
    // ─────────────────────────────────────────────────────────────────────────

    performLayout(ctx: CanvasRenderingContext2D) {
        this.measure(ctx);

        // Early exit if no children
        if (this.children.length === 0) {
            this.clearLayoutDirty();
            return;
        }

        // Create flex tree and compute layout using miniflex
        const root = new RootFlexBox(this.rect.width, this.rect.height, this._flexOptions);
        this._buildFlexTree(this, root);

        let pass = 0;
        let needsAnotherPass: boolean;
        do {
            root.build();
            needsAnotherPass = this._reconcileLayout(ctx, this, root);
            pass++;
        } while (needsAnotherPass && pass < MAX_LAYOUT_PASSES);

        this.clearLayoutDirty();
    }

    private _clampWidthToParent() {
        const parent = this.parent;
        if (parent === null || parent.rect.width <= 0) {
            return;
        }

        let availableWidth = parent.rect.width;
        if (parent instanceof CanvasContainer) {
            parent._ensureOptionsCache();
            const padding = parent._cachedPadding;
            availableWidth -= padding.left + padding.right;
        }

        if (this.rect.width > availableWidth) {
            this.rect.width = availableWidth;
        }
    }

    private _buildFlexTree(cNode: CanvasNode, fBox: FlexBox) {
        const children = cNode.children;
        const len = children.length;
        // Direct comparison is faster than startsWith
        const dir = fBox.direction;
        const isHorizontal = dir === 'row' || dir === 'row-reverse';
        const parentWidth = fBox.size.width;
        const parentHeight = fBox.size.height;

        for (let i = 0; i < len; i++) {
            const child = children[i];
            const childStyle = child.style;

            // Inline normalizePercentStyle to avoid object allocation
            // Reuse temp style object
            _tempStyle.flexGrow = childStyle.flexGrow ?? 0;
            _tempStyle.flexShrink = childStyle.flexShrink ?? 1;
            _tempStyle.flexBasis = childStyle.flexBasis ?? 0;
            _tempStyle.alignSelf = childStyle.alignSelf ?? 'auto';
            _tempStyle.width = typeof childStyle.width === 'number' ? childStyle.width : undefined;
            _tempStyle.height = typeof childStyle.height === 'number' ? childStyle.height : undefined;

            // Handle width: '100%'
            if (childStyle.width === '100%') {
                if (isHorizontal) {
                    _tempStyle.width = undefined;
                    if (_tempStyle.flexGrow === 0) _tempStyle.flexGrow = 1;
                    if (_tempStyle.flexShrink === undefined) _tempStyle.flexShrink = 1;
                    if (_tempStyle.flexBasis === 0) _tempStyle.flexBasis = 0;
                } else {
                    _tempStyle.width = parentWidth;
                }
            }

            // Handle height: '100%'
            if (childStyle.height === '100%') {
                if (!isHorizontal) {
                    _tempStyle.height = undefined;
                    if (_tempStyle.flexGrow === 0) _tempStyle.flexGrow = 1;
                    if (_tempStyle.flexShrink === undefined) _tempStyle.flexShrink = 1;
                    if (_tempStyle.flexBasis === 0) _tempStyle.flexBasis = 0;
                } else {
                    _tempStyle.height = parentHeight;
                }
            }

            // Set flexBasis from natural size if not set
            if (_tempStyle.flexBasis === 0 || _tempStyle.flexBasis === undefined) {
                _tempStyle.flexBasis = isHorizontal ? child.rect.width : child.rect.height;
            }

            if (child instanceof CanvasContainer) {
                const childBox = new FlexBox(0, 0, child._flexOptions);
                childBox.size.width = child.rect.width;
                childBox.size.height = child.rect.height;

                // Copy temp style values (faster than object spread)
                fBox.addChild(childBox, {
                    flexGrow: _tempStyle.flexGrow,
                    flexShrink: _tempStyle.flexShrink,
                    flexBasis: _tempStyle.flexBasis,
                    alignSelf: _tempStyle.alignSelf,
                    width: _tempStyle.width,
                    height: _tempStyle.height,
                } as any);

                this._buildFlexTree(child, childBox);
            } else {
                const leaf = fBox.addChild({
                    flexGrow: _tempStyle.flexGrow,
                    flexShrink: _tempStyle.flexShrink,
                    flexBasis: _tempStyle.flexBasis,
                    alignSelf: _tempStyle.alignSelf,
                    width: _tempStyle.width,
                    height: _tempStyle.height,
                } as any);
                leaf.size.width = child.rect.width;
                leaf.size.height = child.rect.height;
            }
        }
    }

    private _reconcileLayout(ctx: CanvasRenderingContext2D, cNode: CanvasNode, fNode: FlexElement | FlexBox): boolean {
        let dirty = false;

        const parentRect = cNode.parent ? cNode.parent.rect : this.rect;
        const fPos = fNode.position;
        const fSize = fNode.size;

        if (cNode !== this) {
            cNode.rect.x = parentRect.x + fPos.x;
            cNode.rect.y = parentRect.y + fPos.y;
            cNode.rect.width = fSize.width;
            cNode.rect.height = fSize.height;
        } else {
            cNode.rect.width = fSize.width;
            cNode.rect.height = fSize.height;
        }

        if (cNode instanceof CanvasContainer && fNode instanceof FlexBox) {
            const cChildren = cNode.children;
            const fChildren = fNode.children;
            const len = cChildren.length;

            for (let i = 0; i < len; i++) {
                if (this._reconcileLayout(ctx, cChildren[i], fChildren[i] as FlexElement | FlexBox)) {
                    dirty = true;
                }
            }

            if (this._updateSizeFromContent(cNode, fNode)) {
                const heightDiff = fSize.height - cNode.rect.height;
                const widthDiff = fSize.width - cNode.rect.width;

                if (heightDiff > LAYOUT_EPSILON || heightDiff < -LAYOUT_EPSILON) {
                    fSize.height = cNode.rect.height;
                    dirty = true;
                }
                if (widthDiff > LAYOUT_EPSILON || widthDiff < -LAYOUT_EPSILON) {
                    fSize.width = cNode.rect.width;
                    dirty = true;
                }
            }
        } else {
            const prevHeight = cNode.rect.height;
            const enforcedWidth = cNode.rect.width;

            cNode.measure(ctx);
            cNode.rect.width = enforcedWidth;

            const heightDiff = cNode.rect.height - prevHeight;
            if (heightDiff > LAYOUT_EPSILON || heightDiff < -LAYOUT_EPSILON) {
                fSize.height = cNode.rect.height;
                dirty = true;
            }
        }

        return dirty;
    }

    private _updateSizeFromContent(container: CanvasContainer, box: FlexBox | RootFlexBox): boolean {
        container._ensureOptionsCache();
        const rowLayout = container._cachedIsRow;
        const padding = container._cachedPadding;

        const boxChildren = box.children;
        const len = boxChildren.length;
        let maxExtent = 0;

        if (rowLayout) {
            for (let i = 0; i < len; i++) {
                const child = boxChildren[i];
                const end = child.position.y + child.size.height;
                if (end > maxExtent) maxExtent = end;
            }

            const contentHeight = maxExtent > 0 ? maxExtent + padding.bottom : 0;
            const styleHeight = container.style.height;
            const minHeight = typeof styleHeight === 'number' ? styleHeight : 0;
            const targetHeight = contentHeight > minHeight ? contentHeight : minHeight;

            if (targetHeight > container.rect.height + LAYOUT_EPSILON) {
                container.rect.height = targetHeight;
                return true;
            }
        } else {
            for (let i = 0; i < len; i++) {
                const child = boxChildren[i];
                const end = child.position.x + child.size.width;
                if (end > maxExtent) maxExtent = end;
            }

            const contentWidth = maxExtent > 0 ? maxExtent + padding.right : 0;
            const styleWidth = container.style.width;
            const minWidth = typeof styleWidth === 'number' ? styleWidth : 0;
            const targetWidth = contentWidth > minWidth ? contentWidth : minWidth;

            if (targetWidth > container.rect.width + LAYOUT_EPSILON) {
                container.rect.width = targetWidth;
                return true;
            }
        }

        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Painting
    // ─────────────────────────────────────────────────────────────────────────

    onPaint(ctx: CanvasRenderingContext2D) {
        const children = this.children;
        const len = children.length;
        for (let i = 0; i < len; i++) {
            children[i].paint(ctx);
        }
    }
}

// Re-export for convenience
export { resolvePaddingBox };
export type { PaddingBox };

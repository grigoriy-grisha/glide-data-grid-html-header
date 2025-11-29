import { CanvasFlexStyle, CanvasNode, DimensionValue } from './CanvasNode';
import {
    RootFlexBox,
    FlexBox,
    FlexBoxOptions,
    FlexElement,
    resolvePaddingBox,
} from '../../../miniflex';

const LAYOUT_EPSILON = 0.5;
const MAX_LAYOUT_PASSES = 3;

const numericDimension = (value: DimensionValue | undefined) =>
    typeof value === 'number' ? value : undefined;

const isRowDirection = (direction?: FlexBoxOptions['direction']) =>
    direction?.startsWith('row') ?? true;

const gapForDirection = (options: FlexBoxOptions, isRow: boolean) =>
    isRow ? options.columnGap ?? 0 : options.rowGap ?? 0;

const computeIntrinsicContentSize = (children: CanvasNode[], isRow: boolean, gap: number) => {
    let contentWidth = 0;
    let contentHeight = 0;

    if (isRow) {
        children.forEach((child, index) => {
            contentWidth += child.rect.width;
            contentHeight = Math.max(contentHeight, child.rect.height);
            if (index < children.length - 1) {
                contentWidth += gap;
            }
        });
    } else {
        children.forEach((child, index) => {
            contentHeight += child.rect.height;
            contentWidth = Math.max(contentWidth, child.rect.width);
            if (index < children.length - 1) {
                contentHeight += gap;
            }
        });
    }

    return { contentWidth, contentHeight };
};

const normalizePercentStyle = (style: CanvasFlexStyle, parentBox: FlexBox | RootFlexBox): CanvasFlexStyle => {
    const normalized: CanvasFlexStyle = { ...style };
    const parentIsRow = parentBox.direction.startsWith('row');

    if (normalized.width === '100%') {
        if (parentIsRow) {
            normalized.width = undefined;
            if (normalized.flexGrow === undefined || normalized.flexGrow === 0) {
                normalized.flexGrow = 1;
            }
            if (normalized.flexShrink === undefined) {
                normalized.flexShrink = 1;
            }
            if (normalized.flexBasis === undefined) {
                normalized.flexBasis = 0;
            }
        } else {
            normalized.width = parentBox.size.width;
        }
    }

    if (normalized.height === '100%') {
        if (!parentIsRow) {
            normalized.height = undefined;
            if (normalized.flexGrow === undefined || normalized.flexGrow === 0) {
                normalized.flexGrow = 1;
            }
            if (normalized.flexShrink === undefined) {
                normalized.flexShrink = 1;
            }
            if (normalized.flexBasis === undefined) {
                normalized.flexBasis = 0;
            }
        } else {
            normalized.height = parentBox.size.height;
        }
    }

    return normalized;
};

export class CanvasContainer extends CanvasNode {
    flexOptions: FlexBoxOptions;

    constructor(id: string, flexOptions: FlexBoxOptions = {}) {
        super(id);
        this.flexOptions = flexOptions;
    }

    measure(ctx: CanvasRenderingContext2D) {
        this.children.forEach(child => child.measure(ctx));

        const isRow = isRowDirection(this.flexOptions.direction);
        const gap = gapForDirection(this.flexOptions, isRow);
        const padding = resolvePaddingBox(this.flexOptions.padding);
        const { contentWidth, contentHeight } = computeIntrinsicContentSize(this.children, isRow, gap);

        const intrinsicWidth = contentWidth + padding.left + padding.right;
        const intrinsicHeight = contentHeight + padding.top + padding.bottom;

        const explicitWidth = numericDimension(this.style.width);
        const explicitHeight = numericDimension(this.style.height);

        this.rect.width = explicitWidth ?? intrinsicWidth;
        this.rect.height = explicitHeight ?? intrinsicHeight;

        if (explicitWidth === undefined) {
            this.clampWidthToParent();
        }
    }

    performLayout(ctx: CanvasRenderingContext2D) {
        this.measure(ctx);

        const root = new RootFlexBox(this.rect.width, this.rect.height, this.flexOptions);
        this.buildFlexTree(this, root);

        let pass = 0;
        let needsAnotherPass = false;
        do {
            root.build();
            needsAnotherPass = this.reconcileLayout(ctx, this, root);
            pass += 1;
        } while (needsAnotherPass && pass < MAX_LAYOUT_PASSES);
    }

    private clampWidthToParent() {
        if (!this.parent || this.parent.rect.width <= 0) {
            return;
        }

        let availableWidth = this.parent.rect.width;
        if (this.parent instanceof CanvasContainer) {
            const padding = resolvePaddingBox(this.parent.flexOptions.padding);
            availableWidth -= padding.left + padding.right;
        }

        if (this.rect.width > availableWidth) {
            this.rect.width = availableWidth;
        }
    }

    private buildFlexTree(cNode: CanvasNode, fBox: FlexBox) {
        const isHorizontal = fBox.direction.startsWith('row');

        cNode.children.forEach(child => {
            const style = normalizePercentStyle({ ...child.style }, fBox);

            if (style.flexBasis === 0 || style.flexBasis === undefined) {
                const naturalWidth = child.rect.width;
                const naturalHeight = child.rect.height;
                const naturalMainSize = isHorizontal ? naturalWidth : naturalHeight;
                style.flexBasis = naturalMainSize;
            }

            if (child instanceof CanvasContainer) {
                const childBox = new FlexBox(0, 0, child.flexOptions);
                childBox.size.width = child.rect.width;
                childBox.size.height = child.rect.height;

                fBox.addChild(childBox, style as any);
                this.buildFlexTree(child, childBox);
            } else {
                const leaf = fBox.addChild(style as any);
                leaf.size.width = child.rect.width;
                leaf.size.height = child.rect.height;
            }
        });
    }

    private reconcileLayout(ctx: CanvasRenderingContext2D, cNode: CanvasNode, fNode: FlexElement | FlexBox): boolean {
        let dirty = false;

        const parentX = cNode.parent ? cNode.parent.rect.x : this.rect.x;
        const parentY = cNode.parent ? cNode.parent.rect.y : this.rect.y;

        if (cNode !== this) {
            cNode.rect.x = parentX + fNode.position.x;
            cNode.rect.y = parentY + fNode.position.y;
            cNode.rect.width = fNode.size.width;
            cNode.rect.height = fNode.size.height;
        } else {
            cNode.rect.width = fNode.size.width;
            cNode.rect.height = fNode.size.height;
        }

        if (cNode instanceof CanvasContainer && fNode instanceof FlexBox) {
            for (let i = 0; i < cNode.children.length; i++) {
                dirty = this.reconcileLayout(ctx, cNode.children[i], fNode.children[i] as FlexElement | FlexBox) || dirty;
            }

            const resized = this.updateSizeFromContent(cNode, fNode);
            if (resized) {
                if (Math.abs(fNode.size.height - cNode.rect.height) > LAYOUT_EPSILON) {
                    fNode.size.height = cNode.rect.height;
                    dirty = true;
                }
                if (Math.abs(fNode.size.width - cNode.rect.width) > LAYOUT_EPSILON) {
                    fNode.size.width = cNode.rect.width;
                    dirty = true;
                }
            }
        } else {
            const prevHeight = cNode.rect.height;
            const enforcedWidth = cNode.rect.width;

            cNode.measure(ctx);
            cNode.rect.width = enforcedWidth;

            if (Math.abs(cNode.rect.height - prevHeight) > LAYOUT_EPSILON) {
                fNode.size.height = cNode.rect.height;
                dirty = true;
            }
        }

        return dirty;
    }

    private updateSizeFromContent(container: CanvasContainer, box: FlexBox | RootFlexBox) {
        const rowLayout = isRowDirection(container.flexOptions.direction);
        const padding = resolvePaddingBox(container.flexOptions.padding);

        let maxExtent = 0;
        box.children.forEach(child => {
            const start = rowLayout ? child.position.y : child.position.x;
            const end = start + (rowLayout ? child.size.height : child.size.width);
            maxExtent = Math.max(maxExtent, end);
        });

        if (rowLayout) {
            const contentHeight = Math.max(0, maxExtent + padding.bottom);
            const minHeight = numericDimension(container.style.height) ?? 0;
            const targetHeight = Math.max(minHeight, contentHeight);
            if (targetHeight > container.rect.height + LAYOUT_EPSILON) {
                container.rect.height = targetHeight;
                return true;
            }
        } else {
            const contentWidth = Math.max(0, maxExtent + padding.right);
            const minWidth = numericDimension(container.style.width) ?? 0;
            const targetWidth = Math.max(minWidth, contentWidth);
            if (targetWidth > container.rect.width + LAYOUT_EPSILON) {
                container.rect.width = targetWidth;
                return true;
            }
        }

        return false;
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        this.children.forEach(child => child.paint(ctx));
    }
}

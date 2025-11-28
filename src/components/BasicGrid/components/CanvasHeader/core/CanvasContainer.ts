import { CanvasNode } from './CanvasNode';
import { RootFlexBox, FlexBox, FlexBoxOptions, FlexElement } from '../../../miniflex';

export class CanvasContainer extends CanvasNode {
    flexOptions: FlexBoxOptions;

    constructor(id: string, flexOptions: FlexBoxOptions = {}) {
        super(id);
        this.flexOptions = flexOptions;
    }

    measure(ctx: CanvasRenderingContext2D) {
        // 1. Measure all children first to get their intrinsic sizes
        this.children.forEach(child => child.measure(ctx));

        // 2. Compute Intrinsic Size of this container based on children
        const isRow = this.flexOptions.direction?.startsWith('row') ?? true;
        const gap = isRow ? (this.flexOptions.columnGap ?? 0) : (this.flexOptions.rowGap ?? 0);
        const padding = this.flexOptions.padding;

        let pTop = 0, pBottom = 0, pLeft = 0, pRight = 0;
        if (typeof padding === 'number') {
            pTop = pRight = pBottom = pLeft = padding;
        } else if (padding) {
            pTop = padding.top ?? 0;
            pBottom = padding.bottom ?? 0;
            pLeft = padding.left ?? 0;
            pRight = padding.right ?? 0;
        }

        let contentWidth = 0;
        let contentHeight = 0;

        if (isRow) {
            // Row: Sum widths, Max height
            this.children.forEach((child, i) => {
                contentWidth += child.rect.width;
                contentHeight = Math.max(contentHeight, child.rect.height);
                if (i < this.children.length - 1) contentWidth += gap;
            });
        } else {
            // Column: Sum heights, Max width
            this.children.forEach((child, i) => {
                contentHeight += child.rect.height;
                contentWidth = Math.max(contentWidth, child.rect.width);
                if (i < this.children.length - 1) contentHeight += gap;
            });
        }

        const intrinsicWidth = contentWidth + pLeft + pRight;
        const intrinsicHeight = contentHeight + pTop + pBottom;

        // 3. Update rect
        // If style is set, use it. Otherwise use intrinsic.
        this.rect.width = (this.style.width !== undefined) ? this.style.width : intrinsicWidth;
        this.rect.height = (this.style.height !== undefined) ? this.style.height : intrinsicHeight;

        // Clamp to parent width if we are not explicitly sized and we are overflowing
        if (this.style.width === undefined && this.parent && this.parent.rect.width > 0) {
            let availableWidth = this.parent.rect.width;

            // Account for parent's padding if it's a container
            if (this.parent instanceof CanvasContainer) {
                const parentPadding = this.parent.flexOptions.padding;
                let parentPLeft = 0, parentPRight = 0;

                if (typeof parentPadding === 'number') {
                    parentPLeft = parentPRight = parentPadding;
                } else if (parentPadding) {
                    parentPLeft = parentPadding.left ?? 0;
                    parentPRight = parentPadding.right ?? 0;
                }

                availableWidth -= (parentPLeft + parentPRight);
            }

            if (this.rect.width > availableWidth) {
                this.rect.width = availableWidth;
            }
        }
    }

    // Perform layout on children
    performLayout(ctx: CanvasRenderingContext2D) {
        // 1. Measure self and children (Pass 0)
        this.measure(ctx);

        // Helper to build the flex tree
        const buildTree = (cNode: CanvasNode, fBox: FlexBox) => {
            const isHorizontal = fBox.direction.startsWith('row');

            cNode.children.forEach(child => {
                // Prepare style
                const style = { ...child.style };

                // Auto-calculate flexBasis if not set
                if (style.flexBasis === 0 || style.flexBasis === undefined) {
                    const naturalWidth = child.rect.width;
                    const naturalHeight = child.rect.height;
                    const naturalMainSize = isHorizontal ? naturalWidth : naturalHeight;
                    style.flexBasis = naturalMainSize;
                }

                if (child instanceof CanvasContainer) {
                    const childBox = new FlexBox(0, 0, child.flexOptions);
                    childBox.style = style as any;
                    // Assign the measured size to the FlexBox so it's used if not stretched
                    childBox.size.width = child.rect.width;
                    childBox.size.height = child.rect.height;
                    fBox.addChild(childBox);

                    // Recurse
                    buildTree(child, childBox);
                } else {
                    // Leaf
                    const leaf = fBox.addChild(style);
                    // Assign the measured size to the FlexElement
                    leaf.size.width = child.rect.width;
                    leaf.size.height = child.rect.height;
                }
            });
        }

        // 2. Build Layout Tree
        const root = new RootFlexBox(this.rect.width, this.rect.height, this.flexOptions);
        buildTree(this, root);

        // 3. Build Layout
        root.build();

        // 4. Apply back to CanvasNodes
        const applyLayout = (cNode: CanvasNode, fNode: FlexElement | FlexBox) => {
            const parentX = cNode.parent ? cNode.parent.rect.x : this.rect.x;
            const parentY = cNode.parent ? cNode.parent.rect.y : this.rect.y;

            if (cNode !== this) {
                cNode.rect.x = parentX + fNode.position.x;
                cNode.rect.y = parentY + fNode.position.y;
                cNode.rect.width = fNode.size.width;
                cNode.rect.height = fNode.size.height;
            }

            // Re-measure if the node size changed significantly, especially for wrapped text
            if (!(cNode instanceof CanvasContainer)) {
                cNode.measure(ctx);
            }

            if (cNode instanceof CanvasContainer && fNode instanceof FlexBox) {
                for (let i = 0; i < cNode.children.length; i++) {
                    applyLayout(cNode.children[i], fNode.children[i] as any);
                }

                // Update container height from children if not fixed
                // This helps when children wrap/grow and expand the container vertically (in column or row)
                // Since flexbox layout computed positions, we can infer the bounds.
                // But fNode.size should already reflect that? 
                // Miniflex doesn't always update container size to fit content if it started fixed?
                // But let's trust fNode.size first (which we applied above).

                // If the flexbox result (fNode.size) is 0 height (because it didn't expand?), 
                // we might want to re-measure based on actual children positions.
                // But applying fNode.size should be enough if miniflex works correctly.
            }
        }

        // Apply to children
        for (let i = 0; i < this.children.length; i++) {
            applyLayout(this.children[i], root.children[i] as any);
        }
    }

    paint(ctx: CanvasRenderingContext2D) {
        this.children.forEach(child => child.paint(ctx));
    }
}

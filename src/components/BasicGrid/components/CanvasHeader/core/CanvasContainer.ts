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
        // NOTE: This is a "naive" measurement that assumes no wrapping (single line).
        // It's useful for "auto" sizing when no constraints are present, but 
        // for wrapping containers, the actual size will be determined by performLayout.
        
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

        // 3. Update rect with intrinsic size initially
        // This might be overwritten by layout constraints later
        this.rect.width = (this.style.width !== undefined) ? this.style.width : intrinsicWidth;
        this.rect.height = (this.style.height !== undefined) ? this.style.height : intrinsicHeight;

        // 4. Apply Parent Constraints (Clamp)
        // If we have a parent and we are not fixed size, clamp to available space.
        // This is critical for 'flex-wrap' to know when to wrap.
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

            // If intrinsic width is larger than available, clamp it.
            // This effectively tells the layout engine "You only have this much space".
            if (this.rect.width > availableWidth) {
                this.rect.width = availableWidth;
            }
        }
    }

    // Perform layout on children
    performLayout(ctx: CanvasRenderingContext2D) {
        // 1. Measure self (and children recursively) to determine initial constraints and intrinsic sizes
        this.measure(ctx);

        // 2. Build Flex Tree using the (potentially clamped) rect dimensions
        // The root flex box needs the constraint dimensions to calculate wrapping.
        const root = new RootFlexBox(this.rect.width, this.rect.height, this.flexOptions);

        // Helper to build the flex tree
        const buildTree = (cNode: CanvasNode, fBox: FlexBox) => {
            const isHorizontal = fBox.direction.startsWith('row');

            cNode.children.forEach(child => {
                // Prepare style
                const style = { ...child.style };

                // Auto-calculate flexBasis if not set
                // For wrapping to work, we must respect the natural size of items.
                if (style.flexBasis === 0 || style.flexBasis === undefined) {
                    const naturalWidth = child.rect.width;
                    const naturalHeight = child.rect.height;
                    const naturalMainSize = isHorizontal ? naturalWidth : naturalHeight;
                    style.flexBasis = naturalMainSize;
                }

                if (child instanceof CanvasContainer) {
                    // Nested Flex Container
                    // We pass 0,0 initially, but minflex will size it based on children?
                    // Actually for nested containers, we usually want them to act as items.
                    const childBox = new FlexBox(0, 0, child.flexOptions);
                    childBox.style = style as any;
                    
                    // Assign the measured size to the FlexBox so it's used if not stretched
                    // This allows 'auto' sized nested containers to contribute their size
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

        buildTree(this, root);

        const EPSILON = 0.5;
        const MAX_LAYOUT_PASSES = 3;

        // Helper to update container size based on children content (Post-Layout Expansion)
        const updateSizeFromContent = (container: CanvasContainer, box: FlexBox | RootFlexBox) => {
            const isRow = container.flexOptions.direction?.startsWith('row') ?? true;
            const padding = container.flexOptions.padding;

            let pBottom = 0, pRight = 0;
            if (typeof padding === 'number') {
                pBottom = pRight = padding;
            } else if (padding) {
                pBottom = padding.bottom ?? 0;
                pRight = padding.right ?? 0;
            }

            let maxExtent = 0;
            if (box.children.length > 0) {
                box.children.forEach(child => {
                    const start = isRow ? child.position.y : child.position.x;
                    const end = start + (isRow ? child.size.height : child.size.width);
                    maxExtent = Math.max(maxExtent, end);
                });
            }

            if (isRow) {
                const contentHeight = Math.max(0, maxExtent + pBottom);
                const minHeight = container.style.height ?? 0;
                const targetHeight = Math.max(minHeight, contentHeight);
                if (targetHeight > container.rect.height + EPSILON) {
                    container.rect.height = targetHeight;
                    return true;
                }
            } else {
                const contentWidth = Math.max(0, maxExtent + pRight);
                const minWidth = container.style.width ?? 0;
                const targetWidth = Math.max(minWidth, contentWidth);
                if (targetWidth > container.rect.width + EPSILON) {
                    container.rect.width = targetWidth;
                    return true;
                }
            }

            return false;
        };

        // Apply computed layout back to CanvasNodes and detect if a second pass is required
        const reconcileLayout = (cNode: CanvasNode, fNode: FlexElement | FlexBox): boolean => {
            let dirty = false;

            const parentX = cNode.parent ? cNode.parent.rect.x : this.rect.x;
            const parentY = cNode.parent ? cNode.parent.rect.y : this.rect.y;

            if (cNode !== this) {
                cNode.rect.x = parentX + fNode.position.x;
                cNode.rect.y = parentY + fNode.position.y;
                cNode.rect.width = fNode.size.width;
                cNode.rect.height = fNode.size.height;
            } else {
                // Root container width/height should follow flex result
                cNode.rect.width = fNode.size.width;
                cNode.rect.height = fNode.size.height;
            }

            if (cNode instanceof CanvasContainer && fNode instanceof FlexBox) {
                for (let i = 0; i < cNode.children.length; i++) {
                    dirty = reconcileLayout(cNode.children[i], fNode.children[i] as any) || dirty;
                }

                const resized = updateSizeFromContent(cNode, fNode);
                if (resized) {
                    if (Math.abs(fNode.size.height - cNode.rect.height) > EPSILON) {
                        fNode.size.height = cNode.rect.height;
                        dirty = true;
                    }
                    if (Math.abs(fNode.size.width - cNode.rect.width) > EPSILON) {
                        fNode.size.width = cNode.rect.width;
                        dirty = true;
                    }
                }
            } else {
                const prevHeight = cNode.rect.height;
                const enforcedWidth = cNode.rect.width;

                // Re-measure with updated width constraint to account for wrapping text
                cNode.measure(ctx);
                cNode.rect.width = enforcedWidth; // keep width assigned by flex

                if (Math.abs(cNode.rect.height - prevHeight) > EPSILON) {
                    fNode.size.height = cNode.rect.height;
                    dirty = true;
                }
            }

            return dirty;
        };

        let pass = 0;
        let needsAnotherPass = false;
        do {
            root.build();
            needsAnotherPass = reconcileLayout(this, root);
            pass += 1;
        } while (needsAnotherPass && pass < MAX_LAYOUT_PASSES);
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        this.children.forEach(child => child.paint(ctx));
    }
}

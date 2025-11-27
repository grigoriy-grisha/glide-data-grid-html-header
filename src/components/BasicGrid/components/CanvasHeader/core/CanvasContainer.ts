import { CanvasNode } from './CanvasNode';
import { RootFlexBox, FlexBox, FlexBoxOptions, FlexElement } from '../../../miniflex';

export class CanvasContainer extends CanvasNode {
    flexOptions: FlexBoxOptions;

    constructor(id: string, flexOptions: FlexBoxOptions = {}) {
        super(id);
        this.flexOptions = flexOptions;
    }

    measure(ctx: CanvasRenderingContext2D) {
        // Containers usually don't measure themselves based on content in the same way leaves do
        // They are sized by their parent or by the layout engine.
    }

    // Perform layout on children
    performLayout(ctx: CanvasRenderingContext2D) {
        // 1. Measure all children first (leaves need to calculate their natural size)
        const measureRecursive = (node: CanvasNode) => {
            node.measure(ctx);
            if (node instanceof CanvasContainer) {
                node.children.forEach(measureRecursive);
            }
        }
        this.children.forEach(measureRecursive);

        // 2. Create Flex Tree
        const root = new RootFlexBox(this.rect.width, this.rect.height, this.flexOptions);

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

            if (cNode instanceof CanvasContainer && fNode instanceof FlexBox) {
                for (let i = 0; i < cNode.children.length; i++) {
                    applyLayout(cNode.children[i], fNode.children[i] as any);
                }
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

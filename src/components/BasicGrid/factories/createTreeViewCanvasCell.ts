import { GridCell } from "@glideapps/glide-data-grid";
import { createCanvasCell } from "../customCells/canvasCell/factory";
import { CellCanvasRoot } from "../customCells/canvasCell/CellCanvasRoot";
import { CanvasContainer } from "../components/CanvasHeader/core/CanvasContainer";
import { CanvasText } from "../components/CanvasHeader/primitives/CanvasText";
import { CanvasChevron } from "../components/CanvasHeader/primitives/CanvasChevron";
import { CanvasRect } from "../components/CanvasHeader/primitives/CanvasRect";
import { animateNumericValue, easeInOutCubic } from "../utils/cellAnimations";
import { GridTreeNode } from "../models/GridTree";
import { buildCanvasTree } from "../components/CanvasHeader/CanvasComponents";

export function createTreeViewCanvasCell<RowType>(
    text: string,
    node: GridTreeNode<RowType>,
    onToggle: () => void,
    renderContent?: (row: RowType) => JSX.Element | null,
    row?: RowType
): GridCell {
    return createCanvasCell((_ctx, _rect, theme, _hoverX, _hoverY, args) => {
        const { depth, hasChildren, isExpanded, rowId } = node;

        // Retrieve persisted state for this cell
        // We need a stable way to store/retrieve state across renders.
        // Currently, the renderer infrastructure handles `args.drawState` which we use for animations.
        // But `createCanvasCell` is called on every render cycle by `useGridCellContent`.
        // The `render` function inside is also called on every paint.
        
        // For interactive state like hover, we need `CellCanvasRoot` to persist between frames or 
        // we need to use the `args` passed to render which comes from `renderer.ts` -> `retrieveRenderData`.
        
        // `renderer.ts` calls `storeRenderData(cellId, cell, renderResult)`.
        // The `renderResult` contains `canvasRoot`.
        // If we reuse the existing `canvasRoot`, we preserve the state (hoveredNode, etc).
        
        let canvasRoot: CellCanvasRoot | undefined;
        if (args?.canvasRoot instanceof CellCanvasRoot) {
             canvasRoot = args.canvasRoot;
             // Update the existing root layout/style if needed, but usually we rebuild for data changes.
             // If we rebuild, we lose internal state like `hoveredNode` unless we copy it.
             // However, `CellCanvasRoot` handles `mousemove` every frame in `draw` -> `dispatchPointerEvent`.
             // So `hoveredNode` should be re-calculated correctly if we pass the hover position.
        }
        
        // Animation for toggle
        let toggleProgress = isExpanded ? 1 : 0;
        // Only animate if we have args (draw cycle) and it's a node with children
        if (args && hasChildren) {
             toggleProgress = animateNumericValue(
                args,
                rowId,
                'tree-toggle',
                isExpanded ? 1 : 0,
                {
                  duration: 100,
                  easing: easeInOutCubic,
                  initialValue: isExpanded ? 1 : 0,
                }
             );
        }

        const root = new CanvasContainer("root", {
            direction: "row",
            alignItems: "center",
            padding: { left: 8 }
        });
        root.style = { height: _rect.height };

        // Indentation
        if (depth > 0) {
            const spacer = new CanvasRect("spacer");
            // 18px per depth level
            spacer.style = { width: depth * 18, height: 1 };
            root.addChild(spacer);
        }

        // Chevron or placeholder
        if (hasChildren) {
            // Wrapper for chevron to handle hover and click area
            const chevronContainer = new CanvasContainer("chevron-container", {
                alignItems: "center",
                justifyContent: "center"
            });
            chevronContainer.style = { 
                width: 24, 
                height: 24, 
                flexShrink: 0, 
                cursor: 'pointer',
                marginRight: 4
            };
            
            // Hover effect
            chevronContainer.onMouseEnter = () => {
                chevronContainer.backgroundColor = "rgba(0, 0, 0, 0.06)";
            };
            chevronContainer.onMouseLeave = () => {
                chevronContainer.backgroundColor = "transparent";
            };
            
            // Click handler on container for larger hit area
            chevronContainer.onClick = (e) => {
                e.stopPropagation();
                onToggle();
            };
            
            // Circular background using borderRadius (requires support in DrawBatcher/CanvasNode or simulating via custom paint)
            // Since standard CanvasContainer draws rect background, we'll use a custom paint or rely on roundedRect if supported by container
            // For now, let's subclass CanvasContainer or just use the container as is but add custom paint for circle
            
            // Actually, let's use a custom CanvasNode for the button background + chevron
            // Or just modify the chevronContainer to draw a circle
            chevronContainer.onPaint = (batcher, ctx) => {
                if (chevronContainer.backgroundColor !== "transparent") {
                     const { x, y, width, height } = chevronContainer.rect;
                     const cx = x + width / 2;
                     const cy = y + height / 2;
                     const radius = width / 2;
                     
                     batcher.custom(ctx => {
                         ctx.beginPath();
                         ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                         ctx.fillStyle = chevronContainer.backgroundColor;
                         ctx.fill();
                     });
                }
                // Call default paint to draw children (the chevron itself)
                // But CanvasContainer.paint calls onPaint then children. 
                // If we override onPaint we need to ensure children are painted? 
                // Wait, CanvasNode.paint calls onPaint. CanvasContainer.onPaint iterates children.
                // So if we override onPaint in a Container, we must call super.onPaint or manually iterate children.
                // Let's manually iterate since super.onPaint is simple.
                for (const child of chevronContainer.children) {
                    child.paint(batcher, ctx);
                }
            };

            const chevron = new CanvasChevron("chevron", {
                rotation: toggleProgress,
                color: theme.textMedium
            });
            // Disable hit testing on the chevron itself so the container handles all interactions
            // This prevents the container's onMouseLeave from firing when hovering the chevron
            chevron.hitTest = () => [];
            
            chevronContainer.addChild(chevron);
            
            root.addChild(chevronContainer);

            // Gap after chevron (reduced because container has width)
            const gap = new CanvasRect("chevron-gap");
            gap.style = { width: 4, height: 1 };
            root.addChild(gap);
        } else {
             // Placeholder for alignment (12px) + Gap (8px)
             const spacer = new CanvasRect("placeholder");
             // Match chevron container width (24) + gap (4)
             spacer.style = { width: 24 + 4, height: 1, flexShrink: 0 };
             root.addChild(spacer);
        }

        // Content
        if (renderContent && row) {
            const jsxElement = renderContent(row);
            if (jsxElement) {
                const contentNode = buildCanvasTree(jsxElement, `tree-content-${rowId}`);
                contentNode.style = { flexGrow: 1 };
                root.addChild(contentNode);
            } else {
                 const label = new CanvasText("label", text, {
                    font: theme.baseFontFull,
                    color: theme.textDark
                });
                label.style = { flexGrow: 1 };
                root.addChild(label);
            }
        } else {
            const label = new CanvasText("label", text, {
                font: theme.baseFontFull,
                color: theme.textDark
            });
            label.style = { flexGrow: 1 };
            root.addChild(label);
        }

        if (!canvasRoot) {
             canvasRoot = new CellCanvasRoot(root);
        } else {
             canvasRoot.setRootNode(root);
        }
        
        // Draw the canvas root
        canvasRoot.render(
            _ctx,
            _rect,
            (_hoverX !== undefined && _hoverY !== undefined) ? { x: _hoverX, y: _hoverY } : undefined
        );

        return {
            canvasRoot
        };
    },
    undefined,
    text // copyData
    );
}

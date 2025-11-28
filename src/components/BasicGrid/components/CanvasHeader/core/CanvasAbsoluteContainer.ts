import { CanvasContainer } from './CanvasContainer';

export class CanvasAbsoluteContainer extends CanvasContainer {
    performLayout(ctx: CanvasRenderingContext2D) {
        this.children.forEach(child => {
            if (child instanceof CanvasContainer) {
                child.performLayout(ctx);
            } else {
                child.measure(ctx);
            }
        });

        // Expand to fit children
        let maxX = 0;
        let maxY = 0;
        this.children.forEach(child => {
            maxX = Math.max(maxX, child.rect.x + child.rect.width);
            maxY = Math.max(maxY, child.rect.y + child.rect.height);
        });
        
        // Assuming absolute container starts at 0,0 relative to itself? 
        // No, absolute container children have absolute positions relative to parent?
        // Actually CanvasAbsoluteContainer usually implies children have explicit rects or position
        // But here we want the container ITSELF to grow if children grow.
        // However, children rects are usually in parent coordinates.
        
        // If children are positioned at (x,y), and container is at (rect.x, rect.y),
        // Child rects are typically relative to screen or parent?
        // In CanvasRoot.render:
        // cNode.rect.x = parentX + fNode.position.x;
        
        // For AbsoluteContainer, performLayout calls children.
        // If children expanded, we might want to update this.rect.height/width?
        
        // But wait, cellWrapper is AbsoluteContainer.
        // It has rect.x/y set explicitly.
        // contentContainer is inside.
        // contentContainer.rect is relative to screen? 
        // Looking at CanvasNode.ts:
        // hitTest checks (x >= this.rect.x ...).
        // CanvasContainer.performLayout updates children rects to be absolute/screen coords?
        //   const parentX = cNode.parent ? cNode.parent.rect.x : this.rect.x;
        //   cNode.rect.x = parentX + fNode.position.x;
        // Yes, rects are absolute screen coordinates.
        
        // So if contentContainer expands, its rect expands.
        // We need to ensure cellWrapper also expands to cover it.
        
        if (this.children.length > 0) {
            let minX = Infinity, minY = Infinity, maxR = -Infinity, maxB = -Infinity;
             this.children.forEach(child => {
                minX = Math.min(minX, child.rect.x);
                minY = Math.min(minY, child.rect.y);
                maxR = Math.max(maxR, child.rect.x + child.rect.width);
                maxB = Math.max(maxB, child.rect.y + child.rect.height);
            });
            
            // If we have children, update our size to contain them.
            // Note: We keep our x/y, but expand width/height.
            // Since rects are absolute, we should check if they go outside our current bounds.
            
            // We probably don't want to move x/y of the cell wrapper (it's anchored to the grid),
            // but we should extend width/height.
            
            // Width is usually fixed by column width. Height is usually fixed by row height.
            // But for overflow/hit testing, we want height to expand.
            
            const currentBottom = this.rect.y + this.rect.height;
            if (maxB > currentBottom) {
                this.rect.height = maxB - this.rect.y;
            }
            
            // Also update background rect if it exists?
            // The bgRect is a child. It might be the first child.
            // If contentContainer expands, bgRect usually stays fixed unless we update it.
            // But the user said "parent block didn't stretch".
            
            // If we update this.rect, the hitTest on this container will work.
        }
    }

    onPaint(ctx: CanvasRenderingContext2D) {
        if (this.backgroundColor && this.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
        }

        if (this.borderWidth > 0 && this.borderColor && this.borderColor !== 'transparent') {
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = this.borderWidth;
            ctx.strokeRect(
                this.rect.x + this.borderWidth / 2,
                this.rect.y + this.borderWidth / 2,
                this.rect.width - this.borderWidth,
                this.rect.height - this.borderWidth
            );
        }

        super.onPaint(ctx);
    }
}

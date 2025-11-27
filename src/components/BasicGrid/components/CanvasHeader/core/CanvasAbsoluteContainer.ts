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
    }
}

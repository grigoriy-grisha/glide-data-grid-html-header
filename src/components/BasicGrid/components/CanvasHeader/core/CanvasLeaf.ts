import { CanvasNode } from './CanvasNode';

export abstract class CanvasLeaf extends CanvasNode {
    addChild() {
        throw new Error("CanvasLeaf cannot have children");
    }

    hitTest(x: number, y: number): CanvasNode[] {
        if (x >= this.rect.x && x <= this.rect.x + this.rect.width &&
            y >= this.rect.y && y <= this.rect.y + this.rect.height) {
            return [this];
        }
        return [];
    }
}

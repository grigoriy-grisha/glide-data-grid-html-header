import { CanvasNode } from './CanvasNode';

export abstract class CanvasLeaf extends CanvasNode {
    addChild(child: CanvasNode) {
        throw new Error("CanvasLeaf cannot have children");
    }
}

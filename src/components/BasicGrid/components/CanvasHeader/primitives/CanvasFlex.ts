import { CanvasContainer } from '../core/CanvasContainer';
import { FlexBoxOptions } from '../../../miniflex';

export class CanvasFlex extends CanvasContainer {
    constructor(id: string, flexOptions?: FlexBoxOptions) {
        super(id, flexOptions);
    }
}

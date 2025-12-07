import { drawIcon } from '../cells/buttons'
import type { ButtonIcon } from '../cells/iconSprites'
import { CanvasLeaf } from "../core/CanvasLeaf"
import { DrawBatcher } from "../core/DrawBatcher"

const DEFAULT_SIZE = 16
const TRANSPARENT = 'transparent'

export interface CanvasIconOptions {
    size?: number
    color?: string
}

export class CanvasIcon extends CanvasLeaf {
    icon: ButtonIcon
    size: number
    color?: string

    constructor(id: string, icon: ButtonIcon, options?: CanvasIconOptions) {
        super(id)
        this.icon = icon
        this.size = options?.size ?? DEFAULT_SIZE
        this.color = options?.color
    }

    measure(_ctx: CanvasRenderingContext2D) {
        this.rect.width = this.size
        this.rect.height = this.size
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect
        
        if (this.backgroundColor && this.backgroundColor !== TRANSPARENT) {
            batcher.fillRect(x, y, width, height, this.backgroundColor)
        }
        
        drawIcon(batcher, this.icon, x, y, this.size, this.color)
    }
}

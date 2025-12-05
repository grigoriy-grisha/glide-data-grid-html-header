import { CanvasLeaf } from "../core/CanvasLeaf"
import { DrawBatcher } from "../core/DrawBatcher"

const DEFAULT_SIZE = 16
const DEFAULT_COLOR = "black"
const DEFAULT_ROTATION = 0
const ROTATION_MULTIPLIER = Math.PI / 2
const LINE_WIDTH = 1.8
const CHEVRON_POINTS = {
    startX: -3.5,
    startY: -4.25,
    middleX: 2.75,
    middleY: 0,
    endX: -3.5,
    endY: 4.25,
}

export interface CanvasChevronOptions {
    rotation?: number
    color?: string
}

export class CanvasChevron extends CanvasLeaf {
    rotation: number = DEFAULT_ROTATION
    color: string = DEFAULT_COLOR

    constructor(id: string, options: CanvasChevronOptions = {}) {
        super(id)
        this.rotation = options.rotation ?? DEFAULT_ROTATION
        this.color = options.color ?? DEFAULT_COLOR
        this.rect.width = DEFAULT_SIZE
        this.rect.height = DEFAULT_SIZE
    }

    measure(_ctx: CanvasRenderingContext2D) {
    }

    onPaint(batcher: DrawBatcher, _ctx: CanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect
        const cx = x + width / 2
        const cy = y + height / 2
        const rotation = this.rotation * ROTATION_MULTIPLIER

        batcher.custom(ctx => {
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate(rotation)
            ctx.strokeStyle = this.color
            ctx.lineWidth = LINE_WIDTH
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            
            ctx.beginPath()
            ctx.moveTo(CHEVRON_POINTS.startX, CHEVRON_POINTS.startY)
            ctx.lineTo(CHEVRON_POINTS.middleX, CHEVRON_POINTS.middleY)
            ctx.lineTo(CHEVRON_POINTS.endX, CHEVRON_POINTS.endY)
            ctx.stroke()
            
            ctx.restore()
        })
    }
}

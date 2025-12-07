import type { CanvasRenderArgs } from '../lib/canvas/cells/types'

export type AnimationEasing = (t: number) => number

export interface NumericAnimationOptions {
  duration?: number
  easing?: AnimationEasing
  initialValue?: number
}

interface NumericAnimationState {
  value: number
  target: number
  startValue: number
  startTime: number | null
  duration: number
  easing: AnimationEasing
}

interface RendererAnimationState {
  cellIdentity: string
  animations: Record<string, NumericAnimationState>
}

const DEFAULT_DURATION = 220

export const easeOutCubic: AnimationEasing = (t) => 1 - Math.pow(1 - t, 3)

export const easeInOutCubic: AnimationEasing = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

type RendererDrawStateTuple = [RendererAnimationState | undefined, (state: RendererAnimationState) => void]

/** Animation args interface supporting both DrawArgs and CanvasRenderArgs */
interface AnimationArgs {
  frameTime?: number
  requestAnimationFrame?: () => void
  drawState?: [unknown, (state: unknown) => void]
}

function ensureRendererState(
  args: AnimationArgs,
  cellIdentity: string
): RendererAnimationState {
  const [existingState, setState] = (args.drawState ?? [undefined, () => {}]) as RendererDrawStateTuple

  if (!existingState || existingState.cellIdentity !== cellIdentity) {
    const freshState: RendererAnimationState = {
      cellIdentity,
      animations: {},
    }
    setState(freshState)
    return freshState
  }

  return existingState
}

export function animateNumericValue(
  args: AnimationArgs | CanvasRenderArgs,
  cellIdentity: string,
  animationKey: string,
  targetValue: number,
  options: NumericAnimationOptions = {},
): number {
  const animArgs = args as AnimationArgs
  if (!animArgs.drawState || !animArgs.frameTime) {
    // No animation support available, return target immediately
    return targetValue
  }

  const [, setRendererState] = animArgs.drawState as RendererDrawStateTuple
  const rendererState = ensureRendererState(animArgs, cellIdentity)

  let animationState = rendererState.animations[animationKey]

  if (!animationState) {
    const initialValue = options.initialValue ?? targetValue
    animationState = {
      value: initialValue,
      target: targetValue,
      startValue: initialValue,
      startTime: null,
      duration: options.duration ?? DEFAULT_DURATION,
      easing: options.easing ?? easeOutCubic,
    }
    rendererState.animations[animationKey] = animationState
    setRendererState(rendererState)
  }

  const duration = options.duration ?? animationState.duration ?? DEFAULT_DURATION
  const easing = options.easing ?? animationState.easing ?? easeOutCubic

  if (animationState.target !== targetValue) {
    animationState.target = targetValue
    animationState.startValue = animationState.value
    animationState.startTime = animArgs.frameTime ?? null
  }

  animationState.duration = duration
  animationState.easing = easing

  if (animationState.startTime == null || animArgs.frameTime === undefined) {
    return animationState.value
  }

  const elapsed = animArgs.frameTime - animationState.startTime
  const progress = duration <= 0 ? 1 : Math.min(1, elapsed / duration)
  const easedProgress = easing(progress)
  animationState.value =
    animationState.startValue + (animationState.target - animationState.startValue) * easedProgress

  if (progress < 1) {
    animArgs.requestAnimationFrame?.()
  } else {
    animationState.startTime = null
    animationState.value = animationState.target
  }

  setRendererState(rendererState)

  return animationState.value
}



import type { DrawArgs, InnerGridCell } from '@glideapps/glide-data-grid'

export type AnimationEasing = (t: number) => number

export interface NumericAnimationOptions {
  duration?: number
  easing?: AnimationEasing
  /**
   * Optional explicit initial value. Defaults to the first target value.
   */
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

function ensureRendererState<T extends InnerGridCell>(
  args: DrawArgs<T>,
  cellIdentity: string
): RendererAnimationState {
  const [existingState, setState] = args.drawState as RendererDrawStateTuple

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

/**
 * Tween helper that animates any numeric value and stores the state inside the renderer draw state.
 * Consumers should pass a stable `cellIdentity` (for example `${rowId}:${columnId}`) so that
 * animations reset when the cell renders different data.
 */
export function animateNumericValue<T extends InnerGridCell>(
  args: DrawArgs<T>,
  cellIdentity: string,
  animationKey: string,
  targetValue: number,
  options: NumericAnimationOptions = {}
): number {
  const [, setRendererState] = args.drawState as RendererDrawStateTuple
  const rendererState = ensureRendererState(args, cellIdentity)
  const animationState =
    rendererState.animations[animationKey] ??
    (() => {
      const initialValue = options.initialValue ?? targetValue
      const state: NumericAnimationState = {
        value: initialValue,
        target: targetValue,
        startValue: initialValue,
        startTime: null,
        duration: options.duration ?? DEFAULT_DURATION,
        easing: options.easing ?? easeOutCubic,
      }
      rendererState.animations[animationKey] = state
      setRendererState(rendererState)
      return state
    })()

  const duration = options.duration ?? animationState.duration ?? DEFAULT_DURATION
  const easing = options.easing ?? animationState.easing ?? easeOutCubic

  if (animationState.target !== targetValue) {
    animationState.target = targetValue
    animationState.startValue = animationState.value
    animationState.startTime = args.frameTime
  }

  animationState.duration = duration
  animationState.easing = easing

  if (animationState.startTime != null) {
    const elapsed = args.frameTime - animationState.startTime
    const progress = duration <= 0 ? 1 : Math.min(1, elapsed / duration)
    const easedProgress = easing(progress)
    animationState.value =
      animationState.startValue + (animationState.target - animationState.startValue) * easedProgress

    if (progress < 1) {
      args.requestAnimationFrame()
    } else {
      animationState.startTime = null
      animationState.value = animationState.target
    }

    setRendererState(rendererState)
  }

  return animationState.value
}



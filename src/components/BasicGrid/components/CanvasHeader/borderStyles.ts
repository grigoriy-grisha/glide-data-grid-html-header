import { HEADER_BORDER_COLOR } from '../headerConstants'

export const DEFAULT_BORDER_STYLE = {
  color: HEADER_BORDER_COLOR,
  lineWidth: 1,
} as const

export function createHideBorderStyle(bgColor: string) {
  return {
    color: bgColor,
    lineWidth: 2,
  } as const
}


import type { PointerKeyPair } from './types'

/** Tolerance for relative coordinate detection */
export const RELATIVE_COORD_TOLERANCE = 5

/** Candidate keys for extracting pointer coordinates from args */
export const POINTER_CANDIDATE_KEYS: PointerKeyPair[] = [
  ['hoverX', 'hoverY'],
  ['mouseX', 'mouseY'],
  ['pointerX', 'pointerY'],
  ['posX', 'posY'],
  ['x', 'y'],
]

/** Default cursor when not hovering interactive elements */
export const DEFAULT_CURSOR = 'default'

/** Cursor for legacy hover areas */
export const LEGACY_HOVER_CURSOR = 'pointer'


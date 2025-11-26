import type { SortDirection } from '../types'

export type SortState = { columnId: string; direction: SortDirection } | null

export interface SelectedBounds {
  start: number
  end: number
}


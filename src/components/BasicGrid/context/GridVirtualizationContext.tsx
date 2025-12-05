import { useMemo, type ReactNode } from 'react'
import { createSafeContext } from './createSafeContext'
import { useThrottledIndices } from './useThrottledIndices'

export interface GridVisibleIndices {
  [key: string]: number
  colStart: number
  colEnd: number
  rowStart: number
  rowEnd: number
}

interface GridVirtualizationContextValue {
  visibleIndices: GridVisibleIndices
  updateVisibleIndices: (indices: Partial<GridVisibleIndices>) => void
}

const DEFAULT_INDICES: GridVisibleIndices = {
  colStart: 0,
  colEnd: 20,
  rowStart: 0,
  rowEnd: 20,
}

export const [GridVirtualizationContext, useGridVirtualization] =
  createSafeContext<GridVirtualizationContextValue>('GridVirtualization')

interface GridVirtualizationProviderProps {
  children: ReactNode
  initialIndices?: GridVisibleIndices
}

export function GridVirtualizationProvider({
  children,
  initialIndices = DEFAULT_INDICES,
}: GridVirtualizationProviderProps) {
  const [visibleIndices, updateVisibleIndices] = useThrottledIndices(initialIndices)

  const value = useMemo(
    () => ({ visibleIndices, updateVisibleIndices }),
    [visibleIndices, updateVisibleIndices]
  )

  return (
    <GridVirtualizationContext.Provider value={value}>
      {children}
    </GridVirtualizationContext.Provider>
  )
}

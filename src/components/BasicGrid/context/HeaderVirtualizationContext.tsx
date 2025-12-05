import { useMemo, type ReactNode } from 'react'
import { createSafeContext } from './createSafeContext'
import { useThrottledIndices } from './useThrottledIndices'

export interface HeaderVisibleIndices {
  [key: string]: number
  start: number
  end: number
}

interface HeaderVirtualizationContextValue {
  visibleIndices: HeaderVisibleIndices
  updateVisibleIndices: (indices: Partial<HeaderVisibleIndices>) => void
}

const DEFAULT_INDICES: HeaderVisibleIndices = {
  start: 0,
  end: 20,
}

export const [HeaderVirtualizationContext, useHeaderVirtualization] =
  createSafeContext<HeaderVirtualizationContextValue>('HeaderVirtualization')

interface HeaderVirtualizationProviderProps {
  children: ReactNode
  initialIndices?: HeaderVisibleIndices
}

export function HeaderVirtualizationProvider({
  children,
  initialIndices = DEFAULT_INDICES,
}: HeaderVirtualizationProviderProps) {
  const [visibleIndices, updateVisibleIndices] = useThrottledIndices(initialIndices)

  const value = useMemo(
    () => ({ visibleIndices, updateVisibleIndices }),
    [visibleIndices, updateVisibleIndices]
  )

  return (
    <HeaderVirtualizationContext.Provider value={value}>
      {children}
    </HeaderVirtualizationContext.Provider>
  )
}

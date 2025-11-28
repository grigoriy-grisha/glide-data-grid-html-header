import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface VisibleIndices {
  start: number
  end: number
}

interface HeaderVirtualizationContextValue {
  visibleIndices: VisibleIndices
  updateVisibleIndices: (indices: VisibleIndices) => void
}

const HeaderVirtualizationContext = createContext<HeaderVirtualizationContextValue | null>(null)

interface HeaderVirtualizationProviderProps {
  children: ReactNode
  initialIndices?: VisibleIndices
}

export function HeaderVirtualizationProvider({
  children,
  initialIndices = { start: 0, end: 20 },
}: HeaderVirtualizationProviderProps) {
  const [visibleIndices, setVisibleIndices] = useState<VisibleIndices>(initialIndices)
  
  const updateVisibleIndices = useCallback((indices: VisibleIndices) => {
    setVisibleIndices((prev) => {
      // Only update if there's a meaningful change
      if (Math.abs(prev.start - indices.start) < 2 && Math.abs(prev.end - indices.end) < 2) {
        return prev
      }
      return indices
    })
  }, [])

  const value = React.useMemo(
    () => ({
      visibleIndices,
      updateVisibleIndices,
    }),
    [visibleIndices, updateVisibleIndices]
  )

  return (
    <HeaderVirtualizationContext.Provider value={value}>
      {children}
    </HeaderVirtualizationContext.Provider>
  )
}

export function useHeaderVirtualization() {
  const context = useContext(HeaderVirtualizationContext)
  if (!context) {
    throw new Error('useHeaderVirtualization must be used within HeaderVirtualizationProvider')
  }
  return context
}


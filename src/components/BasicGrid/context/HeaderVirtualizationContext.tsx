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

// Threshold for virtualization updates - higher value = fewer updates = better performance
// Value of 5 means updates only occur when visible range changes by 5+ columns
// Reduced from 8 to ensure initial render works correctly
const VIRTUALIZATION_THRESHOLD = 5

export function HeaderVirtualizationProvider({
  children,
  initialIndices = { start: 0, end: 20 },
}: HeaderVirtualizationProviderProps) {
  const [visibleIndices, setVisibleIndices] = useState<VisibleIndices>(initialIndices)
  const isInitialMountRef = React.useRef(true)
  
  const updateVisibleIndices = useCallback((indices: VisibleIndices) => {
    setVisibleIndices((prev) => {
      // Always update on initial mount to ensure header renders
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false
        return indices
      }
      
      // Only update if there's a meaningful change (threshold reduces unnecessary re-renders)
      // This prevents updates on minor scroll movements while maintaining responsiveness
      const startDiff = Math.abs(prev.start - indices.start)
      const endDiff = Math.abs(prev.end - indices.end)
      if (startDiff < VIRTUALIZATION_THRESHOLD && endDiff < VIRTUALIZATION_THRESHOLD) {
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


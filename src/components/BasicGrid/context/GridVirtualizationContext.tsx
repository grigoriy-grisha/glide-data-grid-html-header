import React, { createContext, useContext, useState, useCallback, type ReactNode, useMemo } from 'react'

export interface VisibleIndices {
  colStart: number
  colEnd: number
  rowStart: number
  rowEnd: number
}

interface GridVirtualizationContextValue {
  visibleIndices: VisibleIndices
  updateVisibleIndices: (indices: Partial<VisibleIndices>) => void
}

const GridVirtualizationContext = createContext<GridVirtualizationContextValue | null>(null)

interface GridVirtualizationProviderProps {
  children: ReactNode
  initialIndices?: VisibleIndices
}

const VIRTUALIZATION_THRESHOLD = 5

export function GridVirtualizationProvider({
  children,
  initialIndices = { colStart: 0, colEnd: 20, rowStart: 0, rowEnd: 20 },
}: GridVirtualizationProviderProps) {
  const [visibleIndices, setVisibleIndices] = useState<VisibleIndices>(initialIndices)
  const isInitialMountRef = React.useRef(true)

  const updateVisibleIndices = useCallback((indices: Partial<VisibleIndices>) => {
    setVisibleIndices((prev) => {
      // Always update on initial mount
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false
        return { ...prev, ...indices }
      }

      let changed = false;
      const newIndices = { ...prev }

      if (indices.colStart !== undefined && Math.abs(prev.colStart - indices.colStart) >= VIRTUALIZATION_THRESHOLD) {
        newIndices.colStart = indices.colStart
        changed = true
      }
      if (indices.colEnd !== undefined && Math.abs(prev.colEnd - indices.colEnd) >= VIRTUALIZATION_THRESHOLD) {
        newIndices.colEnd = indices.colEnd
        changed = true
      }
      if (indices.rowStart !== undefined && Math.abs(prev.rowStart - indices.rowStart) >= VIRTUALIZATION_THRESHOLD) {
        newIndices.rowStart = indices.rowStart
        changed = true
      }
      if (indices.rowEnd !== undefined && Math.abs(prev.rowEnd - indices.rowEnd) >= VIRTUALIZATION_THRESHOLD) {
        newIndices.rowEnd = indices.rowEnd
        changed = true
      }

      return changed ? newIndices : prev
    })
  }, [])

  const value = useMemo(
    () => ({
      visibleIndices,
      updateVisibleIndices,
    }),
    [visibleIndices, updateVisibleIndices]
  )

  return (
    <GridVirtualizationContext.Provider value={value}>
      {children}
    </GridVirtualizationContext.Provider>
  )
}

export function useGridVirtualization() {
  const context = useContext(GridVirtualizationContext)
  if (!context) {
    throw new Error('useGridVirtualization must be used within GridVirtualizationProvider')
  }
  return context
}



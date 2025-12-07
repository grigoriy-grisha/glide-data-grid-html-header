import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Highlight } from '@glideapps/glide-data-grid'

import { COLUMN_HIGHLIGHT_COLOR } from '../constants'

export function useColumnSelection(rowCount: number, columnCount: number) {
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set())

  // Clamp selection when columnCount changes
  useEffect(() => {
    setSelectedColumns((prev) => {
      if (prev.size === 0 || columnCount === 0) {
        return prev.size === 0 ? prev : new Set()
      }
      
      const clamped = new Set<number>()
      for (const idx of prev) { 
        if (idx < columnCount) {
          clamped.add(idx)
        }
      }
      
      if (clamped.size === prev.size) {
        return prev
      }
      return clamped
    })
  }, [columnCount])

  /**
   * Toggle column selection.
   * - Regular click: replaces selection with new range (or clears if same range)
   * - Ctrl+click: toggles the range within existing selection
   */
  const toggleColumn = useCallback((startIndex: number, colSpan: number, isMultiSelect: boolean) => {
    const safeSpan = Math.max(0, colSpan)
    if (safeSpan === 0) {
      return
    }

    setSelectedColumns((prev) => {
      const rangeIndices = new Set<number>()
      for (let i = 0; i < safeSpan; i++) {
        rangeIndices.add(startIndex + i)
      }

      if (isMultiSelect) {
        // Ctrl+click: toggle the range
        const next = new Set(prev)
        const allSelected = [...rangeIndices].every((idx) => prev.has(idx))
        
        if (allSelected) {
          // Remove all from range
          for (const idx of rangeIndices) {
            next.delete(idx)
          }
        } else {
          // Add all from range
          for (const idx of rangeIndices) {
            next.add(idx)
          }
        }
        return next
      } else {
        // Regular click: replace or toggle
        const sameSelection = 
          prev.size === rangeIndices.size && 
          [...rangeIndices].every((idx) => prev.has(idx))
        
        if (sameSelection) {
          return new Set()
        }
        return rangeIndices
      }
    })
  }, [])

  const isColumnSelected = useCallback((columnIndex: number): boolean => {
    return selectedColumns.has(columnIndex)
  }, [selectedColumns])

  // Legacy API compatibility
  const selectRange = useCallback((startIndex: number, span: number) => {
    toggleColumn(startIndex, span, false)
  }, [toggleColumn])

  const selectedBounds = useMemo(() => {
    if (selectedColumns.size === 0) {
      return null
    }
    
    const indices = [...selectedColumns].sort((a, b) => a - b)
    return {
      start: indices[0],
      end: indices[indices.length - 1],
    }
  }, [selectedColumns])

  const highlightRegions = useMemo<Highlight[] | undefined>(() => {
    if (selectedColumns.size === 0 || rowCount === 0) {
      return undefined
    }

    return [...selectedColumns].map((colIndex) => ({
      color: COLUMN_HIGHLIGHT_COLOR,
      range: {
        x: colIndex,
        y: 0,
        width: 1,
        height: rowCount,
      },
      style: 'solid-outline',
    }))
  }, [rowCount, selectedColumns])

  const clearSelection = useCallback(() => {
    setSelectedColumns(new Set())
  }, [])

  return {
    selectedColumns,
    toggleColumn,
    isColumnSelected,
    selectRange,
    selectedBounds,
    highlightRegions,
    clearSelection,
  }
}

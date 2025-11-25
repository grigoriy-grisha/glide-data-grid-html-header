import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Highlight } from '@glideapps/glide-data-grid'

import type { ColumnSelectionRange } from '../types'
import { COLUMN_HIGHLIGHT_COLOR } from '../constants'

export function useColumnSelection(rowCount: number, columnCount: number) {
  const [selection, setSelection] = useState<ColumnSelectionRange | null>(null)

  useEffect(() => {
    setSelection((prev) => {
      if (!prev) {
        return prev
      }
      if (columnCount === 0 || prev.start >= columnCount) {
        return null
      }
      const allowedLength = Math.min(prev.length, columnCount - prev.start)
      if (allowedLength <= 0) {
        return null
      }
      if (allowedLength !== prev.length) {
        return { start: prev.start, length: allowedLength }
      }
      return prev
    })
  }, [columnCount])

  const selectRange = useCallback((startIndex: number, span: number) => {
    const safeSpan = Math.max(0, span)
    if (safeSpan === 0) {
      setSelection(null)
      return
    }
    setSelection((prev) => {
      if (prev && prev.start === startIndex && prev.length === safeSpan) {
        return null
      }
      return { start: startIndex, length: safeSpan }
    })
  }, [])

  const selectedBounds = useMemo(() => {
    if (!selection) {
      return null
    }
    return {
      start: selection.start,
      end: selection.start + selection.length - 1,
    }
  }, [selection])

  const highlightRegions = useMemo<Highlight[] | undefined>(() => {
    if (!selection || rowCount === 0) {
      return undefined
    }
    const { start, length } = selection

    // Pre-allocate array for better performance
    const regions: Highlight[] = new Array(length)

    for (let offset = 0; offset < length; offset++) {
      regions[offset] = {
        color: COLUMN_HIGHLIGHT_COLOR,
        range: {
          x: start + offset,
          y: 0,
          width: 1,
          height: rowCount,
        },
        style: 'solid-outline',
      }
    }

    return regions
  }, [rowCount, selection])

  const clearSelection = useCallback(() => {
    setSelection(null)
  }, [])

  return { selectRange, selectedBounds, highlightRegions, clearSelection }
}


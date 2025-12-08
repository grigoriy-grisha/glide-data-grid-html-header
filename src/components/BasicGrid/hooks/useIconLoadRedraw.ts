import { useEffect, type RefObject } from 'react'
import type { DataEditorRef } from '@glideapps/glide-data-grid'
import { onAnyIconLoad } from '../lib/canvas'

interface UseIconLoadRedrawParams {
  dataEditorRef: RefObject<DataEditorRef>
  rowCount: number
  columnCount: number
}

/**
 * Subscribes to icon load events and triggers grid redraw when icons are loaded.
 * Uses requestAnimationFrame to batch multiple icon loads into a single redraw.
 */
export function useIconLoadRedraw({
  dataEditorRef,
  rowCount,
  columnCount,
}: UseIconLoadRedrawParams): void {
  useEffect(() => {
    let pendingFrame: number | null = null

    const unsubscribe = onAnyIconLoad(() => {
      if (pendingFrame !== null) return

      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = null

        const ref = dataEditorRef.current
        if (!ref) return

        const numRows = Math.min(30, rowCount)
        const numCols = columnCount
        const cells: Array<{ cell: [number, number] }> = []

        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            cells.push({ cell: [col, row] })
          }
        }

        if (cells.length > 0) {
          ref.updateCells(cells)
        }
      })
    })

    return () => {
      unsubscribe()
      if (pendingFrame !== null) {
        cancelAnimationFrame(pendingFrame)
      }
    }
  }, [dataEditorRef, rowCount, columnCount])
}


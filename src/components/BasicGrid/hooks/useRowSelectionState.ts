import { useCallback, useEffect, useMemo, useState } from 'react'
import { CompactSelection } from '@glideapps/glide-data-grid'

import type { BasicGridRowSelectionChange } from '../types'
import type { GridTreeNode } from '../models/GridTree'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface UseRowSelectionStateParams<RowType extends Record<string, unknown>> {
  gridRows: RowType[]
  rowSelectionEnabled: boolean
  selectedRows?: RowType[]
  getRowSelectable?: (row: RowType) => boolean
  onRowSelectionChange?: (selection: BasicGridRowSelectionChange<RowType>) => void
  nodesByRowIndex?: GridTreeNode<RowType>[]
  treeEnabled: boolean
}

type SelectionState = 'all' | 'partial' | 'none'
type IndexRange = [start: number, end: number]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert array of indexes to CompactSelection with optimized ranges */
function indexesToSelection(indexes: number[]): CompactSelection {
  if (indexes.length === 0) return CompactSelection.empty()

  const sorted = [...new Set(indexes)].sort((a, b) => a - b)
  let selection = CompactSelection.empty()
  let rangeStart = sorted[0]
  let prev = sorted[0]

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i]
    const isConsecutive = current === prev + 1

    if (!isConsecutive || i === sorted.length) {
      selection = rangeStart === prev
        ? selection.add(rangeStart)
        : selection.add([rangeStart, prev + 1])

      if (i < sorted.length) {
        rangeStart = current
        prev = current
      }
    } else {
      prev = current
    }
  }

  return selection
}

/** Count indexes from array that fall within range */
function countIndexesInRange(indexes: number[], start: number, end: number): number {
  let count = 0
  for (const index of indexes) {
    if (index >= start && index < end) count++
  }
  return count
}

/** Filter indexes that fall within range */
function filterIndexesInRange(indexes: number[], start: number, end: number): number[] {
  return indexes.filter(index => index >= start && index < end)
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useRowSelectionState<RowType extends Record<string, unknown>>({
  gridRows,
  rowSelectionEnabled,
  selectedRows,
  getRowSelectable,
  onRowSelectionChange,
  nodesByRowIndex,
  treeEnabled,
}: UseRowSelectionStateParams<RowType>) {
  const isControlled = selectedRows !== undefined

  // Internal state for uncontrolled mode
  const [internalSelection, setInternalSelection] = useState<CompactSelection>(CompactSelection.empty)

  // Convert controlled selectedRows to CompactSelection
  const controlledSelection = useMemo(() => {
    if (!selectedRows?.length) return CompactSelection.empty()

    const rowSet = new Set(selectedRows)
    const indexes: number[] = []
    for (let i = 0; i < gridRows.length; i++) {
      if (rowSet.has(gridRows[i])) indexes.push(i)
    }
    return indexesToSelection(indexes)
  }, [gridRows, selectedRows])

  // Active selection based on mode
  const rowSelection = isControlled ? controlledSelection : internalSelection

  // Indexes of rows that can be selected
  const selectableIndexes = useMemo(() => {
    if (!rowSelectionEnabled) return []

    const indexes: number[] = []
    for (let i = 0; i < gridRows.length; i++) {
      if (!getRowSelectable || getRowSelectable(gridRows[i])) {
        indexes.push(i)
      }
    }
    return indexes
  }, [getRowSelectable, gridRows, rowSelectionEnabled])

  // Set of selectable indexes for O(1) lookup
  const selectableSet = useMemo(() => new Set(selectableIndexes), [selectableIndexes])

  // ───────────────────────────────────────────────────────────────────────────
  // Tree helpers
  // ───────────────────────────────────────────────────────────────────────────

  const getSubtreeRange = useCallback(
    (rowIndex: number): IndexRange => {
      if (!treeEnabled || !nodesByRowIndex) {
        return [rowIndex, rowIndex + 1]
      }

      const node = nodesByRowIndex[rowIndex]
      if (!node) return [rowIndex, rowIndex + 1]

      const { depth } = node
      let end = rowIndex + 1

      for (let i = rowIndex + 1; i < nodesByRowIndex.length; i++) {
        if (nodesByRowIndex[i].depth <= depth) break
        end = i + 1
      }

      return [rowIndex, end]
    },
    [nodesByRowIndex, treeEnabled]
  )

  // ───────────────────────────────────────────────────────────────────────────
  // Selection state queries
  // ───────────────────────────────────────────────────────────────────────────

  const getSelectionStateForRow = useCallback(
    (rowIndex: number): SelectionState => {
      if (!rowSelectionEnabled) return 'none'

      const [start, end] = getSubtreeRange(rowIndex)
      const totalSelectable = countIndexesInRange(selectableIndexes, start, end)

      if (totalSelectable === 0) return 'none'

      const selectedInRange = rowSelection.toArray()
        .filter(i => i >= start && i < end && selectableSet.has(i))
        .length

      if (selectedInRange === 0) return 'none'
      if (selectedInRange === totalSelectable) return 'all'
      return 'partial'
    },
    [getSubtreeRange, rowSelection, rowSelectionEnabled, selectableIndexes, selectableSet]
  )

  const isAllRowsSelected = useMemo(() => {
    if (!rowSelectionEnabled || selectableIndexes.length === 0) return false
    return selectableIndexes.every(i => rowSelection.hasIndex(i))
  }, [rowSelection, rowSelectionEnabled, selectableIndexes])

  const hasPartialRowSelection = useMemo(() => {
    if (!rowSelectionEnabled || selectableIndexes.length === 0) return false
    const hasSome = selectableIndexes.some(i => rowSelection.hasIndex(i))
    return hasSome && !isAllRowsSelected
  }, [isAllRowsSelected, rowSelection, rowSelectionEnabled, selectableIndexes])

  // ───────────────────────────────────────────────────────────────────────────
  // Selection mutations
  // ───────────────────────────────────────────────────────────────────────────

  const notifyChange = useCallback(
    (selection: CompactSelection) => {
      if (!onRowSelectionChange) return

      const rowIndexes = selection.toArray().filter(i => i >= 0 && i < gridRows.length)
      const rows = rowIndexes.map(i => gridRows[i]).filter(Boolean) as RowType[]

      onRowSelectionChange({ rows, rowIndexes })
    },
    [gridRows, onRowSelectionChange]
  )

  const updateSelection = useCallback(
    (updater: (current: CompactSelection) => CompactSelection) => {
      if (!rowSelectionEnabled) return

      const next = updater(rowSelection)
      if (next === rowSelection) return

      notifyChange(next)

      if (!isControlled) {
        setInternalSelection(next)
      }
    },
    [isControlled, notifyChange, rowSelection, rowSelectionEnabled]
  )

  const toggleRowSelection = useCallback(
    (rowIndex: number) => {
      if (!rowSelectionEnabled) return

      const row = gridRows[rowIndex]
      if (!row || (getRowSelectable && !getRowSelectable(row))) return

      updateSelection(current => {
        const [start, end] = getSubtreeRange(rowIndex)
        const selectableInRange = filterIndexesInRange(selectableIndexes, start, end)

        if (selectableInRange.length === 0) return current

        const range: IndexRange = [
          selectableInRange[0],
          selectableInRange[selectableInRange.length - 1] + 1
        ]

        return current.hasAll(range) ? current.remove(range) : current.add(range)
      })
    },
    [getRowSelectable, getSubtreeRange, gridRows, rowSelectionEnabled, selectableIndexes, updateSelection]
  )

  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      if (!rowSelectionEnabled) return

      updateSelection(() =>
        checked ? indexesToSelection(selectableIndexes) : CompactSelection.empty()
      )
    },
    [rowSelectionEnabled, selectableIndexes, updateSelection]
  )

  // ───────────────────────────────────────────────────────────────────────────
  // Sync effect: sanitize selection when gridRows shrink (uncontrolled only)
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!rowSelectionEnabled || isControlled) return

    const indexes = internalSelection.toArray()
    if (indexes.length === 0) return

    const maxIndex = gridRows.length - 1
    const valid = indexes.filter(i => i <= maxIndex)

    if (valid.length === indexes.length) return

    const sanitized = indexesToSelection(valid)
    setInternalSelection(sanitized)
    notifyChange(sanitized)
  }, [gridRows.length, isControlled, internalSelection, notifyChange, rowSelectionEnabled])

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  return {
    getSelectionStateForRow,
    toggleRowSelection,
    handleSelectAllChange,
    isAllRowsSelected,
    hasPartialRowSelection,
  }
}

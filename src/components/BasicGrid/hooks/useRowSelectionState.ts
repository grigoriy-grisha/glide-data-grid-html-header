import { useCallback, useEffect, useMemo, useState } from 'react'
import { CompactSelection } from '@glideapps/glide-data-grid'

import type { BasicGridRowSelectionChange } from '../types'
import type { GridTreeNode } from '../models/GridTree'

interface UseRowSelectionStateParams<RowType extends Record<string, unknown>> {
  gridRows: RowType[]
  rowSelectionEnabled: boolean
  getRowSelectable?: (row: RowType) => boolean
  onRowSelectionChange?: (selection: BasicGridRowSelectionChange<RowType>) => void
  nodesByRowIndex?: GridTreeNode<RowType>[]
  treeEnabled: boolean
}

type SelectionState = 'all' | 'partial' | 'none'

export function useRowSelectionState<RowType extends Record<string, unknown>>({
  gridRows,
  rowSelectionEnabled,
  getRowSelectable,
  onRowSelectionChange,
  nodesByRowIndex,
  treeEnabled,
}: UseRowSelectionStateParams<RowType>) {
  const [rowSelection, setRowSelection] = useState<CompactSelection>(() => CompactSelection.empty())

  const selectableRowIndexes = useMemo(() => {
    if (!rowSelectionEnabled) {
      return []
    }
    return gridRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => (getRowSelectable ? getRowSelectable(row) : true))
      .map(({ index }) => index)
  }, [getRowSelectable, gridRows, rowSelectionEnabled])

  const getSubtreeRange = useCallback(
    (rowIndex: number): [number, number] => {
      if (!treeEnabled || !nodesByRowIndex) {
        return [rowIndex, rowIndex + 1]
      }
      const node = nodesByRowIndex[rowIndex]
      if (!node) {
        return [rowIndex, rowIndex + 1]
      }
      const currentDepth = node.depth
      let end = rowIndex + 1
      for (let i = rowIndex + 1; i < nodesByRowIndex.length; i++) {
        const candidate = nodesByRowIndex[i]
        if (candidate.depth <= currentDepth) {
          break
        }
        end = i + 1
      }
      return [rowIndex, end]
    },
    [nodesByRowIndex, treeEnabled]
  )

  const getSelectionStateForRow = useCallback(
    (rowIndex: number): SelectionState => {
      if (!rowSelectionEnabled) {
        return 'none'
      }
      const [start, end] = getSubtreeRange(rowIndex)
      const totalSelectable = selectableRowIndexes.filter((index) => index >= start && index < end).length
      if (totalSelectable === 0) {
        return 'none'
      }
      const selectedCount = rowSelection
        .toArray()
        .filter((index) => index >= start && index < end && selectableRowIndexes.includes(index)).length
      if (selectedCount === 0) {
        return 'none'
      }
      if (selectedCount === totalSelectable) {
        return 'all'
      }
      return 'partial'
    },
    [getSubtreeRange, rowSelection, rowSelectionEnabled, selectableRowIndexes]
  )

  const isAllRowsSelected = useMemo(() => {
    if (!rowSelectionEnabled || selectableRowIndexes.length === 0) {
      return false
    }
    return selectableRowIndexes.every((index) => rowSelection.hasIndex(index))
  }, [rowSelection, rowSelectionEnabled, selectableRowIndexes])

  const hasPartialRowSelection = useMemo(() => {
    if (!rowSelectionEnabled || selectableRowIndexes.length === 0) {
      return false
    }
    const hasSomeSelected = selectableRowIndexes.some((index) => rowSelection.hasIndex(index))
    return hasSomeSelected && !isAllRowsSelected
  }, [isAllRowsSelected, rowSelection, rowSelectionEnabled, selectableRowIndexes])

  const notifyRowSelectionChange = useCallback(
    (selection: CompactSelection) => {
      if (!rowSelectionEnabled || !onRowSelectionChange) {
        return
      }
      const rowIndexes = selection
        .toArray()
        .filter((rowIndex) => rowIndex >= 0 && rowIndex < gridRows.length)
      const selectedRows = rowIndexes.map((index) => gridRows[index]).filter(Boolean) as RowType[]
      onRowSelectionChange({
        rows: selectedRows,
        rowIndexes,
      })
    },
    [gridRows, onRowSelectionChange, rowSelectionEnabled]
  )

  const updateRowSelection = useCallback(
    (updater: (rows: CompactSelection) => CompactSelection) => {
      if (!rowSelectionEnabled) {
        return
      }
      setRowSelection((prev) => {
        const nextRows = updater(prev)
        if (nextRows === prev) {
          return prev
        }
        notifyRowSelectionChange(nextRows)
        return nextRows
      })
    },
    [notifyRowSelectionChange, rowSelectionEnabled]
  )

  const toggleRowSelection = useCallback(
    (rowIndex: number) => {
      if (!rowSelectionEnabled) {
        return
      }
      const targetRow = gridRows[rowIndex]
      if (!targetRow) {
        return
      }
      if (getRowSelectable && !getRowSelectable(targetRow)) {
        return
      }
      updateRowSelection((rows) => {
        const [start, end] = getSubtreeRange(rowIndex)
        const selectableRange = selectableRowIndexes.filter((index) => index >= start && index < end)
        if (selectableRange.length === 0) {
          return rows
        }
        const range: [number, number] = [selectableRange[0], selectableRange[selectableRange.length - 1] + 1]
        return rows.hasAll(range) ? rows.remove(range) : rows.add(range)
      })
    },
    [getRowSelectable, getSubtreeRange, gridRows, rowSelectionEnabled, selectableRowIndexes, updateRowSelection]
  )

  const setAllRowsSelection = useCallback(
    (checked: boolean) => {
      updateRowSelection(() => {
        if (!checked || selectableRowIndexes.length === 0) {
          return CompactSelection.empty()
        }
        const ranges: [number, number][] = []
        let rangeStart = selectableRowIndexes[0]
        let prev = selectableRowIndexes[0]
        for (let i = 1; i < selectableRowIndexes.length; i++) {
          const current = selectableRowIndexes[i]
          if (current === prev + 1) {
            prev = current
            continue
          }
          ranges.push([rangeStart, prev + 1])
          rangeStart = current
          prev = current
        }
        ranges.push([rangeStart, prev + 1])
        return ranges.reduce((selection, range) => selection.add(range), CompactSelection.empty())
      })
    },
    [selectableRowIndexes, updateRowSelection]
  )

  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      if (!rowSelectionEnabled) {
        return
      }
      setAllRowsSelection(checked)
    },
    [rowSelectionEnabled, setAllRowsSelection]
  )

  useEffect(() => {
    if (!rowSelectionEnabled) {
      return
    }
    const rowIndexes = rowSelection.toArray()
    if (rowIndexes.length === 0) {
      return
    }
    const maxIndex = gridRows.length - 1
    const filteredIndexes = rowIndexes.filter((rowIndex) => rowIndex <= maxIndex)
    if (filteredIndexes.length === rowIndexes.length) {
      return
    }
    const sanitizedSelection =
      filteredIndexes.length > 0 ? createRowSelectionFromIndexes(filteredIndexes) : CompactSelection.empty()
    setRowSelection(sanitizedSelection)
    notifyRowSelectionChange(sanitizedSelection)
  }, [gridRows.length, notifyRowSelectionChange, rowSelection, rowSelectionEnabled])

  return {
    getSelectionStateForRow,
    toggleRowSelection,
    handleSelectAllChange,
    isAllRowsSelected,
    hasPartialRowSelection,
  }
}

const createRowSelectionFromIndexes = (indexes: number[]) => {
  if (indexes.length === 0) {
    return CompactSelection.empty()
  }
  const sorted = [...new Set(indexes)].sort((a, b) => a - b)
  let selection = CompactSelection.empty()
  let rangeStart = sorted[0]
  let previous = sorted[0]

  const pushRange = () => {
    if (rangeStart == null || previous == null) {
      return
    }
    if (rangeStart === previous) {
      selection = selection.add(rangeStart)
    } else {
      selection = selection.add([rangeStart, previous + 1])
    }
  }

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    if (current === previous + 1) {
      previous = current
      continue
    }
    pushRange()
    rangeStart = current
    previous = current
  }

  pushRange()
  return selection
}


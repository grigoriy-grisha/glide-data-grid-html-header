import { useMemo } from 'react'
import { DEFAULT_ROW_HEIGHT } from '../constants'
import type { BasicGridProps } from '../types'

interface UseRowHeightParams<RowType extends Record<string, unknown>> {
  rowHeight: BasicGridProps<RowType>['rowHeight']
  gridRows: RowType[]
}

export function useRowHeight<RowType extends Record<string, unknown>>({
  rowHeight: rowHeightProp,
  gridRows,
}: UseRowHeightParams<RowType>) {
  const resolvedRowHeight = useMemo<number | ((rowIndex: number) => number) | undefined>(() => {
    const baseNumber = typeof rowHeightProp === 'number' ? rowHeightProp : undefined
    const baseFunction = typeof rowHeightProp === 'function' ? rowHeightProp : undefined

    if (baseFunction) {
      return (rowIndex: number) => {
        const row = gridRows[rowIndex]
        if (!row) {
          return baseNumber ?? DEFAULT_ROW_HEIGHT
        }
        const value = baseFunction(row, rowIndex)
        return typeof value === 'number' && !Number.isNaN(value) ? value : DEFAULT_ROW_HEIGHT
      }
    }

    return baseNumber
  }, [gridRows, rowHeightProp])

  const estimatedRowHeight = useMemo(() => {
    if (typeof rowHeightProp === 'number' && Number.isFinite(rowHeightProp)) {
      return rowHeightProp
    }
    if (typeof resolvedRowHeight === 'number' && Number.isFinite(resolvedRowHeight)) {
      return resolvedRowHeight
    }
    return DEFAULT_ROW_HEIGHT
  }, [resolvedRowHeight, rowHeightProp])

  return {
    resolvedRowHeight,
    estimatedRowHeight,
  }
}


import { useMemo } from 'react'

import type { BasicGridColumn } from '../types'
import { GridColumnCollection } from '../models/GridColumnCollection'

export function useNormalizedColumnsData<RowType extends Record<string, unknown>>(
  columns: BasicGridColumn<RowType>[]
) {
  const columnCollection = useMemo(() => GridColumnCollection.fromConfig(columns), [columns])

  return { columnCollection }
}


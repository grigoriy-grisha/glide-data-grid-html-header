import { useMemo } from 'react'
import type { CustomRenderer } from '@glideapps/glide-data-grid'

import type { GridColumn } from '../models/GridColumn'
import { selectCellRenderer } from '../customCells/selectCell'
import { buttonCellRenderer } from '../customCells/buttonCell'
import { canvasCellRenderer } from '../lib/canvas'

interface UseCustomRenderersParams<RowType extends Record<string, unknown>> {
  orderedColumns: GridColumn<RowType>[]
  editable: boolean
  treeCustomRenderers?: readonly CustomRenderer<any>[]
}

export function useCustomRenderers<RowType extends Record<string, unknown>>({
  orderedColumns,
  editable,
  treeCustomRenderers,
}: UseCustomRenderersParams<RowType>): CustomRenderer<any>[] | undefined {
  const hasSelectColumns = useMemo(
    () => editable && orderedColumns.some((column) => column.isSelect()),
    [editable, orderedColumns]
  )

  const hasButtonColumns = useMemo(
    () => orderedColumns.some((column) => column.isButton()),
    [orderedColumns]
  )

  const hasCanvasColumns = useMemo(
    () => orderedColumns.some((column) => column.isCanvas() || column.hasRenderCellContent()),
    [orderedColumns]
  )

  return useMemo(() => {
    const renderers: CustomRenderer<any>[] = []

    if (treeCustomRenderers) {
      renderers.push(...treeCustomRenderers)
    }
    if (hasSelectColumns) {
      renderers.push(selectCellRenderer)
    }
    if (hasButtonColumns) {
      renderers.push(buttonCellRenderer)
    }
    if (hasCanvasColumns) {
      renderers.push(canvasCellRenderer)
    }

    return renderers.length > 0 ? renderers : undefined
  }, [treeCustomRenderers, hasSelectColumns, hasButtonColumns, hasCanvasColumns])
}




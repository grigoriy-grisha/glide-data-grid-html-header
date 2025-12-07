import { useMemo } from 'react'
import type { CustomCell, CustomRenderer } from '@glideapps/glide-data-grid'

import type { GridColumn } from '../models/GridColumn'
import { canvasCellRenderer } from '../lib/canvas'

/** Generic custom renderer type */
type GenericCustomRenderer = CustomRenderer<CustomCell>

interface UseCustomRenderersParams<RowType extends Record<string, unknown>> {
  orderedColumns: GridColumn<RowType>[]
  editable: boolean
  treeCustomRenderers?: readonly GenericCustomRenderer[]
}

export function useCustomRenderers<RowType extends Record<string, unknown>>({
  orderedColumns,
  treeCustomRenderers,
}: UseCustomRenderersParams<RowType>): GenericCustomRenderer[] | undefined {
  const hasCanvasColumns = useMemo(
    () => orderedColumns.some((column) => column.isCanvas() || Boolean(column.renderCellContent)),
    [orderedColumns]
  )

  return useMemo(() => {
    const renderers: GenericCustomRenderer[] = []

    if (treeCustomRenderers) {
      renderers.push(...treeCustomRenderers)
    }
    if (hasCanvasColumns) {
      renderers.push(canvasCellRenderer as unknown as GenericCustomRenderer)
    }

    return renderers.length > 0 ? renderers : undefined
  }, [treeCustomRenderers, hasCanvasColumns])
}

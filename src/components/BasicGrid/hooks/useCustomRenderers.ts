import { useMemo } from 'react'
import type { CustomCell, CustomRenderer } from '@glideapps/glide-data-grid'

import type { GridColumn } from '../models/GridColumn'
import { selectCellRenderer } from '../customCells/selectCell'
import { buttonCellRenderer } from '../customCells/buttonCell'
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
  editable,
  treeCustomRenderers,
}: UseCustomRenderersParams<RowType>): GenericCustomRenderer[] | undefined {
  const hasSelectColumns = useMemo(
    () => editable && orderedColumns.some((column) => column.isSelect()),
    [editable, orderedColumns]
  )

  const hasButtonColumns = useMemo(
    () => orderedColumns.some((column) => column.isButton()),
    [orderedColumns]
  )

  const hasCanvasColumns = useMemo(
    () => orderedColumns.some((column) => column.isCanvas() || Boolean(column.renderCellContent)),
    [orderedColumns]
  )

  return useMemo(() => {
    const renderers: GenericCustomRenderer[] = []

    if (treeCustomRenderers) {
      renderers.push(...treeCustomRenderers)
    }
    if (hasSelectColumns) {
      renderers.push(selectCellRenderer as unknown as GenericCustomRenderer)
    }
    if (hasButtonColumns) {
      renderers.push(buttonCellRenderer as unknown as GenericCustomRenderer)
    }
    if (hasCanvasColumns) {
      renderers.push(canvasCellRenderer as unknown as GenericCustomRenderer)
    }

    return renderers.length > 0 ? renderers : undefined
  }, [treeCustomRenderers, hasSelectColumns, hasButtonColumns, hasCanvasColumns])
}




import React, { useCallback } from 'react'
import DataEditor, {
  type DataEditorProps,
  type DataEditorRef,
} from '@glideapps/glide-data-grid'
import { useHeaderVirtualization } from '../context/HeaderVirtualizationContext'

const VISIBLE_BUFFER = 5

export const DataEditorWithVirtualization = React.memo(
  React.forwardRef<DataEditorRef, DataEditorProps>(function DataEditorWithVirtualization(
    { onVisibleRegionChanged, ...dataEditorProps },
    ref
  ) {
    const { updateVisibleIndices } = useHeaderVirtualization()

    const handleVisibleRegionChanged = useCallback<NonNullable<DataEditorProps['onVisibleRegionChanged']>>(
      (range, tx = 0, ty = 0, extras) => {
        onVisibleRegionChanged?.(range, tx, ty, extras)

        const start = Math.floor(range.x)
        const end = Math.ceil(range.x + range.width)
        const newStart = Math.max(0, start - VISIBLE_BUFFER)
        const newEnd = end + VISIBLE_BUFFER

        updateVisibleIndices({ start: newStart, end: newEnd })
      },
      [onVisibleRegionChanged, updateVisibleIndices]
    )

    return <DataEditor ref={ref} {...dataEditorProps} onVisibleRegionChanged={handleVisibleRegionChanged} />
  })
)


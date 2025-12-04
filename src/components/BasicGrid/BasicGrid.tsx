import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import type { DataEditorRef } from '@glideapps/glide-data-grid'
import type { BasicGridProps } from './types'
import { BasicGridContainer } from './BasicGridContainer'

function BasicGridInner<RowType extends Record<string, unknown>>(
  props: BasicGridProps<RowType>,
  ref: React.ForwardedRef<DataEditorRef>
) {
  const dataEditorRef = useRef<DataEditorRef>(null)

  useImperativeHandle(ref, () => dataEditorRef.current as DataEditorRef, [])

  return <BasicGridContainer {...props} dataEditorRef={dataEditorRef} />
}

BasicGridInner.displayName = 'BasicGrid'

export const BasicGrid = forwardRef(BasicGridInner) as <
  RowType extends Record<string, unknown> = Record<string, unknown>,
>(
  props: BasicGridProps<RowType> & { ref?: React.Ref<DataEditorRef> }
) => React.ReactElement

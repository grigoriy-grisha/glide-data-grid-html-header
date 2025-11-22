import type { BasicGridColumn, BasicGridDataType } from '../types'

export function createColumn<RowType extends Record<string, unknown>>(
  accessor: keyof RowType | string,
  dataType: BasicGridDataType,
  title: string,
  options: Partial<Omit<BasicGridColumn<RowType>, 'accessor' | 'dataType' | 'title'>> = {}
): BasicGridColumn<RowType> {
  return {
    accessor,
    dataType,
    title,
    ...options,
  }
}


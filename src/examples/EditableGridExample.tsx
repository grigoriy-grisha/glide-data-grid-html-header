import { useCallback, useState } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, type BasicGridCellChange, type BasicGridSelectOption } from '../components'
import { basicGridRows, type DataRow } from './data'

const cloneDataRow = (row: DataRow): DataRow => ({
  ...row,
  contact: row.contact ? { ...row.contact } : row.contact,
  address: row.address ? { ...row.address } : row.address,
      status: row.status
        ? {
            name: row.status.name,
            options: row.status.options.map((option: BasicGridSelectOption) => ({ ...option })),
          }
        : row.status,
  progress: row.progress,
})

const cloneChild = (source: unknown): Record<string, unknown> => {
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    return { ...(source as Record<string, unknown>) }
  }
  return {}
}

const setValueAtPath = (row: DataRow, path: string, value: unknown): DataRow => {
  const segments = path.split('.').filter(Boolean)
  if (segments.length === 0) {
    return row
  }
  const nextRow: DataRow = { ...row }
  let currentNext: Record<string, unknown> = nextRow
  let currentOriginal: unknown = row

  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i]
    const originalChild =
      currentOriginal && typeof currentOriginal === 'object'
        ? (currentOriginal as Record<string, unknown>)[key]
        : undefined
    const clonedChild = cloneChild(originalChild)
    currentNext[key] = clonedChild
    currentNext = clonedChild
    currentOriginal = originalChild
  }

  const lastKey = segments[segments.length - 1]
  currentNext[lastKey] = value
  return nextRow
}

const columns: BasicGridColumn<DataRow>[] = [
  {
    title: 'Основные данные',
    children: [
      createColumn<DataRow>('employeeId', 'string', 'ID', { width: 120 }),
      createColumn<DataRow>('firstName', 'string', 'Имя', { width: 150 }),
      createColumn<DataRow>('lastName', 'string', 'Фамилия', { width: 170 }),
      createColumn<DataRow>('role', 'string', 'Роль', { width: 220 }),
      createColumn<DataRow>('department', 'string', 'Отдел', { width: 180 }),
    ],
  },
  {
    title: 'Контакты',
    children: [
      createColumn<DataRow>('email', 'string', 'Email', { width: 260 }),
      createColumn<DataRow>('contact.phone', 'string', 'Телефон', { width: 180 }),
    ],
  },
  {
    title: 'Прогресс',
    children: [
      createColumn<DataRow>('status.name', 'select', 'Статус', {
        width: 160,
        selectOptionsAccessor: 'status.options',
        selectPlaceholder: 'Выберите статус',
      }),
      createColumn<DataRow>('progress', 'percent', 'Прогресс %', { width: 140 }),
    ],
  },
  createColumn<DataRow>('salary', 'number', 'Зарплата', {
    width: 180,
    formatter: (value) => (typeof value === 'number' ? `${Math.round(value).toLocaleString('ru-RU')} ₽` : ''),
  }),
]

export function EditableGridExample() {
  const [editableGridRows, setEditableGridRows] = useState<DataRow[]>(() => basicGridRows.map(cloneDataRow))

  const handleEditableCellChange = useCallback((change: BasicGridCellChange<DataRow>) => {
    if (!change.accessorPath) {
      return
    }
    if (Object.is(change.previousValue, change.nextRawValue)) {
      return
    }

    setEditableGridRows((prevRows) => {
      let targetIndex = prevRows.findIndex((row) => row === change.row)
      if (targetIndex === -1 && change.row?.employeeId) {
        targetIndex = prevRows.findIndex((row) => row.employeeId === change.row.employeeId)
      }
      if (targetIndex === -1) {
        return prevRows
      }
      const updatedRow = setValueAtPath(prevRows[targetIndex], change.accessorPath!, change.nextRawValue)
      const nextRows = [...prevRows]
      nextRows[targetIndex] = updatedRow
      return nextRows
    })
  }, [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Editable Basic Grid</h2>
      <p className="section-description">
        Версия с редактированием: кликните по ячейке текста (например, имя или email), введите новое значение и
        увидьте, как оно сохраняется во внутреннем состоянии.
      </p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={editableGridRows}
        height={420}
        headerRowHeight={54}
        editable
        onCellChange={handleEditableCellChange}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}


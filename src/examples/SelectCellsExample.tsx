import { BasicGrid, createColumn, type BasicGridColumn } from '../components'
import { basicGridRows, type DataRow } from './data'

const priorityOptions = [
  { label: 'Низкий', value: 'Низкий' },
  { label: 'Средний', value: 'Средний' },
  { label: 'Высокий', value: 'Высокий' },
  { label: 'Критический', value: 'Критический' },
]

const departmentOptions = [
  { label: 'Разработка', value: 'Разработка' },
  { label: 'Дизайн', value: 'Дизайн' },
  { label: 'Маркетинг', value: 'Маркетинг' },
  { label: 'Продажи', value: 'Продажи' },
  { label: 'HR', value: 'HR' },
  { label: 'Аналитика', value: 'Аналитика' },
]

const columns: BasicGridColumn<DataRow>[] = [
  {
    title: 'Сотрудник',
    children: [
      createColumn<DataRow>('employeeId', 'string', 'ID', { width: 120 }),
      createColumn<DataRow>('firstName', 'string', 'Имя', { width: 150 }),
      createColumn<DataRow>('lastName', 'string', 'Фамилия', { width: 170 }),
    ],
  },
  {
    title: 'Select ячейки',
    children: [
      createColumn<DataRow>('status.name', 'select', 'Статус (из данных)', {
        width: 200,
        selectOptionsAccessor: 'status.options',
        selectPlaceholder: 'Выберите статус',
      }),
      createColumn<DataRow>('department', 'select', 'Отдел (статический)', {
        width: 180,
        selectOptionsGetter: () => departmentOptions,
        selectPlaceholder: 'Выберите отдел',
      }),
      createColumn<DataRow>('priority', 'select', 'Приоритет', {
        width: 160,
        selectOptionsGetter: () => priorityOptions,
        selectPlaceholder: 'Выберите приоритет',
      }),
    ],
  },
  {
    title: 'Дополнительно',
    children: [
      createColumn<DataRow>('progress', 'percent', 'Прогресс %', { width: 140 }),
      createColumn<DataRow>('salary', 'number', 'Зарплата', {
        width: 180,
        formatter: (value) => (typeof value === 'number' ? `${Math.round(value).toLocaleString('ru-RU')} ₽` : ''),
      }),
    ],
  },
]

export function SelectCellsExample() {
  return (
    <div className="data-grid-section">
      <h2 className="section-title">Select Cells Example</h2>
      <p className="section-description">
        Примеры использования ячеек типа select с разными источниками данных (из строки, статические опции).
      </p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={basicGridRows.slice(0, 6)}
        height={400}
        headerRowHeight={54}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}


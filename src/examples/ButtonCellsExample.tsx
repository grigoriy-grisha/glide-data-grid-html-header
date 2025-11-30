import { BasicGrid, createColumn, type BasicGridColumn } from '../components'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

const columns: BasicGridColumn<DataRow>[] = [
  {
    title: 'Сотрудник',
    headerContent: <HeaderCard icon="👤" iconTone="blue" title="Сотрудник" subtitle="Основная информация" compact />,
    children: [
      createColumn<DataRow>('employeeId', 'string', 'ID', { width: 120 }),
      createColumn<DataRow>('firstName', 'string', 'Имя', { width: 150 }),
      createColumn<DataRow>('lastName', 'string', 'Фамилия', { width: 170 }),
      createColumn<DataRow>('role', 'string', 'Роль', { width: 220 }),
    ],
  },
  {
    title: 'Действия',
    headerContent: <HeaderCard icon="⚡" iconTone="green" title="Действия" subtitle="Кнопки действий" compact />,
    children: [
      createColumn<DataRow>('actions', 'button', 'Основное действие', {
        width: 200,
        buttonOptions: {
          label: (row) => `Открыть ${row.firstName}`,
          variant: 'primary',
          onClick: (row) => {
            alert(`Открыт профиль: ${row.firstName} ${row.lastName}`)
          },
        },
      }),
      createColumn<DataRow>('actions', 'button', 'Редактировать', {
        width: 160,
        buttonOptions: {
          label: 'Редактировать',
          variant: 'secondary',
          onClick: (row) => {
            alert(`Редактирование: ${row.firstName} ${row.lastName}`)
          },
        },
      }),
      createColumn<DataRow>('actions', 'button', 'Удалить', {
        width: 140,
        buttonOptions: {
          label: 'Удалить',
          variant: 'danger',
          onClick: (row) => {
            if (confirm(`Удалить ${row.firstName} ${row.lastName}?`)) {
              alert(`Удалён: ${row.firstName} ${row.lastName}`)
            }
          },
        },
      }),
    ],
  },
  {
    title: 'Условные кнопки',
    headerContent: <HeaderCard icon="🎯" iconTone="purple" title="Условные кнопки" subtitle="Динамические действия" compact />,
    children: [
      createColumn<DataRow>('actions', 'button', 'Статус', {
        width: 180,
        buttonOptions: {
          label: (row) => {
            const status = row.status?.name || 'Неизвестно'
            return status === 'Активен' ? 'Деактивировать' : 'Активировать'
          },
          variant: 'secondary',
          disabled: (row) => row.progress < 50,
          onClick: (row) => {
            const status = row.status?.name || 'Неизвестно'
            alert(`Изменение статуса для ${row.firstName}: ${status === 'Активен' ? 'Деактивация' : 'Активация'}`)
          },
        },
      }),
    ],
  },
]

export function ButtonCellsExample() {
  return (
    <div className="data-grid-section">
      <h2 className="section-title">Button Cells Example</h2>
      <p className="section-description">
        Примеры использования ячеек типа button с разными вариантами (primary, secondary, danger) и условной логикой.
      </p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={basicGridRows.slice(0, 5)}
        height={400}
        headerRowHeight={54}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}


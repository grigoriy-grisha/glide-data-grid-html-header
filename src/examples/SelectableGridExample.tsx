import { useCallback, useState } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, type BasicGridRowSelectionChange } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

const columns: BasicGridColumn<DataRow>[] = [
  {
    title: 'Основные данные',
    headerContent: (
      <HeaderCard
        icon="🧾"
        iconTone="blue"
        title="Основные данные"
        subtitle="Идентификаторы и роли"
        chip={{ label: 'Core', tone: 'blue' }}
      />
    ),
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
    headerContent: (
      <HeaderCard icon="☎" iconTone="purple" title="Контакты" subtitle="CRM & сервис" chip={{ label: 'Live', tone: 'green' }} />
    ),
    children: [
      createColumn<DataRow>('email', 'string', 'Email', { width: 260 }),
      createColumn<DataRow>('contact.phone', 'string', 'Телефон', { width: 180 }),
    ],
  },
  {
    title: 'Прогресс',
    headerContent: <HeaderCard icon="📈" iconTone="purple" title="Прогресс" subtitle="KPI + статус" compact />,
    children: [
      createColumn<DataRow>('status.name', 'select', 'Статус', {
        width: 160,
        selectOptionsAccessor: 'status.options',
        selectPlaceholder: 'Выберите статус',
      }),
      createColumn<DataRow>('progress', 'percent', 'Прогресс %', { width: 140 }),
    ],
  },
]

export function SelectableGridExample() {
  const [selectedEmployees, setSelectedEmployees] = useState<DataRow[]>([])

  const handleRowSelectionChange = useCallback((selection: BasicGridRowSelectionChange<DataRow>) => {
    setSelectedEmployees(selection.rows)
  }, [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Selectable Grid</h2>
      <p className="section-description">
        Нажмите на чекбоксы в первой колонке, чтобы выбрать сотрудников и передать список наружу.
      </p>
      <div className="selected-rows-panel">
        <div className="selected-rows-count">
          {selectedEmployees.length > 0
            ? `Выбрано сотрудников: ${selectedEmployees.length}`
            : 'Выберите хотя бы одну строку'}
        </div>
      </div>
      <BasicGrid<DataRow>
        columns={columns}
        rows={basicGridRows}
        height={420}
        headerRowHeight={54}
        enableRowSelection
        showRowMarkers={false}
        onRowSelectionChange={handleRowSelectionChange}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}



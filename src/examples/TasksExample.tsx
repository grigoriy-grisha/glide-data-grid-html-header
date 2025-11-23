import { BasicGrid, createColumn, type BasicGridColumn } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { taskData, type Task } from './data/tasks'

const columns: BasicGridColumn<Task>[] = [
  {
    title: 'Задача',
    headerContent: <HeaderCard icon="✅" iconTone="blue" title="Задача" subtitle="Основная информация" compact />,
    children: [
      createColumn<Task>('id', 'string', 'ID', { width: 120 }),
      createColumn<Task>('title', 'string', 'Название', { width: 300 }),
      createColumn<Task>('assignee', 'string', 'Исполнитель', { width: 180 }),
    ],
  },
  {
    title: 'Статус и приоритет',
    headerContent: <HeaderCard icon="📊" iconTone="purple" title="Статус и приоритет" subtitle="Управление задачами" compact />,
    children: [
      createColumn<Task>('status.name', 'select', 'Статус', {
        width: 150,
        selectOptionsAccessor: 'status.options',
        selectPlaceholder: 'Выберите статус',
      }),
      createColumn<Task>('priority', 'string', 'Приоритет', { width: 120 }),
      createColumn<Task>('progress', 'percent', 'Прогресс', { width: 140 }),
    ],
  },
  {
    title: 'Дополнительно',
    headerContent: <HeaderCard icon="📅" iconTone="green" title="Дополнительно" subtitle="Даты и проекты" compact />,
    children: [
      createColumn<Task>('dueDate', 'string', 'Срок', { width: 120 }),
      createColumn<Task>('project', 'string', 'Проект', { width: 150, grow: 1 }),
    ],
  },
]

export function TasksExample() {
  return (
    <div className="data-grid-section">
      <h2 className="section-title">Tasks Example</h2>
      <p className="section-description">
        Пример таблицы с задачами: название, исполнитель, статус, приоритет, прогресс выполнения и сроки.
      </p>
      <BasicGrid<Task>
        columns={columns}
        rows={taskData}
        height={400}
        headerRowHeight={54}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


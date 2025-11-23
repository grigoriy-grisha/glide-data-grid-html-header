import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, tag, text, layout, layoutRow, renderComponents, type ButtonIcon } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { taskData, type Task } from './data/tasks'

export function TasksCanvasExample() {
  const checkIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'

  const buildTaskCard = (task: Task) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'Высокий':
          return { color: '#842029', background: '#f8d7da' }
        case 'Средний':
          return { color: '#664d03', background: '#fff3cd' }
        default:
          return { color: '#0f5132', background: '#d1e7dd' }
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Завершена':
          return { color: '#0f5132', background: '#d1e7dd' }
        case 'В работе':
          return { color: '#084298', background: '#cfe2ff' }
        case 'На проверке':
          return { color: '#664d03', background: '#fff3cd' }
        default:
          return { color: '#6c757d', background: '#e9ecef' }
      }
    }

    const priorityColor = getPriorityColor(task.priority)
    const statusColor = getStatusColor(task.status.name)

    return layout(
      [
        layoutRow(
          [
            text({ text: task.title, color: '#212529' }),
          ],
          { height: 24 }
        ),
        layoutRow(
          [
            tag({
              text: task.priority,
              color: priorityColor.color,
              background: priorityColor.background,
            }),
            tag({
              text: task.status.name,
              color: statusColor.color,
              background: statusColor.background,
            }),
            text({ text: `${task.progress}%`, color: '#6c757d' }),
          ],
          { height: 28, justify: 'space-between', gap: 6 }
        ),
        layoutRow(
          [
            text({ text: `Исполнитель: ${task.assignee}`, color: '#6c757d' }),
            button({
              text: 'Завершить',
              leftIcon: checkIconSVG,
              variant: 'primary',
              onClick: () => alert(`Задача завершена: ${task.title}`),
            }),
          ],
          { height: 32, justify: 'space-between', gap: 8 }
        ),
      ],
      {
        padding: { left: 10, right: 10, top: 8, bottom: 8 },
        rowGap: 6,
        width: 'fill',
      }
    )
  }

  const columns = useMemo<BasicGridColumn<Task>[]>(() => [
    {
      title: 'Задача',
      headerContent: <HeaderCard icon="✅" iconTone="blue" title="Задача" subtitle="Основная информация" compact />,
      children: [
        createColumn<Task>('id', 'string', 'ID', { width: 120 }),
        createColumn<Task>('project', 'string', 'Проект', { width: 150 }),
        createColumn<Task>('dueDate', 'string', 'Срок', { width: 120 }),
      ],
    },
    {
      title: 'Карточка задачи',
      headerContent: <HeaderCard icon="📋" iconTone="purple" title="Карточка задачи" subtitle="Canvas ячейка" compact />,
      children: [
        createColumn<Task>('actions', 'canvas', 'Детали', {
          width: 450,
          grow: 1,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const task = row as Task
              const structuredComponents = buildTaskCard(task)
              return renderComponents([structuredComponents], ctx, rect, theme, hoverX, hoverY)
            },
            copyData: 'Задача',
          },
        }),
      ],
    },
  ], [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Tasks Canvas Example</h2>
      <p className="section-description">
        Пример canvas ячеек для задач: карточка с названием, приоритетом, статусом, прогрессом, исполнителем и кнопкой завершения.
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


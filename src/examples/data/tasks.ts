import type { BasicGridSelectOption } from '../../components/BasicGrid'

export interface Task extends Record<string, unknown> {
  id: string
  title: string
  assignee: string
  priority: string
  status: {
    name: string
    options: BasicGridSelectOption[]
  }
  progress: number
  dueDate: string
  project: string
  tags: string[]
}

export const taskData: Task[] = [
  {
    id: 'TASK-001',
    title: 'Разработать API для авторизации',
    assignee: 'Михаил Петров',
    priority: 'Высокий',
    status: {
      name: 'В работе',
      options: [
        { label: 'Новая', value: 'Новая' },
        { label: 'В работе', value: 'В работе' },
        { label: 'На проверке', value: 'На проверке' },
        { label: 'Завершена', value: 'Завершена' },
      ],
    },
    progress: 65,
    dueDate: '2024-12-25',
    project: 'Backend API',
    tags: ['backend', 'api', 'auth'],
  },
  {
    id: 'TASK-002',
    title: 'Создать дизайн главной страницы',
    assignee: 'Екатерина Смирнова',
    priority: 'Средний',
    status: {
      name: 'На проверке',
      options: [
        { label: 'Новая', value: 'Новая' },
        { label: 'В работе', value: 'В работе' },
        { label: 'На проверке', value: 'На проверке' },
        { label: 'Завершена', value: 'Завершена' },
      ],
    },
    progress: 90,
    dueDate: '2024-12-20',
    project: 'Frontend',
    tags: ['design', 'ui', 'frontend'],
  },
  {
    id: 'TASK-003',
    title: 'Написать тесты для модуля платежей',
    assignee: 'Виктор Громов',
    priority: 'Высокий',
    status: {
      name: 'В работе',
      options: [
        { label: 'Новая', value: 'Новая' },
        { label: 'В работе', value: 'В работе' },
        { label: 'На проверке', value: 'На проверке' },
        { label: 'Завершена', value: 'Завершена' },
      ],
    },
    progress: 40,
    dueDate: '2024-12-28',
    project: 'QA',
    tags: ['testing', 'qa', 'payments'],
  },
  {
    id: 'TASK-004',
    title: 'Оптимизировать производительность БД',
    assignee: 'Олег Баранов',
    priority: 'Средний',
    status: {
      name: 'Новая',
      options: [
        { label: 'Новая', value: 'Новая' },
        { label: 'В работе', value: 'В работе' },
        { label: 'На проверке', value: 'На проверке' },
        { label: 'Завершена', value: 'Завершена' },
      ],
    },
    progress: 0,
    dueDate: '2025-01-05',
    project: 'DevOps',
    tags: ['database', 'optimization', 'devops'],
  },
  {
    id: 'TASK-005',
    title: 'Реализовать систему уведомлений',
    assignee: 'Анна Иванова',
    priority: 'Низкий',
    status: {
      name: 'Завершена',
      options: [
        { label: 'Новая', value: 'Новая' },
        { label: 'В работе', value: 'В работе' },
        { label: 'На проверке', value: 'На проверке' },
        { label: 'Завершена', value: 'Завершена' },
      ],
    },
    progress: 100,
    dueDate: '2024-12-15',
    project: 'Backend API',
    tags: ['backend', 'notifications'],
  },
]


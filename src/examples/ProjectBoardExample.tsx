import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, Canvas } from '../components'
import type { BadgeView, ButtonView } from '../components/BasicGrid/lib/canvas'

// SVG icons
const FOLDER_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'

const CLOCK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'

const USER_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'

const FLAG_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>'

const CHECK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'

const PLAY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'

const PAUSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'

const GIT_BRANCH_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>'

const CALENDAR_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'

interface Project extends Record<string, unknown> {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  progress: number
  team: string[]
  deadline: string
  daysLeft: number
  tasksTotal: number
  tasksCompleted: number
  branch: string
}

const STATUS_CONFIG: Record<Project['status'], { badge: BadgeView; label: string; icon: string }> = {
  planning: { badge: 'default', label: 'Планирование', icon: CLOCK_ICON },
  active: { badge: 'positive', label: 'В работе', icon: PLAY_ICON },
  paused: { badge: 'warning', label: 'Пауза', icon: PAUSE_ICON },
  completed: { badge: 'accent', label: 'Завершён', icon: CHECK_ICON },
  cancelled: { badge: 'negative', label: 'Отменён', icon: FLAG_ICON },
}

const PRIORITY_CONFIG: Record<Project['priority'], { color: string; label: string }> = {
  low: { color: '#9e9e9e', label: 'Низкий' },
  medium: { color: '#2196f3', label: 'Средний' },
  high: { color: '#ff9800', label: 'Высокий' },
  critical: { color: '#f44336', label: 'Критический' },
}

function generateProjects(): Project[] {
  const projects: Project[] = [
    {
      id: 'PRJ-001',
      name: 'E-commerce Platform',
      description: 'Разработка интернет-магазина с каталогом и корзиной',
      status: 'active',
      priority: 'high',
      progress: 67,
      team: ['Алексей', 'Мария', 'Дмитрий'],
      deadline: '2025-01-15',
      daysLeft: 39,
      tasksTotal: 48,
      tasksCompleted: 32,
      branch: 'feature/ecommerce',
    },
    {
      id: 'PRJ-002',
      name: 'Mobile Banking App',
      description: 'iOS и Android приложение для банка',
      status: 'active',
      priority: 'critical',
      progress: 45,
      team: ['Сергей', 'Анна', 'Павел', 'Елена'],
      deadline: '2025-02-28',
      daysLeft: 83,
      tasksTotal: 120,
      tasksCompleted: 54,
      branch: 'develop/mobile',
    },
    {
      id: 'PRJ-003',
      name: 'Analytics Dashboard',
      description: 'Дашборд для аналитики и отчётов',
      status: 'completed',
      priority: 'medium',
      progress: 100,
      team: ['Ольга', 'Игорь'],
      deadline: '2024-12-01',
      daysLeft: 0,
      tasksTotal: 28,
      tasksCompleted: 28,
      branch: 'main',
    },
    {
      id: 'PRJ-004',
      name: 'CRM System Upgrade',
      description: 'Обновление CRM системы до версии 3.0',
      status: 'paused',
      priority: 'medium',
      progress: 35,
      team: ['Виктор', 'Наталья'],
      deadline: '2025-03-30',
      daysLeft: 113,
      tasksTotal: 65,
      tasksCompleted: 23,
      branch: 'feature/crm-v3',
    },
    {
      id: 'PRJ-005',
      name: 'ML Recommendation Engine',
      description: 'Система рекомендаций на основе ML',
      status: 'planning',
      priority: 'high',
      progress: 12,
      team: ['Андрей', 'Ксения', 'Роман'],
      deadline: '2025-04-15',
      daysLeft: 129,
      tasksTotal: 85,
      tasksCompleted: 10,
      branch: 'research/ml-engine',
    },
    {
      id: 'PRJ-006',
      name: 'Legacy System Migration',
      description: 'Миграция старой системы в облако',
      status: 'cancelled',
      priority: 'low',
      progress: 20,
      team: ['Максим'],
      deadline: '2024-11-15',
      daysLeft: -22,
      tasksTotal: 40,
      tasksCompleted: 8,
      branch: 'archive/migration',
    },
    {
      id: 'PRJ-007',
      name: 'API Gateway v2',
      description: 'Новая версия API шлюза с авторизацией',
      status: 'active',
      priority: 'high',
      progress: 82,
      team: ['Денис', 'Юлия', 'Артём'],
      deadline: '2024-12-25',
      daysLeft: 18,
      tasksTotal: 55,
      tasksCompleted: 45,
      branch: 'feature/api-v2',
    },
  ]
  return projects
}

function createProjectColumns(): BasicGridColumn<Project>[] {
  return [
    {
      title: 'Проект',
      dataType: 'string',
      width: 280,
      grow: 1,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" gap={12} alignItems="center" padding={{ left: 12, right: 12 }}>
          <Canvas.Container 
            direction="row" 
            alignItems="center" 
            justifyContent="center"
            style={{ width: 44, height: 44 }}
          >
            <Canvas.Rect 
              color={PRIORITY_CONFIG[row.priority].color + '20'} 
              style={{ width: 44, height: 44 }} 
              borderColor={PRIORITY_CONFIG[row.priority].color}
              borderWidth={2}
            />
            <Canvas.Icon 
              icon={FOLDER_ICON} 
              size={22} 
              color={PRIORITY_CONFIG[row.priority].color} 
            />
          </Canvas.Container>
          <Canvas.Container direction="column" gap={4}>
            <Canvas.Text font="600 14px -apple-system, BlinkMacSystemFont, sans-serif" color="#1a1a1a">
              {row.name}
            </Canvas.Text>
            <Canvas.Text 
              font="12px -apple-system, BlinkMacSystemFont, sans-serif" 
              color="#666"
            >
              {row.description}
            </Canvas.Text>
          </Canvas.Container>
        </Canvas.Container>
      ),
    },
    {
      title: 'Статус',
      dataType: 'string',
      width: 150,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center">
          <Canvas.Badge
            text={STATUS_CONFIG[row.status].label}
            view={STATUS_CONFIG[row.status].badge}
            size="s"
            leftIcon={STATUS_CONFIG[row.status].icon}
          />
        </Canvas.Container>
      ),
    },
    {
      title: 'Дедлайн',
      dataType: 'string',
      width: 150,
      grow: 0,
      renderCellContent: (row) => {
        const isOverdue = row.daysLeft < 0
        const isUrgent = row.daysLeft > 0 && row.daysLeft <= 14
        const textColor = isOverdue ? '#f44336' : isUrgent ? '#ff9800' : '#333'
        
        return (
          <Canvas.Container direction="column" gap={12} alignItems="center" justifyContent="center">
            <Canvas.Container direction="row" gap={4} alignItems="center">
              <Canvas.Icon icon={CALENDAR_ICON} size={14} color={textColor} />
              <Canvas.Text font="13px -apple-system, BlinkMacSystemFont, sans-serif" color={textColor}>
                {row.deadline}
              </Canvas.Text>
            </Canvas.Container>
            <Canvas.Badge
              text={isOverdue ? `Просрочено: ${Math.abs(row.daysLeft)}д` : 
                    row.daysLeft === 0 ? 'Сегодня' : 
                    `Осталось: ${row.daysLeft}д`}
              view={isOverdue ? 'negative' : isUrgent ? 'warning' : 'positive'}
              size="xs"
            />
          </Canvas.Container>
        )
      },
    },
    {
      title: 'Ветка',
      dataType: 'string',
      width: 170,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" gap={6} alignItems="center" justifyContent="center">
          <Canvas.Icon icon={GIT_BRANCH_ICON} size={14} color="#6366f1" />
          <Canvas.Text 
            font="12px 'Fira Code', monospace" 
            color="#6366f1"
          >
            {row.branch}
          </Canvas.Text>
        </Canvas.Container>
      ),
    },
    {
      title: '',
      dataType: 'string',
      width: 100,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center">
          <Canvas.Button
            view="secondary"
            size="xs"
            onClick={() => console.log(`Open project ${row.id}`)}
          >
            Открыть
          </Canvas.Button>
        </Canvas.Container>
      ),
    },
  ]
}

export function ProjectBoardExample() {
  const projects = useMemo(() => generateProjects(), [])
  const columns = useMemo(() => createProjectColumns(), [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Project Board</h2>
      <p className="section-description">
        Доска проектов с индикаторами прогресса, статусами, приоритетами, 
        командой и дедлайнами. Показывает возможности комбинирования 
        бейджей, иконок и прогресс-баров в ячейках таблицы.
      </p>
      <BasicGrid<Project>
        columns={columns}
        rows={projects}
        height={520}
        headerRowHeight={48}
        rowHeight={90}
        showRowMarkers={false}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


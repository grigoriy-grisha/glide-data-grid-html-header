import { useMemo } from 'react'
import { BasicGrid, type BasicGridColumn, Canvas } from '../components'
import type { BadgeView } from '../components/BasicGrid/lib/canvas'

// SVG icons
const USER_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'

const MAIL_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>'

const EDIT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'

const TRASH_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'

const STAR_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'

const SHIELD_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'

const ACTIVITY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>'

interface DashboardUser extends Record<string, unknown> {
  id: string
  name: string
  email: string
  role: 'admin' | 'moderator' | 'user' | 'guest'
  status: 'active' | 'inactive' | 'pending' | 'banned'
  lastSeen: string
  activity: number
  verified: boolean
  rating: number
}

const ROLE_CONFIG: Record<DashboardUser['role'], { badge: BadgeView; label: string }> = {
  admin: { badge: 'negative', label: 'Админ' },
  moderator: { badge: 'warning', label: 'Модератор' },
  user: { badge: 'accent', label: 'Пользователь' },
  guest: { badge: 'light', label: 'Гость' },
}

const STATUS_CONFIG: Record<DashboardUser['status'], { badge: BadgeView; label: string }> = {
  active: { badge: 'positive', label: 'Активен' },
  inactive: { badge: 'default', label: 'Неактивен' },
  pending: { badge: 'warning', label: 'Ожидание' },
  banned: { badge: 'negative', label: 'Заблокирован' },
}

function generateUsers(): DashboardUser[] {
  const names = [
    'Александр Петров', 'Мария Иванова', 'Дмитрий Сидоров', 'Анна Козлова',
    'Сергей Волков', 'Елена Новикова', 'Михаил Морозов', 'Ольга Соколова',
    'Андрей Лебедев', 'Наталья Федорова', 'Владимир Кузнецов', 'Татьяна Попова'
  ]
  
  const roles: DashboardUser['role'][] = ['admin', 'moderator', 'user', 'user', 'user', 'guest']
  const statuses: DashboardUser['status'][] = ['active', 'active', 'active', 'inactive', 'pending', 'banned']
  
  return names.map((name, i) => ({
    id: `USER-${String(i + 1).padStart(3, '0')}`,
    name,
    email: name.toLowerCase().replace(' ', '.').replace(/[а-яё]/g, c => {
      const map: Record<string, string> = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya' }
      return map[c] || c
    }) + '@company.com',
    role: roles[i % roles.length],
    status: statuses[i % statuses.length],
    lastSeen: `${Math.floor(Math.random() * 24)} ч. назад`,
    activity: Math.floor(Math.random() * 100),
    verified: i % 3 !== 0,
    rating: Math.floor(Math.random() * 5) + 1,
  }))
}

function createUserColumns(): BasicGridColumn<DashboardUser>[] {
  return [
    {
      title: 'Пользователь',
      dataType: 'string',
      width: 250,
      grow: 1,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" gap={12} alignItems="center" padding={{ left: 12, right: 12 }}>
          <Canvas.Container 
            direction="row" 
            alignItems="center" 
            justifyContent="center"
            style={{ width: 40, height: 40 }}
          >
            <Canvas.Rect 
              color={row.role === 'admin' ? '#ef5350' : row.role === 'moderator' ? '#ff9800' : '#4caf50'} 
              style={{ width: 40, height: 40 }} 
              borderWidth={0}
            />
            <Canvas.Icon icon={USER_ICON} size={20} color="#ffffff" />
          </Canvas.Container>
          <Canvas.Container direction="column" gap={2}>
            <Canvas.Container direction="row" gap={6} alignItems="center">
              <Canvas.Text font="600 14px -apple-system, BlinkMacSystemFont, sans-serif" color="#1a1a1a">
                {row.name}
              </Canvas.Text>
              {row.verified && (
                <Canvas.Icon icon={SHIELD_ICON} size={14} color="#4caf50" />
              )}
            </Canvas.Container>
            <Canvas.Container direction="row" gap={4} alignItems="center">
              <Canvas.Icon icon={MAIL_ICON} size={12} color="#888" />
              <Canvas.Text font="12px -apple-system, BlinkMacSystemFont, sans-serif" color="#666">
                {row.email}
              </Canvas.Text>
            </Canvas.Container>
          </Canvas.Container>
        </Canvas.Container>
      ),
    },
    {
      title: 'Роль',
      dataType: 'string',
      width: 140,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center">
          <Canvas.Badge
            text={ROLE_CONFIG[row.role].label}
            view={ROLE_CONFIG[row.role].badge}
            size="s"
            leftIcon={row.role === 'admin' ? SHIELD_ICON : undefined}
          />
        </Canvas.Container>
      ),
    },
    {
      title: 'Статус',
      dataType: 'string',
      width: 140,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center">
          <Canvas.Badge
            text={STATUS_CONFIG[row.status].label}
            view={STATUS_CONFIG[row.status].badge}
            size="s"
          />
        </Canvas.Container>
      ),
    },
    {
      title: 'Активность',
      dataType: 'number',
      width: 160,
      grow: 0,
      renderCellContent: (row) => {
        const barColor = row.activity > 70 ? '#4caf50' : row.activity > 40 ? '#ff9800' : '#ef5350'
        return (
          <Canvas.Container direction="column" justifyContent="center"  gap={6} padding={12}>
            <Canvas.Container direction="row" alignItems="center" justifyContent="space-between">
              <Canvas.Container direction="row" alignItems="center" gap={4}>
                <Canvas.Icon icon={ACTIVITY_ICON} size={14} color={barColor} />
                <Canvas.Text font="600 13px -apple-system, BlinkMacSystemFont, sans-serif" color={barColor}>
                  {row.activity}%
                </Canvas.Text>
              </Canvas.Container>
              <Canvas.Text font="11px -apple-system, BlinkMacSystemFont, sans-serif" color="#888">
                {row.lastSeen}
              </Canvas.Text>
            </Canvas.Container>
          </Canvas.Container>
        )
      },
    },
    {
      title: 'Рейтинг',
      dataType: 'number',
      width: 130,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center" gap={2}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Canvas.Icon
              key={star}
              icon={STAR_ICON}
              size={16}
              color={star <= row.rating ? '#ffc107' : '#e0e0e0'}
            />
          ))}
        </Canvas.Container>
      ),
    },
    {
      title: 'Действия',
      dataType: 'string',
      width: 160,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" gap={8} alignItems="center" justifyContent="center">
          <Canvas.IconButton
            icon={MAIL_ICON}
            view="secondary"
            buttonSize="xs"
            onClick={() => console.log(`Send email to ${row.email}`)}
          />
          <Canvas.IconButton
            icon={EDIT_ICON}
            view="accent"
            buttonSize="xs"
            onClick={() => console.log(`Edit user ${row.id}`)}
          />
          <Canvas.IconButton
            icon={TRASH_ICON}
            view="critical"
            buttonSize="xs"
            disabled={row.role === 'admin'}
            onClick={() => console.log(`Delete user ${row.id}`)}
          />
        </Canvas.Container>
      ),
    },
  ]
}

export function UserDashboardExample() {
  const users = useMemo(() => generateUsers(), [])
  const columns = useMemo(() => createUserColumns(), [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">User Dashboard</h2>
      <p className="section-description">
        Панель управления пользователями с аватарами, бейджами ролей и статусов, 
        индикаторами активности, рейтингом и кнопками действий. 
        Демонстрация сложной компоновки Canvas компонентов в ячейках.
      </p>
      <BasicGrid<DashboardUser>
        columns={columns}
        rows={users}
        height={550}
        headerRowHeight={48}
        rowHeight={72}
        showRowMarkers={false}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


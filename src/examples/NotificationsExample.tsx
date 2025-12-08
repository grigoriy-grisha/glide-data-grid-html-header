import React, { useMemo, useState, useCallback } from 'react'
import { BasicGrid, type BasicGridColumn, Canvas } from '../components'
import type { BadgeView } from '../components/BasicGrid/lib/canvas'
import {
  IconInfo,
  IconDone,
  IconAttention,
  IconClose,
  IconSber,
  IconLock,
  IconBankCard,
  IconMessagePersonFill,
  IconTrashFill,
  IconDoneCircleFill,
  IconEye,
} from '@salutejs/plasma-icons'

type NotificationSeverity = 'info' | 'success' | 'warning' | 'error'
type NotificationCategory = 'system' | 'security' | 'payment' | 'user'

interface Notification extends Record<string, unknown> {
  id: string
  title: string
  message: string
  severity: NotificationSeverity
  category: NotificationCategory
  timestamp: string
  timeAgo: string
  read: boolean
  source: string
}

const SEVERITY_CONFIG: Record<NotificationSeverity, {
  icon: React.ReactElement
  iconColor: string
  bgColor: string
  badge: BadgeView
  label: string
}> = {
  info: {
    icon: <IconInfo />,
    iconColor: '#3b82f6',
    bgColor: '#dbeafe',
    badge: 'accent',
    label: 'Информация'
  },
  success: {
    icon: <IconDone />,
    iconColor: '#10b981',
    bgColor: '#d1fae5',
    badge: 'positive',
    label: 'Успех'
  },
  warning: {
    icon: <IconAttention />,
    iconColor: '#f59e0b',
    bgColor: '#fef3c7',
    badge: 'warning',
    label: 'Внимание'
  },
  error: {
    icon: <IconClose />,
    iconColor: '#ef4444',
    bgColor: '#fee2e2',
    badge: 'negative',
    label: 'Ошибка'
  },
}

const CATEGORY_CONFIG: Record<NotificationCategory, {
  icon: React.ReactElement
  label: string
}> = {
  system: { icon: <IconSber />, label: 'Система' },
  security: { icon: <IconLock />, label: 'Безопасность' },
  payment: { icon: <IconBankCard />, label: 'Платежи' },
  user: { icon: <IconMessagePersonFill />, label: 'Пользователи' },
}

function generateNotifications(): Notification[] {
  return [
    {
      id: 'notif-1',
      title: 'Успешная авторизация',
      message: 'Новый вход в систему с IP 192.168.1.105 (Chrome, Windows)',
      severity: 'success',
      category: 'security',
      timestamp: '2024-12-20 15:45:00',
      timeAgo: '5 мин назад',
      read: false,
      source: 'Auth Service',
    },
    {
      id: 'notif-2',
      title: 'Критическая нагрузка на сервер',
      message: 'CPU usage превысил 95%. Необходимо немедленное вмешательство.',
      severity: 'error',
      category: 'system',
      timestamp: '2024-12-20 15:42:00',
      timeAgo: '8 мин назад',
      read: false,
      source: 'Monitoring',
    },
    {
      id: 'notif-3',
      title: 'Платёж обработан',
      message: 'Заказ #ORD-2024-1547 успешно оплачен. Сумма: 45,900 ₽',
      severity: 'success',
      category: 'payment',
      timestamp: '2024-12-20 15:30:00',
      timeAgo: '20 мин назад',
      read: true,
      source: 'Payment Gateway',
    },
    {
      id: 'notif-4',
      title: 'Подозрительная активность',
      message: 'Обнаружено 5 неудачных попыток входа для пользователя admin@company.com',
      severity: 'warning',
      category: 'security',
      timestamp: '2024-12-20 15:15:00',
      timeAgo: '35 мин назад',
      read: false,
      source: 'Security Monitor',
    },
    {
      id: 'notif-5',
      title: 'База данных: плановое обслуживание',
      message: 'Плановое резервное копирование запланировано на 03:00 UTC',
      severity: 'info',
      category: 'system',
      timestamp: '2024-12-20 14:00:00',
      timeAgo: '1 ч назад',
      read: true,
      source: 'DB Admin',
    },
    {
      id: 'notif-6',
      title: 'Новый пользователь зарегистрирован',
      message: 'Пользователь sergey.volkov@email.com успешно создан и подтверждён',
      severity: 'info',
      category: 'user',
      timestamp: '2024-12-20 13:45:00',
      timeAgo: '2 ч назад',
      read: true,
      source: 'User Service',
    },
    {
      id: 'notif-7',
      title: 'Ошибка оплаты',
      message: 'Транзакция #TXN-9485 отклонена банком. Код ошибки: INSUFFICIENT_FUNDS',
      severity: 'error',
      category: 'payment',
      timestamp: '2024-12-20 12:30:00',
      timeAgo: '3 ч назад',
      read: true,
      source: 'Payment Gateway',
    },
    {
      id: 'notif-8',
      title: 'Превышен лимит API запросов',
      message: 'Клиент API-KEY-7845 превысил лимит в 10,000 запросов/час',
      severity: 'warning',
      category: 'system',
      timestamp: '2024-12-20 11:00:00',
      timeAgo: '4 ч назад',
      read: true,
      source: 'API Gateway',
    },
    {
      id: 'notif-9',
      title: 'Сертификат SSL обновлён',
      message: 'SSL сертификат для *.company.com успешно продлён до 2025-12-20',
      severity: 'success',
      category: 'security',
      timestamp: '2024-12-20 09:00:00',
      timeAgo: '6 ч назад',
      read: true,
      source: 'SSL Manager',
    },
    {
      id: 'notif-10',
      title: 'Массовая рассылка завершена',
      message: 'Email кампания "Новогодние скидки" отправлена 15,847 получателям',
      severity: 'info',
      category: 'user',
      timestamp: '2024-12-20 08:00:00',
      timeAgo: '7 ч назад',
      read: true,
      source: 'Email Service',
    },
  ]
}

function createNotificationColumns(
  onMarkRead: (id: string) => void,
  onDelete: (id: string) => void
): BasicGridColumn<Notification>[] {
  return [
    {
      title: 'Уведомление',
      dataType: 'string',
      width: 400,
      grow: 1,
      renderCellContent: (row) => {
        const config = SEVERITY_CONFIG[row.severity]
        return (
          <Canvas.Container direction="row" gap={14} alignItems="center" padding={{ left: 12, right: 12 }}>
            <Canvas.Container
              direction="row"
              alignItems="center"
              justifyContent="center"
              style={{ width: 44, height: 44, flexShrink: 0 }}
            >
              <Canvas.Rect
                color={config.bgColor}
                style={{ width: 44, height: 44 }}
              />
              <Canvas.Icon
                icon={config.icon}
                size={22}
                color={config.iconColor}
              />
            </Canvas.Container>
            <Canvas.Container direction="column" gap={4} style={{ flexGrow: 1 }}>
              <Canvas.Container direction="row" gap={8} alignItems="center">
                <Canvas.Text
                  font={`${row.read ? '500' : '700'} 14px -apple-system, BlinkMacSystemFont, sans-serif`}
                  color={row.read ? '#64748b' : '#0f172a'}
                >
                  {row.title}
                </Canvas.Text>
                {!row.read && (
                  <Canvas.Rect
                    color="#3b82f6"
                    style={{ width: 8, height: 8 }}
                  />
                )}
              </Canvas.Container>
              <Canvas.Text
                font="13px -apple-system, BlinkMacSystemFont, sans-serif"
                color={row.read ? '#94a3b8' : '#475569'}
                wordWrap
              >
                {row.message}
              </Canvas.Text>
            </Canvas.Container>
          </Canvas.Container>
        )
      },
    },
    {
      title: 'Тип',
      dataType: 'string',
      width: 130,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center">
          <Canvas.Badge
            text={SEVERITY_CONFIG[row.severity].label}
            view={SEVERITY_CONFIG[row.severity].badge}
            size="s"
          />
        </Canvas.Container>
      ),
    },
    {
      title: 'Категория',
      dataType: 'string',
      width: 150,
      grow: 0,
      renderCellContent: (row) => {
        const config = CATEGORY_CONFIG[row.category]
        return (
          <Canvas.Container direction="row" gap={8} alignItems="center" justifyContent="center">
            <Canvas.Icon icon={config.icon} size={16} color="#64748b" />
            <Canvas.Text font="13px -apple-system, BlinkMacSystemFont, sans-serif" color="#475569">
              {config.label}
            </Canvas.Text>
          </Canvas.Container>
        )
      },
    },
    {
      title: 'Источник',
      dataType: 'string',
      width: 140,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center">
          <Canvas.Text
            font="12px 'Fira Code', monospace"
            color="#6366f1"
          >
            {row.source}
          </Canvas.Text>
        </Canvas.Container>
      ),
    },
    {
      title: 'Время',
      dataType: 'string',
      width: 120,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="column" gap={2} alignItems="center" justifyContent="center">
          <Canvas.Text font="13px -apple-system, BlinkMacSystemFont, sans-serif" color="#475569">
            {row.timeAgo}
          </Canvas.Text>
        </Canvas.Container>
      ),
    },
    {
      title: 'Действия',
      dataType: 'string',
      width: 140,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" gap={8} alignItems="center" justifyContent="center">
          {!row.read && (
            <Canvas.IconButton
              icon={<IconEye />}
              view="accent"
              buttonSize="xs"
              onClick={() => onMarkRead(row.id)}
            />
          )}
          {row.read && (
            <Canvas.IconButton
              icon={<IconDoneCircleFill />}
              view="secondary"
              buttonSize="xs"
              disabled
            />
          )}
          <Canvas.IconButton
            icon={<IconTrashFill />}
            view="critical"
            buttonSize="xs"
            onClick={() => onDelete(row.id)}
          />
        </Canvas.Container>
      ),
    },
  ]
}

export function NotificationsExample() {
  const [notifications, setNotifications] = useState(() => generateNotifications())

  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  const handleDelete = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const columns = useMemo(
    () => createNotificationColumns(handleMarkRead, handleDelete),
    [handleMarkRead, handleDelete]
  )

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="data-grid-section">
      <h2 className="section-title">
        Notifications Center
        {unreadCount > 0 && (
          <span style={{
            marginLeft: 12,
            background: '#ef4444',
            color: 'white',
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600
          }}>
            {unreadCount} новых
          </span>
        )}
      </h2>
      <p className="section-description">
        Центр уведомлений с разными уровнями важности (info, success, warning, error),
        категориями, статусами прочтения и действиями. Демонстрация интерактивных
        элементов с обновлением состояния.
      </p>
      <BasicGrid<Notification>
        columns={columns}
        rows={notifications}
        height={600}
        headerRowHeight={48}
        rowHeight={80}
        showRowMarkers={false}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


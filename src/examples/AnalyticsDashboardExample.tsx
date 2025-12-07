import { useMemo } from 'react'
import { BasicGrid, type BasicGridColumn, Canvas } from '../components'

// SVG icons
const TRENDING_UP_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'

const TRENDING_DOWN_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>'

const USERS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'

const DOLLAR_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'

const SHOPPING_CART_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>'

const EYE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'

const PERCENT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>'

const CLOCK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'

const MOUSE_POINTER_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg>'

interface MetricData extends Record<string, unknown> {
  id: string
  metric: string
  icon: string
  iconColor: string
  iconBg: string
  currentValue: string
  previousValue: string
  change: number
  changeType: 'positive' | 'negative' | 'neutral'
  sparkline: number[]
  target: number
  actual: number
  period: string
}

function generateMetrics(): MetricData[] {
  return [
    {
      id: 'revenue',
      metric: 'Выручка',
      icon: DOLLAR_ICON,
      iconColor: '#059669',
      iconBg: '#d1fae5',
      currentValue: '₽ 2,847,500',
      previousValue: '₽ 2,456,200',
      change: 15.9,
      changeType: 'positive',
      sparkline: [45, 52, 38, 65, 55, 72, 68, 82, 75, 90, 85, 95],
      target: 3000000,
      actual: 2847500,
      period: 'Декабрь 2024',
    },
    {
      id: 'users',
      metric: 'Новые пользователи',
      icon: USERS_ICON,
      iconColor: '#2563eb',
      iconBg: '#dbeafe',
      currentValue: '12,458',
      previousValue: '10,234',
      change: 21.7,
      changeType: 'positive',
      sparkline: [30, 35, 28, 40, 45, 38, 52, 48, 60, 55, 68, 72],
      target: 15000,
      actual: 12458,
      period: 'Декабрь 2024',
    },
    {
      id: 'orders',
      metric: 'Заказы',
      icon: SHOPPING_CART_ICON,
      iconColor: '#7c3aed',
      iconBg: '#ede9fe',
      currentValue: '3,847',
      previousValue: '3,562',
      change: 8.0,
      changeType: 'positive',
      sparkline: [60, 55, 70, 65, 75, 80, 72, 85, 78, 90, 88, 95],
      target: 4000,
      actual: 3847,
      period: 'Декабрь 2024',
    },
    {
      id: 'conversion',
      metric: 'Конверсия',
      icon: PERCENT_ICON,
      iconColor: '#ea580c',
      iconBg: '#ffedd5',
      currentValue: '4.28%',
      previousValue: '4.85%',
      change: -11.8,
      changeType: 'negative',
      sparkline: [85, 80, 88, 75, 70, 72, 68, 65, 70, 62, 58, 55],
      target: 5.0,
      actual: 4.28,
      period: 'Декабрь 2024',
    },
    {
      id: 'pageviews',
      metric: 'Просмотры страниц',
      icon: EYE_ICON,
      iconColor: '#0891b2',
      iconBg: '#cffafe',
      currentValue: '458,721',
      previousValue: '421,550',
      change: 8.8,
      changeType: 'positive',
      sparkline: [50, 55, 48, 60, 65, 58, 70, 75, 68, 80, 85, 90],
      target: 500000,
      actual: 458721,
      period: 'Декабрь 2024',
    },
    {
      id: 'bounce',
      metric: 'Bounce Rate',
      icon: MOUSE_POINTER_ICON,
      iconColor: '#dc2626',
      iconBg: '#fee2e2',
      currentValue: '32.5%',
      previousValue: '35.8%',
      change: -9.2,
      changeType: 'positive', // For bounce rate, decrease is positive
      sparkline: [70, 68, 72, 65, 60, 58, 55, 52, 50, 48, 45, 42],
      target: 30.0,
      actual: 32.5,
      period: 'Декабрь 2024',
    },
    {
      id: 'session',
      metric: 'Ср. время сессии',
      icon: CLOCK_ICON,
      iconColor: '#4f46e5',
      iconBg: '#e0e7ff',
      currentValue: '4м 32с',
      previousValue: '4м 15с',
      change: 6.7,
      changeType: 'positive',
      sparkline: [40, 45, 42, 50, 48, 55, 52, 60, 58, 65, 62, 70],
      target: 5.0,
      actual: 4.53,
      period: 'Декабрь 2024',
    },
  ]
}

// Simple sparkline component drawn with Canvas primitives
function SparklineCell({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  return (
    <Canvas.Container direction="row" gap={2} alignItems="flex-end" style={{ height: 32 }}>
      {data.map((value, i) => {
        const height = ((value - min) / range) * 28 + 4
        const isLast = i === data.length - 1
        return (
          <Canvas.Rect
            key={i}
            color={isLast ? color : color + '60'}
            style={{ width: 6, height }}
          />
        )
      })}
    </Canvas.Container>
  )
}

function createAnalyticsColumns(): BasicGridColumn<MetricData>[] {
  return [
    {
      title: 'Метрика',
      dataType: 'string',
      width: 220,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" gap={14} alignItems="center" padding={{ left: 12 }}>
          <Canvas.Container 
            direction="row" 
            alignItems="center" 
            justifyContent="center"
            style={{ width: 44, height: 44 }}
          >
            <Canvas.Rect 
              color={row.iconBg} 
              style={{ width: 44, height: 44 }} 
            />
            <Canvas.Icon 
              icon={row.icon} 
              size={22} 
              color={row.iconColor} 
            />
          </Canvas.Container>
          <Canvas.Container direction="column" gap={2}>
            <Canvas.Text font="600 14px -apple-system, BlinkMacSystemFont, sans-serif" color="#1e293b">
              {row.metric}
            </Canvas.Text>
            <Canvas.Text font="12px -apple-system, BlinkMacSystemFont, sans-serif" color="#94a3b8">
              {row.period}
            </Canvas.Text>
          </Canvas.Container>
        </Canvas.Container>
      ),
    },
    {
      title: 'Текущее',
      dataType: 'string',
      width: 160,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="column" gap={4} padding={12}>
          <Canvas.Text font="700 20px -apple-system, BlinkMacSystemFont, sans-serif" color="#0f172a">
            {row.currentValue}
          </Canvas.Text>
          <Canvas.Text font="12px -apple-system, BlinkMacSystemFont, sans-serif" color="#94a3b8">
            было: {row.previousValue}
          </Canvas.Text>
        </Canvas.Container>
      ),
    },
    {
      title: 'Изменение',
      dataType: 'number',
      width: 140,
      grow: 0,
      renderCellContent: (row) => {
        const isPositive = row.changeType === 'positive'
        const color = isPositive ? '#059669' : '#dc2626'
        const bgColor = isPositive ? '#d1fae5' : '#fee2e2'
        const icon = row.change >= 0 ? TRENDING_UP_ICON : TRENDING_DOWN_ICON
        
        return (
          <Canvas.Container direction="row" alignItems="center" justifyContent="center">
            <Canvas.Container 
              direction="row" 
              gap={6} 
              alignItems="center"
              padding={{ left: 12, right: 12, top: 8, bottom: 8 }}
            >
              <Canvas.Rect color={bgColor} style={{ width: 80, height: 32 }} />
              <Canvas.Icon icon={icon} size={16} color={color} />
              <Canvas.Text font="600 14px -apple-system, BlinkMacSystemFont, sans-serif" color={color}>
                {row.change > 0 ? '+' : ''}{row.change.toFixed(1)}%
              </Canvas.Text>
            </Canvas.Container>
          </Canvas.Container>
        )
      },
    },
    {
      title: 'Тренд',
      dataType: 'string',
      width: 140,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center">
          {SparklineCell({data: row.sparkline, color: row.iconColor})}
        </Canvas.Container>
      ),
    },
    {
      title: 'Прогресс к цели',
      dataType: 'number',
      width: 200,
      grow: 1,
      renderCellContent: (row) => {
        const progress = Math.min((row.actual / row.target) * 100, 100)
        const progressColor = progress >= 90 ? '#059669' : progress >= 70 ? '#eab308' : '#dc2626'
        
        return (
          <Canvas.Container direction="column" justifyContent="center"  gap={8} padding={12}>
            <Canvas.Container direction="row" alignItems="center" justifyContent="space-between">
              <Canvas.Text font="600 13px -apple-system, BlinkMacSystemFont, sans-serif" color={progressColor}>
                {progress.toFixed(0)}%
              </Canvas.Text>
              <Canvas.Text font="11px -apple-system, BlinkMacSystemFont, sans-serif" color="#94a3b8">
                цель: {typeof row.target === 'number' && row.target > 1000 
                  ? row.target.toLocaleString() 
                  : row.target}
              </Canvas.Text>
            </Canvas.Container>
          </Canvas.Container>
        )
      },
    },
    {
      title: '',
      dataType: 'string',
      width: 120,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center">
          <Canvas.Button
            view="secondary"
            size="xs"
            onClick={() => console.log(`View details for ${row.metric}`)}
          >
            Подробнее
          </Canvas.Button>
        </Canvas.Container>
      ),
    },
  ]
}

export function AnalyticsDashboardExample() {
  const metrics = useMemo(() => generateMetrics(), [])
  const columns = useMemo(() => createAnalyticsColumns(), [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Analytics Dashboard</h2>
      <p className="section-description">
        Дашборд аналитики с ключевыми метриками, трендами (спарклайны), 
        индикаторами изменений и прогрессом к цели. Демонстрирует использование 
        иконок, цветовой кодировки и визуальных индикаторов в ячейках.
      </p>
      <BasicGrid<MetricData>
        columns={columns}
        rows={metrics}
        height={580}
        headerRowHeight={48}
        rowHeight={80}
        showRowMarkers={false}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


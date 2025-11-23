import { useCallback, useMemo, useState } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, tag, layout, layoutRow, renderComponents, type ButtonIcon } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

export function MixedCellsExample() {
  const [activeOverlayRowId, setActiveOverlayRowId] = useState<string | null>(null)

  const toggleRowOverlay = useCallback((row: DataRow) => {
    setActiveOverlayRowId((prev) => (prev === row.employeeId ? null : row.employeeId))
  }, [])

  const renderEmployeeOverlay = useCallback((row: DataRow) => {
    return (
      <div className="employee-overlay">
        <div className="employee-overlay__header">
          <div className="employee-overlay__avatar">
            {row.firstName?.[0]}
            {row.lastName?.[0]}
          </div>
          <div className="employee-overlay__meta">
            <div className="employee-overlay__name">
              {row.firstName} {row.lastName}
            </div>
            <div className="employee-overlay__role">
              {row.department} · {row.position?.name ?? 'Специалист'}
            </div>
            <div className="employee-overlay__status">
              Статус: <strong>{row.status?.name ?? 'Активен'}</strong>
            </div>
          </div>
        </div>

        <div className="employee-overlay__grid">
          <div>
            <span className="employee-overlay__label">Email</span>
            <p>{row.email}</p>
          </div>
          <div>
            <span className="employee-overlay__label">Телефон</span>
            <p>{row.contact?.phone ?? '—'}</p>
          </div>
          <div>
            <span className="employee-overlay__label">Город</span>
            <p>{row.city}</p>
          </div>
          <div>
            <span className="employee-overlay__label">Команда</span>
            <p>{row.team ?? 'Core'}</p>
          </div>
        </div>

        <div className="employee-overlay__actions">
          <button
            type="button"
            className="employee-overlay__action employee-overlay__action--primary"
            onClick={() => alert(`Написать сотруднику ${row.firstName} ${row.lastName}`)}
          >
            Написать
          </button>
          <button
            type="button"
            className="employee-overlay__action"
            onClick={() => alert(`Открыть профиль ${row.firstName} ${row.lastName}`)}
          >
            Открыть профиль
          </button>
        </div>
      </div>
    )
  }, [])

  const infoIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'

  const buildCanvasCell = useCallback((dataRow: DataRow) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Активен':
          return { color: '#0f5132', background: '#d1e7dd' }
        case 'На обучении':
          return { color: '#084298', background: '#cfe2ff' }
        case 'В отпуске':
          return { color: '#664d03', background: '#fff3cd' }
        default:
          return { color: '#842029', background: '#f8d7da' }
      }
    }

    const statusColor = getStatusColor(dataRow.status?.name || 'Неизвестно')

    return layout(
      [
        layoutRow(
          [
            button({
              text: 'Открыть',
              leftIcon: infoIconSVG,
              variant: 'primary',
              onClick: () => toggleRowOverlay(dataRow),
            }),
            tag({
              text: dataRow.status?.name || 'Неизвестно',
              color: statusColor.color,
              background: statusColor.background,
            }),
            tag({
              text: `${dataRow.progress}%`,
              color: '#084298',
              background: '#cfe2ff',
            }),
          ],
          { gap: 8, justify: 'space-between', height: 32 }
        ),
        ],
        {
          padding: { left: 8, right: 8, top: 8, bottom: 6 },
          width: 'fill',
        }
    )
  }, [infoIconSVG, toggleRowOverlay])

  const columns = useMemo<BasicGridColumn<DataRow>[]>(() => [
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
      title: 'Статус и прогресс',
      headerContent: <HeaderCard icon="📊" iconTone="green" title="Статус и прогресс" subtitle="KPI + статус" compact />,
      children: [
        createColumn<DataRow>('status.name', 'select', 'Статус', {
          width: 160,
          selectOptionsAccessor: 'status.options',
          selectPlaceholder: 'Выберите статус',
        }),
        createColumn<DataRow>('progress', 'percent', 'Прогресс %', { width: 140 }),
      ],
    },
    {
      title: 'Действия',
      headerContent: <HeaderCard icon="⚡" iconTone="blue" title="Действия" subtitle="Быстрые операции" compact />,
      children: [
        createColumn<DataRow>('actions', 'canvas', 'Действие', {
          width: 320,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const dataRow = row as DataRow
              const structuredComponents = buildCanvasCell(dataRow)
              return renderComponents([structuredComponents], ctx, rect, theme, hoverX, hoverY)
            },
            copyData: 'Открыть',
          },
        }),
        createColumn<DataRow>('actions', 'button', 'Быстрое действие', {
          width: 180,
          buttonOptions: {
            label: (row) => `Открыть ${row.firstName}`,
            variant: 'secondary',
            onClick: (row) => toggleRowOverlay(row),
          },
        }),
      ],
    },
    createColumn<DataRow>('salary', 'number', 'Зарплата', {
      width: 180,
      formatter: (value) => (typeof value === 'number' ? `${Math.round(value).toLocaleString('ru-RU')} ₽` : ''),
    }),
  ], [buildCanvasCell, toggleRowOverlay])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Mixed Cells Example</h2>
      <p className="section-description">
        Комплексный пример с использованием всех типов ячеек: string, number, percent, select, button, canvas. Также
        демонстрирует работу с row overlay.
      </p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={basicGridRows.slice(0, 6)}
        height={420}
        headerRowHeight={54}
        enableColumnReorder={true}
        getRowId={(row) => row.employeeId}
        rowOverlayRowId={activeOverlayRowId}
        renderRowOverlay={renderEmployeeOverlay}
        onRowOverlayClose={() => setActiveOverlayRowId(null)}
      />
    </div>
  )
}


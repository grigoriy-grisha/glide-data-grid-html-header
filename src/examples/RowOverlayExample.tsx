import { useCallback, useMemo, useState } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, layout, layoutRow, renderComponents, type ButtonIcon } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

export function RowOverlayExample() {
  const [overlayRowId, setOverlayRowId] = useState<string | number | null>(null)

  const infoIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'

  const buildActionCell = (dataRow: DataRow) => {
    return layout(
      [
        layoutRow(
          [
            button({
              text: 'Подробнее',
              leftIcon: infoIconSVG,
              variant: 'primary',
              onClick: () => setOverlayRowId(dataRow.employeeId),
            }),
          ],
          { height: 32, justify: 'center' }
        ),
      ],
      {
        padding: { left: 8, right: 8, top: 8, bottom: 8 },
        width: 'fill',
      }
    )
  }

  const handleCloseOverlay = useCallback(() => {
    setOverlayRowId(null)
  }, [])

  const renderOverlay = useCallback(
    (row: DataRow, _rowIndex: number) => {
      return (
        <div

        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#212529' }}>
              Детальная информация о сотруднике
            </h3>
            <button
              onClick={handleCloseOverlay}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: '#6c757d',
              }}
              title="Закрыть"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>ID сотрудника</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>{row.employeeId}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Полное имя</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>{row.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Возраст</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>{row.age} лет</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Роль</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>{row.role}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Отдел</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>{row.department}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Город</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>{row.city}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Email</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>{row.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Телефон</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>{row.contact?.phone || 'Не указан'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Адрес</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>
                {row.address?.street1}, {row.address?.city}, {row.address?.state}, {row.address?.country}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Статус</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: row.status?.name === 'Активен' ? '#0f5132' : '#664d03',
                  backgroundColor: row.status?.name === 'Активен' ? '#d1e7dd' : '#fff3cd',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  display: 'inline-block',
                }}
              >
                {row.status?.name || 'Неизвестно'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Прогресс</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>{row.progress}%</div>
            </div>
          </div>
        </div>
      )
    },
    [handleCloseOverlay]
  )

  const columns = useMemo<BasicGridColumn<DataRow>[]>(() => [
    {
      title: 'Сотрудник',
      headerContent: <HeaderCard icon="👤" iconTone="blue" title="Сотрудник" subtitle="Основная информация" compact />,
      children: [
        createColumn<DataRow>('employeeId', 'string', 'ID', { width: 120 }),
        createColumn<DataRow>('firstName', 'string', 'Имя', { width: 150 }),
        createColumn<DataRow>('lastName', 'string', 'Фамилия', { width: 170 }),
        createColumn<DataRow>('role', 'string', 'Роль', { width: 200 }),
        createColumn<DataRow>('department', 'string', 'Отдел', { width: 150 }),
      ],
    },
    {
      title: 'Контакты',
      headerContent: <HeaderCard icon="📧" iconTone="purple" title="Контакты" subtitle="Email и телефон" compact />,
      children: [
        createColumn<DataRow>('email', 'string', 'Email', { width: 250 }),
        createColumn<DataRow>('contact.phone', 'string', 'Телефон', { width: 180 }),
      ],
    },
    {
      title: 'Действия',
      headerContent: <HeaderCard icon="⚡" iconTone="green" title="Действия" subtitle="Открыть детали" compact />,
      children: [
        createColumn<DataRow>('actions', 'canvas', 'Подробнее', {
          width: 150,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const dataRow = row as DataRow
              const structuredComponents = buildActionCell(dataRow)
              return renderComponents([structuredComponents], ctx, rect, theme, hoverX, hoverY)
            },
            copyData: 'Действия',
          },
        }),
      ],
    },
  ], [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Row Overlay Example</h2>
      <p className="section-description">
        Пример использования renderRowOverlay: нажмите на кнопку "Подробнее" в колонке "Действия", чтобы открыть детальную информацию о сотруднике в overlay блоке под строкой.
      </p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={basicGridRows.slice(0, 6)}
        height={400}
        headerRowHeight={54}
        getRowId={(row) => row.employeeId}
        rowOverlayRowId={overlayRowId}
        renderRowOverlay={renderOverlay}
        onRowOverlayClose={handleCloseOverlay}
      />
    </div>
  )
}














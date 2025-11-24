import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, tag, text, layout, layoutRow, renderComponents } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

export function CompactLayoutExample() {
  const buildCompactCell = (dataRow: DataRow) => {
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
            text({ text: dataRow.firstName, color: '#212529' }),
            tag({
              text: dataRow.status?.name || 'Неизвестно',
              color: statusColor.color,
              background: statusColor.background,
            }),
          ],
          { height: 28, justify: 'space-between', gap: 6 }
        ),
        layoutRow(
          [
            text({ text: `${dataRow.progress}%`, color: '#6c757d' }),
            button({
              text: '→',
              variant: 'secondary',
              onClick: () => alert(`Детали: ${dataRow.firstName} ${dataRow.lastName}`),
            }),
          ],
          { height: 28, justify: 'space-between', gap: 6 }
        ),
      ],
      {
        padding: { left: 6, right: 6, top: 4, bottom: 4 },
        rowGap: 4,
        width: 'fill',
      }
    )
  }

  const columns = useMemo<BasicGridColumn<DataRow>[]>(() => [
    {
      title: 'Сотрудник',
      headerContent: <HeaderCard icon="👤" iconTone="blue" title="Сотрудник" subtitle="Основная информация" compact />,
      children: [
        createColumn<DataRow>('employeeId', 'string', 'ID', { width: 120 }),
        createColumn<DataRow>('lastName', 'string', 'Фамилия', { width: 170 }),
        createColumn<DataRow>('role', 'string', 'Роль', { width: 220 }),
      ],
    },
    {
      title: 'Компактная компоновка',
      headerContent: <HeaderCard icon="📦" iconTone="teal" title="Компактная компоновка" subtitle="Минимальные отступы" compact />,
      children: [
        createColumn<DataRow>('actions', 'canvas', 'Статус', {
          width: 240,
          grow: 1,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const dataRow = row as DataRow
              const structuredComponents = buildCompactCell(dataRow)
              return renderComponents([structuredComponents], ctx, rect, theme, hoverX, hoverY)
            },
            copyData: 'Статус',
          },
        }),
      ],
    },
  ], [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Compact Layout Example</h2>
      <p className="section-description">
        Пример компактной компоновки с минимальными отступами и небольшими элементами для экономии пространства.
      </p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={basicGridRows.slice(0, 8)}
        height={400}
        rowHeight={64}
        headerRowHeight={54}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}


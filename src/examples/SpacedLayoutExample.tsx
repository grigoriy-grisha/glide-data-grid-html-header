import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, tag, text, layout, layoutRow, renderComponents } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

export function SpacedLayoutExample() {
  const buildSpacedCell = (dataRow: DataRow) => {
    return layout(
      [
        layoutRow(
          [
            text({ text: dataRow.firstName, color: '#212529' }),
            text({ text: dataRow.lastName, color: '#212529' }),
          ],
          { height: 24, justify: 'space-between' }
        ),
        layoutRow(
          [
            tag({
              text: dataRow.department,
              color: '#084298',
              background: '#cfe2ff',
            }),
            tag({
              text: `${dataRow.progress}%`,
              color: '#0f5132',
              background: '#d1e7dd',
            }),
          ],
          { height: 28, justify: 'space-between' }
        ),
        layoutRow(
          [
            button({
              text: 'Открыть',
              variant: 'primary',
              onClick: () => alert(`Открыт: ${dataRow.firstName} ${dataRow.lastName}`),
            }),
            button({
              text: 'Редактировать',
              variant: 'secondary',
              onClick: () => alert(`Редактирование: ${dataRow.firstName} ${dataRow.lastName}`),
            }),
          ],
          { height: 32, justify: 'space-between' }
        ),
      ],
      {
        padding: { left: 12, right: 12, top: 10, bottom: 12 },
        rowGap: 10,
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
        createColumn<DataRow>('email', 'string', 'Email', { width: 260 }),
      ],
    },
    {
      title: 'Распределённое пространство',
      headerContent: <HeaderCard icon="📏" iconTone="amber" title="Распределённое пространство" subtitle="space-between" compact />,
      children: [
        createColumn<DataRow>('actions', 'canvas', 'Действия', {
          width: 380,
          grow: 1,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const dataRow = row as DataRow
              const structuredComponents = buildSpacedCell(dataRow)
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
      <h2 className="section-title">Spaced Layout Example</h2>
      <p className="section-description">
        Пример использования justify: 'space-between' для распределения элементов по краям с максимальным пространством между ними.
      </p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={basicGridRows.slice(0, 5)}
        height={400}
        headerRowHeight={54}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}


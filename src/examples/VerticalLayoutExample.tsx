import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, tag, text, layout, layoutRow, renderComponents, type ButtonIcon } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

export function VerticalLayoutExample() {
  const infoIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'

  const buildVerticalCell = (dataRow: DataRow) => {
    return layout(
      [
        layoutRow(
          [
            text({ text: `${dataRow.firstName} ${dataRow.lastName}`, color: '#212529' }),
          ],
          { height: 24 }
        ),
        layoutRow(
          [
            tag({
              text: dataRow.role,
              color: '#084298',
              background: '#cfe2ff',
            }),
          ],
          { height: 24 }
        ),
        layoutRow(
          [
            button({
              text: 'Подробнее',
              leftIcon: infoIconSVG,
              variant: 'secondary',
              onClick: () => alert(`Информация о ${dataRow.firstName} ${dataRow.lastName}`),
            }),
          ],
          { height: 32, justify: 'center' }
        ),
      ],
      {
        padding: { left: 12, right: 12, top: 10, bottom: 10 },
        rowGap: 6,
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
      title: 'Вертикальная компоновка',
      headerContent: <HeaderCard icon="📐" iconTone="purple" title="Вертикальная компоновка" subtitle="Стек элементов" compact />,
      children: [
        createColumn<DataRow>('actions', 'canvas', 'Карточка сотрудника', {
          width: 280,
          grow: 1,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const dataRow = row as DataRow
              const structuredComponents = buildVerticalCell(dataRow)
              return renderComponents([structuredComponents], ctx, rect, theme, hoverX, hoverY)
            },
            copyData: 'Карточка',
          },
        }),
      ],
    },
  ], [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Vertical Layout Example</h2>
      <p className="section-description">
        Пример вертикальной компоновки элементов в canvas ячейке: текст, теги и кнопки расположены друг под другом.
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

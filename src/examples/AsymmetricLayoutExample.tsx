import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, tag, text, layout, layoutRow, renderComponents } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

export function AsymmetricLayoutExample() {
  const buildAsymmetricCell = (dataRow: DataRow) => {
    return layout(
      [
        layoutRow(
          [
            text({ text: dataRow.firstName, color: '#212529' }),
            tag({
              text: dataRow.department,
              color: '#084298',
              background: '#cfe2ff',
            }),
          ],
          { height: 28, justify: 'space-between', gap: 8 }
        ),
        layoutRow(
          [
            text({ text: `${dataRow.progress}%`, color: '#6c757d' }),
          ],
          { height: 24, justify: 'start' }
        ),
        layoutRow(
          [
            button({
              text: 'Открыть',
              variant: 'primary',
              onClick: () => alert(`Открыт: ${dataRow.firstName} ${dataRow.lastName}`),
            }),
            button({
              text: 'Ещё',
              variant: 'secondary',
              onClick: () => alert(`Дополнительные действия для ${dataRow.firstName}`),
            }),
          ],
          { height: 32, justify: 'end', gap: 6 }
        ),
      ],
      {
        padding: { left: 12, right: 12, top: 10, bottom: 10 },
        rowGap: 8,
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
      title: 'Асимметричная компоновка',
      headerContent: <HeaderCard icon="⚖" iconTone="amber" title="Асимметричная компоновка" subtitle="Разное выравнивание" compact />,
      children: [
        createColumn<DataRow>('actions', 'canvas', 'Действия', {
          width: 320,
          grow: 1,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const dataRow = row as DataRow
              const structuredComponents = buildAsymmetricCell(dataRow)
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
      <h2 className="section-title">Asymmetric Layout Example</h2>
      <p className="section-description">
        Пример асимметричной компоновки с разным выравниванием в разных рядах: space-between, start, end.
      </p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={basicGridRows.slice(0, 6)}
        height={400}
        headerRowHeight={54}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}


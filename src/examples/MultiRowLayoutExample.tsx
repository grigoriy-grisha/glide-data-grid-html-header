import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, tag, text, layout, layoutRow, renderComponents, type ButtonIcon } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

export function MultiRowLayoutExample() {
  const editIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'

  const deleteIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'

  const buildMultiRowCell = (dataRow: DataRow) => {
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
            text({ text: dataRow.role, color: '#6c757d' }),
            tag({
              text: dataRow.department,
              color: '#084298',
              background: '#cfe2ff',
            }),
          ],
          { height: 24, justify: 'space-between', gap: 8 }
        ),
        layoutRow(
          [
            text({ text: `Прогресс: ${dataRow.progress}%`, color: '#6c757d' }),
            tag({
              text: dataRow.status?.name || 'Неизвестно',
              color: '#0f5132',
              background: '#d1e7dd',
            }),
          ],
          { height: 24, justify: 'space-between', gap: 8 }
        ),
        layoutRow(
          [
            button({
              text: 'Редактировать',
              leftIcon: editIconSVG,
              variant: 'primary',
              onClick: () => alert(`Редактирование: ${dataRow.firstName} ${dataRow.lastName}`),
            }),
            button({
              text: 'Удалить',
              leftIcon: deleteIconSVG,
              variant: 'danger',
              onClick: () => {
                if (confirm(`Удалить ${dataRow.firstName} ${dataRow.lastName}?`)) {
                  alert(`Удалён: ${dataRow.firstName} ${dataRow.lastName}`)
                }
              },
            }),
          ],
          { height: 32, justify: 'space-between', gap: 8 }
        ),
      ],
      {
        padding: { left: 10, right: 10, top: 8, bottom: 8 },
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
        createColumn<DataRow>('employeeId', 'string', 'ID', {grow: 1}),
        createColumn<DataRow>('email', 'string', 'Email', {grow: 1}),
      ],
    },
    {
      title: 'Многострочная компоновка',
      headerContent: <HeaderCard icon="📄" iconTone="purple" title="Многострочная компоновка" subtitle="Несколько рядов" compact />,
      children: [
        createColumn<DataRow>('actions', 'canvas', 'Полная карточка', {
          sortable: false, 
          grow:1,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const dataRow = row as DataRow
              const structuredComponents = buildMultiRowCell(dataRow)
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
      <h2 className="section-title">Multi-Row Layout Example</h2>
      <p className="section-description">
        Пример многострочной компоновки с несколькими рядами элементов: информация о сотруднике, теги и кнопки действий.
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


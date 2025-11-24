import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, buttonIcon, text, layout, layoutRow, renderComponents, type ButtonIcon } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

export function IconTextLayoutExample() {
  const emailIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'

  const phoneIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'

  const userIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'

  const buildIconTextCell = (dataRow: DataRow) => {
    return layout(
      [
        layoutRow(
          [
            buttonIcon({
              icon: userIconSVG,
              variant: 'secondary',
              onClick: () => alert(`Профиль: ${dataRow.firstName} ${dataRow.lastName}`),
            }),
            text({ text: `${dataRow.firstName} ${dataRow.lastName}`, color: '#212529' }),
          ],
          { height: 32, gap: 8 }
        ),
        layoutRow(
          [
            buttonIcon({
              icon: emailIconSVG,
              variant: 'secondary',
              onClick: () => alert(`Email: ${dataRow.email}`),
            }),
            text({ text: dataRow.email, color: '#6c757d' }),
          ],
          { height: 32, gap: 8 }
        ),
        layoutRow(
          [
            buttonIcon({
              icon: phoneIconSVG,
              variant: 'secondary',
              onClick: () => alert(`Телефон: ${dataRow.contact?.phone}`),
            }),
            text({ text: dataRow.contact?.phone || '—', color: '#6c757d' }),
          ],
          { height: 32, gap: 8 }
        ),
      ],
      {
        padding: { left: 10, right: 10, top: 8, bottom: 8 },
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
        createColumn<DataRow>('role', 'string', 'Роль', { width: 220 }),
      ],
    },
    {
      title: 'Иконки и текст',
      headerContent: <HeaderCard icon="🎨" iconTone="purple" title="Иконки и текст" subtitle="Комбинация элементов" compact />,
      children: [
        createColumn<DataRow>('actions', 'canvas', 'Контакты', {
          width: 320,
          grow: 1,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const dataRow = row as DataRow
              const structuredComponents = buildIconTextCell(dataRow)
              return renderComponents([structuredComponents], ctx, rect, theme, hoverX, hoverY)
            },
            copyData: 'Контакты',
          },
        }),
      ],
    },
  ], [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Icon Text Layout Example</h2>
      <p className="section-description">
        Пример компоновки с иконками и текстом: иконки-кнопки рядом с текстовой информацией.
      </p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={basicGridRows.slice(0, 5)}
        height={400}
        headerRowHeight={54}
        rowHeight={124}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}


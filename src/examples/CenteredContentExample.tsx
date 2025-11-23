import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, tag, text, layout, layoutRow, renderComponents, type ButtonIcon } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

export function CenteredContentExample() {
  const starIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'

  const buildCenteredCell = (dataRow: DataRow) => {
    const getProgressColor = (progress: number) => {
      if (progress >= 80) return { color: '#0f5132', background: '#d1e7dd' }
      if (progress >= 50) return { color: '#084298', background: '#cfe2ff' }
      return { color: '#842029', background: '#f8d7da' }
    }

    const progressColor = getProgressColor(dataRow.progress)

    return layout(
      [
        layoutRow(
          [
            text({ text: `${dataRow.progress}%`, color: '#212529' }),
          ],
          { height: 28, justify: 'center' }
        ),
        layoutRow(
          [
            tag({
              text: dataRow.status?.name || 'Неизвестно',
              color: progressColor.color,
              background: progressColor.background,
            }),
          ],
          { height: 28, justify: 'center' }
        ),
        layoutRow(
          [
            button({
              text: 'Детали',
              leftIcon: starIconSVG,
              variant: 'primary',
              onClick: () => alert(`Прогресс ${dataRow.firstName}: ${dataRow.progress}%`),
            }),
          ],
          { height: 32, justify: 'center' }
        ),
      ],
      {
        padding: { left: 8, right: 8, top: 12, bottom: 12 },
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
        createColumn<DataRow>('firstName', 'string', 'Имя', { width: 150 }),
        createColumn<DataRow>('lastName', 'string', 'Фамилия', { width: 170 }),
      ],
    },
    {
      title: 'Центрированный контент',
      headerContent: <HeaderCard icon="🎯" iconTone="green" title="Центрированный контент" subtitle="Выравнивание по центру" compact />,
      children: [
        createColumn<DataRow>('actions', 'canvas', 'Прогресс', {
          width: 200,
          grow: 1,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const dataRow = row as DataRow
              const structuredComponents = buildCenteredCell(dataRow)
              return renderComponents([structuredComponents], ctx, rect, theme, hoverX, hoverY)
            },
            copyData: 'Прогресс',
          },
        }),
      ],
    },
  ], [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Centered Content Example</h2>
      <p className="section-description">
        Пример центрированного контента в canvas ячейке: все элементы выровнены по центру с использованием justify: 'center'.
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


import { useCallback, useMemo, useState } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, buttonIcon, tag, layout, layoutRow, renderComponents, type ButtonIcon } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'

export function CanvasCellsExample() {
  const [buttonTexts, setButtonTexts] = useState<Map<string, string>>(() => {
    const randomTexts = ['Открыть', 'Просмотр', 'Детали', 'Редактировать', 'Удалить', 'Сохранить']
    const map = new Map<string, string>()
    basicGridRows.forEach((row) => {
      map.set(row.employeeId, randomTexts[Math.floor(Math.random() * randomTexts.length)])
    })
    return map
  })

  const randomTexts = ['Открыть', 'Просмотр', 'Детали', 'Редактировать', 'Удалить', 'Сохранить']

  const leftIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
  const rightIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
  const iconButtonSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>'

  const buildActionCellLayout = useCallback((dataRow: DataRow, label: string) => {
    const handlePrimary = () => {
      const employeeId = dataRow.employeeId
      setButtonTexts((prev) => {
        const newMap = new Map(prev)
        const newText = randomTexts[Math.floor(Math.random() * randomTexts.length)]
        newMap.set(employeeId, newText)
        return newMap
      })
      console.log('Кнопка нажата для строки:', dataRow)
    }

    return layout(
      [
        layoutRow(
          [
            button({
              text: label,
              leftIcon: leftIconSVG,
              rightIcon: rightIconSVG,
              variant: 'primary',
              onClick: handlePrimary,
            }),
            tag({
              text: dataRow.role,
              color: '#084298',
              background: '#cfe2ff',
            }),
          ],
          { gap: 10, justify: 'space-between', height: 32 }
        ),
        layoutRow(
          [
            button({
              text: 'Просмотр',
              variant: 'secondary',
              onClick: handlePrimary,
            }),
            button({
              text: 'Редактировать',
              variant: 'secondary',
              onClick: handlePrimary,
            }),
            buttonIcon({
              icon: iconButtonSVG,
              variant: 'danger',
              onClick: () => {
                if (confirm(`Удалить ${dataRow.firstName} ${dataRow.lastName}?`)) {
                  alert(`Удалён: ${dataRow.firstName} ${dataRow.lastName}`)
                }
              },
            }),
          ],
          { gap: 8, height: 32 }
        ),
        ],
        {
          padding: { left: 8, right: 8, top: 8, bottom: 6 },
          width: 'fill',
        }
    )
  }, [leftIconSVG, rightIconSVG, iconButtonSVG, randomTexts])

  const columns = useMemo<BasicGridColumn<DataRow>[]>(() => [
    {
      title: 'Сотрудник',
      headerContent: <HeaderCard icon="👤" iconTone="blue" title="Сотрудник" subtitle="Основная информация" compact />,
      children: [
        createColumn<DataRow>('employeeId', 'string', 'ID', { width: 120 }),
        createColumn<DataRow>('firstName', 'string', 'Имя', { width: 150 }),
        createColumn<DataRow>('lastName', 'string', 'Фамилия', { width: 170 }),
        createColumn<DataRow>('role', 'string', 'Роль', { width: 220 }),
      ],
    },
    {
      title: 'Canvas ячейки',
      headerContent: <HeaderCard icon="🎨" iconTone="purple" title="Canvas ячейки" subtitle="Кастомная отрисовка" compact />,
      children: [
        createColumn<DataRow>('actions', 'canvas', 'Комплексные действия', {
          width: 400,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const dataRow = row as DataRow
              const employeeId = dataRow.employeeId
              const buttonText = buttonTexts.get(employeeId) || randomTexts[0]
              const structuredComponents = buildActionCellLayout(dataRow, buttonText)

              return renderComponents([structuredComponents], ctx, rect, theme, hoverX, hoverY)
            },
            copyData: 'Открыть',
          },
        }),
      ],
    },
    {
      title: 'Дополнительно',
      headerContent: <HeaderCard icon="📊" iconTone="green" title="Дополнительно" subtitle="Другие поля" compact />,
      children: [
        createColumn<DataRow>('progress', 'percent', 'Прогресс %', { width: 140 }),
        createColumn<DataRow>('status.name', 'select', 'Статус', {
          width: 160,
          selectOptionsAccessor: 'status.options',
          selectPlaceholder: 'Выберите статус',
        }),
      ],
    },
  ], [buttonTexts, buildActionCellLayout, randomTexts])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Canvas Cells Example</h2>
      <p className="section-description">
        Примеры использования canvas ячеек с кастомной отрисовкой: кнопки, теги, иконки, сложные компоновки.
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


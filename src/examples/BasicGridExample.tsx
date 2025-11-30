import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'
import { CanvasContainer } from '../components/BasicGrid/components/CanvasHeader/core/CanvasContainer'
import { CanvasText } from '../components/BasicGrid/components/CanvasHeader/primitives/CanvasText'
import { CanvasIcon } from '../components/BasicGrid/components/CanvasHeader/primitives/CanvasIcon'
import { CanvasButton } from '../components/BasicGrid/components/CanvasHeader/primitives/CanvasButton'

const svgIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
</svg>
`

const columns: BasicGridColumn<DataRow>[] = [
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
      {
        accessor: 'employeeId',
        dataType: "string",
        title: 'ID',
        width: 150,
        renderColumnContent: ( rect) => {
          const root = new CanvasContainer('root', {
            direction: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 6,
            wrap: 'wrap',
            alignContent: 'center',
          })

          root.rect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }

          const text = new CanvasText('text-label', 'Текст:')
          text.color = '#666'
          root.addChild(text)

          const icon = new CanvasIcon('icon-svg', svgIcon, { size: 20, color: '#1565c0' })
          icon.style = {
            width: 20,
            height: 20,
          }
          icon.onClick = () => {
            console.log('SVG Icon clicked via CanvasNode!')
          }
          icon.onMouseEnter = () => {
            icon.color = '#9065c0'
          }
          icon.onMouseLeave = () => {
            icon.color = '#1565c0'
          }

          root.addChild(icon)

          return root
        },
        renderCellContent: (row, rowIndex, rect) => {
          const root = new CanvasContainer(`cell-root-${row.employeeId ?? rowIndex}`, {
            direction: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: 8,
            padding: 8,
            wrap: 'wrap'
          })
          root.rect = { x: 0, y: 0, width: rect.width, height: rect.height }

          const left = new CanvasContainer(`cell-left-${row.employeeId ?? rowIndex}`, {
            direction: 'column',
            rowGap: 2,
          })
          left.style.width = '100%'

          const title = new CanvasText(`cell-title-${row.employeeId ?? rowIndex}`, row.employeeId ?? '—')
          title.color = '#0d47a1'
          title.style = { flexGrow: 1 }
          left.addChild(title)

          const subtitle = new CanvasText(`cell-sub-${row.employeeId ?? rowIndex}`, row.role ?? '—')
          subtitle.color = '#607d8b'
          subtitle.style = { flexGrow: 1 }
          left.addChild(subtitle)

          const actionButton = new CanvasButton(`cell-btn-${row.employeeId ?? rowIndex}`, 'Подробнее', {
            variant: 'secondary',
          })
          actionButton.onClick = () => {
            console.log('Подробнее по сотруднику', row.employeeId)
          }

          root.addChild(left)
          root.addChild(actionButton)

          return root
        },
      },
      {
        title: 'ФИО',
        children: [
          createColumn<DataRow>('firstName', 'string', 'Имя', { width: 150 }),
          createColumn<DataRow>('lastName', 'string', 'Фамилия', { width: 170 }),
        ],
      },
      {
        title: 'Позиция',
        children: [
          createColumn<DataRow>('role', 'string', 'Роль', {
            width: 320,
            renderCellContent: (row, rowIndex) => {
              // Root: Row layout
              const root = new CanvasContainer(`role-root-${rowIndex}`, {
                direction: 'row',
                justifyContent: 'space-between',
                padding: 4,
                columnGap: 8,
              })


              const statusStrip = new CanvasContainer(`status-strip-${rowIndex}`, {
                direction: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              })
              statusStrip.style = { width: 4, alignSelf: 'stretch', flexShrink: 0 }


              const avatarArea = new CanvasContainer(`avatar-area-${rowIndex}`, {
                direction: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                rowGap: 2,
              })
              avatarArea.style = { width: 40, flexShrink: 0 }

              let iconChar = '👤'
              if (row.role === 'Developer') iconChar = '💻'
              if (row.role === 'Manager') iconChar = '💼'
              if (row.role === 'Designer') iconChar = '🎨'

              const icon = new CanvasText(`icon-${rowIndex}`, iconChar, { font: '24px sans-serif' })
              avatarArea.addChild(icon)

              // Small ID text below icon
              const idText = new CanvasText(`id-${rowIndex}`, `#${rowIndex + 1}`, { font: '9px sans-serif', color: '#999' })
              avatarArea.addChild(idText)

              root.addChild(avatarArea)

              // SECTION 2: Main Content (Column, Flex Grow)
              const contentArea = new CanvasContainer(`content-area-${rowIndex}`, {
                direction: 'column',
                justifyContent: 'flex-start', // Push header to top, tags to bottom
                padding: { left: 4, right: 4 },
              })

              // 2.1 Header Row (Row: Title + Badge)
              const headerRow = new CanvasContainer(`header-row-${rowIndex}`, {
                direction: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              })

              const titleText = new CanvasText(`title-${rowIndex}`, row.role as string, {
                font: 'bold 12px sans-serif',
                color: '#333'
              })
              headerRow.addChild(titleText)

              // Status badge (Auto width)
              const statusText = new CanvasText(`status-${rowIndex}`, row.status?.name || 'Active', {
                  font: '10px sans-serif',
                  color: '#4caf50'
              })
              headerRow.addChild(statusText)

              contentArea.addChild(headerRow)

              // 2.2 Description Row (Row with wrapping text)
              const descRow = new CanvasContainer(`desc-row-${rowIndex}`, {
                  direction: 'row',
                  alignItems: 'flex-start',
                  padding: { top: 2, bottom: 2 }
              })

              let desc = 'Сотрудник'
              if (row.role === 'Developer') desc = 'Full-stack разработка, React/Node.js'
              if (row.role === 'Manager') desc = 'Управление проектами, Agile/Scrum'
              if (row.role === 'Designer') desc = 'UI/UX дизайн, Figma, прототипирование'

              const descText = new CanvasText(`desc-text-${rowIndex}`, desc, {
                  font: '10px sans-serif',
                  color: '#666',
                  wordWrap: true,
                  lineHeight: 1.2
              })
              descRow.addChild(descText)
              contentArea.addChild(descRow)

              // 2.3 Tags Row (Row: Flex-start with gap)
              const tagsRow = new CanvasContainer(`tags-row-${rowIndex}`, {
                  direction: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  columnGap: 4
              })

              // Mock tags
              const tags = ['FullTime', 'Office']
              tags.forEach((tag, i) => {
                  const tagBtn = new CanvasButton(`tag-${rowIndex}-${i}`, tag, { variant: 'secondary' })
                  // Hack to make button smaller
                  // tagBtn.style = { height: 16, fontSize: 9 } // hypothetical style support
                  tagsRow.addChild(tagBtn)
              })
              contentArea.addChild(tagsRow)

              root.addChild(contentArea)

              // SECTION 3: Actions Area (Column: Space Around)
              const actionsArea = new CanvasContainer(`actions-area-${rowIndex}`, {
                  direction: 'column',
                  justifyContent: 'space-around',
                  alignItems: 'flex-end',
                  padding: { left: 4 }
              })
              actionsArea.style = { width: 80, flexShrink: 0 }

              // Top Action
              const msgBtn = new CanvasButton(`msg-btn-${rowIndex}`, 'Chat', { variant: 'primary' })
              msgBtn.onClick = () => console.log('Chat', row.employeeId)
              actionsArea.addChild(msgBtn)

              // Bottom Info (Right aligned text column)
              const metaInfo = new CanvasContainer(`meta-${rowIndex}`, {
                  direction: 'column',
                  alignItems: 'flex-end',
                  rowGap: 2
              })
              const dateText = new CanvasText(`date-${rowIndex}`, '2 ч. назад', { font: '9px sans-serif', color: '#aaa' })
              metaInfo.addChild(dateText)

              const deptText = new CanvasText(`dept-${rowIndex}`, (row.department as string).substring(0, 8) + '...', {
                  font: '9px sans-serif',
                  color: '#999'
              })
              metaInfo.addChild(deptText)

              actionsArea.addChild(metaInfo)

              root.addChild(actionsArea)

              return root
            },
          }),
          createColumn<DataRow>('department', 'string', 'Отдел', { width: 180 }),
        ],
      },
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
    title: 'Прогресс',
    headerContent: <HeaderCard icon="📈" iconTone="purple" title="Прогресс" subtitle="KPI + статус" compact />,
    children: [
      createColumn<DataRow>('status.name', 'select', 'Статус', {
        width: 160,
        selectOptionsAccessor: 'status.options',
        selectPlaceholder: 'Выберите статус',
      }),
      createColumn<DataRow>('progress', 'percent', 'Прогресс %', { width: 140 }),
      {
        title: 'Действие',
        dataType: 'string',
        width: 150,
        renderColumnContent: ( ) => {
          const root = new CanvasContainer('root', {
            direction: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 6,
            wrap: 'wrap',
            alignContent: 'center',
          })


          // Текст
          const text = new CanvasText('text-label', 'Текст:')
          text.color = '#666'
          root.addChild(text)

          // Иконка SVG
          const icon = new CanvasIcon('icon-svg', svgIcon, { size: 20, color: '#1565c0' })
          icon.style = {
            width: 20,
            height: 20,
          }
          icon.onClick = () => {
            console.log('SVG Icon clicked via CanvasNode!')
          }
          icon.onMouseEnter = () => {
            icon.color = '#9065c0'
          }
          icon.onMouseLeave = () => {
            icon.color = '#1565c0'
          }

          root.addChild(icon)

          // Кнопка
          const button = new CanvasButton('btn-test', 'Button', { variant: 'secondary' })
          button.onClick = () => {
            console.log('Button clicked!')
          }
          root.addChild(button)
          const button1 = new CanvasButton('btn-test', 'Button', { variant: 'secondary' })
          button1.onClick = () => {
            console.log('Button clicked!')
          }
          root.addChild(button1)

          // Возвращаем root ноду для интеграции
          return root
        },
      },
    ],
  },
  createColumn<DataRow>('salary', 'number', 'Зарплата', {
    width: 180,
    formatter: (value) => (typeof value === 'number' ? `${Math.round(value).toLocaleString('ru-RU')} ₽` : ''),
  }),
]

export function BasicGridExample() {
  const rows = useMemo(() => {
    const extraRows: DataRow[] = Array.from({ length: 100 }).map((_, i) => {
      const id = i + 100
      return {
        employeeId: `EMP-${id}`,
        firstName: `Сотрудник`,
        lastName: `${id}`,
        name: `Сотрудник ${id}`,
        age: 20 + (i % 40),
        role: i % 3 === 0 ? 'Developer' : i % 3 === 1 ? 'Manager' : 'Designer',
        department: i % 2 === 0 ? 'Разработка' : 'Дизайн',
        salary: 100000 + (i * 1000),
        city: 'Москва',
        email: `employee${id}@example.com`,
        contact: { email: `employee${id}@example.com`, phone: '+7 000 000 00 00' },
        address: { street1: 'Улица', city: 'Москва', state: 'Москва', country: 'Россия' },
        status: { name: 'Активен', options: [] },
        progress: i % 100,
      }
    })
    return [...basicGridRows, ...extraRows]
  }, [])

  const summaryRows = useMemo(() => {
    const totalSalary = rows.reduce((sum, row) => {
      return sum + (typeof row.salary === 'number' ? row.salary : 0)
    }, 0)

    const summaryRow: DataRow = {
      employeeId: 'total',
      firstName: 'Итого',
      lastName: '',
      name: 'Итого',
      age: 0,
      role: '',
      department: '',
      salary: totalSalary,
      city: '',
      email: '',
      contact: { email: '', phone: '' },
      address: { street1: '', city: '', state: '', country: '' },
      status: { name: '', options: [] },
      progress: 0,
    }

    return [summaryRow]
  }, [rows])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Basic Grid</h2>
      <p className="section-description">Базовая таблица Glide Data Grid без редактирования.</p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={rows}
        summaryRows={summaryRows}
        height={500}
        headerRowHeight={54}
        rowHeight={80}
        enableColumnReorder={true}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}



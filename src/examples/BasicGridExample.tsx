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
          createColumn<DataRow>('role', 'string', 'Роль', { width: 220, grow: 1 }),
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
        renderColumnContent: ( rect) => {
          const root = new CanvasContainer('root', {
            direction: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 6,
            wrap: 'wrap',
            alignContent: 'center',
          })

          // Устанавливаем размеры корневого контейнера
          root.rect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }

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
        height={420}
        headerRowHeight={54}
        enableColumnReorder={true}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}



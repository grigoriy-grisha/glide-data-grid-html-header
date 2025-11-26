import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { basicGridRows, type DataRow } from './data'
import { CanvasButton } from '../components/BasicGrid/components/CanvasHeader/CanvasButton'
import { CanvasFlex } from '../components/BasicGrid/components/CanvasHeader/CanvasFlex'
import { CanvasIcon } from '../components/BasicGrid/components/CanvasHeader/CanvasIcon'
import { CanvasText } from '../components/BasicGrid/components/CanvasHeader/CanvasText'
import { CanvasIconButton } from '../components/BasicGrid/components/CanvasHeader/CanvasIconButton'

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
      createColumn<DataRow>('employeeId', 'string', 'ID', { width: 120 }),
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
        renderColumnContent: (ctx, rect, mousePosition, onRerenderRequested) => {
          // Пример SVG иконки (стрелка вниз)
          const arrowDownSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>`

          const flex = new CanvasFlex(
            rect,
            [
              new CanvasIcon(
                { x: 0, y: 0 },
                arrowDownSvg,
                {
                  width: 20,
                  height: 20,
                  color: '#1565c0',
                }
              ),
              new CanvasText(
                'Текст:',
                { x: 0, y: 0 },
                {
                  color: '#666',
                  fontSize: 13,
                  fontWeight: 'normal',
                }
              ),
              new CanvasIconButton(
                { x: 0, y: 0, width: 32, height: 28 },
                '', // Текст не нужен, только иконка
                arrowDownSvg,
                {
                  fillColor: '#e3f2fd',
                  hoverFillColor: '#bbdefb',
                  strokeColor: '#2196f3',
                  borderRadius: 4,
                  height: 28,
                  iconSize: 16,
                  iconColor: '#1565c0',
                  showText: false, // Не показывать текст
                  onClick: () => {
                    console.log('Clicked on icon button!')
                  },
                }
              ),
              new CanvasButton(
                { x: 0, y: 0, width: 60, height: 28 },
                'Кнопка 1',
                {
                  fillColor: '#e3f2fd',
                  hoverFillColor: '#bbdefb',
                  strokeColor: '#2196f3',
                  textColor: '#1565c0',
                  fontSize: 12,
                  borderRadius: 4,
                  height: 28,
                  onClick: () => {
                    console.log('Clicked on button 1!')
                  },
                }
              ),
              new CanvasButton(
                { x: 0, y: 0, width: 60, height: 28 },
                'Кнопка 2',
                {
                  fillColor: '#fff3e0',
                  hoverFillColor: '#ffe0b2',
                  strokeColor: '#ff9800',
                  textColor: '#e65100',
                  fontSize: 12,
                  borderRadius: 4,
                  height: 28,
                  onClick: () => {
                    console.log('Clicked on button 2!')
                  },
                }
              ),
            ],
            {
              gap: 12,
              direction: 'row',
              alignItems: 'center',
              padding: 6,
              wrap: true, // Перенос элементов на новую строку при нехватке места
            }
          )
          flex.setContext(ctx, onRerenderRequested)
          
          if (mousePosition) {
            flex.updateMousePosition(mousePosition.x, mousePosition.y)
          }
          
          flex.draw()
          
          // Возвращаем кликабельные области
          return flex.getClickableAreas()
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



import { BasicGrid, BasicGridColumn, createColumn } from './components/BasicGrid'
import './App.css'
import { useEffect, type ReactNode } from 'react'

interface DataRow extends Record<string, unknown> {
  employeeId: string
  firstName: string
  lastName: string
  name: string
  age: number
  role: string
  department: string
  salary: number
  city: string
  email: string
  contact: {
    email: string
    phone: string
  }
  address: {
    street1: string
    city: string
    state: string
    country: string
  }
  status: {
    label: string
    progress: number
  }
}

type HeaderTone = 'blue' | 'green' | 'amber' | 'purple' | 'teal'

interface HeaderChip {
  label: string
  tone?: HeaderTone
}

interface HeaderCardProps {
  icon: ReactNode
  iconTone?: HeaderTone
  title: string
  subtitle?: string
  chip?: HeaderChip
  metrics?: { label: string; value: string }[]
  compact?: boolean
}

const HeaderCard = ({ icon, iconTone = 'blue', title, subtitle, chip, metrics, compact = false }: HeaderCardProps) => {
  const cardClassName = ['basic-grid-header-card']
  if (!compact && metrics && metrics.length > 0) {
    cardClassName.push('basic-grid-header-card--stacked')
  }
  if (compact) {
    cardClassName.push('basic-grid-header-card--compact')
  }

  return (
    <div className={cardClassName.join(' ')}>
      <div className="basic-grid-header-card-main">
        <div className={`basic-grid-header-card-icon basic-grid-header-card-icon--${iconTone}`}>{icon}</div>
        <div className="basic-grid-header-card-body">
          <span className="basic-grid-header-card-title">{title}</span>
          {subtitle && <span className="basic-grid-header-card-subtitle">{subtitle}</span>}
        </div>
        {chip && (
          <span className={`basic-grid-header-chip basic-grid-header-chip--${chip.tone ?? 'blue'}`}>{chip.label}</span>
        )}
      </div>
      {!compact && metrics && metrics.length > 0 && (
        <div className="basic-grid-header-metrics">
          {metrics.map((metric) => (
            <div key={`${title}-${metric.label}`} className="basic-grid-header-metric">
              <span className="basic-grid-header-metric-value">{metric.value}</span>
              <span className="basic-grid-header-metric-label">{metric.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const basicGridColumns: BasicGridColumn<DataRow>[] = [
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
      {
        title: 'Цифровые каналы',
        headerContent: (
          <HeaderCard icon="💬" iconTone="blue" title="Цифровые каналы" subtitle="Email · Chat · Push" compact />
        ),
        children: [
          {
            title: 'Рабочие',
            children: [
              createColumn<DataRow>('contact.email', 'string', 'Рабочий email', { width: 260 }),
            ],
          },
          {
            title: 'Личные',
            children: [
              createColumn<DataRow>('email', 'string', 'Личный email', { width: 220 }),
            ],
          },
        ],
      },
      {
        title: 'Телефония',
        headerContent: (
          <HeaderCard
            icon="📞"
            iconTone="teal"
            title="Телефония"
            subtitle="Голосовые каналы"
            chip={{ label: 'SLA 99%', tone: 'blue' }}
            compact
          />
        ),
        children: [createColumn<DataRow>('contact.phone', 'string', 'Телефон', { width: 180 })],
      },
    ],
  },
  {
    title: 'Локация',
    headerContent: (
      <HeaderCard icon="📍" iconTone="amber" title="Локация" subtitle="Адреса и регионы" chip={{ label: 'Geo', tone: 'amber' }} />
    ),
    children: [
      {
        title: 'Фактический адрес',
        headerContent: (
          <HeaderCard icon="🏢" iconTone="purple" title="Фактический адрес" subtitle="Street · City · Country" compact />
        ),
        children: [
          createColumn<DataRow>('address.street1', 'string', 'Адрес', { width: 260 }),
          {
            title: 'Муниципалитет',
            headerContent: (
              <HeaderCard icon="🏙" iconTone="blue" title="Муниципалитет" subtitle="Города и округа" compact />
            ),
            children: [
              createColumn<DataRow>('address.city', 'string', 'Город', { width: 160 }),
              {
                title: 'Региональные сведения',
                headerContent: (
                  <HeaderCard icon="🗺" iconTone="green" title="Региональные сведения" subtitle="Регион · Страна" compact />
                ),
                children: [
                  createColumn<DataRow>('address.state', 'string', 'Регион', { width: 160 }),
                  createColumn<DataRow>('address.country', 'string', 'Страна', { width: 160 }),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Прогресс и компенсация',
    headerContent: (
      <HeaderCard
        icon="📈"
        iconTone="purple"
        title="Прогресс и компенсация"
        subtitle="OKR + выплаты"
        chip={{ label: 'HR', tone: 'purple' }}
        metrics={[
          { label: 'avg progress', value: '74%' },
          { label: 'avg pay', value: '185k ₽' },
        ]}
      />
    ),
    children: [
      {
        title: 'Прогресс',
        headerContent: <HeaderCard icon="🎯" iconTone="green" title="Прогресс" subtitle="KPI + статус" compact />,
        children: [
          createColumn<DataRow>('status.label', 'string', 'Статус', { width: 140 }),
          createColumn<DataRow>('status.progress', 'percent', 'Прогресс %', { width: 140 }),
        ],
      },
      createColumn<DataRow>('salary', 'number', 'Зарплата', {
        width: 180,
        headerContent: (
          <HeaderCard
            icon="₽"
            iconTone="amber"
            title="Зарплата"
            subtitle="Ежемесячно · median 185k ₽"
            chip={{ label: 'Finance', tone: 'amber' }}
            compact
          />
        ),
        formatter: (value) => (typeof value === 'number' ? `${Math.round(value).toLocaleString('ru-RU')} ₽` : ''),
      }),
    ],
  },
]

const basicGridRows: DataRow[] = [
  {
    employeeId: 'EMP-001',
    firstName: 'Анна',
    lastName: 'Иванова',
    name: 'Анна Иванова',
    age: 29,
    role: 'Product Manager',
    department: 'Разработка',
    salary: 185000,
    city: 'Москва',
    email: 'anna.ivanova@example.com',
    contact: {
      email: 'anna.ivanova@example.com',
      phone: '+7 (495) 100-20-30',
    },
    address: {
      street1: 'ул. Тверская, 5',
      city: 'Москва',
      state: 'Москва',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 82,
    },
  },
  {
    employeeId: 'EMP-002',
    firstName: 'Михаил',
    lastName: 'Петров',
    name: 'Михаил Петров',
    age: 34,
    role: 'Backend Engineer',
    department: 'Разработка',
    salary: 210000,
    city: 'Санкт-Петербург',
    email: 'mikhail.petrov@example.com',
    contact: {
      email: 'mikhail.petrov@example.com',
      phone: '+7 (812) 340-10-22',
    },
    address: {
      street1: 'Наб. реки Фонтанки, 44',
      city: 'Санкт-Петербург',
      state: 'Ленинградская область',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 68,
    },
  },
  {
    employeeId: 'EMP-003',
    firstName: 'Екатерина',
    lastName: 'Смирнова',
    name: 'Екатерина Смирнова',
    age: 31,
    role: 'UX Lead',
    department: 'Дизайн',
    salary: 165000,
    city: 'Казань',
    email: 'ekaterina.smirnova@example.com',
    contact: {
      email: 'ekaterina.smirnova@example.com',
      phone: '+7 (843) 555-33-77',
    },
    address: {
      street1: 'ул. Баумана, 12',
      city: 'Казань',
      state: 'Татарстан',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 74,
    },
  },
  {
    employeeId: 'EMP-004',
    firstName: 'Дмитрий',
    lastName: 'Волков',
    name: 'Дмитрий Волков',
    age: 28,
    role: 'Data Analyst',
    department: 'Аналитика',
    salary: 152000,
    city: 'Новосибирск',
    email: 'dmitry.volkov@example.com',
    contact: {
      email: 'dmitry.volkov@example.com',
      phone: '+7 (383) 111-45-67',
    },
    address: {
      street1: 'Красный проспект, 98',
      city: 'Новосибирск',
      state: 'Новосибирская область',
      country: 'Россия',
    },
    status: {
      label: 'На обучении',
      progress: 59,
    },
  },
  {
    employeeId: 'EMP-005',
    firstName: 'Ирина',
    lastName: 'Кузнецова',
    name: 'Ирина Кузнецова',
    age: 33,
    role: 'HR Business Partner',
    department: 'HR',
    salary: 138000,
    city: 'Екатеринбург',
    email: 'irina.kuznetsova@example.com',
    contact: {
      email: 'irina.kuznetsova@example.com',
      phone: '+7 (343) 240-08-55',
    },
    address: {
      street1: 'пр. Ленина, 24',
      city: 'Екатеринбург',
      state: 'Свердловская область',
      country: 'Россия',
    },
    status: {
      label: 'В отпуске',
      progress: 35,
    },
  },
  {
    employeeId: 'EMP-006',
    firstName: 'Павел',
    lastName: 'Соколов',
    name: 'Павел Соколов',
    age: 38,
    role: 'Sales Director',
    department: 'Продажи',
    salary: 198000,
    city: 'Нижний Новгород',
    email: 'pavel.sokolov@example.com',
    contact: {
      email: 'pavel.sokolov@example.com',
      phone: '+7 (831) 905-44-11',
    },
    address: {
      street1: 'ул. Большая Покровская, 8',
      city: 'Нижний Новгород',
      state: 'Нижегородская область',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 91,
    },
  },
  {
    employeeId: 'EMP-007',
    firstName: 'Светлана',
    lastName: 'Миронова',
    name: 'Светлана Миронова',
    age: 27,
    role: 'Marketing Lead',
    department: 'Маркетинг',
    salary: 167000,
    city: 'Самара',
    email: 'svetlana.mironova@example.com',
    contact: {
      email: 'svetlana.mironova@example.com',
      phone: '+7 (846) 400-70-10',
    },
    address: {
      street1: 'ул. Ленинградская, 18',
      city: 'Самара',
      state: 'Самарская область',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 64,
    },
  },
  {
    employeeId: 'EMP-008',
    firstName: 'Олег',
    lastName: 'Баранов',
    name: 'Олег Баранов',
    age: 35,
    role: 'DevOps Engineer',
    department: 'Инфраструктура',
    salary: 175000,
    city: 'Краснодар',
    email: 'oleg.baranov@example.com',
    contact: {
      email: 'oleg.baranov@example.com',
      phone: '+7 (861) 310-55-66',
    },
    address: {
      street1: 'ул. Красная, 45',
      city: 'Краснодар',
      state: 'Краснодарский край',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 77,
    },
  },
  {
    employeeId: 'EMP-009',
    firstName: 'Виктор',
    lastName: 'Громов',
    name: 'Виктор Громов',
    age: 42,
    role: 'QA Lead',
    department: 'Тестирование',
    salary: 142000,
    city: 'Воронеж',
    email: 'victor.gromov@example.com',
    contact: {
      email: 'victor.gromov@example.com',
      phone: '+7 (473) 700-55-21',
    },
    address: {
      street1: 'ул. Плехановская, 15',
      city: 'Воронеж',
      state: 'Воронежская область',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 71,
    },
  },
  {
    employeeId: 'EMP-010',
    firstName: 'Татьяна',
    lastName: 'Галкина',
    name: 'Татьяна Галкина',
    age: 30,
    role: 'Product Analyst',
    department: 'Аналитика',
    salary: 158000,
    city: 'Пермь',
    email: 'tatyana.galkina@example.com',
    contact: {
      email: 'tatyana.galkina@example.com',
      phone: '+7 (342) 320-47-88',
    },
    address: {
      street1: 'ул. Ленина, 60',
      city: 'Пермь',
      state: 'Пермский край',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 66,
    },
  },
  {
    employeeId: 'EMP-011',
    firstName: 'Георгий',
    lastName: 'Соколов',
    name: 'Георгий Соколов',
    age: 37,
    role: 'Security Engineer',
    department: 'Инфраструктура',
    salary: 205000,
    city: 'Челябинск',
    email: 'georgy.sokolov@example.com',
    contact: {
      email: 'georgy.sokolov@example.com',
      phone: '+7 (351) 410-23-19',
    },
    address: {
      street1: 'ул. Кирова, 22',
      city: 'Челябинск',
      state: 'Челябинская область',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 79,
    },
  },
  {
    employeeId: 'EMP-012',
    firstName: 'Маргарита',
    lastName: 'Шестакова',
    name: 'Маргарита Шестакова',
    age: 26,
    role: 'Content Strategist',
    department: 'Маркетинг',
    salary: 128000,
    city: 'Уфа',
    email: 'margaret.shestakova@example.com',
    contact: {
      email: 'margaret.shestakova@example.com',
      phone: '+7 (347) 505-33-44',
    },
    address: {
      street1: 'пр. Октября, 31',
      city: 'Уфа',
      state: 'Башкортостан',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 62,
    },
  },
  {
    employeeId: 'EMP-013',
    firstName: 'Константин',
    lastName: 'Лаптев',
    name: 'Константин Лаптев',
    age: 41,
    role: 'Finance Controller',
    department: 'Финансы',
    salary: 223000,
    city: 'Ростов-на-Дону',
    email: 'konstantin.laptev@example.com',
    contact: {
      email: 'konstantin.laptev@example.com',
      phone: '+7 (863) 990-44-00',
    },
    address: {
      street1: 'пр. Будённовский, 45',
      city: 'Ростов-на-Дону',
      state: 'Ростовская область',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 88,
    },
  },
  {
    employeeId: 'EMP-014',
    firstName: 'Алёна',
    lastName: 'Фролова',
    name: 'Алёна Фролова',
    age: 24,
    role: 'Junior Designer',
    department: 'Дизайн',
    salary: 98000,
    city: 'Сочи',
    email: 'alena.frolova@example.com',
    contact: {
      email: 'alena.frolova@example.com',
      phone: '+7 (862) 234-90-08',
    },
    address: {
      street1: 'Курортный проспект, 27',
      city: 'Сочи',
      state: 'Краснодарский край',
      country: 'Россия',
    },
    status: {
      label: 'На испытательном сроке',
      progress: 54,
    },
  },
  {
    employeeId: 'EMP-015',
    firstName: 'Руслан',
    lastName: 'Сафаров',
    name: 'Руслан Сафаров',
    age: 36,
    role: 'Platform Architect',
    department: 'Инфраструктура',
    salary: 240000,
    city: 'Казань',
    email: 'ruslan.safarov@example.com',
    contact: {
      email: 'ruslan.safarov@example.com',
      phone: '+7 (843) 777-15-45',
    },
    address: {
      street1: 'ул. Достоевского, 19',
      city: 'Казань',
      state: 'Татарстан',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 95,
    },
  },
  {
    employeeId: 'EMP-016',
    firstName: 'Елизавета',
    lastName: 'Суркова',
    name: 'Елизавета Суркова',
    age: 29,
    role: 'Community Manager',
    department: 'Маркетинг',
    salary: 122000,
    city: 'Ярославль',
    email: 'elizaveta.surkova@example.com',
    contact: {
      email: 'elizaveta.surkova@example.com',
      phone: '+7 (4852) 333-02-11',
    },
    address: {
      street1: 'ул. Кирова, 5',
      city: 'Ярославль',
      state: 'Ярославская область',
      country: 'Россия',
    },
    status: {
      label: 'Активен',
      progress: 58,
    },
  },
]

function App() {
  // Пример использования кастомных React компонентов в ячейках с поддержкой состояния и кликов
  useEffect(() => {
    // Ждем, пока DataGrid загрузится
    const timer = setTimeout(() => {
      const setCellComponent = (window as any).setCellComponent
      
      if (setCellComponent) {
        // Пример 1: Кастомный компонент с кнопкой в колонке "Имя" (колонка 2), строка 0
        // С поддержкой состояния и обработчика клика
        let buttonState = { clicked: false }
        setCellComponent(2, 0, ({ row, state }: { row: DataRow; rowIndex: number; colIndex: number; state?: any }) => (
          <div style={{ 
            padding: '8px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '6px',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            cursor: 'pointer',
          }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            // Состояние обновляется через обработчик onClick в setCellComponent
          }}
          >
            {state?.clicked ? '✅ ' : ''}{row.name}
          </div>
        ), {
          state: buttonState,
          onClick: () => {
            buttonState.clicked = !buttonState.clicked
            // Обновляем компонент с новым состоянием
            setCellComponent(2, 0, ({ row, state }: { row: DataRow; rowIndex: number; colIndex: number; state?: any }) => (
              <div style={{
                padding: '8px',
                background: state?.clicked 
                  ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '6px',
                color: 'white',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                cursor: 'pointer',
              }}>
                {state?.clicked ? '✅ ' : ''}{row.name}
              </div>
            ), { state: buttonState, onClick: () => {
              buttonState.clicked = !buttonState.clicked
              setCellComponent(2, 0, ({ row, state }: { row: DataRow; rowIndex: number; colIndex: number; state?: any }) => (
                <div style={{
                  padding: '8px',
                  background: state?.clicked 
                    ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '6px',
                  color: 'white',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  cursor: 'pointer',
                }}>
                  {state?.clicked ? '✅ ' : ''}{row.name}
                </div>
              ), { state: buttonState, onClick: () => {
                buttonState.clicked = !buttonState.clicked
              }})
            }})
          }
        })
        
        // Пример 2: Компонент с прогресс-баром в колонке "Зарплата" (колонка 7), строка 1
        setCellComponent(7, 1, ({ row }: { row: DataRow; rowIndex: number; colIndex: number }) => {
          const maxSalary = 150000
          const percentage = (row.salary / maxSalary) * 100
          
          return (
            <div style={{ 
              padding: '4px 8px',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}>
              <div style={{
                width: '100%',
                height: '20px',
                background: '#e0e0e0',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, #4caf50 ${percentage}%, #81c784 100%)`,
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '4px',
                  fontSize: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                }}>
                  {row.salary.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>
          )
        })
        
        // Пример 3: Компонент с аватаром и информацией в колонке "Email" (колонка 3), строка 2
        setCellComponent(3, 2, ({ row }: { row: DataRow; rowIndex: number; colIndex: number }) => (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px',
            height: '100%',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              flexShrink: 0,
            }}>
              {row.name.charAt(0)}
            </div>
            <div style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {row.name}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#666',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {row.email}
              </div>
            </div>
          </div>
        ))
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1 className="logo">✨ Glide</h1>
          <p className="subtitle">Современное React приложение</p>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <div className="data-grid-section">
            <h2 className="section-title">Basic Grid</h2>
            <p className="section-description">
              Минимальная таблица Glide Data Grid без дополнительных функций
            </p>
            <BasicGrid<DataRow>
              columns={basicGridColumns}
              rows={basicGridRows}
              height={420}
              headerRowHeight={54}
              enableColumnReorder={true}
            />
          </div>
{/* 
          <div className="data-grid-section">
            <h2 className="section-title">Simple Grid</h2>
            <p className="section-description">
              Простая таблица Glide Data Grid с базовой функциональностью
            </p>
            <SimpleGrid />
          </div> */}

          {/* <div className="data-grid-section">
            <h2 className="section-title">Data Grid</h2>
            <p className="section-description">
              Интерактивная таблица данных с возможностью редактирования, сортировки и иерархической структуры
            </p>
            <p className="section-hint">
              💡 Для сортировки: кликните на заголовок столбца (▲ по возрастанию, ▼ по убыванию). 
              Для редактирования: двойной клик по ячейке, или выберите ячейку и нажмите Enter, или начните вводить текст.
              Для иерархии: кликните по ячейке ID с индикатором ▼ или ▶, чтобы свернуть/развернуть дочерние строки.
            </p>
            <DataGrid /> */}
          {/* </div> */}
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>Создано с ❤️ используя React + Vite</p>
        </div>
      </footer>
    </div>
  )
}

export default App


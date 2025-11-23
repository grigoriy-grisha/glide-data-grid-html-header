import {
  BasicGrid,
  BasicGridCellChange,
  BasicGridColumn,
  BasicGridRowSelectionChange,
  BasicGridSelectOption,
  button,
  buttonIcon,
  type ButtonIcon,
  container,
  createColumn,
  renderComponents,
  tag,
  text,
} from './components/BasicGrid'
import './App.css'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

const isTreeNodeSelectable = (node: NetworkNode) => node.type !== 'edge'

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
    name: string
    options: BasicGridSelectOption[]
  }
  progress: number
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

const DEFAULT_STATUS_OPTIONS = ['Активен', 'На обучении', 'В отпуске', 'На испытательном сроке']

const createStatusOptions = (options: string[] = DEFAULT_STATUS_OPTIONS): BasicGridSelectOption[] =>
  options.map((label) => ({ label, value: label }))

const createStatus = (name: string, options: string[] = DEFAULT_STATUS_OPTIONS) => ({
  name,
  options: createStatusOptions(options),
})

const cloneDataRow = (row: DataRow): DataRow => ({
  ...row,
  contact: row.contact ? { ...row.contact } : row.contact,
  address: row.address ? { ...row.address } : row.address,
  status: row.status
    ? {
        name: row.status.name,
        options: row.status.options.map((option) => ({ ...option })),
      }
    : row.status,
  progress: row.progress,
})

const cloneChild = (source: unknown): Record<string, unknown> => {
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    return { ...(source as Record<string, unknown>) }
  }
  return {}
}

const setValueAtPath = (row: DataRow, path: string, value: unknown): DataRow => {
  const segments = path.split('.').filter(Boolean)
  if (segments.length === 0) {
    return row
  }
  const nextRow: DataRow = { ...row }
  let currentNext: Record<string, unknown> = nextRow
  let currentOriginal: unknown = row

  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i]
    const originalChild =
      currentOriginal && typeof currentOriginal === 'object'
        ? (currentOriginal as Record<string, unknown>)[key]
        : undefined
    const clonedChild = cloneChild(originalChild)
    currentNext[key] = clonedChild
    currentNext = clonedChild
    currentOriginal = originalChild
  }

  const lastKey = segments[segments.length - 1]
  currentNext[lastKey] = value
  return nextRow
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
          createColumn<DataRow>('status.name', 'select', 'Статус', {
            width: 160,
            selectOptionsAccessor: 'status.options',
            selectPlaceholder: 'Выберите статус',
          }),
          createColumn<DataRow>('progress', 'percent', 'Прогресс %', { width: 140 }),
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
    status: createStatus('Активен'),
    progress: 82,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 68,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 74,
    actions: ''
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
    status: createStatus('На обучении'),
    progress: 59,
    actions: ''
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
    status: createStatus('В отпуске'),
    progress: 35,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 91,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 64,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 77,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 71,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 66,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 79,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 62,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 88,
    actions: ''
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
    status: createStatus('На испытательном сроке', [
      'На испытательном сроке',
      'Активен',
      'На обучении',
    ]),
    progress: 54,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 95,
    actions: ''
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
    status: createStatus('Активен'),
    progress: 58,
    actions: ''
  },
]

interface NetworkNode extends Record<string, unknown> {
  id: string
  name: string
  type: string
  status: string
  load: number
  latency: number
  items?: NetworkNode[]
}

const networkColumns: BasicGridColumn<NetworkNode>[] = [
  createColumn<NetworkNode>('name', 'string', 'Узел', { width: 260 }),
  createColumn<NetworkNode>('type', 'string', 'Тип', { width: 180 }),
  createColumn<NetworkNode>('status', 'string', 'Статус', { width: 150 }),
  createColumn<NetworkNode>('load', 'percent', 'Нагрузка %', {
    width: 140,
    formatter: (value) => (typeof value === 'number' ? `${value}%` : ''),
  }),
  createColumn<NetworkNode>('latency', 'number', 'Задержка, мс', {
    width: 160,
    formatter: (value) => (typeof value === 'number' ? `${value} мс` : ''),
  }),
]

const networkData: NetworkNode[] = [
  {
    id: '3190',
    name: 'ЦОД · Москва',
    type: 'region',
    status: 'Онлайн',
    load: 82,
    latency: 18,
    items: [
      {
        id: '31469',
        name: 'Кластер API',
        type: 'cluster',
        status: 'Онлайн',
        load: 74,
        latency: 12,
        items: [],
      },
      {
        id: '31470',
        name: 'Маршрутизатор ядра',
        type: 'router',
        status: 'Деградация',
        load: 91,
        latency: 22,
        items: [
          {
            id: '3144141',
            name: 'Транк M9 · линия 1',
            type: 'link',
            status: 'Онлайн',
            load: 55,
            latency: 6,
            items: [],
          },
          {
            id: '3144142',
            name: 'Транк M9 · линия 2',
            type: 'link',
            status: 'Онлайн',
            load: 61,
            latency: 7,
            items: [],
          },
          {
            id: '3144143',
            name: 'Edge CDN #01',
            type: 'edge',
            status: 'Перегрев',
            load: 96,
            latency: 15,
            items: [],
          },
          {
            id: '3144144',
            name: 'Edge CDN #02',
            type: 'edge',
            status: 'Онлайн',
            load: 72,
            latency: 11,
            items: [],
          },
        ],
      },
      {
        id: '31471',
        name: 'Кластер хранения',
        type: 'storage',
        status: 'Онлайн',
        load: 64,
        latency: 9,
        items: [],
      },
    ],
  },
  {
    id: '3191',
    name: 'Регион · Санкт-Петербург',
    type: 'region',
    status: 'Онлайн',
    load: 58,
    latency: 25,
    items: [
      {
        id: '31480',
        name: 'Edge шлюз · Нева',
        type: 'edge',
        status: 'Онлайн',
        load: 47,
        latency: 13,
        items: [],
      },
    ],
  },
]

function App() {
  const [editableGridRows, setEditableGridRows] = useState<DataRow[]>(() => basicGridRows.map(cloneDataRow))
  const [selectedEmployees, setSelectedEmployees] = useState<DataRow[]>([])
  const [selectedNetworkNodes, setSelectedNetworkNodes] = useState<NetworkNode[]>([])

  // Состояние для хранения текста кнопки для каждой строки
  const [buttonTexts, setButtonTexts] = useState<Map<string, string>>(() => {
    const randomTexts = ['Открыть', 'Просмотр', 'Детали', 'Редактировать', 'Удалить', 'Сохранить']
    const map = new Map<string, string>()
    basicGridRows.forEach((row) => {
      // Инициализируем случайным текстом для каждой строки
      map.set(row.employeeId, randomTexts[Math.floor(Math.random() * randomTexts.length)])
    })
    return map
  })

  // Создаем колонки с доступом к состоянию buttonTexts
  const gridColumns = useMemo<BasicGridColumn<DataRow>[]>(() => {
    const randomTexts = ['Открыть', 'Просмотр', 'Детали', 'Редактировать', 'Удалить', 'Сохранить']

    // Просто добавляем секцию "Действия" с колонкой canvas в конец секции "Прогресс и компенсация"
    return basicGridColumns.map((col) => {
      if (col.title === 'Основные данные' && col.children) {
        return {
          ...col,
          children: [
            {
              title: 'Действия',
              headerContent: <HeaderCard icon="⚡" iconTone="blue" title="Действия" subtitle="Быстрые операции" compact />,
              children: [

                createColumn<DataRow>('actions', 'canvas', 'Действие', {
                  width: 280,
                  sortable: false,
                  canvasOptions: {
                    render: (ctx, rect, theme, hoverX, hoverY, row) => {
                      // Получаем текст кнопки из состояния
                      const employeeId = (row as DataRow).employeeId
                      const buttonText = buttonTexts.get(employeeId) || randomTexts[0]

                      // Пример SVG иконок
                      const leftIconSVG: ButtonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
                      const rightIconSVG: ButtonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
                      const iconButtonSVG: ButtonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>'

                      // Декларативное описание компонентов
                      // Создаем обработчики с доступом к нужным данным через замыкание
                      const components = [
                        text({ text: 'какой-то текст' }),
                        button({
                          text: buttonText,
                          leftIcon: leftIconSVG,
                          rightIcon: rightIconSVG,
                          variant: 'primary',
                          onClick: () => {
                            // Обработчик будет вызван напрямую при клике
                            const employeeId = (row as DataRow).employeeId
                            setButtonTexts((prev) => {
                              const newMap = new Map(prev)
                              const newText = randomTexts[Math.floor(Math.random() * randomTexts.length)]
                              newMap.set(employeeId, newText)
                              return newMap
                            })
                            console.log('Кнопка нажата для строки:', row)
                          },
                        }),
                        text({ text: 'какой-то текст' }),
                        tag({
                          text: (row as DataRow).status?.name ?? 'Активен',
                          color: '#0f5132',
                          background: '#d1e7dd',
                        }),
                        buttonIcon({
                          icon: iconButtonSVG,
                          variant: 'secondary',
                          onClick: () => {
                            // Обработчик будет вызван напрямую при клике
                            console.log('Иконка-кнопка нажата для строки:', row)
                            alert(`Иконка-кнопка нажата для: ${(row as DataRow).firstName} ${(row as DataRow).lastName}`)
                          },
                        }),
                      ]

                      // Отрисовываем компоненты с gap между ними
                      // Используем container для группировки с gap
                      const result = renderComponents(
                        [container(components, { gap: 12, marginLeft: 8, marginRight: 8 })],
                        ctx,
                        rect,
                        theme,
                        hoverX,
                        hoverY
                      )

                      // console.log('renderComponents вернул:', {
                      //   hoveredAreasCount: result.hoveredAreas.length,
                      //   clickHandlersCount: result.clickHandlers.length,
                      //   clickHandlers: result.clickHandlers
                      // })

                      // // Сохраняем обработчики кликов для использования в onClick
                      // console.log('Render result:', {
                      //   hoveredAreasCount: result.hoveredAreas.length,
                      //   clickHandlersCount: result.clickHandlers.length,
                      //   clickHandlers: result.clickHandlers
                      // })

                      // console.log('Render result:', {
                      //   hoveredAreasCount: result.hoveredAreas.length,
                      //   clickHandlersCount: result.clickHandlers.length,
                      //   clickHandlers: result.clickHandlers.map((h: any) => ({
                      //     componentType: h.componentType,
                      //     area: h.area
                      //   }))
                      // })

                      // console.log('Render возвращает:', {
                      //   hoveredAreasCount: renderResult.hoveredAreas.length,
                      //   clickHandlersCount: renderResult.clickHandlers.length,
                      //   clickHandlers: renderResult.clickHandlers
                      // })

                      return {
                        hoveredAreas: result.hoveredAreas,
                        clickHandlers: result.clickHandlers,
                        buttonText: buttonText,
                      }
                    },
                    copyData: 'Открыть',
                  },
                }),
              ],
            },
            ...col.children,

          ],
        }
      }
      return col
    })
  }, [buttonTexts])

  const handleEditableCellChange = useCallback((change: BasicGridCellChange<DataRow>) => {
    if (!change.accessorPath) {
      return
    }
    if (Object.is(change.previousValue, change.nextRawValue)) {
      return
    }

    setEditableGridRows((prevRows) => {
      let targetIndex = prevRows.findIndex((row) => row === change.row)
      if (targetIndex === -1 && change.row?.employeeId) {
        targetIndex = prevRows.findIndex((row) => row.employeeId === change.row.employeeId)
      }
      if (targetIndex === -1) {
        return prevRows
      }
      const updatedRow = setValueAtPath(prevRows[targetIndex], change.accessorPath!, change.nextRawValue)
      const nextRows = [...prevRows]
      nextRows[targetIndex] = updatedRow
      return nextRows
    })
  }, [])

  const handleRowSelectionChange = useCallback((selection: BasicGridRowSelectionChange<DataRow>) => {
    setSelectedEmployees(selection.rows)
  }, [])

  const handleNetworkSelectionChange = useCallback((selection: BasicGridRowSelectionChange<NetworkNode>) => {
    setSelectedNetworkNodes(selection.rows)
  }, [])



  console.log({gridColumns})

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
            <p className="section-description">Базовая таблица Glide Data Grid без редактирования.</p>
            <BasicGrid<DataRow>
              columns={gridColumns}
              rows={basicGridRows}
              height={420}
              headerRowHeight={54}
              enableColumnReorder={true}
            />
          </div>
          <div className="data-grid-section">
            <h2 className="section-title">Editable Basic Grid</h2>
            <p className="section-description">
              Версия с редактированием: кликните по ячейке текста (например, имя или email), введите новое значение и
              увидьте, как оно сохраняется во внутреннем состоянии.
            </p>
            <BasicGrid<DataRow>
              columns={gridColumns}
              rows={editableGridRows}
              height={420}
              headerRowHeight={54}
              editable
              onCellChange={handleEditableCellChange}
            />
          </div>
          <div className="data-grid-section">
            <h2 className="section-title">Selectable Grid</h2>
            <p className="section-description">
              Нажмите на чекбоксы в первой колонке, чтобы выбрать сотрудников и передать список наружу.
            </p>
            <div className="selected-rows-panel">
              <div className="selected-rows-count">
                {selectedEmployees.length > 0
                  ? `Выбрано сотрудников: ${selectedEmployees.length}`
                  : 'Выберите хотя бы одну строку'}
              </div>
              {selectedEmployees.length}
            </div>
            <BasicGrid<DataRow>
              columns={gridColumns}
              rows={basicGridRows}
              height={420}
              headerRowHeight={54}
              enableRowSelection
              showRowMarkers={false}
              onRowSelectionChange={handleRowSelectionChange}
            />
          </div>
          <div className="data-grid-section">
            <h2 className="section-title">Network Tree Grid</h2>
            <p className="section-description">
              Древовидное представление инфраструктуры с вложенными узлами
            </p>
            <div className="selected-rows-panel">
              <div className="selected-rows-count">
                {selectedNetworkNodes.length > 0
                  ? `Выбрано узлов: ${selectedNetworkNodes.length}`
                  : 'Выберите узел или ветку'}
              </div>

            </div>
            <BasicGrid<NetworkNode>
              columns={networkColumns}
              rows={networkData}
              height={360}
              headerRowHeight={48}
              enableRowSelection
              showRowMarkers={false}
              onRowSelectionChange={handleNetworkSelectionChange}
              getRowSelectable={isTreeNodeSelectable}
              treeOptions={{
                treeColumnId: 'name',
                childrenKey: 'items',
                defaultExpandedDepth: 2,
              }}
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


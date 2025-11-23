import { BasicGrid, createColumn, type BasicGridColumn } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { userData, type User } from './data/users'

const columns: BasicGridColumn<User>[] = [
  {
    title: 'Пользователь',
    headerContent: <HeaderCard icon="👤" iconTone="blue" title="Пользователь" subtitle="Основная информация" compact />,
    children: [
      createColumn<User>('id', 'string', 'ID', { width: 120 }),
      createColumn<User>('username', 'string', 'Имя пользователя', { width: 180 }),
      createColumn<User>('email', 'string', 'Email', { width: 250 }),
    ],
  },
  {
    title: 'Роль и статус',
    headerContent: <HeaderCard icon="🔐" iconTone="purple" title="Роль и статус" subtitle="Права доступа" compact />,
    children: [
      createColumn<User>('role', 'string', 'Роль', { width: 150 }),
      createColumn<User>('status', 'string', 'Статус', { width: 120 }),
      createColumn<User>('activity', 'percent', 'Активность', { width: 140 }),
    ],
  },
  {
    title: 'Даты',
    headerContent: <HeaderCard icon="📅" iconTone="green" title="Даты" subtitle="Регистрация и вход" compact />,
    children: [
      createColumn<User>('registrationDate', 'string', 'Регистрация', { width: 140 }),
      createColumn<User>('lastLogin', 'string', 'Последний вход', { width: 180 }),
    ],
  },
]

export function UsersExample() {
  return (
    <div className="data-grid-section">
      <h2 className="section-title">Users Example</h2>
      <p className="section-description">
        Пример таблицы с пользователями: имя, email, роль, статус активности, даты регистрации и последнего входа.
      </p>
      <BasicGrid<User>
        columns={columns}
        rows={userData}
        height={400}
        headerRowHeight={54}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


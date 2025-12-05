import { BasicGrid, createColumn, type BasicGridColumn } from '../components'
import { userData, type User } from './data/users'

const columns: BasicGridColumn<User>[] = [
  {
    title: 'Пользователь',
    children: [
      createColumn<User>('id', 'string', 'ID', { width: 120 }),
      createColumn<User>('username', 'string', 'Имя пользователя', { width: 180 }),
      createColumn<User>('email', 'string', 'Email', { width: 250 }),
    ],
  },
  {
    title: 'Роль и статус',
    children: [
      createColumn<User>('role', 'string', 'Роль', { width: 150 }),
      createColumn<User>('status', 'string', 'Статус', { width: 120 }),
      createColumn<User>('activity', 'percent', 'Активность', { width: 140 }),
    ],
  },
  {
    title: 'Даты',
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



export interface User extends Record<string, unknown> {
  id: string
  username: string
  email: string
  role: string
  lastLogin: string
  status: string
  registrationDate: string
  activity: number
}

export const userData: User[] = [
  {
    id: 'USR-001',
    username: 'ivanov_ivan',
    email: 'ivan.ivanov@example.com',
    role: 'Администратор',
    lastLogin: '2024-12-20 14:30',
    status: 'Активен',
    registrationDate: '2024-01-15',
    activity: 95,
  },
  {
    id: 'USR-002',
    username: 'petrova_maria',
    email: 'maria.petrova@example.com',
    role: 'Модератор',
    lastLogin: '2024-12-20 10:15',
    status: 'Активен',
    registrationDate: '2024-02-20',
    activity: 78,
  },
  {
    id: 'USR-003',
    username: 'sidorov_alex',
    email: 'alex.sidorov@example.com',
    role: 'Пользователь',
    lastLogin: '2024-12-19 18:45',
    status: 'Активен',
    registrationDate: '2024-03-10',
    activity: 62,
  },
  {
    id: 'USR-004',
    username: 'kozlov_anna',
    email: 'anna.kozlov@example.com',
    role: 'Пользователь',
    lastLogin: '2024-12-15 09:20',
    status: 'Неактивен',
    registrationDate: '2024-04-05',
    activity: 23,
  },
  {
    id: 'USR-005',
    username: 'volkov_dmitry',
    email: 'dmitry.volkov@example.com',
    role: 'Модератор',
    lastLogin: '2024-12-20 16:00',
    status: 'Активен',
    registrationDate: '2024-05-12',
    activity: 88,
  },
]


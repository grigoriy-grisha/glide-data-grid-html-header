export interface Transaction extends Record<string, unknown> {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  account: string
  status: string
  tags: string[]
}

export const transactionData: Transaction[] = [
  {
    id: 'TXN-001',
    date: '2024-12-15',
    description: 'Зарплата',
    category: 'Доходы',
    amount: 185000,
    type: 'income',
    account: 'Основной счёт',
    status: 'Завершена',
    tags: ['зарплата', 'доход'],
  },
  {
    id: 'TXN-002',
    date: '2024-12-16',
    description: 'Покупка продуктов',
    category: 'Продукты',
    amount: -3500,
    type: 'expense',
    account: 'Основной счёт',
    status: 'Завершена',
    tags: ['продукты', 'расход'],
  },
  {
    id: 'TXN-003',
    date: '2024-12-17',
    description: 'Оплата интернета',
    category: 'Коммунальные',
    amount: -890,
    type: 'expense',
    account: 'Основной счёт',
    status: 'Завершена',
    tags: ['интернет', 'коммунальные'],
  },
  {
    id: 'TXN-004',
    date: '2024-12-18',
    description: 'Фриланс проект',
    category: 'Доходы',
    amount: 45000,
    type: 'income',
    account: 'Дополнительный счёт',
    status: 'В обработке',
    tags: ['фриланс', 'доход'],
  },
  {
    id: 'TXN-005',
    date: '2024-12-19',
    description: 'Покупка одежды',
    category: 'Одежда',
    amount: -12000,
    type: 'expense',
    account: 'Основной счёт',
    status: 'Завершена',
    tags: ['одежда', 'расход'],
  },
  {
    id: 'TXN-006',
    date: '2024-12-20',
    description: 'Инвестиции в акции',
    category: 'Инвестиции',
    amount: -50000,
    type: 'expense',
    account: 'Инвестиционный счёт',
    status: 'Завершена',
    tags: ['инвестиции', 'акции'],
  },
]



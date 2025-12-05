import { BasicGrid, createColumn, type BasicGridColumn } from '../components'
import { transactionData, type Transaction } from './data/transactions'

const columns: BasicGridColumn<Transaction>[] = [
  {
    title: 'Транзакция',
    children: [
      createColumn<Transaction>('id', 'string', 'ID', { width: 120 }),
      createColumn<Transaction>('date', 'string', 'Дата', { width: 120 }),
      createColumn<Transaction>('description', 'string', 'Описание', { width: 250 }),
    ],
  },
  {
    title: 'Финансы',
    children: [
      createColumn<Transaction>('amount', 'number', 'Сумма', {
        width: 150,
        formatter: (value) => {
          const amount = typeof value === 'number' ? value : 0
          const formatted = Math.abs(amount).toLocaleString('ru-RU')
          const sign = amount >= 0 ? '+' : '-'
          return `${sign}${formatted} ₽`
        },
      }),
      createColumn<Transaction>('category', 'string', 'Категория', { width: 150 }),
      createColumn<Transaction>('type', 'string', 'Тип', { width: 120 }),
    ],
  },
  {
    title: 'Дополнительно',
    children: [
      createColumn<Transaction>('account', 'string', 'Счёт', { width: 200 }),
      createColumn<Transaction>('status', 'string', 'Статус', { width: 140 }),
    ],
  },
]

export function TransactionsExample() {
  return (
    <div className="data-grid-section">
      <h2 className="section-title">Transactions Example</h2>
      <p className="section-description">
        Пример таблицы с финансовыми транзакциями: доходы и расходы, категории, счета и статусы операций.
      </p>
      <BasicGrid<Transaction>
        columns={columns}
        rows={transactionData}
        height={400}
        headerRowHeight={54}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


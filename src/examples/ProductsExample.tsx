import { BasicGrid, createColumn, type BasicGridColumn } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { productData, type Product } from './data/products'

const columns: BasicGridColumn<Product>[] = [
  {
    title: 'Товар',
    headerContent: <HeaderCard icon="📦" iconTone="blue" title="Товар" subtitle="Основная информация" compact />,
    children: [
      createColumn<Product>('id', 'string', 'ID', { width: 120 }),
      createColumn<Product>('name', 'string', 'Название', { width: 250 }),
      createColumn<Product>('category', 'string', 'Категория', { width: 150 }),
    ],
  },
  {
    title: 'Цена и наличие',
    headerContent: <HeaderCard icon="💰" iconTone="green" title="Цена и наличие" subtitle="Финансы и склад" compact />,
    children: [
      createColumn<Product>('price', 'number', 'Цена', {
        width: 140,
        formatter: (value) => (typeof value === 'number' ? `${Math.round(value).toLocaleString('ru-RU')} ₽` : ''),
      }),
      createColumn<Product>('stock', 'number', 'Остаток', { width: 120 }),
      createColumn<Product>('status.name', 'select', 'Статус', {
        width: 150,
        selectOptionsAccessor: 'status.options',
        selectPlaceholder: 'Выберите статус',
      }),
    ],
  },
  {
    title: 'Дополнительно',
    headerContent: <HeaderCard icon="⭐" iconTone="amber" title="Дополнительно" subtitle="Рейтинг и поставщик" compact />,
    children: [
      createColumn<Product>('rating', 'number', 'Рейтинг', {
        width: 120,
        formatter: (value) => (typeof value === 'number' ? `${value.toFixed(1)} ⭐` : ''),
      }),
      createColumn<Product>('supplier', 'string', 'Поставщик', { width: 180, grow: 1 }),
    ],
  },
]

export function ProductsExample() {
  return (
    <div className="data-grid-section">
      <h2 className="section-title">Products Example</h2>
      <p className="section-description">
        Пример таблицы с данными о товарах: название, категория, цена, остаток на складе, статус и рейтинг.
      </p>
      <BasicGrid<Product>
        columns={columns}
        rows={productData}
        height={400}
        headerRowHeight={54}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


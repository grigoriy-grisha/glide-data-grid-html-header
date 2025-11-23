import type { BasicGridSelectOption } from '../../components/BasicGrid'

export interface Product extends Record<string, unknown> {
  id: string
  name: string
  category: string
  price: number
  stock: number
  rating: number
  status: {
    name: string
    options: BasicGridSelectOption[]
  }
  supplier: string
  description: string
}

export const productData: Product[] = [
  {
    id: 'PROD-001',
    name: 'Ноутбук MacBook Pro',
    category: 'Электроника',
    price: 129990,
    stock: 15,
    rating: 4.8,
    status: {
      name: 'В наличии',
      options: [
        { label: 'В наличии', value: 'В наличии' },
        { label: 'Нет в наличии', value: 'Нет в наличии' },
        { label: 'Предзаказ', value: 'Предзаказ' },
      ],
    },
    supplier: 'Apple Inc.',
    description: 'Профессиональный ноутбук для работы',
  },
  {
    id: 'PROD-002',
    name: 'Смартфон iPhone 15',
    category: 'Электроника',
    price: 89990,
    stock: 42,
    rating: 4.9,
    status: {
      name: 'В наличии',
      options: [
        { label: 'В наличии', value: 'В наличии' },
        { label: 'Нет в наличии', value: 'Нет в наличии' },
        { label: 'Предзаказ', value: 'Предзаказ' },
      ],
    },
    supplier: 'Apple Inc.',
    description: 'Новейший смартфон с камерой 48 МП',
  },
  {
    id: 'PROD-003',
    name: 'Беспроводные наушники',
    category: 'Аудио',
    price: 12990,
    stock: 0,
    rating: 4.6,
    status: {
      name: 'Нет в наличии',
      options: [
        { label: 'В наличии', value: 'В наличии' },
        { label: 'Нет в наличии', value: 'Нет в наличии' },
        { label: 'Предзаказ', value: 'Предзаказ' },
      ],
    },
    supplier: 'Sony Corporation',
    description: 'Наушники с шумоподавлением',
  },
  {
    id: 'PROD-004',
    name: 'Игровая мышь',
    category: 'Периферия',
    price: 3490,
    stock: 78,
    rating: 4.7,
    status: {
      name: 'В наличии',
      options: [
        { label: 'В наличии', value: 'В наличии' },
        { label: 'Нет в наличии', value: 'Нет в наличии' },
        { label: 'Предзаказ', value: 'Предзаказ' },
      ],
    },
    supplier: 'Logitech',
    description: 'Высокоточная игровая мышь',
  },
  {
    id: 'PROD-005',
    name: 'Механическая клавиатура',
    category: 'Периферия',
    price: 8990,
    stock: 23,
    rating: 4.5,
    status: {
      name: 'В наличии',
      options: [
        { label: 'В наличии', value: 'В наличии' },
        { label: 'Нет в наличии', value: 'Нет в наличии' },
        { label: 'Предзаказ', value: 'Предзаказ' },
      ],
    },
    supplier: 'Corsair',
    description: 'RGB подсветка, переключатели Cherry MX',
  },
]


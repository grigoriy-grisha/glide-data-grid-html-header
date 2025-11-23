import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, button, tag, text, layout, layoutRow, renderComponents, type ButtonIcon } from '../components/BasicGrid'
import { HeaderCard } from './components/HeaderCard'
import { productData, type Product } from './data/products'

export function ProductsCanvasExample() {
  const cartIconSVG: ButtonIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>'

  const buildProductCard = (product: Product) => {
    const getStockColor = (stock: number) => {
      if (stock === 0) return { color: '#842029', background: '#f8d7da' }
      if (stock < 10) return { color: '#664d03', background: '#fff3cd' }
      return { color: '#0f5132', background: '#d1e7dd' }
    }

    const stockColor = getStockColor(product.stock)

    return layout(
      [
        layoutRow(
          [
            text({ text: product.name, color: '#212529' }),
            tag({
              text: `${product.stock} шт`,
              color: stockColor.color,
              background: stockColor.background,
            }),
          ],
          { height: 28, justify: 'space-between', gap: 8 }
        ),
        layoutRow(
          [
            text({ text: `${product.price.toLocaleString('ru-RU')} ₽`, color: '#084298' }),
            tag({
              text: `${product.rating} ⭐`,
              color: '#664d03',
              background: '#fff3cd',
            }),
          ],
          { height: 28, justify: 'space-between', gap: 8 }
        ),
        layoutRow(
          [
            button({
              text: 'В корзину',
              leftIcon: cartIconSVG,
              variant: 'primary',
              onClick: () => alert(`Добавлено в корзину: ${product.name}`),
            }),
          ],
          { height: 32, justify: 'center' }
        ),
      ],
      {
        padding: { left: 10, right: 10, top: 8, bottom: 8 },
        rowGap: 6,
        width: 'fill',
      }
    )
  }

  const columns = useMemo<BasicGridColumn<Product>[]>(() => [
    {
      title: 'Товар',
      headerContent: <HeaderCard icon="📦" iconTone="blue" title="Товар" subtitle="Основная информация" compact />,
      children: [
        createColumn<Product>('id', 'string', 'ID', { width: 120 }),
        createColumn<Product>('category', 'string', 'Категория', { width: 150 }),
        createColumn<Product>('supplier', 'string', 'Поставщик', { width: 180 }),
      ],
    },
    {
      title: 'Карточка товара',
      headerContent: <HeaderCard icon="🛍" iconTone="purple" title="Карточка товара" subtitle="Canvas ячейка" compact />,
      children: [
        createColumn<Product>('actions', 'canvas', 'Информация', {
          width: 320,
          grow: 1,
          sortable: false,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, row) => {
              const product = row as Product
              const structuredComponents = buildProductCard(product)
              return renderComponents([structuredComponents], ctx, rect, theme, hoverX, hoverY)
            },
            copyData: 'Товар',
          },
        }),
      ],
    },
  ], [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Products Canvas Example</h2>
      <p className="section-description">
        Пример canvas ячеек для товаров: карточка с названием, остатком на складе, ценой, рейтингом и кнопкой добавления в корзину.
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


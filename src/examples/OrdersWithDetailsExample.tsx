import { useMemo, useState, useCallback } from 'react'
import { BasicGrid, type BasicGridColumn, Canvas } from '../components'
import type { BadgeView } from '../components/BasicGrid/lib/canvas'

// SVG icons
const PACKAGE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'

const TRUCK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>'

const CHECK_CIRCLE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'

const CLOCK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'

const X_CIRCLE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'

const CHEVRON_DOWN_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>'

const CHEVRON_UP_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>'

const USER_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'


interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

interface Order extends Record<string, unknown> {
  id: string
  orderNumber: string
  date: string
  customer: string
  email: string
  address: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
}

const STATUS_CONFIG: Record<Order['status'], { badge: BadgeView; label: string; icon: string }> = {
  pending: { badge: 'warning', label: 'Ожидает', icon: CLOCK_ICON },
  processing: { badge: 'accent', label: 'В обработке', icon: PACKAGE_ICON },
  shipped: { badge: 'default', label: 'Отправлен', icon: TRUCK_ICON },
  delivered: { badge: 'positive', label: 'Доставлен', icon: CHECK_CIRCLE_ICON },
  cancelled: { badge: 'negative', label: 'Отменён', icon: X_CIRCLE_ICON },
}

function generateOrders(): Order[] {
  return [
    {
      id: 'order-1',
      orderNumber: 'ORD-2024-001',
      date: '2024-12-15 14:30',
      customer: 'Александр Петров',
      email: 'alex.petrov@email.com',
      address: 'г. Москва, ул. Ленина 15, кв. 42',
      status: 'delivered',
      paymentMethod: 'Банковская карта **** 4532',
      items: [
        { id: 'item-1', name: 'MacBook Pro 14"', quantity: 1, price: 189990, image: '💻' },
        { id: 'item-2', name: 'Magic Mouse', quantity: 1, price: 8990, image: '🖱️' },
        { id: 'item-3', name: 'USB-C Hub', quantity: 2, price: 3490, image: '🔌' },
      ],
      subtotal: 205960,
      shipping: 0,
      total: 205960,
    },
    {
      id: 'order-2',
      orderNumber: 'ORD-2024-002',
      date: '2024-12-18 09:15',
      customer: 'Мария Иванова',
      email: 'maria.ivanova@email.com',
      address: 'г. Санкт-Петербург, Невский пр. 100',
      status: 'shipped',
      paymentMethod: 'Apple Pay',
      items: [
        { id: 'item-4', name: 'iPhone 15 Pro', quantity: 1, price: 129990, image: '📱' },
        { id: 'item-5', name: 'AirPods Pro 2', quantity: 1, price: 24990, image: '🎧' },
      ],
      subtotal: 154980,
      shipping: 500,
      total: 155480,
    },
    {
      id: 'order-3',
      orderNumber: 'ORD-2024-003',
      date: '2024-12-19 16:45',
      customer: 'Дмитрий Сидоров',
      email: 'dmitry.sidorov@email.com',
      address: 'г. Казань, ул. Баумана 35',
      status: 'processing',
      paymentMethod: 'Банковская карта **** 8876',
      items: [
        { id: 'item-6', name: 'iPad Air', quantity: 1, price: 69990, image: '📲' },
        { id: 'item-7', name: 'Apple Pencil', quantity: 1, price: 14990, image: '✏️' },
        { id: 'item-8', name: 'Smart Keyboard', quantity: 1, price: 19990, image: '⌨️' },
      ],
      subtotal: 104970,
      shipping: 350,
      total: 105320,
    },
    {
      id: 'order-4',
      orderNumber: 'ORD-2024-004',
      date: '2024-12-20 11:20',
      customer: 'Анна Козлова',
      email: 'anna.kozlova@email.com',
      address: 'г. Новосибирск, ул. Красный пр. 50',
      status: 'pending',
      paymentMethod: 'СБП',
      items: [
        { id: 'item-9', name: 'Apple Watch Ultra 2', quantity: 1, price: 79990, image: '⌚' },
      ],
      subtotal: 79990,
      shipping: 600,
      total: 80590,
    },
    {
      id: 'order-5',
      orderNumber: 'ORD-2024-005',
      date: '2024-12-17 13:00',
      customer: 'Сергей Волков',
      email: 'sergey.volkov@email.com',
      address: 'г. Екатеринбург, ул. Малышева 101',
      status: 'cancelled',
      paymentMethod: 'Банковская карта **** 2211',
      items: [
        { id: 'item-10', name: 'iMac 24"', quantity: 1, price: 159990, image: '🖥️' },
        { id: 'item-11', name: 'Magic Keyboard', quantity: 1, price: 12990, image: '⌨️' },
      ],
      subtotal: 172980,
      shipping: 0,
      total: 172980,
    },
  ]
}

function createOrderColumns(
  expandedRowId: string | null,
  onToggleExpand: (id: string) => void
): BasicGridColumn<Order>[] {
  return [
    {
      title: '',
      dataType: 'string',
      width: 50,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center">
          <Canvas.IconButton
            icon={expandedRowId === row.id ? CHEVRON_UP_ICON : CHEVRON_DOWN_ICON}
            view="secondary"
            buttonSize="xs"
            onClick={() => onToggleExpand(row.id)}
          />
        </Canvas.Container>
      ),
    },
    {
      title: 'Заказ',
      dataType: 'string',
      width: 160,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="column" gap={4} padding={8}>
          <Canvas.Text font="600 14px -apple-system, BlinkMacSystemFont, sans-serif" color="#1a1a1a">
            {row.orderNumber}
          </Canvas.Text>
          <Canvas.Text font="12px -apple-system, BlinkMacSystemFont, sans-serif" color="#888">
            {row.date}
          </Canvas.Text>
        </Canvas.Container>
      ),
    },
    {
      title: 'Клиент',
      dataType: 'string',
      width: 200,
      grow: 1,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" gap={10} alignItems="center" padding={{ left: 8 }}>
          <Canvas.Container 
            direction="row" 
            alignItems="center" 
            justifyContent="center"
            style={{ width: 36, height: 36 }}
          >
            <Canvas.Rect color="#e3f2fd" style={{ width: 36, height: 36 }} />
            <Canvas.Icon icon={USER_ICON} size={18} color="#1976d2" />
          </Canvas.Container>
          <Canvas.Container direction="column" gap={2}>
            <Canvas.Text font="500 13px -apple-system, BlinkMacSystemFont, sans-serif" color="#333">
              {row.customer}
            </Canvas.Text>
            <Canvas.Text font="12px -apple-system, BlinkMacSystemFont, sans-serif" color="#666">
              {row.email}
            </Canvas.Text>
          </Canvas.Container>
        </Canvas.Container>
      ),
    },
    {
      title: 'Статус',
      dataType: 'string',
      width: 150,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="row" alignItems="center" justifyContent="center">
          <Canvas.Badge
            text={STATUS_CONFIG[row.status].label}
            view={STATUS_CONFIG[row.status].badge}
            size="s"
            leftIcon={STATUS_CONFIG[row.status].icon}
          />
        </Canvas.Container>
      ),
    },
    {
      title: 'Товаров',
      dataType: 'number',
      width: 100,
      grow: 0,
      renderCellContent: (row) => {
        const totalItems = row.items.reduce((sum, item) => sum + item.quantity, 0)
        return (
          <Canvas.Container direction="row" alignItems="center" justifyContent="center" gap={6}>
            <Canvas.Icon icon={PACKAGE_ICON} size={16} color="#666" />
            <Canvas.Text font="600 14px -apple-system, BlinkMacSystemFont, sans-serif" color="#333">
              {totalItems}
            </Canvas.Text>
          </Canvas.Container>
        )
      },
    },
    {
      title: 'Сумма',
      dataType: 'number',
      width: 140,
      grow: 0,
      renderCellContent: (row) => (
        <Canvas.Container direction="column" gap={2} alignItems="flex-end" padding={{ right: 12 }}>
          <Canvas.Text font="700 15px -apple-system, BlinkMacSystemFont, sans-serif" color="#1a1a1a">
            {row.total.toLocaleString()} ₽
          </Canvas.Text>
          {row.shipping > 0 && (
            <Canvas.Text font="11px -apple-system, BlinkMacSystemFont, sans-serif" color="#888">
              +{row.shipping.toLocaleString()} ₽ доставка
            </Canvas.Text>
          )}
        </Canvas.Container>
      ),
    },
  ]
}

// Стили для оверлея
const overlayStyles = {
  container: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: '12px',
    padding: '20px',
    margin: '8px 16px 16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0',
  } as React.CSSProperties,
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e293b',
    margin: 0,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  } as React.CSSProperties,
  section: {
    background: '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e2e8f0',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  } as React.CSSProperties,
  itemRow: {
    borderBottom: '1px solid #f1f5f9',
  } as React.CSSProperties,
  itemCell: {
    padding: '12px 8px',
    fontSize: '14px',
  } as React.CSSProperties,
  itemName: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  itemEmoji: {
    fontSize: '24px',
  } as React.CSSProperties,
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '10px',
  } as React.CSSProperties,
  infoIcon: {
    color: '#64748b',
    marginTop: '2px',
  } as React.CSSProperties,
  infoText: {
    fontSize: '14px',
    color: '#334155',
    lineHeight: 1.5,
  } as React.CSSProperties,
  totalsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
  } as React.CSSProperties,
  totalLabel: {
    color: '#64748b',
  } as React.CSSProperties,
  totalValue: {
    color: '#1e293b',
    fontWeight: 500,
  } as React.CSSProperties,
  grandTotal: {
    borderTop: '2px solid #e2e8f0',
    marginTop: '8px',
    paddingTop: '12px',
    fontSize: '16px',
    fontWeight: 600,
  } as React.CSSProperties,
}

function OrderDetailsOverlay({ order }: { order: Order }) {
  return (
    <div style={overlayStyles.container}>
      <div style={overlayStyles.header}>
        <h3 style={overlayStyles.title}>Детали заказа {order.orderNumber}</h3>
      </div>
      
      <div style={overlayStyles.grid}>
        {/* Товары */}
        <div style={overlayStyles.section}>
          <div style={overlayStyles.sectionTitle}>
            <span>📦</span> Товары в заказе
          </div>
          <table style={overlayStyles.itemsTable}>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} style={overlayStyles.itemRow}>
                  <td style={overlayStyles.itemCell}>
                    <div style={overlayStyles.itemName}>
                      <span style={overlayStyles.itemEmoji}>{item.image}</span>
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td style={{ ...overlayStyles.itemCell, textAlign: 'center', color: '#64748b' }}>
                    × {item.quantity}
                  </td>
                  <td style={{ ...overlayStyles.itemCell, textAlign: 'right', fontWeight: 500 }}>
                    {item.price.toLocaleString()} ₽
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <div style={overlayStyles.totalsRow}>
              <span style={overlayStyles.totalLabel}>Подытог:</span>
              <span style={overlayStyles.totalValue}>{order.subtotal.toLocaleString()} ₽</span>
            </div>
            <div style={overlayStyles.totalsRow}>
              <span style={overlayStyles.totalLabel}>Доставка:</span>
              <span style={overlayStyles.totalValue}>
                {order.shipping === 0 ? 'Бесплатно' : `${order.shipping.toLocaleString()} ₽`}
              </span>
            </div>
            <div style={{ ...overlayStyles.totalsRow, ...overlayStyles.grandTotal }}>
              <span>Итого:</span>
              <span style={{ color: '#059669' }}>{order.total.toLocaleString()} ₽</span>
            </div>
          </div>
        </div>

        {/* Информация о доставке */}
        <div style={overlayStyles.section}>
          <div style={overlayStyles.sectionTitle}>
            <span>📍</span> Информация о доставке
          </div>
          
          <div style={overlayStyles.infoRow}>
            <span style={overlayStyles.infoIcon}>👤</span>
            <div>
              <div style={{ ...overlayStyles.infoText, fontWeight: 500 }}>{order.customer}</div>
              <div style={{ ...overlayStyles.infoText, color: '#64748b', fontSize: '13px' }}>{order.email}</div>
            </div>
          </div>
          
          <div style={overlayStyles.infoRow}>
            <span style={overlayStyles.infoIcon}>📍</span>
            <div style={overlayStyles.infoText}>{order.address}</div>
          </div>
          
          <div style={overlayStyles.infoRow}>
            <span style={overlayStyles.infoIcon}>💳</span>
            <div style={overlayStyles.infoText}>{order.paymentMethod}</div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onClick={() => alert(`Открытие трекинга заказа ${order.orderNumber}`)}
            >
              🚚 Отследить заказ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrdersWithDetailsExample() {
  const orders = useMemo(() => generateOrders(), [])
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id))
  }, [])

  const columns = useMemo(
    () => createOrderColumns(expandedRowId, handleToggleExpand),
    [expandedRowId, handleToggleExpand]
  )

  const renderRowOverlay = useCallback((row: Order) => {
    return <OrderDetailsOverlay order={row} />
  }, [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Orders with Details (Row Overlay)</h2>
      <p className="section-description">
        Таблица заказов с раскрывающимися деталями. Нажмите на стрелку слева от заказа, 
        чтобы увидеть подробную информацию о товарах, доставке и оплате. 
        Демонстрация <code>renderRowOverlay</code> для создания расширяемых строк.
      </p>
      <BasicGrid<Order>
        columns={columns}
        rows={orders}
        height={600}
        headerRowHeight={48}
        rowHeight={72}
        showRowMarkers={false}
        getRowId={(row) => row.id}
        rowOverlayRowId={expandedRowId}
        renderRowOverlay={renderRowOverlay}
        onRowOverlayClose={() => setExpandedRowId(null)}
      />
    </div>
  )
}


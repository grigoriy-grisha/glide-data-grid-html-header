import React, {useMemo, useState, useEffect, useRef} from 'react'
import { createPortal } from 'react-dom'
import { BasicGrid, createColumn, type BasicGridColumn, Canvas } from '../components'
import { basicGridRows, type DataRow } from './data'
import { subscribeToCanvasPortalHover } from '../components/BasicGrid/components/CanvasHeader/utils/portalHoverEvents'
import { IconBookOpenOutline } from '@salutejs/plasma-icons';
import {renderToString} from "react-dom/server";
// import {renderToString} from "react-dom/server";
import {Tooltip} from '@salutejs/sdds-finai'
// console.log(renderToString(<Icon icon="apps"/>))

// console.log()
const svgIcon = renderToString(<IconBookOpenOutline />).match(/<svg[\s\S]*?<\/svg>/)![0]

console.log(svgIcon)
function CounterHeader() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Canvas.Container
      direction="row"
      gap={6}
      alignItems="center"
      justifyContent="center"

    >
      <Canvas.Text color="#333" font="bold 12px sans-serif" portalHoverEnabled>
        Counter: {count.toString()}
      </Canvas.Text>
    </Canvas.Container>
  )
}

function SimpleHeader() {
  return (
    <Canvas.Container direction="row" gap={12} alignItems="center" portalHoverEnabled>
        <Canvas.Text color="blue" style={{ flexShrink: 0 }} >Simple</Canvas.Text >
        <Canvas.Text color="red" style={{ flexShrink: 0 }}>Header</Canvas.Text>
        <Canvas.Tag backgroundColor="#FFF3E0" textColor="#E65100">
          NEW
        </Canvas.Tag>
    </Canvas.Container>
  )
}

function HeaderHoverPortal() {
    const ref = useRef<any>();

    const [state, setState] = useState({
        visible: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        nodeId: '',
    })

    useEffect(() => {
        return subscribeToCanvasPortalHover((detail) => {
            setState({
                visible: detail.visible,
                x: detail.x,
                y: detail.y,
                width: detail.width,
                height: detail.height,
                nodeId: detail.nodeId ?? '',
            })
        })
    }, [])

    useEffect(() => {
        if (state.visible) {
            ref.current!.parentNode.style.position = 'relative'
            ref.current!.parentNode.style.top = '4px'
        }
    }, [state.visible]);

    return createPortal(
        <div style={{
            position: 'fixed',
            left: `${state.x}px`,
            top: `${state.y}px`,
            width: `${Math.max(0, state.width)}px`,
            height: `${Math.max(0, state.height)}px`,
            pointerEvents: 'none',
            boxSizing: 'border-box',
            borderRadius: 8,
            border: '1px solid rgba(21, 101, 192, 0.8)',
            background: 'rgba(21, 101, 192, 0.12)',
            color: '#0f172a',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
        }}>
            <Tooltip
                opened={state.visible}
                placement="top"
                text={state.nodeId ? `Ховер: ${state.nodeId}` : 'Элемент канваса'}
                view="default"
                style={{
                    position: 'relative',
                    top: 4,
                }}
                target={
                    <div
                        ref={ref}
                        className="1231412412414"
                        style={{
                            width: `${Math.max(0, state.width)}px`,
                            height: `${Math.max(0, state.height)}px`,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'flex-end',
                        }}
                    >
                    </div>
                }
            />
        </div>
        ,
        document.body
    )
}

const columns: BasicGridColumn<DataRow>[] = [
  {
    title: 'Основные данные',
    children: [
      {
        accessor: 'employeeId',
        dataType: "string",
        title: 'ID',
        width: 150,
        renderColumnContent: CounterHeader,
        renderCellContent: (row) => (
          <Canvas.Container
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={8}
            padding={8}
            wrap="wrap"
          >
            <Canvas.Container  direction="column" gap={2} style={{ width: '100%' }}>
              <Canvas.Text color="#0d47a1" style={{ flexGrow: 1 }}>
                {row.employeeId ?? '—'}
              </Canvas.Text>
              <Canvas.Text color="#607d8b" style={{ flexGrow: 1 }}>
                {row.role ?? '—'}
              </Canvas.Text>
            </Canvas.Container>
            <Canvas.Button
              portalHoverEnabled
              variant="secondary"
              onClick={() => console.log('Подробнее по сотруднику', row.employeeId)}
            >
              Подробнее
            </Canvas.Button>
          </Canvas.Container>
        ),
      },
      {
        title: 'ФИО',
        children: [
          createColumn<DataRow>('firstName', 'string', 'Имя', {
             width: 150,
             renderColumnContent: SimpleHeader
          }),
          createColumn<DataRow>('lastName', 'string', 'Фамилия', { width: 170 }),
        ],
      },
      {
        title: 'Позиция',
        children: [
          createColumn<DataRow>('role', 'string', 'Роль', {
            width: 320,
            renderCellContent: (row, rowIndex) => {
              const iconChar = row.role === 'Developer' ? '💻'
                : row.role === 'Manager' ? '💼'
                : row.role === 'Designer' ? '🎨'
                : '👤'

              const desc = row.role === 'Developer' ? 'Full-stack разработка, React/Node.js'
                : row.role === 'Manager' ? 'Управление проектами, Agile/Scrum'
                : row.role === 'Designer' ? 'UI/UX дизайн, Figma, прототипирование'
                : 'Сотрудник'

              return (
                <Canvas.Container direction="row" justifyContent="space-between" padding={4} >
                  <Canvas.Container
                    direction="column"
                    justifyContent="center"
                    alignItems="center"
                    gap={2}
                  >
                    <Canvas.Text font="24px sans-serif">{iconChar}</Canvas.Text>
                    <Canvas.Text font="9px sans-serif" color="#999">{`#${rowIndex + 1}`}</Canvas.Text>
                  </Canvas.Container>
                  <Canvas.Container direction="column" justifyContent="flex-start" >
                    <Canvas.Container direction="row" justifyContent="space-between" alignItems="center" gap={6}>
                      <Canvas.Text font="bold 12px sans-serif" color="#333">{row.role}</Canvas.Text>
                      <Canvas.Tag portalHoverEnabled backgroundColor="#E8F5E9" textColor="#2E7D32">
                        {row.status.name}
                      </Canvas.Tag>
                    </Canvas.Container>
                    <Canvas.Container direction="row" alignItems="flex-start" >
                      <Canvas.Text font="10px sans-serif" color="#666" wordWrap lineHeight={1.2}>
                        {desc}
                      </Canvas.Text>
                    </Canvas.Container>
                    <Canvas.Container direction="row" justifyContent="flex-start" alignItems="center" gap={4}>
                      <Canvas.Button variant="secondary">FullTime</Canvas.Button>
                      <Canvas.Button variant="secondary">Office</Canvas.Button>
                    </Canvas.Container>
                  </Canvas.Container>

                  <Canvas.Container
                    direction="column"
                    justifyContent="space-around"
                    alignItems="flex-end"
                  >
                    <Canvas.Button variant="primary" onClick={() => console.log('Chat', row.employeeId)}>
                      Chat
                    </Canvas.Button>
                    <Canvas.Container direction="column" alignItems="flex-end" gap={2}>
                      <Canvas.Text font="9px sans-serif" color="#aaa">2 ч. назад</Canvas.Text>
                      <Canvas.Text font="9px sans-serif" color="#999">
                        {`${(row.department as string).substring(0, 8)}...`}
                      </Canvas.Text>
                    </Canvas.Container>
                  </Canvas.Container>
                </Canvas.Container>
              )
            },
          }),
          createColumn<DataRow>('department', 'string', 'Отдел', { width: 180 }),
        ],
      },
    ],
  },
  {
    title: 'Контакты',
    children: [
      createColumn<DataRow>('email', 'string', 'Email', { width: 260 }),
      createColumn<DataRow>('contact.phone', 'string', 'Телефон', { width: 180 }),
    ],
  },
  {
    title: 'Прогресс',
    children: [
      createColumn<DataRow>('status.name', 'select', 'Статус', {
        width: 160,
        selectOptionsAccessor: 'status.options',
        selectPlaceholder: 'Выберите статус',
      }),
      createColumn<DataRow>('progress', 'percent', 'Прогресс %', { width: 140 }),
      {
        title: 'Действие',
        dataType: 'string',
        width: 150,
        renderColumnContent: () => (
          <Canvas.Container
            direction="row"
            alignItems="center"
            justifyContent="center"
            gap={6}
            wrap="wrap"
            alignContent="center"
            portalHoverEnabled
          >
            <Canvas.Text color="#666">Текст:</Canvas.Text>
            <Canvas.Icon
              icon={svgIcon}
              size={18}
              color="#1565c0"
              onClick={() => console.log('SVG Icon clicked via CanvasNode!')}
            />
            <Canvas.Button variant="secondary" onClick={() => console.log('Button clicked!')}>
              Button
            </Canvas.Button>
            <Canvas.Button variant="secondary" onClick={() => console.log('Button clicked!')}>
              Button
            </Canvas.Button>
          </Canvas.Container>
        ),
      },
    ],
  },
  createColumn<DataRow>('salary', 'number', 'Зарплата', {
    width: 180,
    formatter: (value) => (typeof value === 'number' ? `${Math.round(value).toLocaleString('ru-RU')} ₽` : ''),
  }),
]

export function BasicGridExample() {

  const rows = useMemo(() => {
    const extraRows: DataRow[] = Array.from({ length: 100 }).map((_, i) => {
      const id = i + 100
      return {
        employeeId: `EMP-${id}`,
        firstName: `Сотрудник`,
        lastName: `${id}`,
        name: `Сотрудник ${id}`,
        age: 20 + (i % 40),
        role: i % 3 === 0 ? 'Developer' : i % 3 === 1 ? 'Manager' : 'Designer',
        department: i % 2 === 0 ? 'Разработка' : 'Дизайн',
        salary: 100000 + (i * 1000),
        city: 'Москва',
        email: `employee${id}@example.com`,
        contact: { email: `employee${id}@example.com`, phone: '+7 000 000 00 00' },
        address: { street1: 'Улица', city: 'Москва', state: 'Москва', country: 'Россия' },
        status: { name: 'Активен', options: [] },
        progress: i % 100,
      }
    })
    return [...basicGridRows, ...extraRows]
  }, [])

  const summaryRows = useMemo(() => {
    const totalSalary = rows.reduce((sum, row) => {
      return sum + (typeof row.salary === 'number' ? row.salary : 0)
    }, 0)

    const summaryRow: DataRow = {
      employeeId: 'total',
      firstName: 'Итого',
      lastName: '',
      name: 'Итого',
      age: 0,
      role: '',
      department: '',
      salary: totalSalary,
      city: '',
      email: '',
      contact: { email: '', phone: '' },
      address: { street1: '', city: '', state: '', country: '' },
      status: { name: '', options: [] },
      progress: 0,
    }

    return [summaryRow]
  }, [rows])

  return (
    <div className="data-grid-section">
      <HeaderHoverPortal />
      <h2 className="section-title">Basic Grid</h2>
      <p className="section-description">Базовая таблица Glide Data Grid без редактирования.</p>
      <BasicGrid<DataRow>
        columns={columns}
        rows={rows}
        summaryRows={summaryRows}
        height={500}
        headerRowHeight={54}
        rowHeight={80}
        enableColumnReorder={true}
        getRowId={(row) => row.employeeId}
      />
    </div>
  )
}

import React from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, container, renderComponents, text, button, tag } from '../components/BasicGrid'

// Тип для строки данных с большим количеством колонок
interface LargeDataRow extends Record<string, unknown> {
  id: number
  [key: string]: unknown
}

// Быстрый генератор случайных чисел (линейный конгруэнтный генератор)
class FastRandom {
  private seed: number
  constructor(seed: number = Date.now()) {
    this.seed = seed
  }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2 ** 32
    return this.seed / 2 ** 32
  }
  reset(seed: number) {
    this.seed = seed
  }
}

// Ленивая генерация строки - данные создаются только при обращении
const createLazyRow = (rowIndex: number): LargeDataRow => {
  const cities = ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург', 'Нижний Новгород', 'Самара', 'Краснодар']
  const departments = ['Разработка', 'Дизайн', 'Маркетинг', 'Продажи', 'HR', 'Аналитика', 'Тестирование', 'Инфраструктура']
  const roles = ['Engineer', 'Manager', 'Analyst', 'Designer', 'Developer', 'Lead', 'Director', 'Specialist']

  const colKeys: string[] = new Array(5000)
  for (let col = 0; col < 5000; col++) {
    colKeys[col] = `col_${col}`
  }

  const mod5Values = new Array(5000)
  for (let col = 0; col < 5000; col++) {
    mod5Values[col] = col % 5
  }

  const i = rowIndex
  const iPlus1 = i + 1
  const cityIndex = i % cities.length
  const deptIndex = i % departments.length
  const roleIndex = i % roles.length
  const iMod100 = i % 100

  const num = i + 1
  const idPrefix = num < 10 ? `00000${num}` :
    num < 100 ? `0000${num}` :
      num < 1000 ? `000${num}` :
        num < 10000 ? `00${num}` :
          num < 100000 ? `0${num}` : String(num)

  // Генератор случайных чисел для этой строки (детерминированный)
  const rng = new FastRandom(i * 5000)

  // Кэш для уже вычисленных значений
  const cache: Record<string, unknown> = {}
  cache.id = iPlus1

  return new Proxy({ id: iPlus1 } as LargeDataRow, {
    get(_target, prop: string) {
      // Если значение уже в кэше, возвращаем его
      if (prop in cache) {
        return cache[prop]
      }

      // Если это id, возвращаем сразу
      if (prop === 'id') {
        return iPlus1
      }

      // Генерируем значение для колонки
      const colMatch = prop.match(/^col_(\d+)$/)
      if (colMatch) {
        const col = parseInt(colMatch[1], 10)
        if (col >= colKeys.length) return undefined
        const colKey = colKeys[col]
        const mod5 = mod5Values[col]

        let value: unknown

        if (col < 5) {
          switch (col) {
            case 0: value = `ID-${idPrefix}`; break
            case 1: value = `Строка ${iPlus1}`; break
            case 2: value = cities[cityIndex]; break
            case 3: value = departments[deptIndex]; break
            case 4: value = roles[roleIndex]; break
          }
        } else {
          const random = rng.next()
          if (mod5 === 0) {
            value = Math.floor(random * 10000)
          } else if (mod5 === 1) {
            value = (random * 100).toFixed(2)
          } else if (mod5 === 2) {
            value = random > 0.5 ? 'Да' : 'Нет'
          } else if (mod5 === 3) {
            value = `Значение ${col}-${i}`
          } else {
            value = `Текст ${col}-${iMod100}`
          }
        }

        // Кэшируем значение
        cache[colKey] = value
        return value
      }

      return undefined
    },
    has(_target, prop: string) {
      if (prop === 'id') return true
      if (prop.match(/^col_\d+$/)) return true
      return false
    },
    ownKeys(_target) {
      const keys = ['id', ...colKeys]
      return keys
    },
    getOwnPropertyDescriptor(_target, prop: string) {
      if (prop === 'id' || prop.match(/^col_\d+$/)) {
        return {
          enumerable: true,
          configurable: true,
          value: undefined // Значение будет получено через get
        }
      }
      return undefined
    }
  })
}

// Генерация 5000 колонок
const generateColumns = (): BasicGridColumn<LargeDataRow>[] => {
  const startTime = performance.now()
  const columns: BasicGridColumn<LargeDataRow>[] = []

  // Группируем колонки по 10 в группы для лучшей организации
  const groupsCount = 500 // 500 групп по 10 колонок = 5000 колонок

  console.log('🚀 Начало генерации 5,000 колонок...')

  for (let groupIndex = 0; groupIndex < groupsCount; groupIndex++) {
    const groupColumns: BasicGridColumn<LargeDataRow>[] = []

    for (let colInGroup = 0; colInGroup < 10; colInGroup++) {
      const colIndex = groupIndex * 10 + colInGroup
      const colKey = `col_${colIndex}`

      let title = `Колонка ${colIndex + 1}`
      let type: 'string' | 'number' = 'string'

      if (colIndex === 0) {
        // ID Column with simplified canvas (horizontal only)
        groupColumns.push(
          createColumn<LargeDataRow>(colKey, 'canvas', 'ID', {
            width: 180,
            sortable: true,
            canvasOptions: {
              render: (ctx, rect, theme, hoverX, hoverY, row) => {
                const idText = row['col_0'] as string
                const color = (row.id % 3 === 0) ? '#1e88e5' : (row.id % 3 === 1) ? '#7b1fa2' : '#4caf50'

                return renderComponents([
                  container([
                    tag({
                      text: '#',
                      color: '#ffffff',
                      background: color
                    }),
                    text({
                      text: idText,
                      color: '#212529'
                    })
                  ], { gap: 8, marginLeft: 12 })
                ], ctx, rect, theme, hoverX, hoverY)
              },
              copyData: (row) => row['col_0'] as string
            }
          })
        )
        continue
      } else if (colIndex === 1) {
        title = 'Название'
        type = 'string'
      } else if (colIndex === 2) {
        title = 'Город'
        type = 'string'
      } else if (colIndex === 3) {
        title = 'Отдел'
        type = 'string'
      } else if (colIndex === 4) {
        title = 'Роль'
        type = 'string'
      } else if (colIndex === 5) {
        // Button column
        groupColumns.push(
          createColumn<LargeDataRow>(colKey, 'button', 'Действие', {
            width: 140,
            buttonOptions: {
              label: 'Открыть',
              variant: 'primary',
              onClick: (row) => {
                console.log(`Clicked row ${row.id}`)
                alert(`Вы нажали на кнопку в строке ${row.id}`)
              }
            }
          })
        )
        continue
      } else if (colIndex === 6) {
        // Select column
        groupColumns.push(
          createColumn<LargeDataRow>(colKey, 'select', 'Статус', {
            width: 160,
            selectOptionsGetter: () => [
              { label: 'Активен', value: 'active' },
              { label: 'В ожидании', value: 'pending' },
              { label: 'Заблокирован', value: 'blocked' },
              { label: 'Архив', value: 'archived' }
            ],
            selectPlaceholder: 'Выберите статус'
          })
        )
        continue
      } else if (colIndex === 7) {
        // Simplified Profile Column (horizontal only)
        groupColumns.push(
          createColumn<LargeDataRow>(colKey, 'canvas', 'Профиль', {
            width: 280,
            sortable: false,
            canvasOptions: {
              render: (ctx, rect, theme, hoverX, hoverY, row) => {
                const initials = (row['col_1'] as string)?.split(' ')[1]?.substring(0, 2).toUpperCase() || '??'
                const color = (row.id % 2 === 0) ? '#1e88e5' : '#7b1fa2'

                return renderComponents([
                  container([
                    text({
                      text: initials,
                      color: color,
                    }),
                    text({ text: row['col_1'] as string, color: '#212529' }),
                    text({ text: row['col_4'] as string, color: '#757575' }),
                    button({
                      text: 'Contact',
                      variant: 'secondary',
                      onClick: () => alert(`Contacting ${row['col_1']}`)
                    })
                  ], { gap: 12, marginLeft: 12 })
                ], ctx, rect, theme, hoverX, hoverY)
              },
              copyData: (row) => row['col_1'] as string
            }
          })
        )
        continue
      } else if (colIndex === 8) {
        // Simplified Action Column (horizontal only)
        groupColumns.push(
          createColumn<LargeDataRow>(colKey, 'canvas', 'Действия', {
            width: 240,
            sortable: false,
            canvasOptions: {
              render: (ctx, rect, theme, hoverX, hoverY, row) => {
                return renderComponents([
                  container([
                    tag({
                      text: row.id % 2 === 0 ? 'Active' : 'Inactive',
                      color: row.id % 2 === 0 ? '#4caf50' : '#f44336'
                    }),
                    button({
                      text: 'Edit',
                      variant: 'secondary',
                      onClick: () => alert(`Editing row ${row.id}`)
                    })
                  ], { gap: 8, marginLeft: 12 })
                ], ctx, rect, theme, hoverX, hoverY)
              },
              copyData: (row) => `${row.id}`
            }
          })
        )
        continue
      } else if (colIndex % 5 === 0) {
        title = `Число ${colIndex}`
        type = 'number'
      } else {
        title = `Поле ${colIndex}`
        type = 'string'
      }

      groupColumns.push(
        createColumn<LargeDataRow>(colKey, type, title, {
          width: 120,
          sortable: true,
        })
      )
    }

    columns.push({
      title: `Группа ${groupIndex + 1}`,
      children: groupColumns,
    })
  }

  const endTime = performance.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  console.log(`✅ Генерация колонок завершена за ${duration} секунд`)

  return columns
}

// Создание полностью ленивого массива - строки создаются только при обращении
const createLazyRows = (rowCount: number): LargeDataRow[] => {
  console.log(`🚀 Создание полностью виртуального массива из ${rowCount.toLocaleString()} строк (ленивая генерация)...`)
  const startTime = performance.now()

  // Кэш для уже созданных строк
  const rowCache = new Map<number, LargeDataRow>()

  // Создаем Proxy для массива, который создает строки только при обращении
  const rows = new Proxy(new Array(rowCount) as LargeDataRow[], {
    get(target, prop: string | symbol) {
      // Обработка числовых индексов
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = parseInt(prop, 10)
        if (index >= 0 && index < rowCount) {
          // Проверяем кэш
          if (!rowCache.has(index)) {
            rowCache.set(index, createLazyRow(index))
          }
          return rowCache.get(index)
        }
      }

      // Обработка стандартных свойств массива
      if (prop === 'length') {
        return rowCount
      }

      const value = (target as any)[prop]
      if (typeof value === 'function') {
        // Для методов массива возвращаем функцию, которая работает с виртуальными данными
        return function (...args: any[]) {
          // Для методов, которые требуют итерации, создаем строки по требованию
          if (prop === 'forEach' || prop === 'map' || prop === 'filter' || prop === 'find' || prop === 'some' || prop === 'every') {
            return value.call(
              new Proxy(target, {
                get(_t, p: string | symbol) {
                  if (typeof p === 'string' && /^\d+$/.test(p)) {
                    const idx = parseInt(p, 10)
                    if (idx >= 0 && idx < rowCount && !rowCache.has(idx)) {
                      rowCache.set(idx, createLazyRow(idx))
                    }
                    return rowCache.get(idx)
                  }
                  return (target as any)[p]
                }
              }),
              ...args
            )
          }
          return value.apply(target, args)
        }
      }

      return value
    },
    has(_target, prop: string | symbol) {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = parseInt(prop, 10)
        return index >= 0 && index < rowCount
      }
      return false
    },
    ownKeys(_target) {
      // Возвращаем все индексы как ключи
      return Array.from({ length: rowCount }, (_, i) => String(i))
    },
    getOwnPropertyDescriptor(_target, prop: string | symbol) {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = parseInt(prop, 10)
        if (index >= 0 && index < rowCount) {
          return {
            enumerable: true,
            configurable: true,
            value: undefined // Значение будет получено через get
          }
        }
      }
      return undefined
    }
  })

  const endTime = performance.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  console.log(`✅ Виртуальный массив создан за ${duration} секунд (строки создаются только при обращении)`)

  return rows
}

// Генерация колонок (выполняется один раз)
console.time('Генерация колонок')
const columns = generateColumns()
console.timeEnd('Генерация колонок')

const ROW_COUNT = 1000000 // Можно изменить на нужное количество (для стабильности рекомендуется до 10000)

export function LargeGridExample() {
  // Используем ленивую генерацию - данные создаются только при обращении
  const dataRows = React.useMemo(() => {
    console.time('Создание виртуального массива')
    const rows = createLazyRows(ROW_COUNT)
    console.timeEnd('Создание виртуального массива')
    console.log(`Всего строк: ${ROW_COUNT.toLocaleString()}, Всего колонок: ${columns.reduce((acc, group) => acc + (group.children?.length || 0), 0)}`)
    return rows
  }, [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Large Grid Example</h2>
      <p className="section-description">
        Пример таблицы с 5000 колонок и {ROW_COUNT.toLocaleString()} строк. Используется ленивая генерация данных - значения создаются только при обращении к ним, что позволяет работать с огромными объемами данных без падения вкладки.
      </p>
      <BasicGrid<LargeDataRow>
        columns={columns}
        rows={dataRows}
        height={600}
        rowHeight={40}
        headerRowHeight={54}
        getRowId={(row) => row.id}
        enableColumnReorder={true}
      />
    </div>
  )
}

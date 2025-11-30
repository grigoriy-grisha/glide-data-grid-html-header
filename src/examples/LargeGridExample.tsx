import React from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, Canvas } from '../components'

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

// Константы для генерации данных
const LEAF_COLUMNS_COUNT = 5
const COLS_PER_REGION = LEAF_COLUMNS_COUNT * 2 * 2 // 5 leaf * 2 states * 2 countries
const COL_COUNT_TARGET = 16000
const REGIONS_COUNT = Math.ceil(COL_COUNT_TARGET / COLS_PER_REGION)
const TOTAL_COLS = REGIONS_COUNT * COLS_PER_REGION

// Предварительная генерация ключей колонок для оптимизации памяти
const COL_KEYS: string[] = new Array(TOTAL_COLS)
const MOD5_VALUES = new Uint8Array(TOTAL_COLS)

for (let col = 0; col < TOTAL_COLS; col++) {
  COL_KEYS[col] = `col_${col}`
  MOD5_VALUES[col] = col % 5
}

// Ленивая генерация строки - данные создаются только при обращении
const createLazyRow = (rowIndex: number): LargeDataRow => {
  const i = rowIndex
  const iPlus1 = i + 1

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
        if (col >= TOTAL_COLS) return undefined
        const colKey = COL_KEYS[col]

        let value: unknown

        // Simplified data generation for generic columns
        const random = rng.next()
        const type = col % LEAF_COLUMNS_COUNT

        if (type === 0) {
          value = Math.floor(random * 1000000).toLocaleString() // Pop
        } else if (type === 1) {
          value = `$${(random * 100).toFixed(2)}B` // GDP
        } else if (type === 2) {
          value = `${Math.floor(random * 1000)} km²` // Area
        } else if (type === 3) {
           const statuses = ['Active', 'Pending', 'Done', 'Failed']
           value = statuses[Math.floor(random * statuses.length)] // Status
        } else {
           value = Math.floor(random * 100) // Progress
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
      const keys = ['id', ...COL_KEYS]
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

// SVG строки для Canvas компонентов
const POPULATION_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" /></svg>'
const STATUS_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.5"/></svg>'
const PROGRESS_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="8" width="20" height="8" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 10h10v4H5z" fill="currentColor" opacity="0.5"/></svg>'
const GLOBE_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" /></svg>'
const MAP_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" fill="currentColor" /></svg>'
const LOCATION_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" /></svg>'

// Генерация колонок с 4 уровнями вложенности и сложными заголовками
const generateColumns = (): BasicGridColumn<LargeDataRow>[] => {
  const startTime = performance.now()
  const columns: BasicGridColumn<LargeDataRow>[] = []

  let globalColIndex = 0

  console.log(`🚀 Начало генерации ${TOTAL_COLS.toLocaleString()} колонок с 4 уровнями вложенности...`)

  const regionNames = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania']
  const countryPairs = [
    ['USA', 'Canada'],
    ['Germany', 'France'],
    ['China', 'Japan'],
    ['Brazil', 'Argentina'],
    ['Nigeria', 'Egypt'],
    ['Australia', 'New Zealand']
  ]
  const statePairs = [
    ['California', 'Texas'],
    ['Bavaria', 'Île-de-France'],
    ['Beijing', 'Tokyo'],
    ['São Paulo', 'Buenos Aires'],
    ['Lagos', 'Cairo'],
    ['New South Wales', 'Auckland']
  ]

  for (let r = 0; r < REGIONS_COUNT; r++) {
    const regionCountries: BasicGridColumn<LargeDataRow>[] = []
    const regionName = regionNames[r % regionNames.length]

    for (let c = 0; c < 2; c++) {
      const countryStates: BasicGridColumn<LargeDataRow>[] = []
      const countryName = countryPairs[r % countryPairs.length][c]

      for (let s = 0; s < 2; s++) {
        const stateCities: BasicGridColumn<LargeDataRow>[] = []
        const stateName = statePairs[r % statePairs.length][s]

        // 5 Leaf columns: Pop, GDP, Area, Status, Progress
        const leafTypes = [
          { key: 'Pop', icon: POPULATION_SVG, color: '#e91e63' },
          { key: 'GDP', icon: null, color: '#4caf50' },
          { key: 'Area', icon: null, color: '#ff9800' },
          { key: 'Status', icon: STATUS_SVG, color: '#9c27b0' },
          { key: 'Progress', icon: PROGRESS_SVG, color: '#00bcd4' }
        ]

        for (let l = 0; l < LEAF_COLUMNS_COUNT; l++) {
          const colKey = `col_${globalColIndex}`
          const leafType = leafTypes[l]

          if (l === 0 || l === 3 || l === 4) {
            // Вариант 1: Canvas.Container с иконкой и текстом (Pop, Status, Progress)
            const svgIcon = leafType.icon!
            const leafColor = leafType.color
            const leafKey = leafType.key

            stateCities.push(
              createColumn<LargeDataRow>(colKey, 'string', leafType.key, {
                width: 90,
                sortable: true,
                renderColumnContent: () => (
                  <Canvas.Container direction="row" gap={4} justifyContent="center" alignItems="center">
                    <Canvas.Icon icon={svgIcon} size={14} color={leafColor} />
                    <Canvas.Text font="bold 11px sans-serif" color={leafColor}>{leafKey}</Canvas.Text>
                  </Canvas.Container>
                )
              })
            )
          } else if (l === 1) {
            // Вариант 2: Canvas.Button
            const leafKey = leafType.key

            stateCities.push(
              createColumn<LargeDataRow>(colKey, 'string', leafType.key, {
                width: 90,
                sortable: true,
                renderColumnContent: () => (
                  <Canvas.Container direction="row" gap={6} justifyContent="center" alignItems="center" wrap="wrap">
                    <Canvas.Button onClick={() => console.log(`Clicked ${leafKey} button`)}>
                      {leafKey}
                    </Canvas.Button>
                  </Canvas.Container>
                )
              })
            )
          } else if (l === 2) {
            // Вариант 3: Кастомная ячейка с кнопками
            const currentColKey = colKey
            stateCities.push(
              createColumn<LargeDataRow>(colKey, 'string', leafType.key, {
                width: 200,
                sortable: false,
                renderCellContent: (row) => {
                  const value = row[currentColKey] as string
                  return (
                    <Canvas.Container direction="column" justifyContent="center" alignItems="stretch" padding={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                      <Canvas.Container direction="row" justifyContent="space-between" alignItems="center">
                        <Canvas.Text font="11px sans-serif" color="#333">{value || '0 km²'}</Canvas.Text>
                      </Canvas.Container>
                      <Canvas.Container direction="row" justifyContent="flex-start" alignItems="center" gap={12}>
                        <Canvas.Button variant="primary">Hello Area!</Canvas.Button>
                        <Canvas.Button onClick={e => {
                          console.log('!!!!', e)
                        }}>Hello Area 2!</Canvas.Button>
                      </Canvas.Container>
                    </Canvas.Container>
                  )
                }
              })
            )

            globalColIndex++
            continue
          } else {
            // Вариант 4: Canvas.Button с текстом
            const leafKey = leafType.key

            stateCities.push(
              createColumn<LargeDataRow>(colKey, 'string', leafType.key, {
                width: 90,
                sortable: true,
                renderColumnContent: () => (
                  <Canvas.Container direction="row" gap={6} justifyContent="center" alignItems="center" wrap="wrap">
                    <Canvas.Button onClick={() => console.log(`Clicked ${leafKey} button`)}>
                      {leafKey}
                    </Canvas.Button>
                  </Canvas.Container>
                )
              })
            )
          }
          globalColIndex++
        }

        // State Level (Level 3)
        const stateNameCopy = stateName
        const stateIndex = s

        countryStates.push({
          title: stateName,
          renderColumnContent: () => (
            <Canvas.Container direction="row" gap={6} justifyContent="center" alignItems="center" wrap="wrap">
              <Canvas.Icon icon={MAP_SVG} size={14} color="#2196f3" />
              <Canvas.Text font="bold 12px sans-serif" color="#333333">{stateNameCopy}</Canvas.Text>
              <Canvas.Button onClick={() => console.log(`Clicked state: ${stateNameCopy}`)}>
                {String(stateIndex + 1)}
              </Canvas.Button>
            </Canvas.Container>
          ),
          children: stateCities
        })
      }

      // Country Level (Level 2)
      const countryNameCopy = countryName

      regionCountries.push({
        title: countryName,
        renderColumnContent: () => (
          <Canvas.Container direction="row" gap={6} justifyContent="center" alignItems="center" wrap="wrap">
            <Canvas.IconButton
              icon={GLOBE_SVG}
              onClick={() => console.log(`Clicked country: ${countryNameCopy}`)}
            />
          </Canvas.Container>
        ),
        children: countryStates
      })
    }

    // Region Level (Level 1)
    const regionNameCopy = regionName

    columns.push({
      title: regionName,
      renderColumnContent: () => (
        <Canvas.Container direction="row" alignItems="center" gap={6}>
          <Canvas.Icon icon={LOCATION_SVG} size={18} color="#2f75d5" />
          <Canvas.Text font="bold 14px sans-serif" color="black" wordWrap>{regionNameCopy}</Canvas.Text>
        </Canvas.Container>
      ),
      children: regionCountries
    })
  }

  const endTime = performance.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  console.log(`✅ Генерация колонок завершена за ${duration} секунд. Всего колонок: ${globalColIndex}`)

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
        Пример таблицы с {TOTAL_COLS.toLocaleString()} колонок и {ROW_COUNT.toLocaleString()} строк. Используется ленивая генерация данных - значения создаются только при обращении к ним, что позволяет работать с огромными объемами данных без падения вкладки.
      </p>
      <BasicGrid<LargeDataRow>
        columns={columns}
        rows={dataRows}
        height={600}
        rowHeight={40}
        headerRowHeight={54}
        getRowId={(row) => row.id}
        stickyHeader={false}
        enableColumnReorder={true}
        onSortChange={(model) => {
          if (model) {
            alert(`Сортировка по колонке: ${model.columnId}, направление: ${model.direction}`)
          }
        }}
      />
    </div>
  )
}

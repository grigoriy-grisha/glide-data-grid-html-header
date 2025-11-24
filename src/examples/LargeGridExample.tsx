import React from 'react'
import { BasicGrid, createColumn, type BasicGridColumn } from '../components/BasicGrid'

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
const COL_COUNT_TARGET = 16000
const COLS_PER_REGION = 12 // 3 leaf * 2 states * 2 countries
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
        if (col % 3 === 0) {
          value = Math.floor(random * 1000000).toLocaleString() // Pop
        } else if (col % 3 === 1) {
          value = `$${(random * 100).toFixed(2)}B` // GDP
        } else {
          value = `${Math.floor(random * 1000)} km²` // Area
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

// Генерация колонок с 4 уровнями вложенности
const generateColumns = (): BasicGridColumn<LargeDataRow>[] => {
  const startTime = performance.now()
  const columns: BasicGridColumn<LargeDataRow>[] = []

  // Структура:
  // Region (Level 1) -> Country (Level 2) -> State (Level 3) -> City Data (Level 4 - Leaves)
  // 3 leaf columns per State
  // 2 States per Country
  // 2 Countries per Region
  // Total columns per Region = 3 * 2 * 2 = 12

  let globalColIndex = 0

  console.log(`🚀 Начало генерации ${TOTAL_COLS.toLocaleString()} колонок с 4 уровнями вложенности...`)

  for (let r = 0; r < REGIONS_COUNT; r++) {
    const regionCountries: BasicGridColumn<LargeDataRow>[] = []

    for (let c = 0; c < 2; c++) {
      const countryStates: BasicGridColumn<LargeDataRow>[] = []

      for (let s = 0; s < 2; s++) {
        const stateCities: BasicGridColumn<LargeDataRow>[] = []

        // 3 Leaf columns: Pop, GDP, Area
        const leafTypes = ['Pop', 'GDP', 'Area']
        for (let l = 0; l < 3; l++) {
          const colKey = `col_${globalColIndex}`
          const title = leafTypes[l]

          stateCities.push(
            createColumn<LargeDataRow>(colKey, 'string', title, {
              width: 60, // Compact width
              sortable: true,
            })
          )
          globalColIndex++
        }

        countryStates.push({
          title: `State ${r}-${c}-${s}`,
          children: stateCities
        })
      }

      regionCountries.push({
        title: `Country ${r}-${c}`,
        children: countryStates
      })
    }

    columns.push({
      title: `Region ${r}`,
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

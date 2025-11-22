import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Handsontable from 'handsontable'
import 'handsontable/dist/handsontable.full.css'
import DataEditor, { GridCell, GridCellKind, GridColumn, Item, EditableGridCell } from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'
import './DataGrid.css'
import html2canvas from 'html2canvas'

interface DataRow {
  id: number
  name: string
  email: string
  age: number
  department: string
  salary: number
  city: string // Город сотрудника
  parentId?: number // ID родительской строки для иерархии
  __level?: number // Уровень вложенности для отображения
  __expanded?: boolean // Состояние раскрытия
  __hasChildren?: boolean // Есть ли дочерние элементы
}

type SortDirection = 'asc' | 'desc' | undefined

// Тип для кастомного React компонента ячейки
type CellComponent = React.ComponentType<{ 
  row: DataRow
  rowIndex: number
  colIndex: number
  onClick?: () => void
  state?: any
}> | React.ReactElement

// Интерфейс для определения кастомных компонентов ячеек с поддержкой состояния
interface CustomCellConfig {
  [colIndex: number]: {
    [rowIndex: number]: {
      component: CellComponent
      state?: any
      onClick?: () => void
    }
  }
}

const initialData: DataRow[] = [
  { id: 1, name: 'Иван Иванов', email: 'ivan@example.com', age: 30, department: 'Разработка', salary: 120000, city: 'Москва' },
  { id: 2, name: 'Петр Петров', email: 'petr@example.com', age: 25, department: 'Дизайн', salary: 90000, city: 'Питер', parentId: 1 },
  { id: 3, name: 'Мария Сидорова', email: 'maria@example.com', age: 28, department: 'Маркетинг', salary: 95000, city: 'Москва' },
  { id: 4, name: 'Анна Козлова', email: 'anna@example.com', age: 32, department: 'Разработка', salary: 130000, city: 'Питер', parentId: 1 },
  { id: 5, name: 'Дмитрий Смирнов', email: 'dmitry@example.com', age: 27, department: 'Продажи', salary: 85000, city: 'Москва', parentId: 3 },
  { id: 6, name: 'Сергей Волков', email: 'sergey@example.com', age: 29, department: 'Дизайн', salary: 92000, city: 'Питер', parentId: 2 },
  { id: 7, name: 'Елена Новикова', email: 'elena@example.com', age: 26, department: 'Маркетинг', salary: 88000, city: 'Москва', parentId: 5 },
]

/**
 * DataGrid компонент с поддержкой кастомных React компонентов в ячейках
 * 
 * Пример использования:
 * 
 * // Установить кастомный компонент в ячейку (колонка 2, строка 0):
 * (window as any).setCellComponent(2, 0, ({ row }) => (
 *   <div style={{ padding: '8px', background: '#e3f2fd', borderRadius: '4px' }}>
 *     <strong>{row.name}</strong>
 *     <br />
 *     <small>{row.email}</small>
 *   </div>
 * ))
 * 
 * // Или передать готовый React элемент:
 * (window as any).setCellComponent(2, 0, <MyCustomComponent />)
 * 
 * // Удалить кастомный компонент:
 * (window as any).setCellComponent(2, 0, null)
 * 
 * Примечание: Компоненты конвертируются в SVG/изображения и встраиваются
 * непосредственно в ячейки Glide Data Grid.
 */
export const DataGrid: React.FC = () => {
  const [data, setData] = useState<DataRow[]>(initialData)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set([1, 2, 3]))
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [expandedDetailRow, setExpandedDetailRow] = useState<number | null>(null) // ID строки с открытым детальным компонентом
  const [sortColumn, setSortColumn] = useState<number | undefined>(undefined)
  const [sortDirection, setSortDirection] = useState<SortDirection>(undefined)
  const hotTableRef = useRef<HTMLDivElement>(null)
  const hotInstanceRef = useRef<Handsontable | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const renderContainerRef = useRef<HTMLDivElement>(null)
  
  // Конфигурация кастомных компонентов ячеек
  const [customCells, setCustomCells] = useState<CustomCellConfig>({})
  
  // Кэш для изображений ячеек (React компоненты -> base64 изображения)
  const cellImageCache = useRef<Map<string, string>>(new Map())
  
  // Флаг загрузки изображений
  const [imageLoadingStates, setImageLoadingStates] = useState<Map<string, boolean>>(new Map())
  
  // Счетчик для принудительного обновления ячеек
  const [imageUpdateTrigger, setImageUpdateTrigger] = useState(0)

  // Функция для проверки, является ли строка родительской
  const hasChildren = useCallback((rowId: number): boolean => {
    return data.some(row => row.parentId === rowId)
  }, [data])

  // Функция для вычисления уровня вложенности строки
  const getRowLevel = useCallback((row: DataRow): number => {
    let level = 0
    let currentParentId: number | undefined = row.parentId
    while (currentParentId !== undefined) {
      level++
      const parent = data.find(r => r.id === currentParentId)
      currentParentId = parent?.parentId
    }
    return level
  }, [data])

  // Функция для построения дерева и получения упорядоченного списка
  const buildTreeOrder = useCallback(() => {
    // Создаем карту всех элементов
    const itemMap = new Map<number, DataRow>()
    data.forEach(item => {
      itemMap.set(item.id, item)
    })

    // Рекурсивная функция для обхода дерева
    const traverseTree = (parentId: number | undefined, result: DataRow[]): void => {
      const children = data.filter(item => item.parentId === parentId)
      
      for (const child of children) {
        // Проверяем, должен ли этот элемент быть видимым
        if (parentId === undefined) {
          // Корневой элемент - всегда видим
          result.push(child)
          if (expandedRows.has(child.id)) {
            traverseTree(child.id, result)
          }
        } else {
          // Дочерний элемент - проверяем, раскрыт ли родитель
          let isVisible = true
          let currentParentId: number | undefined = child.parentId
          
          while (currentParentId !== undefined && isVisible) {
            if (!expandedRows.has(currentParentId)) {
              isVisible = false
              break
            }
            const parent = itemMap.get(currentParentId)
            currentParentId = parent?.parentId
          }
          
          if (isVisible) {
            result.push(child)
            if (expandedRows.has(child.id)) {
              traverseTree(child.id, result)
            }
          }
        }
      }
    }

    const result: DataRow[] = []
    traverseTree(undefined, result)
    return result
  }, [data, expandedRows])

  // Преобразуем данные с учетом иерархии и фильтрации
  const displayData = useMemo(() => {
    // Получаем данные в порядке дерева
    const treeOrdered = buildTreeOrder()

    // Сортируем данные (если нужно)
    let sorted = treeOrdered
    if (sortColumn !== undefined && sortDirection !== undefined) {
      sorted = [...treeOrdered].sort((a, b) => {
        let aValue: string | number
        let bValue: string | number

        switch (sortColumn) {
          case 0:
            aValue = a.id
            bValue = b.id
            break
          case 1:
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case 2:
            aValue = a.email.toLowerCase()
            bValue = b.email.toLowerCase()
            break
          case 3:
            aValue = a.age
            bValue = b.age
            break
        case 4:
          aValue = a.department.toLowerCase()
          bValue = b.department.toLowerCase()
          break
        case 5:
          aValue = a.city.toLowerCase()
          bValue = b.city.toLowerCase()
          break
        case 6:
          aValue = a.salary
          bValue = b.salary
          break
          default:
            return 0
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue, 'ru')
            : bValue.localeCompare(aValue, 'ru')
        } else {
          return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
        }
      })
    }

    // Добавляем метаданные для отображения
    return sorted.map(row => ({
      ...row,
      __level: getRowLevel(row),
      __expanded: expandedRows.has(row.id),
      __hasChildren: hasChildren(row.id),
    }))
  }, [buildTreeOrder, getRowLevel, hasChildren, sortColumn, sortDirection])

  // Функция для получения всех дочерних ID рекурсивно
  const getAllChildrenIds = useCallback((parentId: number): number[] => {
    const children: number[] = []
    const directChildren = data.filter(row => row.parentId === parentId)
    
    for (const child of directChildren) {
      children.push(child.id)
      children.push(...getAllChildrenIds(child.id))
    }
    
    return children
  }, [data])

  // ========== HANDSONTABLE ==========
  
  // Кастомный рендерер для ячеек Handsontable с отступами
  const cellRenderer = useCallback((_instance: Handsontable, td: HTMLTableCellElement, row: number, col: number, _prop: string | number, value: any) => {
    const rowData = displayData[row] as any
    if (!rowData) {
      td.innerHTML = ''
      return td
    }

    const level = rowData.__level || 0
    const indentPixels = level * 20

    // Применяем отступ ко всем ячейкам
    td.style.paddingLeft = `${indentPixels}px`

    // Для первой колонки добавляем индикатор иерархии
    if (col === 0 && rowData.__hasChildren) {
      const isExpanded = rowData.__expanded
      const indicator = isExpanded ? '▼ ' : '▶ '
      td.innerHTML = `${indicator}${value || ''}`
      td.style.cursor = 'pointer'
      
      // Обработчик клика для сворачивания/разворачивания
      td.onclick = (e) => {
        e.stopPropagation()
        const rowId = rowData.id
        setExpandedRows(prev => {
          const newSet = new Set(prev)
          if (newSet.has(rowId)) {
            // Сворачиваем: удаляем родителя и всех его дочерних элементов
            newSet.delete(rowId)
            const allChildren = getAllChildrenIds(rowId)
            allChildren.forEach(childId => newSet.delete(childId))
          } else {
            // Разворачиваем: добавляем родителя
            newSet.add(rowId)
          }
          return newSet
        })
      }
    } else if (col === 0 && level > 0) {
      td.innerHTML = `  ${value || ''}`
    } else {
      td.innerHTML = value != null ? String(value) : ''
    }

    return td
  }, [displayData, getAllChildrenIds])

  // Колонки для Handsontable (без type, используем только renderer)
  const hotColumns = useMemo(() => [
    {
      data: 'id',
      title: 'ID',
      width: 100,
      renderer: cellRenderer,
    },
    {
      data: 'name',
      title: 'Имя',
      width: 200,
      renderer: cellRenderer,
    },
    {
      data: 'email',
      title: 'Email',
      width: 250,
      renderer: cellRenderer,
    },
    {
      data: 'age',
      title: 'Возраст',
      width: 100,
      renderer: cellRenderer,
    },
    {
      data: 'department',
      title: 'Отдел',
      width: 150,
      renderer: cellRenderer,
    },
    {
      data: 'city',
      title: 'Город',
      width: 120,
      renderer: (_instance: Handsontable, td: HTMLTableCellElement, row: number, _col: number, _prop: string | number, value: any) => {
        const rowData = displayData[row] as any
        const level = rowData?.__level || 0
        const indentPixels = level * 20
        td.style.paddingLeft = `${indentPixels}px`
        
        // Добавляем стили для баджей
        const city = String(value || '')
        if (city === 'Москва') {
          td.style.backgroundColor = '#e3f2fd'
          td.style.color = '#1976d2'
          td.style.borderRadius = '4px'
          td.style.fontWeight = '500'
        } else if (city === 'Питер') {
          td.style.backgroundColor = '#fff9c4'
          td.style.color = '#f57f17'
          td.style.borderRadius = '4px'
          td.style.fontWeight = '500'
        }
        
        td.innerHTML = city
        return td
      }
    },
    {
      data: 'salary',
      title: 'Зарплата',
      width: 120,
      renderer: (_instance: Handsontable, td: HTMLTableCellElement, row: number, _col: number, _prop: string | number, value: any) => {
        const rowData = displayData[row] as any
        const level = rowData?.__level || 0
        const indentPixels = level * 20
        td.style.paddingLeft = `${indentPixels}px`
        const formattedValue = typeof value === 'number' ? value.toLocaleString('ru-RU') : (value || '')
        td.innerHTML = formattedValue
        return td
      }
    },
  ], [cellRenderer, displayData])

  // Инициализация скрытого Handsontable для управления данными
  useEffect(() => {
    if (!hotTableRef.current) return

    const hot = new Handsontable(hotTableRef.current, {
      data: displayData,
      columns: hotColumns,
      colHeaders: false,
      rowHeaders: false,
      width: 1,
      height: 1,
      licenseKey: 'non-commercial-and-evaluation',
      // Используем Handsontable API для управления данными
      // Можно использовать для сортировки, фильтрации и других операций
    })

    hotInstanceRef.current = hot

    return () => {
      if (hotInstanceRef.current) {
        hotInstanceRef.current.destroy()
        hotInstanceRef.current = null
      }
    }
  }, [hotColumns])

  // Обновление данных Handsontable при изменении displayData
  useEffect(() => {
    if (hotInstanceRef.current) {
      hotInstanceRef.current.loadData(displayData)
    }
  }, [displayData])

  // Handsontable используется как скрытый движок для управления данными
  // Можно использовать его API для сортировки, фильтрации и других операций
  // Пример использования:
  // - hotInstanceRef.current.getData() - получить данные
  // - hotInstanceRef.current.getPlugin('filters') - фильтрация
  // - hotInstanceRef.current.getPlugin('columnSorting') - сортировка

  // ========== GLIDE DATA GRID ==========

  // Обработчик клика по заголовку столбца Glide
  const onHeaderClicked = useCallback((col: number) => {
    // Колонка 0 - чекбокс, не сортируем
    if (col === 0) {
      return
    }
    
    // Учитываем сдвиг: реальная колонка данных на 1 меньше из-за чекбокса
    const dataCol = col - 1
    
    if (sortColumn === dataCol) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(undefined)
        setSortDirection(undefined)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(dataCol)
      setSortDirection('asc')
    }
  }, [sortColumn, sortDirection])

  // Обработчик клика по строке для открытия детального компонента
  // Используем клик по любой ячейке строки (кроме чекбокса и ID для иерархии)
  const handleRowExpand = useCallback((rowIndex: number) => {
    const dataRow = displayData[rowIndex]
    if (!dataRow) return
    
    // Переключаем состояние открытой строки
    setExpandedDetailRow(prev => prev === dataRow.id ? null : dataRow.id)
  }, [displayData])

  // Обработчик клика по ячейке Glide для сворачивания/разворачивания и чекбоксов
  const onCellClicked = useCallback((cell: Item) => {
    const [col, row] = cell
    const dataRow = displayData[row]
    
    if (!dataRow) return
    
    const level = dataRow.__level || 0
    
    // Колонка 0 - чекбокс
    if (col === 0) {
      setSelectedRows(prev => {
        const newSet = new Set(prev)
        if (newSet.has(dataRow.id)) {
          newSet.delete(dataRow.id)
        } else {
          newSet.add(dataRow.id)
        }
        return newSet
      })
      return
    }
    
    // Проверяем, есть ли кастомный компонент с обработчиком клика
    const realColIndex = col
    const customCellConfig = customCells[realColIndex]?.[row]
    if (customCellConfig?.onClick) {
      // Вызываем обработчик клика и обновляем изображение
      customCellConfig.onClick()
      // Очищаем кэш для этой ячейки, чтобы перерисовать с новым состоянием
      const oldCacheKey = `${realColIndex}-${row}-${dataRow.id}-${JSON.stringify(customCellConfig.state || {})}`
      cellImageCache.current.delete(oldCacheKey)
      setImageUpdateTrigger(prev => prev + 1)
      return
    }
    
    // Вычисляем реальную колонку данных (с учетом сдвига чекбокса и уровня)
    const dataCol = col - level - 1
    
    // Клик по первой колонке данных (ID) для сворачивания/разворачивания
    if (dataCol === 0 && hasChildren(dataRow.id)) {
      setExpandedRows(prev => {
        const newSet = new Set(prev)
        if (newSet.has(dataRow.id)) {
          // Сворачиваем: удаляем родителя и всех его дочерних элементов
          newSet.delete(dataRow.id)
          const allChildren = getAllChildrenIds(dataRow.id)
          allChildren.forEach(childId => newSet.delete(childId))
        } else {
          // Разворачиваем: добавляем родителя
          newSet.add(dataRow.id)
        }
        return newSet
      })
      return
    }
    
    // Клик по любой другой ячейке строки открывает/закрывает детальный компонент
    handleRowExpand(row)
  }, [displayData, hasChildren, getAllChildrenIds, handleRowExpand, customCells])

  // Создание столбцов Glide с индикаторами сортировки
  const glideColumns: GridColumn[] = useMemo(() => {
    const getSortIndicator = (colIndex: number): string => {
      // Учитываем сдвиг: колонка сортировки теперь на 1 больше из-за чекбокса
      if (sortColumn !== undefined && colIndex === sortColumn + 1) {
        return sortDirection === 'asc' ? ' ▲' : ' ▼'
      }
      return ''
    }

    return [
      { title: '', width: 50 }, // Колонка с чекбоксами
      { title: `ID${getSortIndicator(0)}`, width: 120 },
      { title: `Имя${getSortIndicator(1)}`, width: 200 },
      { title: `Email${getSortIndicator(2)}`, width: 250 },
      { title: `Возраст${getSortIndicator(3)}`, width: 100 },
      { title: `Отдел${getSortIndicator(4)}`, width: 150 },
      { title: `Город${getSortIndicator(5)}`, width: 120 },
      { title: `Зарплата${getSortIndicator(6)}`, width: 120 },
    ]
  }, [sortColumn, sortDirection])


  // Функция для конвертации React компонента в изображение
  const renderComponentToImage = useCallback(async (
    component: CellComponent,
    row: DataRow,
    rowIndex: number,
    colIndex: number,
    width: number,
    height: number,
    state?: any
  ): Promise<string> => {
    const cacheKey = `${colIndex}-${rowIndex}-${row.id}-${JSON.stringify(state || {})}`
    
    // Проверяем кэш
    if (cellImageCache.current.has(cacheKey)) {
      return cellImageCache.current.get(cacheKey)!
    }
    
    if (!renderContainerRef.current) return ''
    
    // Устанавливаем флаг загрузки
    setImageLoadingStates(prev => new Map(prev).set(cacheKey, true))
    
    // Создаем временный контейнер для рендеринга
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.top = '0'
    tempContainer.style.width = `${width}px`
    tempContainer.style.height = `${height}px`
    tempContainer.style.overflow = 'hidden'
    tempContainer.style.backgroundColor = 'white'
    tempContainer.style.boxSizing = 'border-box'
    document.body.appendChild(tempContainer)
    
    try {
      // Рендерим React компонент в контейнер
      const { createRoot } = await import('react-dom/client')
      const reactRoot = createRoot(tempContainer)
      
      const ComponentToRender = React.isValidElement(component) 
        ? () => component 
        : component as React.ComponentType<{ row: DataRow; rowIndex: number; colIndex: number; state?: any }>
      
      reactRoot.render(
        <ComponentToRender row={row} rowIndex={rowIndex} colIndex={colIndex} state={state} />
      )
      
      // Ждем рендеринга (увеличиваем время для лучшего качества)
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Конвертируем в изображение через html2canvas с высоким качеством
      const scale = 2 // Увеличиваем масштаб для лучшего качества
      const canvas = await html2canvas(tempContainer, {
        width: width * scale,
        height: height * scale,
        backgroundColor: null,
        scale: scale,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: width * scale,
        windowHeight: height * scale,
      })
      
      // Конвертируем в PNG с высоким качеством
      const imageDataUrl = canvas.toDataURL('image/png', 1.0)
      
      // Сохраняем в кэш
      cellImageCache.current.set(cacheKey, imageDataUrl)
      
      // Очищаем флаг загрузки и триггерим обновление
      setImageLoadingStates(prev => {
        const newMap = new Map(prev)
        newMap.delete(cacheKey)
        return newMap
      })
      
      // Триггерим обновление ячеек
      setImageUpdateTrigger(prev => prev + 1)
      
      // Очищаем
      reactRoot.unmount()
      document.body.removeChild(tempContainer)
      
      return imageDataUrl
    } catch (error) {
      console.error('Error rendering component to image:', error)
      document.body.removeChild(tempContainer)
      setImageLoadingStates(prev => {
        const newMap = new Map(prev)
        newMap.delete(cacheKey)
        return newMap
      })
      return ''
    }
  }, [])

  const getCellContent = useCallback(
    (cell: Item): GridCell => {
      const [col, row] = cell
      const dataRow = displayData[row]

      if (dataRow === undefined) {
        return {
          kind: GridCellKind.Text,
          data: '',
          displayData: '',
          allowOverlay: true,
        }
      }

      const level = dataRow.__level || 0
      
      // Колонка 0 - чекбокс (не зависит от уровня вложенности)
      if (col === 0) {
        const isSelected = selectedRows.has(dataRow.id)
        return {
          kind: GridCellKind.Boolean,
          data: isSelected,
          readonly: false,
          allowOverlay: false,
        }
      }

      // Если колонка меньше уровня вложенности + 1 (чекбокс), возвращаем пустую ячейку
      if (col <= level) {
        return {
          kind: GridCellKind.Text,
          data: '',
          displayData: '',
          allowOverlay: false,
        }
      }

      // Вычисляем реальную колонку данных (с учетом сдвига чекбокса и уровня)
      const dataCol = col - level - 1
      
      // Проверяем, есть ли кастомный компонент для этой ячейки
      const realColIndex = col
      const customCellConfig = customCells[realColIndex]?.[row]
      
      if (customCellConfig) {
        const { component: customCell, state } = customCellConfig
        // Используем state в ключе кэша для обновления при изменении состояния
        const cacheKey = `${realColIndex}-${row}-${dataRow.id}-${JSON.stringify(state || {})}`
        const cachedImage = cellImageCache.current.get(cacheKey)
        const isLoading = imageLoadingStates.get(cacheKey)
        
        // Устанавливаем флаг загрузки если изображение еще не загружено
        if (!cachedImage && !isLoading) {
          setImageLoadingStates(prev => {
            const newMap = new Map(prev)
            newMap.set(cacheKey, true)
            return newMap
          })
          
          // Запускаем загрузку
          const colDef = glideColumns[realColIndex]
          const cellWidth = colDef && 'width' in colDef ? (colDef as { width: number }).width : 120
          const cellHeight = 40
          
          renderComponentToImage(customCell, dataRow, row, realColIndex, cellWidth, cellHeight, state)
            .catch(err => {
              console.error('Error loading cell image:', err)
              setImageLoadingStates(prev => {
                const newMap = new Map(prev)
                newMap.delete(cacheKey)
                return newMap
              })
            })
        }
        
        // Если изображение загружено, используем GridCellKind.Image для встраивания в ячейку
        if (cachedImage) {
          // GridCellKind.Image требует data и displayData как массивы строк (URL изображений)
          return {
            kind: GridCellKind.Image,
            data: [cachedImage], // Массив URL изображений
            displayData: [cachedImage], // Массив URL для отображения
            allowOverlay: false,
            readonly: true,
            contentAlign: 'center',
            themeOverride: {
              bgCell: 'transparent',
            },
          } as GridCell
        }
        
        // Если загружается, показываем placeholder
        return {
          kind: GridCellKind.Text,
          data: 'Загрузка...',
          displayData: 'Загрузка...',
          allowOverlay: false,
        }
      }
      
      const indent = level > 0 ? '\u00A0'.repeat(level * 4) : ''

      let value: string | number
      
      switch (dataCol) {
        case 0: {
          const isParent = dataRow.__hasChildren || false
          const isExpanded = dataRow.__expanded || false
          const indicator = isParent ? (isExpanded ? '▼ ' : '▶ ') : (dataRow.parentId ? '  ' : '')
          value = `${indent}${indicator}${dataRow.id}`
          break
        }
        case 1:
          value = `${indent}${dataRow.name}`
          break
        case 2:
          value = `${indent}${dataRow.email}`
          break
        case 3:
          value = `${indent}${dataRow.age}`
          break
        case 4:
          value = `${indent}${dataRow.department}`
          break
        case 5: {
          // Колонка города с баджем
          const city = dataRow.city || ''
          value = city
          // Используем специальный префикс для идентификации баджа
          value = `BADGE:${city}`
          break
        }
        case 6:
          value = `${indent}${dataRow.salary.toLocaleString('ru-RU')}`
          break
        default:
          value = ''
      }

      // Проверяем, является ли это баджем города
      if (typeof value === 'string' && value.startsWith('BADGE:')) {
        const city = value.replace('BADGE:', '')
        // Используем специальный формат для CSS селектора
        // Добавляем уникальный маркер для идентификации
        return {
          kind: GridCellKind.Text,
          data: city,
          displayData: `●CITY_BADGE_${city}●`, // Уникальный маркер для CSS
          allowOverlay: true,
          themeOverride: {
            bgCell: 'transparent', // Прозрачный фон ячейки
            textDark: 'transparent', // Делаем текст прозрачным
          },
        }
      }

      return {
        kind: GridCellKind.Text,
        data: value.toString(),
        displayData: value.toString(),
        allowOverlay: true,
      }
    },
    [displayData, selectedRows, customCells, imageUpdateTrigger]
  )

  const onCellEdited = useCallback(
    (cell: Item, newValue: EditableGridCell) => {
      const [col, row] = cell
      
      const editedRow = displayData[row]
      if (editedRow === undefined) {
        return
      }

      const level = editedRow.__level || 0

      // Колонка 0 - чекбокс
      if (col === 0 && newValue.kind === GridCellKind.Boolean) {
        setSelectedRows(prev => {
          const newSet = new Set(prev)
          if (newValue.data) {
            newSet.add(editedRow.id)
          } else {
            newSet.delete(editedRow.id)
          }
          return newSet
        })
        return
      }

      if (newValue.kind !== GridCellKind.Text) {
        return
      }

      // Вычисляем реальную колонку данных (с учетом сдвига чекбокса и уровня)
      const dataCol = col - level - 1
      
      // Если колонка меньше уровня вложенности + 1 (чекбокс), не редактируем
      if (col <= level) {
        return
      }

      const originalIndex = data.findIndex(item => item.id === editedRow.id)
      if (originalIndex === -1) {
        return
      }

      const newData = [...data]
      const value = (newValue.data as string)?.trim() || ''

      switch (dataCol) {
        case 0: {
          const cleanValue = value.replace(/[▼▶\u00A0]/g, '').trim()
          const numValue = parseInt(cleanValue)
          if (!isNaN(numValue) && numValue > 0) {
            newData[originalIndex].id = numValue
          }
          break
        }
        case 1: {
          const cleanValue = value.replace(/\u00A0/g, '').trim()
          if (cleanValue.length > 0) {
            newData[originalIndex].name = cleanValue
          }
          break
        }
        case 2: {
          const cleanValue = value.replace(/\u00A0/g, '').trim()
          if (cleanValue.length > 0) {
            newData[originalIndex].email = cleanValue
          }
          break
        }
        case 3: {
          const cleanValue = value.replace(/\u00A0/g, '').trim()
          const numValue = parseInt(cleanValue)
          if (!isNaN(numValue) && numValue >= 0 && numValue <= 150) {
            newData[originalIndex].age = numValue
          }
          break
        }
        case 4: {
          const cleanValue = value.replace(/\u00A0/g, '').trim()
          if (cleanValue.length > 0) {
            newData[originalIndex].department = cleanValue
          }
          break
        }
        case 5: {
          // Редактирование города
          const cleanValue = value.replace(/\u00A0/g, '').trim()
          if (cleanValue.length > 0) {
            newData[originalIndex].city = cleanValue
          }
          break
        }
        case 6: {
          const cleanValue = value.replace(/\u00A0/g, '').replace(/\s/g, '').replace(/,/g, '').replace(/\./g, '')
          const numValue = parseInt(cleanValue)
          if (!isNaN(numValue) && numValue >= 0) {
            newData[originalIndex].salary = numValue
          }
          break
        }
      }
      
      setData(newData)
    },
    [data, displayData]
  )

  // Эффект для предзагрузки изображений кастомных компонентов
  useEffect(() => {
    if (!renderContainerRef.current) return
    
    // Предзагружаем изображения для всех кастомных компонентов
    Object.keys(customCells).forEach(colKey => {
      const colIndex = parseInt(colKey)
      const colCells = customCells[colIndex]
      
      if (!colCells) return
      
      Object.keys(colCells).forEach(rowKey => {
        const rowIndex = parseInt(rowKey)
        const cellConfig = colCells[rowIndex]
        const dataRow = displayData[rowIndex]
        
        if (!cellConfig || !dataRow) return
        
        const { component, state } = cellConfig
        const cacheKey = `${colIndex}-${rowIndex}-${dataRow.id}-${JSON.stringify(state || {})}`
        
        // Если изображение еще не загружено, загружаем его
        if (!cellImageCache.current.has(cacheKey) && !imageLoadingStates.get(cacheKey)) {
          const colDef = glideColumns[colIndex]
          const cellWidth = colDef && 'width' in colDef ? (colDef as { width: number }).width : 120
          const cellHeight = 40
          
          renderComponentToImage(component, dataRow, rowIndex, colIndex, cellWidth, cellHeight, state)
            .then(() => {
              // Принудительно обновляем таблицу после загрузки
              if (gridRef.current) {
                setImageLoadingStates(prev => {
                  const newMap = new Map(prev)
                  newMap.delete(cacheKey)
                  return newMap
                })
              }
            })
        }
      })
    })
  }, [customCells, displayData, glideColumns, renderComponentToImage])
  
  // Эффект для добавления классов к ячейкам с баджами после рендеринга
  useEffect(() => {
    const addBadgeStyles = () => {
      // Ищем все элементы с текстом маркеров городов
      const allElements = document.querySelectorAll('.glide-grid-wrapper *')
      
      allElements.forEach((element: Element) => {
        const text = element.textContent || ''
        
        // Проверяем наличие маркеров городов
        if (text.includes('●CITY_BADGE_Москва●') && !element.classList.contains('badge-processed')) {
          element.classList.add('badge-processed', 'city-badge-moscow')
          
          // Создаем бадж элемент
          const badge = document.createElement('span')
          badge.className = 'badge badge-moscow'
          badge.textContent = 'Москва'
          
          // Очищаем содержимое и добавляем бадж
          element.innerHTML = ''
          element.appendChild(badge)
          
        } else if (text.includes('●CITY_BADGE_Питер●') && !element.classList.contains('badge-processed')) {
          element.classList.add('badge-processed', 'city-badge-piter')
          
          // Создаем бадж элемент
          const badge = document.createElement('span')
          badge.className = 'badge badge-piter'
          badge.textContent = 'Питер'
          
          // Очищаем содержимое и добавляем бадж
          element.innerHTML = ''
          element.appendChild(badge)
        }
      })
    }

    // Добавляем стили после рендеринга с несколькими попытками
    const timeoutId1 = setTimeout(addBadgeStyles, 200)
    const timeoutId2 = setTimeout(addBadgeStyles, 500)
    const timeoutId3 = setTimeout(addBadgeStyles, 1000)
    
    // Также используем MutationObserver для отслеживания изменений DOM
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          shouldUpdate = true
        }
      })
      if (shouldUpdate) {
        setTimeout(addBadgeStyles, 50)
      }
    })
    
    const gridWrapper = document.querySelector('.glide-grid-wrapper')
    if (gridWrapper) {
      observer.observe(gridWrapper, {
        childList: true,
        subtree: true,
        characterData: true
      })
    }
    
    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      clearTimeout(timeoutId3)
      observer.disconnect()
    }
  }, [displayData])

  // Компонент для детального отображения строки
  const DetailComponent: React.FC<{ rowData: DataRow; top: number }> = ({ rowData, top }) => {
    return (
      <div 
        className="detail-row-overlay" 
        style={{ top: `${top}px` }}
      >
        <div className="detail-row-component">
          <div className="detail-content">
            <h3>Детальная информация: {rowData.name}</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{rowData.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{rowData.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Возраст:</span>
                <span className="detail-value">{rowData.age}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Отдел:</span>
                <span className="detail-value">{rowData.department}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Город:</span>
                <span className="detail-value">
                  <span className={`badge badge-${rowData.city === 'Москва' ? 'moscow' : 'piter'}`}>
                    {rowData.city}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Зарплата:</span>
                <span className="detail-value">{rowData.salary.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
            {/* Здесь можно добавить любой React компонент */}
            <div className="detail-custom">
              <p>Здесь можно отобразить любой React компонент!</p>
              <button onClick={() => alert(`Выбрана строка: ${rowData.name}`)}>
                Пример кнопки
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Находим индекс строки с открытым детальным компонентом
  const expandedRowIndex = expandedDetailRow !== null 
    ? displayData.findIndex(row => row.id === expandedDetailRow)
    : -1

  // Вычисляем позицию для детального компонента
  const [detailTop, setDetailTop] = useState<number>(0)
  const rowHeight = 40 // Примерная высота строки в пикселях
  const headerHeight = 40 // Высота заголовка

  useEffect(() => {
    if (expandedRowIndex >= 0 && gridRef.current) {
      // Вычисляем позицию: заголовок + высота строки * индекс строки + высота строки
      const top = headerHeight + (expandedRowIndex * rowHeight) + rowHeight
      setDetailTop(top)
    }
  }, [expandedRowIndex, displayData.length])
  
  // Эффект для предзагрузки изображений кастомных компонентов
  useEffect(() => {
    if (!renderContainerRef.current) return
    
    // Предзагружаем изображения для всех кастомных компонентов
    Object.keys(customCells).forEach(colKey => {
      const colIndex = parseInt(colKey)
      const colCells = customCells[colIndex]
      
      if (!colCells) return
      
      Object.keys(colCells).forEach(rowKey => {
        const rowIndex = parseInt(rowKey)
        const cellConfig = colCells[rowIndex]
        const dataRow = displayData[rowIndex]
        
        if (!cellConfig || !dataRow) return
        
        const { component, state } = cellConfig
        const cacheKey = `${colIndex}-${rowIndex}-${dataRow.id}-${JSON.stringify(state || {})}`
        
        // Если изображение еще не загружено, загружаем его
        if (!cellImageCache.current.has(cacheKey) && !imageLoadingStates.get(cacheKey)) {
          const colDef = glideColumns[colIndex]
          const cellWidth = colDef && 'width' in colDef ? (colDef as { width: number }).width : 120
          const cellHeight = 40
          
          renderComponentToImage(component, dataRow, rowIndex, colIndex, cellWidth, cellHeight, state)
            .then(() => {
              // Принудительно обновляем таблицу после загрузки
              if (gridRef.current) {
                setImageLoadingStates(prev => {
                  const newMap = new Map(prev)
                  newMap.delete(cacheKey)
                  return newMap
                })
              }
            })
        }
      })
    })
  }, [customCells, displayData, glideColumns, renderComponentToImage])
  
  // Функция для установки кастомного компонента в ячейку
  const setCellComponent = useCallback((
    colIndex: number,
    rowIndex: number,
    component: CellComponent | null,
    options?: { state?: any; onClick?: () => void }
  ) => {
    setCustomCells(prev => {
      const newCells = { ...prev }
      
      if (!newCells[colIndex]) {
        newCells[colIndex] = {}
      }
      
      if (component === null) {
        // Удаляем компонент и очищаем кэш изображения
        const dataRow = displayData[rowIndex]
        const oldConfig = newCells[colIndex][rowIndex]
        if (dataRow && oldConfig) {
          const cacheKey = `${colIndex}-${rowIndex}-${dataRow.id}-${JSON.stringify(oldConfig.state || {})}`
          cellImageCache.current.delete(cacheKey)
          setImageLoadingStates(prevState => {
            const newMap = new Map(prevState)
            newMap.delete(cacheKey)
            return newMap
          })
        }
        
        delete newCells[colIndex][rowIndex]
        if (Object.keys(newCells[colIndex]).length === 0) {
          delete newCells[colIndex]
        }
      } else {
        // Очищаем старый кэш при установке нового компонента
        const dataRow = displayData[rowIndex]
        const oldConfig = newCells[colIndex][rowIndex]
        if (dataRow && oldConfig) {
          const cacheKey = `${colIndex}-${rowIndex}-${dataRow.id}-${JSON.stringify(oldConfig.state || {})}`
          cellImageCache.current.delete(cacheKey)
        }
        
        newCells[colIndex][rowIndex] = {
          component,
          state: options?.state,
          onClick: options?.onClick,
        }
      }
      
      return newCells
    })
  }, [displayData])
  
  // Экспортируем функцию для использования извне
  useEffect(() => {
    // Сохраняем функцию в window для доступа извне (можно также использовать контекст)
    ;(window as any).setCellComponent = setCellComponent
  }, [setCellComponent])
  

  return (
    <div className="data-grid-container">
      <div className="data-grid-wrapper">
        {/* Скрытый Handsontable для управления данными */}
        <div ref={hotTableRef} className="handsontable-container" style={{ display: 'none' }}></div>
        
        {/* Glide Data Grid для отображения */}
        <div className="glide-grid-wrapper" ref={gridRef}>
          <DataEditor
            getCellContent={getCellContent}
            columns={glideColumns}
            rows={displayData.length}
            width={900}
            height={400}
            onCellEdited={onCellEdited}
            onHeaderClicked={onHeaderClicked}
            onCellClicked={onCellClicked}
            getCellsForSelection={true}
            rowMarkers="both"
            smoothScrollX={true}
            smoothScrollY={true}
            isDraggable={false}
            keybindings={{
              copy: true,
              paste: true,
              cut: true,
              selectAll: true,
            }}
          />
          
          {/* Скрытый контейнер для рендеринга компонентов в изображения */}
          <div 
            ref={renderContainerRef}
            style={{
              position: 'absolute',
              left: '-9999px',
              top: 0,
              visibility: 'hidden',
            }}
          />
          
          {/* Детальный компонент поверх таблицы */}
          {expandedRowIndex >= 0 && (
            <DetailComponent 
              rowData={displayData[expandedRowIndex]} 
              top={detailTop}
            />
          )}
        </div>
      </div>
    </div>
  )
}

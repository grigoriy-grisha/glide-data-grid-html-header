import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import DataEditor, { GridCell, GridCellKind, GridColumn, Item, EditableGridCell, GridMouseEventArgs, DataEditorRef, isSizedGridColumn } from '@glideapps/glide-data-grid'
import '@glideapps/glide-data-grid/dist/index.css'
import { drawButtonCell, useButtonIcon } from './ButtonCell'
import { drawFlexCell, useFlexIcon, FlexElement } from './FlexCell'
import './SimpleGrid.css'

interface SimpleRow {
  id: number
  name: string
  value: number
  status: string
}

const initialData: SimpleRow[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Элемент ${i + 1}`,
  value: Math.floor(Math.random() * 500) + 50,
  status: Math.random() > 0.5 ? 'Активен' : 'Неактивен',
}))

// SVG иконка стрелки влево по умолчанию
const defaultArrowIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <path d="M10 12 L6 8 L10 4 M6 8 L14 8" 
          stroke="white" 
          stroke-width="2" 
          fill="none" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
  </svg>
`

// SVG иконка для большой кнопки справа
const rightArrowIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <path d="M6 4 L10 8 L6 12 M10 8 L2 8" 
          stroke="white" 
          stroke-width="2" 
          fill="none" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
  </svg>
`


export const SimpleGrid: React.FC = () => {
  const dataEditorRef = useRef<DataEditorRef>(null)
  const [hoveredButton, setHoveredButton] = useState<[number, number, string?] | null>(null) // [col, row, elementId?]
  const [hoverProgress, setHoverProgress] = useState<Map<string, number>>(new Map()) // "col-row-elementId" -> progress
  const animationFrameRef = useRef<number | null>(null)
  // Храним элементы flex-ячеек с их позициями: "col-row" -> FlexElement[]
  const flexElementsRef = useRef<Map<string, FlexElement[]>>(new Map())
  
  // Предзагружаем иконки
  const arrowIconRef = useButtonIcon(defaultArrowIcon)
  const rightArrowIconRef = useFlexIcon(rightArrowIcon)

  // Структура многоуровневых заголовков
  interface HeaderLevel {
    title: string
    colSpan: number
    level: number
    colStart: number
  }

  const headerStructure: HeaderLevel[][] = useMemo(() => [
    // Уровень 1 (верхний)
    [
      { title: 'Основная информация', colSpan: 3, level: 1, colStart: 0 },
      { title: 'Дополнительная информация', colSpan: 1, level: 1, colStart: 3 },
      { title: 'Действия', colSpan: 3, level: 1, colStart: 4 },
    ],
    // Уровень 2 (средний)
    [
      { title: 'ID', colSpan: 1, level: 2, colStart: 0 },
      { title: 'Название', colSpan: 1, level: 2, colStart: 1 },
      { title: 'Значение', colSpan: 1, level: 2, colStart: 2 },
      { title: 'Статус', colSpan: 1, level: 2, colStart: 3 },
      { title: 'Действие', colSpan: 1, level: 2, colStart: 4 },
      { title: '', colSpan: 1, level: 2, colStart: 5 },
      { title: 'Flex Ячейка', colSpan: 1, level: 2, colStart: 6 },
    ],
    // Уровень 3 (нижний, опциональный)
    [
      { title: 'Уникальный идентификатор', colSpan: 1, level: 3, colStart: 0 },
      { title: 'Полное наименование', colSpan: 1, level: 3, colStart: 1 },
      { title: 'Числовое значение', colSpan: 1, level: 3, colStart: 2 },
      { title: 'Текущий статус', colSpan: 1, level: 3, colStart: 3 },
      { title: 'Кнопка действия', colSpan: 1, level: 3, colStart: 4 },
      { title: 'Быстрое действие', colSpan: 1, level: 3, colStart: 5 },
      { title: 'Комплексная ячейка', colSpan: 1, level: 3, colStart: 6 },
    ],
  ], [])

  const columns: GridColumn[] = useMemo(
    () => [
      { title: 'ID', width: 80 },
      { title: 'Название', width: 200 },
      { title: 'Значение', width: 120 },
      { title: 'Статус', width: 150 },
      { title: 'Действие', width: 150 },
      { title: '', width: 50 }, // Колонка с кнопкой-иконкой
      { title: 'Flex Ячейка', width: 350 }, // Колонка с flex-компоновкой
    ],
    []
  )

  const getCellContent = useCallback((cell: Item): GridCell => {
    const [col, row] = cell
    const dataRow = initialData[row]

    if (!dataRow) {
      return {
        kind: GridCellKind.Text,
        data: '',
        displayData: '',
        allowOverlay: false,
      }
    }

    switch (col) {
      case 0:
        return {
          kind: GridCellKind.Number,
          data: dataRow.id,
          displayData: dataRow.id.toString(),
          allowOverlay: false,
        }
      case 1:
        return {
          kind: GridCellKind.Text,
          data: dataRow.name,
          displayData: dataRow.name,
          allowOverlay: false,
        }
      case 2:
        return {
          kind: GridCellKind.Number,
          data: dataRow.value,
          displayData: dataRow.value.toString(),
          allowOverlay: false,
        }
      case 3:
        return {
          kind: GridCellKind.Text,
          data: dataRow.status,
          displayData: dataRow.status,
          allowOverlay: false,
          themeOverride: {
            bgCell: dataRow.status === 'Активен' ? '#e8f5e9' : '#ffebee',
            textDark: dataRow.status === 'Активен' ? '#2e7d32' : '#c62828',
          },
        }
      case 4:
        // Кнопка-ячейка с красивым ховером (используем Text для совместимости)
        return {
          kind: GridCellKind.Text,
          data: 'button',
          displayData: '',
          allowOverlay: false,
        }
      case 5:
        // Кнопка-ячейка только с иконкой
        return {
          kind: GridCellKind.Text,
          data: 'icon-button',
          displayData: '',
          allowOverlay: false,
        }
      case 6:
        // Flex-ячейка с кнопкой слева, текстом по центру и большой кнопкой справа
        return {
          kind: GridCellKind.Text,
          data: 'flex-cell',
          displayData: '',
          allowOverlay: false,
        }
      default:
        return {
          kind: GridCellKind.Text,
          data: '',
          displayData: '',
          allowOverlay: false,
        }
    }
  }, [])

  const onCellEdited = useCallback((cell: Item, newValue: EditableGridCell) => {
    const [col, row] = cell
    const dataRow = initialData[row]

    if (!dataRow) return

    if (newValue.kind === GridCellKind.Text) {
      if (col === 1) {
        dataRow.name = newValue.data as string
      } else if (col === 3) {
        dataRow.status = newValue.data as string
      }
    } else if (newValue.kind === GridCellKind.Number) {
      if (col === 0) {
        dataRow.id = newValue.data as number
      } else if (col === 2) {
        dataRow.value = newValue.data as number
      }
    }
  }, [])

  const drawCell = useCallback(
    (
      args: {
        ctx: CanvasRenderingContext2D
        cell: GridCell
        theme: any
        rect: { x: number; y: number; width: number; height: number }
        col: number
        row: number
        hoverAmount: number
        hoverX: number | undefined
        hoverY: number | undefined
        highlighted: boolean
        imageLoader: any
        overrideCursor?: (cursor: React.CSSProperties['cursor']) => void
      },
      drawContent: () => void
    ) => {
      const { ctx, rect, col, row, overrideCursor, hoverAmount, hoverX, hoverY } = args
      const dataRow = initialData[row]

      // Для кастомной кнопки-ячейки используем fabric.js для рисования
      if (col === 4) {
        const x = rect.x
        const y = rect.y
        const width = rect.width
        const height = rect.height

        // Устанавливаем курсор pointer при наведении на кнопку
        if (overrideCursor) {
          // Проверяем, находится ли курсор внутри области кнопки
          const buttonWidth = Math.min(width - 10, 140)
          const buttonHeight = Math.min(height - 4, 32)
          const buttonX = x + (width - buttonWidth) / 2
          const buttonY = y + (height - buttonHeight) / 2
          
          if (hoverX !== undefined && hoverY !== undefined) {
            const isOverButton = hoverX >= buttonX && hoverX <= buttonX + buttonWidth &&
                                 hoverY >= buttonY && hoverY <= buttonY + buttonHeight
            if (isOverButton || hoverAmount > 0) {
              overrideCursor('pointer')
            }
          } else if (hoverAmount > 0) {
            overrideCursor('pointer')
          }
        }

        // Используем внутреннее состояние для плавной анимации
        const progress = hoverProgress.get(`4-${row}`) || 0
        
        // Размеры кнопки
        const buttonWidth = Math.min(width - 10, 140)
        const buttonHeight = Math.min(height - 4, 32)
        const buttonX = x + (width - buttonWidth) / 2
        const buttonY = y + (height - buttonHeight) / 2
        
        // Используем компонент кнопки
        drawButtonCell({
          ctx,
          icon: arrowIconRef.current,
          text: progress > 0.5 ? 'Нажми!' : 'Нажми',
          progress,
          width: buttonWidth,
          height: buttonHeight,
          x: buttonX,
          y: buttonY,
        })
      } else if (col === 5) {
        // Кнопка только с иконкой
        const x = rect.x
        const y = rect.y
        const width = rect.width
        const height = rect.height

        if (overrideCursor && hoverAmount > 0) {
          overrideCursor('pointer')
        }

        // Используем внутреннее состояние для плавной анимации
        const progress = hoverProgress.get(`5-${row}`) || 0
        
        // Размеры кнопки (квадратная)
        const buttonSize = Math.min(width - 4, height - 4, 40)
        const buttonX = x + (width - buttonSize) / 2
        const buttonY = y + (height - buttonSize) / 2
        
        // Используем компонент кнопки только с иконкой
        drawButtonCell({
          ctx,
          icon: arrowIconRef.current,
          progress,
          width: buttonSize,
          height: buttonSize,
          x: buttonX,
          y: buttonY,
        })
      } else if (col === 6) {
        // Flex-ячейка с кнопкой слева, текстом по центру и большой кнопкой справа
        if (!dataRow) {
          drawContent()
          return
        }
        
        const x = rect.x
        const y = rect.y
        const width = rect.width
        const height = rect.height

        // Получаем или создаем элементы FlexElement для flex-ячейки
        const cellKey = `6-${row}`
        let flexElements = flexElementsRef.current.get(cellKey)
        
        if (!flexElements) {
          // Создаем элементы в первый раз
          flexElements = [
            new FlexElement('left-button', 'icon-button', {
              icon: arrowIconRef.current,
              progress: 0,
              width: 32,
              height: 32,
              style: {
                backgroundColor: '#1b5e20',
                borderRadius: 6,
              },
            }),
            new FlexElement('text', 'text', {
              content: dataRow.name,
              width: 'auto',
              style: {
                textColor: '#333333',
                fontSize: 13,
                padding: 8,
              },
            }),
            new FlexElement('right-button', 'button', {
              icon: rightArrowIconRef.current,
              content: 'Действие',
              progress: 0,
              width: 120,
              height: 32,
              style: {
                backgroundColor: '#1976d2',
                borderRadius: 6,
                fontSize: 12,
              },
            }),
          ]
          flexElementsRef.current.set(cellKey, flexElements)
        }
        
        // Обновляем прогресс элементов из состояния
        const leftButtonProgress = hoverProgress.get(`6-${row}-left-button`) || 0
        const rightButtonProgress = hoverProgress.get(`6-${row}-right-button`) || 0
        flexElements[0].progress = leftButtonProgress
        flexElements[2].progress = rightButtonProgress
        
        // Обновляем иконки (они могут загрузиться позже)
        flexElements[0].icon = arrowIconRef.current
        flexElements[2].icon = rightArrowIconRef.current
        
        // Обновляем контент текста если изменился
        if (flexElements[1].content !== dataRow.name) {
          flexElements[1].content = dataRow.name
        }
        
        // Рисуем flex-ячейку и обновляем позиции элементов
        drawFlexCell({
          ctx,
          x,
          y,
          width,
          height,
          direction: 'row',
          align: 'center',
          justify: 'space-between',
          gap: 8,
          padding: 4,
          items: [], // Не используем items, используем elements
          elements: flexElements,
          onElementBounds: (elements) => {
            // Сохраняем элементы с обновленными позициями
            flexElementsRef.current.set(cellKey, elements)
          },
        })
        
        // Проверяем hover используя сохраненные элементы с позициями
        const savedElements = flexElementsRef.current.get(cellKey)
        if (hoverAmount > 0 && hoverX !== undefined && hoverY !== undefined && savedElements) {
          // Преобразуем абсолютные координаты hoverX/hoverY в относительные координаты ячейки
          // hoverX и hoverY - это абсолютные координаты на canvas
          // x и y - это координаты начала ячейки на canvas
          const relativeHoverX = hoverX - x
          const relativeHoverY = hoverY - y
          
          // Проверяем, на какой элемент наведен курсор
          let hoveredElementId: string | null = null
          for (const element of savedElements) {
            // Пропускаем текстовый элемент, он не интерактивный
            if (element.type === 'text') continue
            
            if (element.contains(relativeHoverX, relativeHoverY)) {
              hoveredElementId = element.id
              break
            }
          }
          
          // Обновляем состояние hoveredButton
          if (hoveredElementId !== null) {
            const currentHovered = hoveredButton && hoveredButton[0] === col && hoveredButton[1] === row ? hoveredButton[2] : undefined
            if (currentHovered !== hoveredElementId) {
              setHoveredButton([col, row, hoveredElementId])
            }
          } else {
            // Если курсор не на элементах, сбрасываем hover
            if (hoveredButton && hoveredButton[0] === col && hoveredButton[1] === row) {
              setHoveredButton(null)
            }
          }
        } else if (hoverAmount === 0) {
          // Когда курсор уходит с ячейки, сбрасываем hover
          if (hoveredButton && hoveredButton[0] === col && hoveredButton[1] === row) {
            setHoveredButton(null)
          }
        }

        // Устанавливаем курсор pointer при наведении
        if (overrideCursor && hoverAmount > 0) {
          overrideCursor('pointer')
        }

        // Рисуем flex-ячейку и обновляем позиции элементов через callback
        drawFlexCell({
          ctx,
          x,
          y,
          width,
          height,
          direction: 'row',
          align: 'center',
          justify: 'space-between',
          gap: 8,
          padding: 4,
          items: [], // Не используем items, используем elements
          elements: flexElements,
          onElementBounds: (updatedElements) => {
            // Обновляем позиции элементов (они уже обновлены в drawFlexCell)
            // Просто сохраняем ссылку для следующего рендера
            flexElementsRef.current.set(cellKey, updatedElements)
          },
        })
      } else {
        // Для всех остальных ячеек используем стандартный рендеринг
        drawContent()
      }
    },
    [hoverProgress, arrowIconRef, rightArrowIconRef, hoveredButton]
  )


  // Анимация плавного ховера
  useEffect(() => {
    let lastUpdateTime = 0
    const updateInterval = 16 // ~60fps
    
    const animate = (currentTime: number) => {
      // Ограничиваем частоту обновлений
      if (currentTime - lastUpdateTime < updateInterval) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }
      
      lastUpdateTime = currentTime
      
      setHoverProgress(prev => {
        const newMap = new Map(prev)
        let hasChanges = false
        const cellsToUpdate: Item[] = []

        // Обновляем прогресс для всех кнопок (колонки 4, 5 и 6)
        for (let i = 0; i < initialData.length; i++) {
          // Проверяем ховер для колонки 4
          const isHovered4 = hoveredButton !== null && hoveredButton[0] === 4 && hoveredButton[1] === i
          const key4 = `4-${i}`
          const currentProgress4 = newMap.get(key4) || 0
          const targetProgress4 = isHovered4 ? 1 : 0
          
          if (Math.abs(currentProgress4 - targetProgress4) > 0.02) {
            const newProgress4 = currentProgress4 + (targetProgress4 - currentProgress4) * 0.2
            newMap.set(key4, newProgress4)
            cellsToUpdate.push([4, i])
            hasChanges = true
          } else if (Math.abs(currentProgress4 - targetProgress4) > 0.001) {
            newMap.set(key4, targetProgress4)
            cellsToUpdate.push([4, i])
            hasChanges = true
          }
          
          // Проверяем ховер для колонки 5
          const isHovered5 = hoveredButton !== null && hoveredButton[0] === 5 && hoveredButton[1] === i
          const key5 = `5-${i}`
          const currentProgress5 = newMap.get(key5) || 0
          const targetProgress5 = isHovered5 ? 1 : 0
          
          if (Math.abs(currentProgress5 - targetProgress5) > 0.02) {
            const newProgress5 = currentProgress5 + (targetProgress5 - currentProgress5) * 0.2
            newMap.set(key5, newProgress5)
            cellsToUpdate.push([5, i])
            hasChanges = true
          } else if (Math.abs(currentProgress5 - targetProgress5) > 0.001) {
            newMap.set(key5, targetProgress5)
            cellsToUpdate.push([5, i])
            hasChanges = true
          }
          
          // Проверяем ховер для колонки 6 (flex-ячейка)
          // Определяем, на какой конкретный элемент наведен курсор
          const isHovered6 = hoveredButton !== null && hoveredButton[0] === 6 && hoveredButton[1] === i
          const hoveredElementId = hoveredButton && hoveredButton[0] === 6 && hoveredButton[1] === i ? hoveredButton[2] : undefined
          
          // Активируем hover ТОЛЬКО для конкретного элемента, на который наведен курсор
          const isHovered6Left = isHovered6 && hoveredElementId === 'left-button'
          const isHovered6Right = isHovered6 && hoveredElementId === 'right-button'
          
          const key6Left = `6-${i}-left-button`
          const currentProgress6Left = newMap.get(key6Left) || 0
          const targetProgress6Left = isHovered6Left ? 1 : 0
          
          if (Math.abs(currentProgress6Left - targetProgress6Left) > 0.02) {
            const newProgress6Left = currentProgress6Left + (targetProgress6Left - currentProgress6Left) * 0.2
            newMap.set(key6Left, newProgress6Left)
            cellsToUpdate.push([6, i])
            hasChanges = true
          } else if (Math.abs(currentProgress6Left - targetProgress6Left) > 0.001) {
            newMap.set(key6Left, targetProgress6Left)
            cellsToUpdate.push([6, i])
            hasChanges = true
          }
          
          const key6Right = `6-${i}-right-button`
          const currentProgress6Right = newMap.get(key6Right) || 0
          const targetProgress6Right = isHovered6Right ? 1 : 0
          
          if (Math.abs(currentProgress6Right - targetProgress6Right) > 0.02) {
            const newProgress6Right = currentProgress6Right + (targetProgress6Right - currentProgress6Right) * 0.2
            newMap.set(key6Right, newProgress6Right)
            cellsToUpdate.push([6, i])
            hasChanges = true
          } else if (Math.abs(currentProgress6Right - targetProgress6Right) > 0.001) {
            newMap.set(key6Right, targetProgress6Right)
            cellsToUpdate.push([6, i])
            hasChanges = true
          }
        }

        // Обновляем ячейки только если есть изменения
        if (hasChanges && dataEditorRef.current && cellsToUpdate.length > 0) {
          // Используем setTimeout для батчинга обновлений
          setTimeout(() => {
            if (dataEditorRef.current) {
              dataEditorRef.current.updateCells(cellsToUpdate.map(cell => ({ cell })))
            }
          }, 0)
        }

        return hasChanges ? newMap : prev
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [hoveredButton])

  const onItemHovered = useCallback((args: GridMouseEventArgs) => {
    if (args.kind === 'cell') {
      const [col, row] = args.location
      if (col === 4 || col === 5) {
        setHoveredButton([col, row])
        // Устанавливаем курсор pointer через DOM
        const gridElement = document.querySelector('.dvn-scroller') as HTMLElement
        if (gridElement) {
          gridElement.style.cursor = 'pointer'
        }
      } else if (col === 6) {
        // Для flex-ячейки позиция определяется в drawCell через hoverX/hoverY
        // Здесь только устанавливаем курсор pointer
        const gridElement = document.querySelector('.dvn-scroller') as HTMLElement
        if (gridElement) {
          gridElement.style.cursor = 'pointer'
        }
      } else {
        // Сбрасываем hoveredButton для всех колонок
        setHoveredButton(null)
        // Возвращаем обычный курсор
        const gridElement = document.querySelector('.dvn-scroller') as HTMLElement
        if (gridElement) {
          gridElement.style.cursor = ''
        }
      }
    } else {
      // Когда курсор уходит с ячейки, сбрасываем hover
      setHoveredButton(null)
      const gridElement = document.querySelector('.dvn-scroller') as HTMLElement
      if (gridElement) {
        gridElement.style.cursor = ''
      }
    }
  }, [])

  // Функция для вычисления ширины колонки с учетом spanning
  const getColumnWidth = useCallback((colIndex: number): number => {
    const col = columns[colIndex]
    if (col && isSizedGridColumn(col)) {
      return col.width
    }
    return 100
  }, [columns])

  // Функция для вычисления ширины spanning заголовка
  const getSpanWidth = useCallback((colStart: number, colSpan: number): number => {
    let width = 0
    for (let i = colStart; i < colStart + colSpan && i < columns.length; i++) {
      width += getColumnWidth(i)
    }
    return width
  }, [columns, getColumnWidth])

  // Функция для отрисовки кастомного header с многоуровневыми заголовками
  const drawHeader = useCallback(
    (
      args: {
        ctx: CanvasRenderingContext2D
        column: GridColumn
        columnIndex: number
        theme: any
        rect: { x: number; y: number; width: number; height: number }
        hoverAmount: number
        isSelected: boolean
        isHovered: boolean
        hasSelectedCell: boolean
        spriteManager: any
        menuBounds: { x: number; y: number; width: number; height: number }
      },
      _drawDefault: () => void
    ) => {
      const { ctx, columnIndex, rect } = args
      const { x, y, width, height } = rect
      
      ctx.save()
      
      // Высота каждого уровня заголовка
      const levelHeight = height / headerStructure.length
      
      // Рисуем все уровни заголовков
      for (let levelIndex = 0; levelIndex < headerStructure.length; levelIndex++) {
        const level = headerStructure[levelIndex]
        const levelY = y + levelIndex * levelHeight
        const levelHeightActual = levelIndex === headerStructure.length - 1 ? height - levelIndex * levelHeight : levelHeight
        
        // Находим заголовок для текущей колонки на этом уровне
        let headerCell: HeaderLevel | null = null
        for (const h of level) {
          if (columnIndex >= h.colStart && columnIndex < h.colStart + h.colSpan) {
            headerCell = h
            break
          }
        }
        
        // Если это первая колонка в spanning, рисуем полный объединенный заголовок
        if (headerCell && columnIndex === headerCell.colStart) {
          const spanWidth = getSpanWidth(headerCell.colStart, headerCell.colSpan)
          const bgColor = levelIndex === 0 ? '#e3f2fd' : levelIndex === 1 ? '#f5f5f5' : '#fafafa'
          
          // Рисуем фон объединенного заголовка (без внутренних разделителей)
          ctx.fillStyle = bgColor
          ctx.fillRect(x, levelY, spanWidth, levelHeightActual)
          
          // Скрываем стандартные границы внутри spanning группы
          // Рисуем толстые линии цвета фона поверх стандартных вертикальных границ
          ctx.strokeStyle = bgColor
          ctx.lineWidth = 4
          ctx.lineCap = 'square'
          
          // Скрываем все внутренние вертикальные границы внутри spanning группы
          // Рисуем толстые линии цвета фона поверх стандартных границ
          for (let i = 1; i < headerCell.colSpan; i++) {
            const borderX = x + getSpanWidth(headerCell.colStart, i)
            // Рисуем толстую линию для полного скрытия стандартной границы
            ctx.beginPath()
            ctx.moveTo(borderX - 1, levelY)
            ctx.lineTo(borderX - 1, levelY + levelHeightActual)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(borderX, levelY)
            ctx.lineTo(borderX, levelY + levelHeightActual)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(borderX + 1, levelY)
            ctx.lineTo(borderX + 1, levelY + levelHeightActual)
            ctx.stroke()
          }
          
          // Рисуем только внешние границы объединенного заголовка (без внутренних разделителей)
          ctx.strokeStyle = '#d0d0d0'
          ctx.lineWidth = 1
          
          // Верхняя граница (только для первого уровня)
          if (levelIndex === 0) {
            ctx.beginPath()
            ctx.moveTo(x, levelY)
            ctx.lineTo(x + spanWidth, levelY)
            ctx.stroke()
          }
          
          // Нижняя граница (общая для всей spanning группы)
          ctx.beginPath()
          ctx.moveTo(x, levelY + levelHeightActual)
          ctx.lineTo(x + spanWidth, levelY + levelHeightActual)
          ctx.stroke()
          
          // Левая граница (если не первая колонка таблицы)
          if (columnIndex > 0) {
            ctx.beginPath()
            ctx.moveTo(x, levelY)
            ctx.lineTo(x, levelY + levelHeightActual)
            ctx.stroke()
          }
          
          // Правая граница объединенного заголовка (только внешняя, без внутренних разделителей)
          const isLastInSpan = columnIndex + headerCell.colSpan >= columns.length
          if (!isLastInSpan) {
            ctx.beginPath()
            ctx.moveTo(x + spanWidth, levelY)
            ctx.lineTo(x + spanWidth, levelY + levelHeightActual)
            ctx.stroke()
          }
          
          // Рисуем текст заголовка по центру объединенной ячейки
          if (headerCell.title) {
            ctx.fillStyle = levelIndex === 0 ? '#1565c0' : levelIndex === 1 ? '#333333' : '#666666'
            const fontSize = levelIndex === 0 ? 14 : levelIndex === 1 ? 13 : 12
            const fontWeight = levelIndex === 0 ? 'bold' : levelIndex === 1 ? 'bold' : 'normal'
            ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            
            const textX = x + spanWidth / 2
            const textY = levelY + levelHeightActual / 2
            
            // Обрезаем текст если не помещается
            let titleText = headerCell.title
            const maxTextWidth = spanWidth - 16
            const textMetrics = ctx.measureText(titleText)
            if (textMetrics.width > maxTextWidth) {
              while (ctx.measureText(titleText + '...').width > maxTextWidth && titleText.length > 0) {
                titleText = titleText.slice(0, -1)
              }
              titleText += '...'
            }
            
            ctx.fillText(titleText, textX, textY)
          }
        } else if (headerCell) {
          // Если это не первая колонка в spanning группе, полностью перекрываем стандартные границы
          const bgColor = levelIndex === 0 ? '#e3f2fd' : levelIndex === 1 ? '#f5f5f5' : '#fafafa'
          
          // Рисуем фон с большим перекрытием, чтобы гарантированно скрыть стандартные границы
          // Перекрываем на 3 пикселя слева и справа
          const overlap = 3
          ctx.fillStyle = bgColor
          ctx.fillRect(x - overlap, levelY, width + overlap * 2, levelHeightActual)
          
          // Рисуем толстые линии того же цвета поверх стандартных границ для их полного скрытия
          ctx.strokeStyle = bgColor
          ctx.lineWidth = 4
          ctx.lineCap = 'square'
          
          // Скрываем левую границу (рисуем толстую линию цвета фона поверх стандартной границы)
          ctx.beginPath()
          ctx.moveTo(x - 1, levelY)
          ctx.lineTo(x - 1, levelY + levelHeightActual)
          ctx.stroke()
          
          // Скрываем правую границу (если это не последняя колонка в spanning группе)
          const isLastInSpan = columnIndex === headerCell.colStart + headerCell.colSpan - 1
          if (!isLastInSpan) {
            ctx.beginPath()
            ctx.moveTo(x + width + 1, levelY)
            ctx.lineTo(x + width + 1, levelY + levelHeightActual)
            ctx.stroke()
          }
          
          // Дополнительно рисуем фон поверх границ для гарантии
          ctx.fillRect(x - overlap, levelY, overlap, levelHeightActual)
          if (!isLastInSpan) {
            ctx.fillRect(x + width, levelY, overlap, levelHeightActual)
          }
        } else {
          // Если заголовок не найден для этого уровня, рисуем обычную ячейку с границами
          ctx.fillStyle = levelIndex === 0 ? '#e3f2fd' : levelIndex === 1 ? '#f5f5f5' : '#fafafa'
          ctx.fillRect(x, levelY, width, levelHeightActual)
          
          ctx.strokeStyle = '#d0d0d0'
          ctx.lineWidth = 1
          
          // Верхняя граница (только для первого уровня)
          if (levelIndex === 0) {
            ctx.beginPath()
            ctx.moveTo(x, levelY)
            ctx.lineTo(x + width, levelY)
            ctx.stroke()
          }
          
          // Нижняя граница
          ctx.beginPath()
          ctx.moveTo(x, levelY + levelHeightActual)
          ctx.lineTo(x + width, levelY + levelHeightActual)
          ctx.stroke()
          
          // Левая граница (если не первая колонка таблицы)
          if (columnIndex > 0) {
            ctx.beginPath()
            ctx.moveTo(x, levelY)
            ctx.lineTo(x, levelY + levelHeightActual)
            ctx.stroke()
          }
          
          // Правая граница
          if (columnIndex < columns.length - 1) {
            ctx.beginPath()
            ctx.moveTo(x + width, levelY)
            ctx.lineTo(x + width, levelY + levelHeightActual)
            ctx.stroke()
          }
        }
      }
      
      ctx.restore()
    },
    [columns, headerStructure, getSpanWidth]
  )
  
  // Обработчик клика по header
  const onHeaderClicked = useCallback((col: number) => {
    // Можно добавить логику обработки клика по заголовкам
    console.log(`Клик по заголовку колонки ${col}`)
  }, [])

  const onCellClicked = useCallback(
    (cell: Item) => {
      const [col, row] = cell
      if (col === 4) {
        alert(`Кнопка нажата для строки ${row + 1}: ${initialData[row].name}`)
      } else if (col === 5) {
        alert(`Кнопка с иконкой нажата для строки ${row + 1}: ${initialData[row].name}`)
      } else if (col === 6) {
        // Определяем, какая кнопка была нажата в flex-ячейке
        const hovered = hoveredButton
        if (hovered && hovered[0] === 6 && hovered[1] === row) {
          if (hovered[2] === 'left') {
            alert(`Левая кнопка нажата для строки ${row + 1}: ${initialData[row].name}`)
          } else if (hovered[2] === 'right') {
            alert(`Правая кнопка нажата для строки ${row + 1}: ${initialData[row].name}`)
          } else {
            alert(`Flex-ячейка нажата для строки ${row + 1}: ${initialData[row].name}`)
          }
        } else {
          alert(`Flex-ячейка нажата для строки ${row + 1}: ${initialData[row].name}`)
        }
      }
    },
    [hoveredButton]
  )

  return (
    <div className="simple-grid-container">
      <h2>Простая таблица Glide Data Grid</h2>
      
      <div className="simple-grid-wrapper">
        <DataEditor
          ref={dataEditorRef}
          getCellContent={getCellContent}
          columns={columns}
          rows={initialData.length}
          width={1100}
          height={300}
          onCellEdited={onCellEdited}
          drawCell={drawCell}
          drawHeader={drawHeader}
          onItemHovered={onItemHovered}
          onHeaderClicked={onHeaderClicked}
          onCellClicked={onCellClicked}
          rowMarkers="both"
          smoothScrollX={true}
          smoothScrollY={true}
          headerHeight={90}
        />
      </div>
    </div>
  )
}


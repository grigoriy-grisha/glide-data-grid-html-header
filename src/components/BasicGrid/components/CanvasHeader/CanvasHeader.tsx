import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { CanvasHeaderRenderer } from './CanvasHeaderRenderer'
import { isCellHoverable, getCellAtPosition } from './hoverUtils'
import { useHeaderVirtualization } from '../../context/HeaderVirtualizationContext'
import type { GridHeaderCell } from '../../models/GridHeaderCell'
import type { GridColumn } from '../../models/GridColumn'

interface CanvasHeaderProps {
  width: number
  height: number
  headerCells: GridHeaderCell[]
  orderedColumns: GridColumn<any>[]
  columnPositions: number[]
  columnWidths: number[]
  levelCount: number
  headerRowHeight: number
  markerWidth?: number
  showRowMarkers?: boolean
  scrollLeft?: number
  canvasHeaderRef?: React.RefObject<HTMLCanvasElement>
  handleResizeMouseDown?: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  handleResizeDoubleClick?: (event: React.MouseEvent<HTMLDivElement>, columnIndex: number, span: number) => void
  getColumnWidth?: (columnIndex: number) => number
  setColumnWidths?: (updates: Array<{ columnId: string; width: number }>) => void
  onVirtualResizeChange?: (x: number | null, columnIndex: number | null) => void
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  width,
  height,
  headerCells,
  orderedColumns,
  columnPositions,
  columnWidths,
  levelCount,
  headerRowHeight,
  markerWidth = 0,
  showRowMarkers = false,
  scrollLeft = 0,
  canvasHeaderRef,
  handleResizeMouseDown,
  handleResizeDoubleClick,
  getColumnWidth,
  setColumnWidths,
  onVirtualResizeChange,
}) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = canvasHeaderRef || internalCanvasRef
  const rendererRef = useRef<CanvasHeaderRenderer>(new CanvasHeaderRenderer())
  const containerRef = useRef<HTMLDivElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null)
  const markerWidthValue = showRowMarkers ? markerWidth : 0
  const { visibleIndices } = useHeaderVirtualization()
  
  // Состояние для виртуального resize
  const virtualResizeRef = useRef<{
    columnIndex: number
    span: number
    startX: number
    startWidths: number[]
    columnRange: Array<{ columnId: string; columnIndex: number; minWidth: number }>
    minTotalWidth: number
    virtualX: number | null
  } | null>(null)
  const resizeStartXRef = useRef<number | null>(null)

  // Фильтруем видимые ячейки для виртуализации
  const visibleCells = useMemo(() => {
    if (!visibleIndices) return headerCells

    const { start, end } = visibleIndices
    return headerCells.filter(cell => {
      const cellEndIndex = cell.startIndex + cell.colSpan
      // Проверяем, пересекается ли ячейка с видимым диапазоном
      return cellEndIndex > start && cell.startIndex < end
    })
  }, [headerCells, visibleIndices])
  
  // Состояние для цикла рендеринга
  const renderStateRef = useRef({
    width,
    height,
    visibleCells,
    columnPositions,
    columnWidths,
    levelCount,
    headerRowHeight,
    scrollLeft,
    mousePosition: null as { x: number; y: number } | null,
    needsRender: true,
  })
  
  const rafIdRef = useRef<number | null>(null)

  // Инициализация контекста и настройка canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    let ctx = ctxRef.current
    if (!ctx) {
      ctx = canvas.getContext('2d', {
        alpha: false,
        desynchronized: false,
      })
      if (!ctx) {
        return
      }
      ctxRef.current = ctx
    }

    // Получаем device pixel ratio для четкости на retina дисплеях
    const dpr = window.devicePixelRatio || 1

    // Устанавливаем размер canvas с учетом DPR (используем width для viewport)
    canvas.width = width * dpr
    canvas.height = height * dpr

    // Сбрасываем трансформации и масштабируем контекст обратно
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)

    // Отключаем сглаживание для четких линий
    ctx.imageSmoothingEnabled = false
  }, [width, height, canvasRef])

  // Обновление состояния для рендеринга
  useEffect(() => {
    renderStateRef.current = {
      width,
      height,
      visibleCells,
      columnPositions,
      columnWidths,
      levelCount,
      headerRowHeight,
      scrollLeft,
      mousePosition: mousePositionRef.current,
      needsRender: true,
    }
  }, [width, height, visibleCells, columnPositions, columnWidths, levelCount, headerRowHeight, scrollLeft])

  // Цикл рендеринга
  useEffect(() => {
    // Устанавливаем колбэк для запроса перерисовки после загрузки иконок
    rendererRef.current.setOnRerenderRequested(() => {
      renderStateRef.current.needsRender = true
    })

    const renderLoop = () => {
      const state = renderStateRef.current
      if (!ctxRef.current || !state.needsRender) {
        rafIdRef.current = requestAnimationFrame(renderLoop)
        return
      }

      // Обновляем mousePosition из ref
      state.mousePosition = mousePositionRef.current
      state.needsRender = false

      const renderer = rendererRef.current
      renderer.render({ 
        ctx: ctxRef.current,
        rect: {
          x: 0,
          y: 0,
          width: state.width,
          height: state.height,
        },
        headerCells: state.visibleCells,
        orderedColumns,
        columnPositions: state.columnPositions,
        columnWidths: state.columnWidths,
        levelCount: state.levelCount,
        headerRowHeight: state.headerRowHeight,
        scrollLeft: state.scrollLeft,
        mousePosition: state.mousePosition,
        theme: {},
        handleResizeMouseDown,
        handleResizeDoubleClick,
      })

      rafIdRef.current = requestAnimationFrame(renderLoop)
    }

    rafIdRef.current = requestAnimationFrame(renderLoop)

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      rendererRef.current.setOnRerenderRequested(null)
    }
  }, [])

  // Убираем transform, так как рендерим только видимую часть

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || !canvasRef.current) {
        return
      }

      const containerRect = containerRef.current.getBoundingClientRect()
      const relativeX = event.clientX - containerRect.left
      
      // Вычитаем ширину маркера строки, если он есть
      // Координаты относительно видимого viewport (canvas рендерит только видимую часть)
      // Для hover используем координаты относительно viewport, scrollLeft добавим в renderer
      const x = relativeX - markerWidthValue
      const y = event.clientY - containerRect.top

      // Проверяем, что курсор не на маркере строки
      if (relativeX < markerWidthValue) {
        mousePositionRef.current = null
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default'
        }
        renderStateRef.current.needsRender = true
        return
      }

      // Сохраняем координаты относительно viewport с учетом scrollLeft для hover
      const newMousePosition = { x: x + scrollLeft, y }
      
      // Проверяем, изменилась ли позиция мыши
      const prevPosition = mousePositionRef.current
      if (prevPosition && prevPosition.x === newMousePosition.x && prevPosition.y === newMousePosition.y) {
        return // Позиция не изменилась, не нужно перерисовывать
      }

      mousePositionRef.current = newMousePosition

      // Для определения курсора используем абсолютные координаты
      const absoluteX = x + scrollLeft
      const cell = getCellAtPosition(
        absoluteX,
        y,
        headerCells,
        columnPositions,
        columnWidths,
        headerRowHeight
      )

      // Проверяем, находимся ли мы на resize handle
      const resizeArea = rendererRef.current.getResizeAreaAt(absoluteX, y)
      if (canvasRef.current) {
        if (resizeArea) {
          canvasRef.current.style.cursor = 'col-resize'
        } else if (cell) {
          canvasRef.current.style.cursor = isCellHoverable(cell) ? 'pointer' : 'default'
        } else {
          canvasRef.current.style.cursor = 'default'
        }
      }

      // Помечаем, что нужна перерисовка
      renderStateRef.current.needsRender = true
    },
    [headerCells, visibleCells, columnPositions, columnWidths, headerRowHeight, scrollLeft, markerWidthValue, canvasRef, width, height, levelCount]
  )

  const handleMouseLeave = useCallback(() => {
    mousePositionRef.current = null
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default'
    }
    renderStateRef.current.needsRender = true
  }, [])

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || !rendererRef.current || !handleResizeMouseDown) {
        return
      }

      const containerRect = containerRef.current.getBoundingClientRect()
      const relativeX = event.clientX - containerRect.left
      
      // Проверяем, что клик не на маркере строки
      if (relativeX < markerWidthValue) {
        return
      }

      const x = relativeX - markerWidthValue
      const y = event.clientY - containerRect.top
      
      // Используем абсолютные координаты с учетом scrollLeft
      const absoluteX = x + scrollLeft
      
      // Проверяем попадание в resize handle
      const resizeArea = rendererRef.current.getResizeAreaAt(absoluteX, y)
      if (resizeArea && getColumnWidth && setColumnWidths) {
        event.preventDefault()
        event.stopPropagation()
        
        // Начинаем виртуальный resize
        const startWidths: number[] = []
        const columnRange: Array<{ columnId: string; columnIndex: number; minWidth: number }> = []
        for (let offset = 0; offset < resizeArea.span; offset++) {
          const colIdx = resizeArea.columnIndex + offset
          const column = orderedColumns[colIdx]
          if (column) {
            const width = getColumnWidth(colIdx)
            startWidths.push(width)
            columnRange.push({
              columnId: column.id,
              columnIndex: colIdx,
              minWidth: column.minWidth,
            })
          }
        }
        
        const minTotalWidth = columnRange.reduce((sum, item) => sum + item.minWidth, 0)
        resizeStartXRef.current = event.clientX
        virtualResizeRef.current = {
          columnIndex: resizeArea.columnIndex,
          span: resizeArea.span,
          startX: event.clientX,
          startWidths,
          columnRange,
          minTotalWidth,
          virtualX: null,
        }
        
        // Добавляем обработчики на document level
        const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!virtualResizeRef.current || !resizeStartXRef.current) {
            return
          }
          
          // Вычисляем виртуальную позицию с учетом scrollLeft
          const containerRect = containerRef.current?.getBoundingClientRect()
          if (!containerRect) return
          
          const relativeX = moveEvent.clientX - containerRect.left - markerWidthValue
          const virtualAbsoluteX = relativeX + scrollLeft
          
          virtualResizeRef.current.virtualX = virtualAbsoluteX
          
          // Уведомляем родительский компонент о изменении позиции виртуальной линии
          if (onVirtualResizeChange) {
            onVirtualResizeChange(virtualAbsoluteX, virtualResizeRef.current.columnIndex)
          }
          
          renderStateRef.current.needsRender = true
        }
        
        const handleMouseUp = (upEvent: MouseEvent) => {
          if (!virtualResizeRef.current || !resizeStartXRef.current || !setColumnWidths) {
            cleanup()
            return
          }
          
          // Применяем реальные изменения только при отпускании мыши
          const delta = upEvent.clientX - resizeStartXRef.current
          
          const calculateWidths = (delta: number) => {
            const startTotalWidth = virtualResizeRef.current!.startWidths.reduce((sum, w) => sum + w, 0)
            
            if (virtualResizeRef.current!.columnRange.length === 1) {
              const width = Math.max(
                virtualResizeRef.current!.columnRange[0].minWidth,
                Math.round(virtualResizeRef.current!.startWidths[0] + delta)
              )
              return [width]
            }
            
            const desiredTotal = Math.max(virtualResizeRef.current!.minTotalWidth, startTotalWidth + delta)
            let remainingTotal = desiredTotal
            let remainingStart = startTotalWidth
            let remainingMin = virtualResizeRef.current!.minTotalWidth
            
            const widths: number[] = []
            
            for (let i = 0; i < virtualResizeRef.current!.columnRange.length; i++) {
              const { minWidth } = virtualResizeRef.current!.columnRange[i]
              if (i === virtualResizeRef.current!.columnRange.length - 1) {
                widths.push(Math.max(minWidth, Math.round(remainingTotal)))
                break
              }
              
              const startWidth = virtualResizeRef.current!.startWidths[i]
              const ratio = remainingStart > 0
                ? startWidth / remainingStart
                : 1 / (virtualResizeRef.current!.columnRange.length - i)
              const proposed = startWidth + delta * ratio
              const maxAvailable = remainingTotal - (remainingMin - minWidth)
              const width = Math.max(
                minWidth,
                Math.min(Math.round(proposed), Math.round(maxAvailable))
              )
              
              widths.push(width)
              remainingTotal -= width
              remainingStart -= startWidth
              remainingMin -= minWidth
            }
            
            return widths
          }
          
          const nextWidths = calculateWidths(delta)
          setColumnWidths(
            virtualResizeRef.current.columnRange.map((item, index) => ({
              columnId: item.columnId,
              width: nextWidths[index],
            }))
          )
          
          cleanup()
        }
        
        const cleanup = () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
          document.body.style.userSelect = ''
          document.body.style.cursor = ''
          
          virtualResizeRef.current = null
          resizeStartXRef.current = null
          
          // Уведомляем родительский компонент о завершении resize
          if (onVirtualResizeChange) {
            onVirtualResizeChange(null, null)
          }
          
          renderStateRef.current.needsRender = true
        }
        
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'col-resize'
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        
        return
      } else if (resizeArea && handleResizeMouseDown) {
        // Fallback к старому способу если нет getColumnWidth/setColumnWidths
        event.preventDefault()
        event.stopPropagation()
        handleResizeMouseDown(event, resizeArea.columnIndex, resizeArea.span)
        return
      }
    },
    [scrollLeft, markerWidthValue, handleResizeMouseDown, getColumnWidth, setColumnWidths, orderedColumns, onVirtualResizeChange]
  )

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || !rendererRef.current) {
        return
      }

      const containerRect = containerRef.current.getBoundingClientRect()
      const relativeX = event.clientX - containerRect.left
      
      // Проверяем, что клик не на маркере строки
      if (relativeX < markerWidthValue) {
        return
      }

      const x = relativeX - markerWidthValue
      const y = event.clientY - containerRect.top
      
      // Используем абсолютные координаты с учетом scrollLeft
      const absoluteX = x + scrollLeft
      
      // Проверяем попадание в кликабельные области (но не resize handle)
      const resizeArea = rendererRef.current.getResizeAreaAt(absoluteX, y)
      if (resizeArea) {
        // Не обрабатываем клик, если это resize handle
        return
      }
      
      const clickableAreas = rendererRef.current.getClickableAreas()
      
      for (const area of clickableAreas) {
        const { rect, onClick } = area
        const isInside = (
          absoluteX >= rect.x &&
          absoluteX < rect.x + rect.width &&
          y >= rect.y &&
          y < rect.y + rect.height
        )
        
        if (isInside) {
          onClick()
          return
        }
      }
    },
    [scrollLeft, markerWidthValue]
  )

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || !rendererRef.current || !handleResizeDoubleClick) {
        return
      }

      const containerRect = containerRef.current.getBoundingClientRect()
      const relativeX = event.clientX - containerRect.left
      
      // Проверяем, что клик не на маркере строки
      if (relativeX < markerWidthValue) {
        return
      }

      const x = relativeX - markerWidthValue
      const y = event.clientY - containerRect.top
      
      // Используем абсолютные координаты с учетом scrollLeft
      const absoluteX = x + scrollLeft
      
      // Проверяем попадание в resize handle
      const resizeArea = rendererRef.current.getResizeAreaAt(absoluteX, y)
      if (resizeArea) {
        handleResizeDoubleClick(event as any, resizeArea.columnIndex, resizeArea.span)
      }
    },
    [scrollLeft, markerWidthValue, handleResizeDoubleClick]
  )

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        width: `${width + markerWidthValue}px`,
        height: `${height}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {showRowMarkers && (
        <div
          style={{
            width: `${markerWidthValue + 1}px`,
            height: `${height}px`,
            backgroundColor: '#f3f6fc',
            borderRight: '1px solid #e0e0e0',
            flexShrink: 0,
          }}
        />
      )}
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ 
            display: 'block',
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: `${width}px`,
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}


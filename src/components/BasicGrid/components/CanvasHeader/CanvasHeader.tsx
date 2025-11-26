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
}) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = canvasHeaderRef || internalCanvasRef
  const rendererRef = useRef<CanvasHeaderRenderer>(new CanvasHeaderRenderer())
  const containerRef = useRef<HTMLDivElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null)
  const markerWidthValue = showRowMarkers ? markerWidth : 0
  const { visibleIndices } = useHeaderVirtualization()

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

      if (canvasRef.current) {
        canvasRef.current.style.cursor = isCellHoverable(cell) ? 'pointer' : 'default'
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
      
      // Проверяем попадание в кликабельные области
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
      onClick={handleClick}
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


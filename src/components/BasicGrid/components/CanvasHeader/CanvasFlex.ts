import { CanvasButton } from './CanvasButton'
import { CanvasText } from './CanvasText'
import { CanvasIcon } from './CanvasIcon'
import { CanvasIconButton } from './CanvasIconButton'
import type { ButtonRect } from './CanvasButton'
import { RootFlexBox } from '../../miniflex'
import type { FlexStyle, Direction, Justify, Align } from '../../miniflex'

export type CanvasFlexChild = CanvasButton | CanvasText | CanvasIcon | CanvasIconButton

export interface FlexOptions {
  gap?: number
  columnGap?: number // Приоритет над gap для горизонтального gap
  rowGap?: number // Приоритет над gap для вертикального gap
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch'
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  wrap?: boolean // Перенос элементов на новую строку/колонку при нехватке места
  // Flex свойства для элементов (применяются ко всем детям)
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number
}

export class CanvasFlex {
  private ctx: CanvasRenderingContext2D | null = null
  private rect: ButtonRect
  private children: CanvasFlexChild[]
  private options: FlexOptions

  constructor(rect: ButtonRect, children: CanvasFlexChild[], options?: FlexOptions) {
    this.rect = rect
    this.children = children
    this.options = options || {}
  }

  setContext(ctx: CanvasRenderingContext2D | null, onIconLoad?: () => void): void {
    this.ctx = ctx
    for (const child of this.children) {
      if (child instanceof CanvasButton || child instanceof CanvasText) {
        child.setContext(ctx)
      } else if (child instanceof CanvasIconButton) {
        child.setContext(ctx, onIconLoad)
      } else if (child instanceof CanvasIcon) {
        child.setContext(ctx)
        // Если иконка еще загружается, подписываемся на загрузку
        if (onIconLoad && child.isLoading()) {
          child.setOnLoadCallback(onIconLoad)
        }
      }
    }
  }

  getRect(): ButtonRect {
    return { ...this.rect }
  }

  setRect(rect: ButtonRect): void {
    this.rect = rect
  }

  getChildren(): CanvasFlexChild[] {
    return [...this.children]
  }

  setChildren(children: CanvasFlexChild[]): void {
    this.children = children
  }

  getOptions(): FlexOptions {
    return { ...this.options }
  }

  setOptions(options: FlexOptions): void {
    this.options = { ...this.options, ...options }
  }

  private getPadding(): { top: number; right: number; bottom: number; left: number } {
    const padding = this.options.padding
    if (!padding) {
      return { top: 0, right: 0, bottom: 0, left: 0 }
    }
    if (typeof padding === 'number') {
      return { top: padding, right: padding, bottom: padding, left: padding }
    }
    return {
      top: padding.top ?? 0,
      right: padding.right ?? 0,
      bottom: padding.bottom ?? 0,
      left: padding.left ?? 0,
    }
  }

  private layoutChildren(): Array<{ child: CanvasFlexChild; rect: ButtonRect }> {
    const padding = this.getPadding()
    const contentX = this.rect.x + padding.left
    const contentY = this.rect.y + padding.top
    const contentWidth = this.rect.width - padding.left - padding.right
    const contentHeight = this.rect.height - padding.top - padding.bottom

    // Если wrap включен, используем старую логику (miniflex не поддерживает wrap)
    if (this.options.wrap) {
      return this.layoutChildrenWithWrap(contentX, contentY, contentWidth, contentHeight)
    }

    // Используем miniflex для вычисления layout
    return this.layoutChildrenWithMiniflex(contentX, contentY, contentWidth, contentHeight)
  }

  private layoutChildrenWithMiniflex(
    contentX: number,
    contentY: number,
    contentWidth: number,
    contentHeight: number
  ): Array<{ child: CanvasFlexChild; rect: ButtonRect }> {
    const {
      gap = 0,
      columnGap,
      rowGap,
      direction = 'row',
      justifyContent = 'flex-start',
      alignItems = 'flex-start',
      flexGrow = 0,
      flexShrink = 1,
      flexBasis = 0,
    } = this.options

    // Преобразуем direction в формат miniflex
    const miniflexDirection: Direction = direction === 'row' ? 'row' :
      direction === 'column' ? 'column' :
      direction === 'row-reverse' ? 'row-reverse' : 'column-reverse'

    // Преобразуем justifyContent в формат miniflex
    const miniflexJustify: Justify = justifyContent === 'space-around' ? 'space-around' :
      justifyContent === 'space-between' ? 'space-between' :
      justifyContent === 'space-evenly' ? 'space-evenly' :
      justifyContent === 'center' ? 'center' :
      justifyContent === 'flex-end' ? 'flex-end' : 'flex-start'

    // Преобразуем alignItems в формат miniflex
    const miniflexAlign: Align = alignItems === 'stretch' ? 'stretch' :
      alignItems === 'center' ? 'center' :
      alignItems === 'flex-end' ? 'flex-end' : 'flex-start'

    // Создаем RootFlexBox
    const rootFlexBox = new RootFlexBox(contentWidth, contentHeight, {
      direction: miniflexDirection,
      columnGap: columnGap ?? gap,
      rowGap: rowGap ?? gap,
      justifyContent: miniflexJustify,
      alignItems: miniflexAlign,
    })

    // Определяем главную и поперечную оси
    const isHorizontal = direction.startsWith('row')

    // Собираем размеры всех элементов и добавляем их в flexbox
    const childMetadata: Array<{ 
      child: CanvasFlexChild
      originalWidth: number
      originalHeight: number
      naturalMainSize: number
      naturalCrossSize: number
    }> = []
    
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i]
      let naturalWidth = 0
      let naturalHeight = 0

      if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
        const childRect = child.getRect()
        const childStyle = child.getStyle()
        naturalWidth = childRect.width
        naturalHeight = childStyle.height ?? childRect.height
      } else if (child instanceof CanvasText) {
        if (this.ctx) {
          const textStyle = child.getStyle()
          this.ctx.font = `${textStyle.fontWeight || 'normal'} ${textStyle.fontSize || 14}px ${textStyle.fontFamily || 'sans-serif'}`
          const textMetrics = this.ctx.measureText(child.getText())
          naturalWidth = textMetrics.width
          naturalHeight = textStyle.fontSize || 14
        }
      } else if (child instanceof CanvasIcon) {
        const bounds = child.getBounds()
        naturalWidth = bounds.width
        naturalHeight = bounds.height
      }

      // Вычисляем размеры для главной и поперечной осей
      const naturalMainSize = isHorizontal ? naturalWidth : naturalHeight
      const naturalCrossSize = isHorizontal ? naturalHeight : naturalWidth

      // Определяем flexBasis: если указан явно, используем его, иначе используем естественный размер по главной оси
      const basis = flexBasis !== 0 ? flexBasis : naturalMainSize

      // Создаем FlexStyle для элемента
      // Для главной оси: используем flexBasis, flexGrow, flexShrink
      // Для поперечной оси: используем явный размер, если он есть
      const flexStyle: Partial<FlexStyle> = {
        id: `child_${i}`,
        flexGrow,
        flexShrink,
        flexBasis: basis,
        metadata: { childIndex: i },
      }

      // Устанавливаем явные размеры для поперечной оси, если они не должны растягиваться
      if (alignItems !== 'stretch') {
        if (isHorizontal) {
          flexStyle.height = naturalCrossSize
        } else {
          flexStyle.width = naturalCrossSize
        }
      }

      // Если элемент имеет фиксированный размер по главной оси и не должен расти/сжиматься,
      // устанавливаем явный размер
      if (flexGrow === 0 && flexShrink === 0) {
        if (isHorizontal) {
          flexStyle.width = naturalMainSize
        } else {
          flexStyle.height = naturalMainSize
        }
      }

      // Добавляем элемент в flexbox
      rootFlexBox.addChild(flexStyle)
      childMetadata.push({ 
        child, 
        originalWidth: naturalWidth,
        originalHeight: naturalHeight,
        naturalMainSize,
        naturalCrossSize,
      })
    }

    // Вычисляем layout
    rootFlexBox.build()

    // Собираем результаты
    const layouts: Array<{ child: CanvasFlexChild; rect: ButtonRect }> = []
    
    for (let i = 0; i < rootFlexBox.children.length; i++) {
      const flexNode = rootFlexBox.children[i]
      const metadata = childMetadata[i]
      const { child, originalWidth, originalHeight } = metadata
      
      // Получаем позицию и размер из flexbox
      const flexX = flexNode.position.x
      const flexY = flexNode.position.y
      const flexWidth = flexNode.size.width
      const flexHeight = flexNode.size.height

      // Преобразуем в абсолютные координаты с учетом padding
      let finalRect: ButtonRect

      if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
        // Для кнопок используем размеры из flexbox
        // Если элемент растягивается по поперечной оси или имеет flexGrow, используем размеры из flexbox
        const useFlexWidth = flexGrow > 0 || alignItems === 'stretch' || flexWidth !== originalWidth
        const useFlexHeight = alignItems === 'stretch' || flexHeight !== originalHeight
        
        finalRect = {
          x: contentX + flexX,
          y: contentY + flexY,
          width: useFlexWidth ? Math.max(0, flexWidth) : originalWidth,
          height: useFlexHeight ? Math.max(0, flexHeight) : originalHeight,
        }
      } else if (child instanceof CanvasText) {
        // Для текста используем размеры из flexbox
        finalRect = {
          x: contentX + flexX,
          y: contentY + flexY,
          width: Math.max(0, flexWidth),
          height: Math.max(0, flexHeight),
        }
      } else if (child instanceof CanvasIcon) {
        // Для иконок используем размеры из flexbox
        finalRect = {
          x: contentX + flexX,
          y: contentY + flexY,
          width: Math.max(0, flexWidth),
          height: Math.max(0, flexHeight),
        }
      } else {
        continue
      }

      layouts.push({ child, rect: finalRect })
    }

    return layouts
  }

  private layoutChildrenWithWrap(
    contentX: number,
    contentY: number,
    contentWidth: number,
    contentHeight: number
  ): Array<{ child: CanvasFlexChild; rect: ButtonRect }> {
    const { gap = 0, direction = 'row', justifyContent = 'flex-start', alignItems = 'flex-start' } = this.options
    const layouts: Array<{ child: CanvasFlexChild; rect: ButtonRect }> = []

    if (direction === 'row') {
      // Горизонтальная раскладка
      const childRects: Array<{ child: CanvasFlexChild; width: number; height: number }> = []
      
      // Сначала собираем размеры всех элементов
      for (const child of this.children) {
        if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
          const childRect = child.getRect()
          const childStyle = child.getStyle()
          const childHeight = childStyle.height ?? childRect.height
          childRects.push({
            child,
            width: childRect.width,
            height: childHeight,
          })
        } else if (child instanceof CanvasText) {
          // Для текста измеряем ширину
          if (this.ctx) {
            const textStyle = child.getStyle()
            this.ctx.font = `${textStyle.fontWeight || 'normal'} ${textStyle.fontSize || 14}px ${textStyle.fontFamily || 'sans-serif'}`
            const textMetrics = this.ctx.measureText(child.getText())
            childRects.push({
              child,
              width: textMetrics.width,
              height: textStyle.fontSize || 14,
            })
          }
        } else if (child instanceof CanvasIcon) {
          const bounds = child.getBounds()
          childRects.push({
            child,
            width: bounds.width,
            height: bounds.height,
          })
        }
      }

      // Если включен wrap, разбиваем на строки
      if (this.options.wrap) {
        const rows: Array<Array<{ child: CanvasFlexChild; width: number; height: number }>> = []
        let currentRow: Array<{ child: CanvasFlexChild; width: number; height: number }> = []
        let currentRowWidth = 0

        for (const item of childRects) {
          const wouldFit = currentRow.length === 0 || 
            (currentRowWidth + gap + item.width <= contentWidth)
          
          if (wouldFit) {
            if (currentRow.length > 0) {
              currentRowWidth += gap
            }
            currentRow.push(item)
            currentRowWidth += item.width
          } else {
            // Переносим на новую строку
            if (currentRow.length > 0) {
              rows.push(currentRow)
            }
            currentRow = [item]
            currentRowWidth = item.width
          }
        }
        
        if (currentRow.length > 0) {
          rows.push(currentRow)
        }

        // Теперь раскладываем каждую строку
        const allLayouts: Array<{ child: CanvasFlexChild; rect: ButtonRect }> = []
        let currentY = contentY

        for (const row of rows) {
          const rowTotalWidth = row.reduce((sum, item) => sum + item.width, 0)
          const rowGapsWidth = gap * Math.max(0, row.length - 1)
          const rowAvailableWidth = contentWidth - rowTotalWidth - rowGapsWidth
          
          // Вычисляем высоту строки до использования
          const rowHeight = Math.max(...row.map(item => item.height))

          let currentX = contentX
          if (justifyContent === 'center') {
            currentX += rowAvailableWidth / 2
          } else if (justifyContent === 'flex-end') {
            currentX += rowAvailableWidth
          } else if (justifyContent === 'space-between' && row.length > 1) {
            currentX = contentX
            const spaceBetween = rowAvailableWidth / (row.length - 1)
            for (let i = 0; i < row.length; i++) {
              const { child, width, height } = row[i]
              let y = currentY
              if (alignItems === 'center') {
                y = currentY + (rowHeight - height) / 2
              } else if (alignItems === 'flex-end') {
                y = currentY + rowHeight - height
              }

              if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
                const childRect = child.getRect()
                const childStyle = child.getStyle()
                const childHeight = childStyle.height ?? childRect.height
                allLayouts.push({
                  child,
                  rect: {
                    x: currentX,
                    y: alignItems === 'stretch' ? currentY : y,
                    width: childRect.width,
                    height: alignItems === 'stretch' ? rowHeight : childHeight,
                  },
                })
              } else if (child instanceof CanvasText) {
                allLayouts.push({
                  child,
                  rect: {
                    x: currentX,
                    y: y,
                    width: width,
                    height: height,
                  },
                })
              } else if (child instanceof CanvasIcon) {
                allLayouts.push({
                  child,
                  rect: {
                    x: currentX,
                    y: y,
                    width: width,
                    height: height,
                  },
                })
              }

              currentX += width + (i < row.length - 1 ? gap + spaceBetween : 0)
            }
            
            currentY += rowHeight + gap
            continue
          } else if (justifyContent === 'space-around' && row.length > 0) {
            const spaceAround = rowAvailableWidth / (row.length * 2)
            currentX = contentX + spaceAround
          }

          // Раскладываем элементы строки
          for (let i = 0; i < row.length; i++) {
            const { child, width, height } = row[i]
            let y = currentY
            if (alignItems === 'center') {
              y = currentY + (rowHeight - height) / 2
            } else if (alignItems === 'flex-end') {
              y = currentY + rowHeight - height
            }

            if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
              const childRect = child.getRect()
              const childStyle = child.getStyle()
              const childHeight = childStyle.height ?? childRect.height
              allLayouts.push({
                child,
                rect: {
                  x: currentX,
                  y: alignItems === 'stretch' ? currentY : y,
                  width: childRect.width,
                  height: alignItems === 'stretch' ? rowHeight : childHeight,
                },
              })
            } else if (child instanceof CanvasText) {
              allLayouts.push({
                child,
                rect: {
                  x: currentX,
                  y: y,
                  width: width,
                  height: height,
                },
              })
            } else if (child instanceof CanvasIcon) {
              allLayouts.push({
                child,
                rect: {
                  x: currentX,
                  y: y,
                  width: width,
                  height: height,
                },
              })
            }

            currentX += width + gap
          }

          currentY += rowHeight + gap
        }

        return allLayouts
      }

      // Если wrap отключен, используем старую логику
      const totalWidth = childRects.reduce((sum, item) => sum + item.width, 0)
      const gapsWidth = gap * (this.children.length - 1)
      const availableWidth = contentWidth - totalWidth - gapsWidth

      let currentX = contentX
      if (justifyContent === 'center') {
        currentX += availableWidth / 2
      } else if (justifyContent === 'flex-end') {
        currentX += availableWidth
      } else if (justifyContent === 'space-between' && this.children.length > 1) {
        currentX = contentX
        const spaceBetween = availableWidth / (this.children.length - 1)
        for (let i = 0; i < childRects.length; i++) {
          const { child, width, height } = childRects[i]
          let y = contentY
          if (alignItems === 'center') {
            y = contentY + (contentHeight - height) / 2
          } else if (alignItems === 'flex-end') {
            y = contentY + contentHeight - height
          } else if (alignItems === 'stretch') {
            // Для stretch используем полную высоту
          }

          if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
            const childRect = child.getRect()
            const childStyle = child.getStyle()
            const childHeight = childStyle.height ?? childRect.height
            layouts.push({
              child,
              rect: {
                x: currentX,
                y: alignItems === 'stretch' ? contentY : y,
                width: childRect.width,
                height: alignItems === 'stretch' ? contentHeight : childHeight,
              },
            })
          } else if (child instanceof CanvasText) {
            layouts.push({
              child,
              rect: {
                x: currentX,
                y: y,
                width: width,
                height: height,
              },
            })
          } else if (child instanceof CanvasIcon) {
            layouts.push({
              child,
              rect: {
                x: currentX,
                y: y,
                width: width,
                height: height,
              },
            })
          }

          currentX += width + (i < childRects.length - 1 ? gap + spaceBetween : 0)
        }
        return layouts
      }
      
      if (justifyContent === 'space-around' && this.children.length > 0) {
        const spaceAround = availableWidth / (this.children.length * 2)
        currentX = contentX + spaceAround
      }

      for (let i = 0; i < childRects.length; i++) {
        const { child, width, height } = childRects[i]
        let y = contentY
        if (alignItems === 'center') {
          y = contentY + (contentHeight - height) / 2
        } else if (alignItems === 'flex-end') {
          y = contentY + contentHeight - height
        } else if (alignItems === 'stretch') {
          // Для stretch используем полную высоту
        }

        if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
          const childRect = child.getRect()
          const childStyle = child.getStyle()
          const childHeight = childStyle.height ?? childRect.height
          layouts.push({
            child,
            rect: {
              x: currentX,
              y: alignItems === 'stretch' ? contentY : y,
              width: childRect.width,
              height: alignItems === 'stretch' ? contentHeight : childHeight,
            },
          })
        } else if (child instanceof CanvasText) {
          layouts.push({
            child,
            rect: {
              x: currentX,
              y: y,
              width: width,
              height: height,
            },
          })
        } else if (child instanceof CanvasIcon) {
          layouts.push({
            child,
            rect: {
              x: currentX,
              y: y,
              width: width,
              height: height,
            },
          })
        }

        currentX += width + gap
      }
    } else {
      // Вертикальная раскладка (column)
      const childRects: Array<{ child: CanvasFlexChild; width: number; height: number }> = []
      let totalHeight = 0

      for (const child of this.children) {
        if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
          const childRect = child.getRect()
          const childStyle = child.getStyle()
          const childHeight = childStyle.height ?? childRect.height
          childRects.push({
            child,
            width: childRect.width,
            height: childHeight,
          })
          totalHeight += childHeight
        } else if (child instanceof CanvasText) {
          const textStyle = child.getStyle()
          childRects.push({
            child,
            width: contentWidth,
            height: textStyle.fontSize || 14,
          })
          totalHeight += textStyle.fontSize || 14
        } else if (child instanceof CanvasIcon) {
          const bounds = child.getBounds()
          childRects.push({
            child,
            width: bounds.width,
            height: bounds.height,
          })
          totalHeight += bounds.height
        }
      }

      const gapsHeight = gap * (this.children.length - 1)
      const availableHeight = contentHeight - totalHeight - gapsHeight

      let currentY = contentY
      if (justifyContent === 'center') {
        currentY += availableHeight / 2
      } else if (justifyContent === 'flex-end') {
        currentY += availableHeight
      } else if (justifyContent === 'space-between' && this.children.length > 1) {
        currentY = contentY
        const spaceBetween = availableHeight / (this.children.length - 1)
        for (let i = 0; i < childRects.length; i++) {
          const { child, width, height } = childRects[i]
          let x = contentX
          if (alignItems === 'center') {
            x = contentX + (contentWidth - width) / 2
          } else if (alignItems === 'flex-end') {
            x = contentX + contentWidth - width
          }

          if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
            const childRect = child.getRect()
            layouts.push({
              child,
              rect: {
                x: alignItems === 'stretch' ? contentX : x,
                y: currentY,
                width: alignItems === 'stretch' ? contentWidth : childRect.width,
                height: height,
              },
            })
          } else if (child instanceof CanvasText) {
            layouts.push({
              child,
              rect: {
                x: x,
                y: currentY,
                width: width,
                height: height,
              },
            })
          } else if (child instanceof CanvasIcon) {
            layouts.push({
              child,
              rect: {
                x: x,
                y: currentY,
                width: width,
                height: height,
              },
            })
          }

          currentY += height + (i < childRects.length - 1 ? gap + spaceBetween : 0)
        }
        return layouts
      }
      
      if (justifyContent === 'space-around' && this.children.length > 0) {
        const spaceAround = availableHeight / (this.children.length * 2)
        currentY = contentY + spaceAround
      }

      for (let i = 0; i < childRects.length; i++) {
        const { child, width, height } = childRects[i]
        let x = contentX
        if (alignItems === 'center') {
          x = contentX + (contentWidth - width) / 2
        } else if (alignItems === 'flex-end') {
          x = contentX + contentWidth - width
        }

        if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
          const childRect = child.getRect()
          layouts.push({
            child,
            rect: {
              x: alignItems === 'stretch' ? contentX : x,
              y: currentY,
              width: alignItems === 'stretch' ? contentWidth : childRect.width,
              height: height,
            },
          })
        } else if (child instanceof CanvasText) {
          layouts.push({
            child,
            rect: {
              x: x,
              y: currentY,
              width: width,
              height: height,
            },
          })
        } else if (child instanceof CanvasIcon) {
          layouts.push({
            child,
            rect: {
              x: x,
              y: currentY,
              width: width,
              height: height,
            },
          })
        }

        currentY += height + gap
      }
    }

    return layouts
  }

  updateMousePosition(mouseX: number, mouseY: number): void {
    const layouts = this.layoutChildren()
    for (const { child, rect } of layouts) {
      if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
        // Временно обновляем rect кнопки для правильной проверки hover
        const originalRect = child.getRect()
        child.setRect(rect)
        child.updateMousePosition(mouseX, mouseY)
        child.setRect(originalRect) // Восстанавливаем оригинальный rect
      }
      // CanvasIcon и CanvasText не требуют обработки hover через updateMousePosition
    }
  }

  getLayouts(): Array<{ child: CanvasFlexChild; rect: ButtonRect }> {
    return this.layoutChildren()
  }

  draw(): void {
    if (!this.ctx) {
      return
    }

    const layouts = this.layoutChildren()
    for (const { child, rect } of layouts) {
      if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
        const originalRect = child.getRect()
        // Обновляем rect кнопки с учетом новой позиции
        child.setRect({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        })
        child.draw()
        child.setRect(originalRect) // Восстанавливаем оригинальный rect
      } else if (child instanceof CanvasText) {
        const originalPosition = child.getPosition()
        const originalText = child.getText()
        
        // Обрезаем текст, если он не помещается в доступную ширину
        if (this.ctx && rect.width > 0) {
          const textStyle = child.getStyle()
          this.ctx.font = `${textStyle.fontWeight || 'normal'} ${textStyle.fontSize || 14}px ${textStyle.fontFamily || 'sans-serif'}`
          const textMetrics = this.ctx.measureText(originalText)
          
          if (textMetrics.width > rect.width) {
            // Текст не помещается, обрезаем его
            let truncatedText = originalText
            while (this.ctx.measureText(truncatedText + '...').width > rect.width && truncatedText.length > 0) {
              truncatedText = truncatedText.slice(0, -1)
            }
            if (truncatedText.length < originalText.length) {
              truncatedText += '...'
            }
            child.setText(truncatedText)
          }
        }
        
        child.setPosition({ x: rect.x, y: rect.y + rect.height / 2 })
        child.draw()
        child.setPosition(originalPosition) // Восстанавливаем оригинальную позицию
        child.setText(originalText) // Восстанавливаем оригинальный текст
      } else if (child instanceof CanvasIcon) {
        const originalPosition = child.getPosition()
        const originalStyle = child.getStyle()
        
        // Устанавливаем позицию и стиль для иконки
        // Используем центрирование относительно rect
        child.setPosition({
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        })
        child.setStyle({
          ...originalStyle,
          width: rect.width,
          height: rect.height,
          horizontalAlign: 'center',
          verticalAlign: 'center',
        })
        
        // Используем синхронную версию, если изображение уже загружено
        const drawn = child.drawSync()
        // Если не нарисовано, вызываем асинхронную версию
        if (!drawn) {
          child.draw()
        }
        
        child.setPosition(originalPosition)
        child.setStyle(originalStyle)
      }
      // CanvasIconButton обрабатывается в первом условии вместе с CanvasButton
    }
  }

  getClickableAreas(): Array<{ rect: ButtonRect; onClick: () => void }> {
    const layouts = this.layoutChildren()
    const clickableAreas: Array<{ rect: ButtonRect; onClick: () => void }> = []

    for (const { child, rect } of layouts) {
      if (child instanceof CanvasButton || child instanceof CanvasIconButton) {
        // Временно обновляем rect кнопки для получения правильной кликабельной области
        const originalRect = child.getRect()
        child.setRect(rect)
        const clickableArea = child.getClickableArea()
        if (clickableArea) {
          clickableAreas.push(clickableArea)
        }
        child.setRect(originalRect) // Восстанавливаем оригинальный rect
      }
    }

    return clickableAreas
  }
}


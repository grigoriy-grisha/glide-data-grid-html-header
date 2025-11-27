// Глобальный кеш для загруженных SVG изображений
const svgImageCache = new Map<string, HTMLImageElement>()

function processSvg(svgString: string, color?: string): string {
  let processedSvg = svgString
  if (color) {
    processedSvg = processedSvg.replace(/fill="currentColor"/gi, `fill="${color}"`)
    processedSvg = processedSvg.replace(/fill='currentColor'/gi, `fill="${color}"`)
    
    // Обрабатываем path элементы без fill
    processedSvg = processedSvg.replace(
      /<path([^>]*?)>/gi,
      (match, attrs) => {
        if (!match.includes('fill=')) {
          const hasSlash = attrs.trim().endsWith('/')
          if (hasSlash) {
            return `<path${attrs.substring(0, attrs.length - 1)} fill="${color}"/>`
          } else {
            return `<path${attrs} fill="${color}">`
          }
        }
        return match
      }
    )
  }
  return processedSvg
}

function loadSvgImage(svgString: string, color?: string): Promise<HTMLImageElement> {
  // Обрабатываем SVG для замены цвета
  const processedSvg = processSvg(svgString, color)

  // Создаем ключ для кеша
  const cacheKey = `${processedSvg}`
  
  // Проверяем кеш
  const cached = svgImageCache.get(cacheKey)
  if (cached) {
    return Promise.resolve(cached)
  }

  // Загружаем новое изображение
  return new Promise((resolve, reject) => {
    try {
      const svgBlob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        // Сохраняем в кеш
        svgImageCache.set(cacheKey, img)
        resolve(img)
      }
      img.onerror = (error) => {
        URL.revokeObjectURL(url)
        console.error('Failed to load SVG icon:', error, svgString.substring(0, 100))
        reject(error)
      }

      img.src = url
    } catch (error) {
      console.error('Error processing SVG icon:', error)
      reject(error)
    }
  })
}

export interface IconPosition {
  x: number
  y: number
}

export interface IconStyle {
  width?: number
  height?: number
  color?: string // Цвет для заполнения SVG (fill)
  opacity?: number
  horizontalAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'center' | 'bottom'
}

export class CanvasIcon {
  private ctx: CanvasRenderingContext2D | null = null
  private position: IconPosition
  private svg: string | null = null
  private image: HTMLImageElement | null = null
  private style: IconStyle
  private loadPromise: Promise<void> | null = null
  private onLoadCallback: (() => void) | null = null

  constructor(position: IconPosition, svg: string, style?: IconStyle) {
    this.position = position
    this.svg = svg
    this.style = style || {}
    // Начинаем загрузку сразу
    this.startLoad()
  }

  setContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx
    // Если изображение еще не загружено, начинаем загрузку
    if (!this.image && !this.loadPromise && this.svg) {
      this.startLoad()
    }
  }

  // Устанавливает колбэк, который будет вызван после загрузки изображения
  setOnLoadCallback(callback: (() => void) | null): void {
    this.onLoadCallback = callback
  }

  getPosition(): IconPosition {
    return { ...this.position }
  }

  setPosition(position: IconPosition): void {
    this.position = position
  }

  getStyle(): IconStyle {
    return { ...this.style }
  }

  setStyle(style: IconStyle): void {
    this.style = { ...this.style, ...style }
    // Перезагружаем если изменился цвет
    if (style.color !== undefined) {
      this.image = null
      this.loadPromise = null
      this.startLoad()
    }
  }

  getSvg(): string | null {
    return this.svg
  }

  setSvg(svg: string): void {
    this.svg = svg
    this.image = null
    this.loadPromise = null
    this.startLoad()
  }

  private startLoad(): void {
    if (!this.svg || this.image || this.loadPromise) {
      return
    }

    this.loadPromise = loadSvgImage(this.svg, this.style.color)
      .then((img) => {
        this.image = img
        this.loadPromise = null
        // Вызываем callback после загрузки для перерисовки
        if (this.onLoadCallback) {
          this.onLoadCallback()
        }
      })
      .catch((error) => {
        console.error('Error loading SVG:', error, this.svg)
        this.loadPromise = null
      })
  }

  // Проверяет, загружено ли изображение (для отладки)
  isLoaded(): boolean {
    return this.image !== null
  }

  // Проверяет, загружается ли изображение
  isLoading(): boolean {
    return this.loadPromise !== null
  }

  draw(): void {
    if (!this.ctx || !this.svg) {
      return
    }

    // Если изображение еще не загружено, пытаемся начать загрузку
    if (!this.image) {
      if (!this.loadPromise) {
        this.startLoad()
      }
      // После начала загрузки пытаемся получить из кеша
      // Если в кеше уже есть, используем его
      loadSvgImage(this.svg, this.style.color)
        .then((img) => {
          this.image = img
          // После загрузки пытаемся перерисовать
          // Но это не сработает, т.к. мы не можем перерисовать canvas отсюда
          // Поэтому просто сохраняем изображение
        })
        .catch(() => {
          // Игнорируем ошибки
        })
      return
    }

    this.drawImage()
  }

  private drawImage(): void {
    if (!this.ctx || !this.image) {
      return
    }

    const {
      width = 16,
      height = 16,
      opacity = 1,
      horizontalAlign = 'left',
      verticalAlign = 'center',
    } = this.style

    // Вычисляем позицию для отрисовки
    let x = this.position.x
    let y = this.position.y

    if (horizontalAlign === 'center') {
      x = this.position.x - width / 2
    } else if (horizontalAlign === 'right') {
      x = this.position.x - width
    }

    if (verticalAlign === 'center') {
      y = this.position.y - height / 2
    } else if (verticalAlign === 'bottom') {
      y = this.position.y - height
    }

    const roundedX = Math.round(x)
    const roundedY = Math.round(y)

    // Сохраняем текущее состояние контекста
    this.ctx.save()

    // Применяем opacity
    this.ctx.globalAlpha = opacity

    // Рисуем изображение
    try {
      this.ctx.drawImage(this.image, roundedX, roundedY, width, height)
    } catch (error) {
      console.error('Error drawing icon:', error)
    }

    // Восстанавливаем состояние контекста
    this.ctx.restore()
  }

  // Синхронная версия draw (если изображение уже загружено)
  drawSync(): boolean {
    if (!this.ctx || !this.svg) {
      return false
    }

    // Если изображение уже загружено, рисуем сразу
    if (this.image) {
      this.drawImage()
      return true
    }

    // Пытаемся получить из кеша синхронно (если уже загружено ранее)
    const cacheKey = `${this.processedSvg()}`
    const cached = svgImageCache.get(cacheKey)
    if (cached) {
      this.image = cached
      this.drawImage()
      return true
    }

    // Если нет в кеше, начинаем загрузку для следующего кадра
    if (!this.loadPromise) {
      this.startLoad()
    }
    return false
  }

  private processedSvg(): string {
    if (!this.svg) return ''
    return processSvg(this.svg, this.style.color)
  }

  // Метод для предзагрузки SVG (можно вызвать заранее)
  preload(): Promise<void> {
    if (this.image) {
      return Promise.resolve()
    }
    if (!this.loadPromise) {
      this.startLoad()
    }
    return this.loadPromise || Promise.resolve()
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    const {
      width = 16,
      height = 16,
      horizontalAlign = 'left',
      verticalAlign = 'center',
    } = this.style

    let x = this.position.x
    let y = this.position.y

    if (horizontalAlign === 'center') {
      x = this.position.x - width / 2
    } else if (horizontalAlign === 'right') {
      x = this.position.x - width
    }

    if (verticalAlign === 'center') {
      y = this.position.y - height / 2
    } else if (verticalAlign === 'bottom') {
      y = this.position.y - height
    }

    return {
      x: Math.round(x),
      y: Math.round(y),
      width,
      height,
    }
  }
}

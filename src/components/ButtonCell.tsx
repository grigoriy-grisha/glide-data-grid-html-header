import { useRef, useEffect } from 'react'

interface ButtonCellProps {
  icon?: HTMLImageElement | null // Предзагруженное изображение иконки
  text?: string // Текст кнопки
  progress?: number // Прогресс ховера (0-1)
  width?: number
  height?: number
  x?: number
  y?: number
  ctx: CanvasRenderingContext2D
}

// Функция для интерполяции цветов
const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')
  
  const r1 = parseInt(hex1.substring(0, 2), 16)
  const g1 = parseInt(hex1.substring(2, 4), 16)
  const b1 = parseInt(hex1.substring(4, 6), 16)
  
  const r2 = parseInt(hex2.substring(0, 2), 16)
  const g2 = parseInt(hex2.substring(2, 4), 16)
  const b2 = parseInt(hex2.substring(4, 6), 16)
  
  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)
  
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')}`
}

export const drawButtonCell = ({
  icon,
  text,
  progress = 0,
  width = 140,
  height = 32,
  x = 0,
  y = 0,
  ctx,
}: ButtonCellProps) => {
  // Сохраняем состояние контекста
  ctx.save()
  
  // Интерполяция цветов
  const startColor1 = '#1b5e20'
  const startColor2 = '#2e7d32'
  const hoverColor1 = '#3949ab'
  const hoverColor2 = '#5c6bc0'
  
  const color1 = interpolateColor(startColor1, hoverColor1, progress)
  const color2 = interpolateColor(startColor2, hoverColor2, progress)
  
  const radius = 8
  
  // Градиентный фон кнопки
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(0.5, progress > 0.5 ? hoverColor1 : startColor1)
  gradient.addColorStop(1, color2)
  
  // Рисуем скругленный прямоугольник с градиентом
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.fill()
  
  // Тень при ховере
  if (progress > 0) {
    ctx.shadowColor = `rgba(102, 126, 234, ${0.3 * progress})`
    ctx.shadowBlur = 10 * progress
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 4 * progress
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }
  
  // Серая граница
  ctx.strokeStyle = '#666666'
  ctx.lineWidth = 1.5
  ctx.stroke()
  
  // Центрируем содержимое
  const centerX = x + width / 2
  const centerY = y + height / 2
  const iconSize = 16
  
  // Если есть иконка и она загружена, рисуем её
  if (icon && icon.complete) {
    let iconX: number
    let iconY = centerY - iconSize / 2
    
    if (text) {
      // Если есть текст, иконка слева от центра
      ctx.font = `bold ${13 + progress * 2}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      const textWidth = ctx.measureText(text).width
      iconX = centerX - textWidth / 2 - iconSize - 8
    } else {
      // Если только иконка, она по центру
      iconX = centerX - iconSize / 2
    }
    
    ctx.drawImage(icon, iconX, iconY, iconSize, iconSize)
  }
  
  // Если есть текст, рисуем его
  if (text) {
    const fontSize = 13 + progress * 2
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Тень для текста при ховере
    if (progress > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 2 * progress
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 1 * progress
    }
    
    // Позиция текста: по центру, или справа от иконки если она есть
    const textX = icon && icon.complete ? centerX + iconSize / 2 + 4 : centerX
    ctx.fillText(text, textX, centerY)
    
    // Сброс тени
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }
  
  // Восстанавливаем состояние контекста
  ctx.restore()
}

// Хук для предзагрузки иконки
export const useButtonIcon = (icon?: string) => {
  const iconRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (icon && !iconRef.current) {
      const svg = icon
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        iconRef.current = img
        URL.revokeObjectURL(url)
      }
      img.src = url
    }
  }, [icon])

  return iconRef
}


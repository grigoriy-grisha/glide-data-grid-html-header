# GridHeaderCanvas - Гибридный Canvas + HTML Header

## Описание

`GridHeaderCanvas` - это гибридная реализация хедера, которая сочетает:
- **Canvas** для фона, границ и базового рендеринга (производительность)
- **HTML overlay** для интерактивных элементов (чекбоксы, иконки, кастомный контент)

## Преимущества

1. ✅ **Производительность** - Canvas эффективно рисует фон и границы
2. ✅ **Гибкость** - HTML overlay поддерживает React-компоненты и кастомный контент
3. ✅ **Интерактивность** - Полная поддержка всех событий (клики, ховеры, drag & drop)
4. ✅ **Кастомизация** - Легко добавлять иконки, менять цвета, стили

## Использование

```tsx
import { GridHeaderCanvas } from './components/GridHeaderCanvas'

// Создание кастомных иконок
const customIcons = new Map([
  ['column-id-1', { 
    icon: 'path/to/icon.svg', 
    position: 'left' 
  }],
  ['column-id-2', { 
    icon: <MyIconComponent />, 
    position: 'right' 
  }]
])

// Использование в BasicGrid
<GridHeaderCanvas
  // ... все стандартные пропсы GridHeader
  headerColors={['#e3f2fd', '#f5f5f5', '#fafafa']}
  headerTextColors={['#1565c0', '#333333', '#666666']}
  headerFontSizes={[14, 13, 12]}
  customIcons={customIcons}
  onCellHover={(cellIndex, isHovered) => {
    console.log(`Cell ${cellIndex} hovered: ${isHovered}`)
  }}
/>
```

## Кастомизация

### Цвета и стили
- `headerColors` - массив цветов фона для каждого уровня
- `headerTextColors` - массив цветов текста для каждого уровня
- `headerFontSizes` - массив размеров шрифта для каждого уровня

### Иконки
- `customIcons` - Map с иконками для колонок
  - Ключ: `columnId`
  - Значение: `{ icon: string | ReactNode, position?: 'left' | 'right' }`

### Ховеры
- `onCellHover` - callback при наведении на ячейку
  - `(cellIndex: number, isHovered: boolean) => void`

## Архитектура

```
┌─────────────────────────────────────┐
│  Canvas Layer (фон, границы)        │
│  - Рисует структуру                 │
│  - Обрабатывает базовые события     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  HTML Overlay (интерактивные)       │
│  - Чекбоксы                         │
│  - Иконки                           │
│  - Кастомный контент                │
│  - Resize handles                   │
└─────────────────────────────────────┘
```

## Сравнение с GridHeader

| Функция | GridHeader (HTML) | GridHeaderCanvas (Hybrid) |
|---------|-------------------|---------------------------|
| Производительность | Средняя | Высокая |
| Кастомный контент | ✅ Полная поддержка | ✅ Полная поддержка |
| Иконки | ✅ Через React | ✅ Через React или URL |
| Ховеры | ✅ CSS | ✅ Canvas + HTML |
| Drag & Drop | ✅ | ✅ |
| Ресайз | ✅ | ✅ |
| Чекбоксы | ✅ | ✅ |


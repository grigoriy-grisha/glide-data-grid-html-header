import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, Canvas } from '../components'
import type { BadgeView, BadgeSize } from '../components/BasicGrid/lib/canvas'

const BADGE_VIEWS: BadgeView[] = [
  'default',
  'accent',
  'positive',
  'warning',
  'negative',
  'dark',
  'light',
]

const BADGE_SIZES: BadgeSize[] = ['xs', 's', 'm', 'l']

interface BadgeRow {
  id: string
  size: BadgeSize
  label: string
  transparent: boolean
  clear: boolean
  [key: string]: unknown
}

// Generate rows for the grid
function generateBadgeRows(): BadgeRow[] {
  const rows: BadgeRow[] = []
  
  // Solid badges (normal mode)
  BADGE_SIZES.forEach((size) => {
    rows.push({
      id: `size-${size}`,
      size,
      label: size.toUpperCase(),
      transparent: false,
      clear: false,
    })
  })
  
  // Transparent badges
  rows.push({
    id: 'transparent',
    size: 'm',
    label: 'Transparent',
    transparent: true,
    clear: false,
  })
  
  // Clear badges (no background)
  rows.push({
    id: 'clear',
    size: 'm',
    label: 'Clear',
    transparent: false,
    clear: true,
  })
  
  return rows
}

// Create columns dynamically for each view
function createBadgeColumns(): BasicGridColumn<BadgeRow>[] {
  const columns: BasicGridColumn<BadgeRow>[] = [
    createColumn<BadgeRow>('label', 'string', 'Size / View', { width: 80, grow: 0 }),
  ]

  BADGE_VIEWS.forEach((view) => {
    columns.push({
      title: view.charAt(0).toUpperCase() + view.slice(1),
      dataType: 'string',
      width: 60,
      grow: 1, // Stretch to fill available width
      renderCellContent: (row) => (
        <Canvas.Container
          direction="row"
          alignItems="center"
          justifyContent="center"
        >
          <Canvas.Badge
            text="Бейдж"
            view={view}
            size={row.size}
            transparent={row.transparent}
            clear={row.clear}
          />
        </Canvas.Container>
      ),
    })
  })

  return columns
}

export function CanvasBadgesExample() {
  const rows = useMemo(() => generateBadgeRows(), [])
  const columns = useMemo(() => createBadgeColumns(), [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Canvas Badges</h2>
      <p className="section-description">
        Демонстрация всех вариантов бейджей (view) и размеров (size) на основе темы sdds_finai__light.
        Варианты: default, accent, positive, warning, negative, dark, light.
        Размеры: xs, s, m, l.
        Режимы: solid (обычный), transparent (полупрозрачный фон), clear (без фона).
      </p>
      <BasicGrid<BadgeRow>
        columns={columns}
        rows={rows}
        height={400}
        headerRowHeight={44}
        rowHeight={64}
        showRowMarkers={false}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


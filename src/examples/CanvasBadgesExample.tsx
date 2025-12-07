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

// SVG icons for demonstration
const CHECK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'

const CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'

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
      grow: 1,
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

// Badges with icons example
interface BadgeWithIconsRow {
  id: string
  type: 'leftIcon' | 'rightIcon' | 'bothIcons' | 'noIcons'
  label: string
  [key: string]: unknown
}

function generateBadgeWithIconsRows(): BadgeWithIconsRow[] {
  return [
    { id: 'left', type: 'leftIcon', label: 'Left Icon' },
    { id: 'right', type: 'rightIcon', label: 'Right Icon' },
    { id: 'both', type: 'bothIcons', label: 'Both Icons' },
    { id: 'none', type: 'noIcons', label: 'No Icons' },
  ]
}

function createBadgeWithIconsColumns(): BasicGridColumn<BadgeWithIconsRow>[] {
  const columns: BasicGridColumn<BadgeWithIconsRow>[] = [
    createColumn<BadgeWithIconsRow>('label', 'string', 'Type', { width: 100, grow: 0 }),
  ]

  BADGE_VIEWS.forEach((view) => {
    columns.push({
      title: view.charAt(0).toUpperCase() + view.slice(1),
      dataType: 'string',
      width: 100,
      grow: 1,
      renderCellContent: (row) => {
        const leftIcon = row.type === 'leftIcon' || row.type === 'bothIcons' ? CHECK_ICON : undefined
        const rightIcon = row.type === 'rightIcon' || row.type === 'bothIcons' ? CLOSE_ICON : undefined

        return (
          <Canvas.Container
            direction="row"
            alignItems="center"
            justifyContent="center"
          >
            <Canvas.Badge
              text="Status"
              view={view}
              size="m"
              leftIcon={leftIcon}
              rightIcon={rightIcon}
            />
          </Canvas.Container>
        )
      },
    })
  })

  return columns
}

export function CanvasBadgesExample() {
  const rows = useMemo(() => generateBadgeRows(), [])
  const columns = useMemo(() => createBadgeColumns(), [])

  const badgeWithIconsRows = useMemo(() => generateBadgeWithIconsRows(), [])
  const badgeWithIconsColumns = useMemo(() => createBadgeWithIconsColumns(), [])

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

      <h2 className="section-title" style={{ marginTop: 32 }}>Badges with Icons</h2>
      <p className="section-description">
        Бейджи с иконками слева, справа или с обеих сторон. Отступ между текстом и иконкой — 6px.
      </p>
      <BasicGrid<BadgeWithIconsRow>
        columns={badgeWithIconsColumns}
        rows={badgeWithIconsRows}
        height={300}
        headerRowHeight={44}
        rowHeight={56}
        showRowMarkers={false}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


import { useMemo } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, Canvas } from '../components'
import type { ButtonView, ButtonSize } from '../components/BasicGrid/lib/canvas'

const BUTTON_VIEWS: ButtonView[] = [
  'default',
  'primary',
  'accent',
  'secondary',
  'clear',
  'success',
  'warning',
  'critical',
  'dark',
  'black',
  'white',
]

const BUTTON_SIZES: ButtonSize[] = ['xs', 's', 'm', 'l']

// SVG icon for demonstration
const CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'

interface IconButtonRow {
  id: string
  size: ButtonSize
  label: string
  disabled: boolean
  [key: string]: unknown
}

// Generate rows for the grid
function generateIconButtonRows(): IconButtonRow[] {
  const rows: IconButtonRow[] = []
  
  BUTTON_SIZES.forEach((size) => {
    rows.push({
      id: `size-${size}`,
      size,
      label: size.toUpperCase(),
      disabled: false,
    })
  })
  
  // Add disabled row
  rows.push({
    id: 'disabled',
    size: 's',
    label: 'Disabled',
    disabled: true,
  })
  
  return rows
}

// Create columns dynamically for each view
function createIconButtonColumns(): BasicGridColumn<IconButtonRow>[] {
  const columns: BasicGridColumn<IconButtonRow>[] = [
    createColumn<IconButtonRow>('label', 'string', 'Size / View', { width: 70, grow: 0 }),
  ]

  BUTTON_VIEWS.forEach((view) => {
    columns.push({
      title: view.charAt(0).toUpperCase() + view.slice(1),
      dataType: 'string',
      width: 40,
      grow: 1, // Stretch to fill available width
      renderCellContent: (row) => (
        <Canvas.Container
          direction="row"
          alignItems="center"
          justifyContent="center"
        >
          <Canvas.IconButton
            icon={CLOSE_ICON}
            view={view}
            buttonSize={row.size}
            disabled={row.disabled}
            onClick={() => console.log(`Clicked: ${view} ${row.size}`)}
          />
        </Canvas.Container>
      ),
    })
  })

  return columns
}

export function CanvasIconButtonsExample() {
  const rows = useMemo(() => generateIconButtonRows(), [])
  const columns = useMemo(() => createIconButtonColumns(), [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Canvas Icon Buttons</h2>
      <p className="section-description">
        Демонстрация всех вариантов иконочных кнопок (view) и размеров (size) на основе темы sdds_finai__light.
        Варианты: default, primary, accent, secondary, clear, success, warning, critical, dark, black, white.
        Размеры: xs, s, m, l.
      </p>
      <BasicGrid<IconButtonRow>
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


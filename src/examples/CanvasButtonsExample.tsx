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

interface ButtonRow {
  id: string
  size: ButtonSize
  label: string
  disabled: boolean
  [key: string]: unknown
}

// Generate rows for the grid
function generateButtonRows(): ButtonRow[] {
  const rows: ButtonRow[] = []
  
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
function createButtonColumns(): BasicGridColumn<ButtonRow>[] {
  const columns: BasicGridColumn<ButtonRow>[] = [
    createColumn<ButtonRow>('label', 'string', 'Size / View', { width: 70, grow: 0 }),
  ]

  BUTTON_VIEWS.forEach((view) => {
    columns.push({
      title: view.charAt(0).toUpperCase() + view.slice(1),
      dataType: 'string',
      width: 50,
      grow: 1, // Stretch to fill available width
      renderCellContent: (row) => (
        <Canvas.Container
          direction="row"
          alignItems="center"
          justifyContent="center"
        >
          <Canvas.Button
            view={view}
            size={row.size}
            disabled={row.disabled}
            onClick={() => console.log(`Clicked: ${view} ${row.size}`)}
          >
            Кнопка
          </Canvas.Button>
        </Canvas.Container>
      ),
    })
  })

  return columns
}

export function CanvasButtonsExample() {
  const rows = useMemo(() => generateButtonRows(), [])
  const columns = useMemo(() => createButtonColumns(), [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Canvas Buttons</h2>
      <p className="section-description">
        Демонстрация всех вариантов кнопок (view) и размеров (size) на основе темы sdds_finai__light.
        Варианты: default, primary, accent, secondary, clear, success, warning, critical, dark, black, white.
        Размеры: xs, s, m, l.
      </p>
      <BasicGrid<ButtonRow>
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


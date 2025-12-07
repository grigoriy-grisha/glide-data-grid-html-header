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

// SVG icons for demonstration
const CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'

const PLUS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>'

const ARROW_RIGHT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>'

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
      grow: 1,
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

// Buttons with icons example
interface ButtonWithIconsRow {
  id: string
  type: 'leftIcon' | 'rightIcon' | 'bothIcons' | 'noIcons'
  label: string
  [key: string]: unknown
}

function generateButtonWithIconsRows(): ButtonWithIconsRow[] {
  return [
    { id: 'left', type: 'leftIcon', label: 'Left Icon' },
    { id: 'right', type: 'rightIcon', label: 'Right Icon' },
    { id: 'both', type: 'bothIcons', label: 'Both Icons' },
    { id: 'none', type: 'noIcons', label: 'No Icons' },
  ]
}

function createButtonWithIconsColumns(): BasicGridColumn<ButtonWithIconsRow>[] {
  const columns: BasicGridColumn<ButtonWithIconsRow>[] = [
    createColumn<ButtonWithIconsRow>('label', 'string', 'Type', { width: 100, grow: 0 }),
  ]

  const selectedViews: ButtonView[] = ['accent', 'secondary', 'success', 'warning', 'critical']
  
  selectedViews.forEach((view) => {
    columns.push({
      title: view.charAt(0).toUpperCase() + view.slice(1),
      dataType: 'string',
      width: 120,
      grow: 1,
      renderCellContent: (row) => {
        const leftIcon = row.type === 'leftIcon' || row.type === 'bothIcons' ? PLUS_ICON : undefined
        const rightIcon = row.type === 'rightIcon' || row.type === 'bothIcons' ? ARROW_RIGHT_ICON : undefined
        
        return (
          <Canvas.Container
            direction="row"
            alignItems="center"
            justifyContent="center"
          >
            <Canvas.Button
              view={view}
              size="s"
              leftIcon={leftIcon}
              rightIcon={rightIcon}
              onClick={() => console.log(`Clicked: ${view} button`)}
            >
              Action
            </Canvas.Button>
          </Canvas.Container>
        )
      },
    })
  })

  return columns
}

export function CanvasIconButtonsExample() {
  const iconButtonRows = useMemo(() => generateIconButtonRows(), [])
  const iconButtonColumns = useMemo(() => createIconButtonColumns(), [])
  
  const buttonWithIconsRows = useMemo(() => generateButtonWithIconsRows(), [])
  const buttonWithIconsColumns = useMemo(() => createButtonWithIconsColumns(), [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Canvas Icon Buttons</h2>
      <p className="section-description">
        Демонстрация всех вариантов иконочных кнопок (view) и размеров (size) на основе темы sdds_finai__light.
        Варианты: default, primary, accent, secondary, clear, success, warning, critical, dark, black, white.
        Размеры: xs, s, m, l.
      </p>
      <BasicGrid<IconButtonRow>
        columns={iconButtonColumns}
        rows={iconButtonRows}
        height={400}
        headerRowHeight={44}
        rowHeight={64}
        showRowMarkers={false}
        getRowId={(row) => row.id}
      />
      
      <h2 className="section-title" style={{ marginTop: 32 }}>Canvas Buttons with Icons</h2>
      <p className="section-description">
        Кнопки с иконками слева, справа или с обеих сторон. Отступ между текстом и иконкой — 8px.
      </p>
      <BasicGrid<ButtonWithIconsRow>
        columns={buttonWithIconsColumns}
        rows={buttonWithIconsRows}
        height={300}
        headerRowHeight={44}
        rowHeight={56}
        showRowMarkers={false}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


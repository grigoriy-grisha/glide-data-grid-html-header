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
const PLUS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>'

const ARROW_RIGHT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>'

const DOWNLOAD_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>'

const SETTINGS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'

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
      grow: 1,
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

// Buttons with icons example
interface ButtonWithIconsRow {
  id: string
  type: 'leftIcon' | 'rightIcon' | 'bothIcons' | 'noIcons'
  label: string
  size: ButtonSize
  [key: string]: unknown
}

function generateButtonWithIconsRows(): ButtonWithIconsRow[] {
  return [
    { id: 'left-xs', type: 'leftIcon', label: 'Left XS', size: 'xs' },
    { id: 'left-s', type: 'leftIcon', label: 'Left S', size: 's' },
    { id: 'left-m', type: 'leftIcon', label: 'Left M', size: 'm' },
    { id: 'left-l', type: 'leftIcon', label: 'Left L', size: 'l' },
    { id: 'right', type: 'rightIcon', label: 'Right Icon', size: 'm' },
    { id: 'both', type: 'bothIcons', label: 'Both Icons', size: 'm' },
  ]
}

function createButtonWithIconsColumns(): BasicGridColumn<ButtonWithIconsRow>[] {
  const columns: BasicGridColumn<ButtonWithIconsRow>[] = [
    createColumn<ButtonWithIconsRow>('label', 'string', 'Type', { width: 90, grow: 0 }),
  ]

  const selectedViews: ButtonView[] = ['accent', 'secondary', 'success', 'warning', 'critical', 'dark']
  
  selectedViews.forEach((view) => {
    columns.push({
      title: view.charAt(0).toUpperCase() + view.slice(1),
      dataType: 'string',
      width: 130,
      grow: 1,
      renderCellContent: (row) => {
        const leftIcon = row.type === 'leftIcon' || row.type === 'bothIcons' 
          ? (row.type === 'bothIcons' ? SETTINGS_ICON : PLUS_ICON) 
          : undefined
        const rightIcon = row.type === 'rightIcon' || row.type === 'bothIcons' 
          ? ARROW_RIGHT_ICON 
          : undefined
        
        const buttonText = row.type === 'bothIcons' ? 'Settings' : 
                          row.type === 'leftIcon' ? 'Add' : 
                          row.type === 'rightIcon' ? 'Next' : 'Action'
        
        return (
          <Canvas.Container
            direction="row"
            alignItems="center"
            justifyContent="center"
          >
            <Canvas.Button
              view={view}
              size={row.size}
              leftIcon={leftIcon}
              rightIcon={rightIcon}
              onClick={() => console.log(`Clicked: ${view} button with icons`)}
            >
              {buttonText}
            </Canvas.Button>
          </Canvas.Container>
        )
      },
    })
  })

  return columns
}

export function CanvasButtonsExample() {
  const rows = useMemo(() => generateButtonRows(), [])
  const columns = useMemo(() => createButtonColumns(), [])
  
  const buttonWithIconsRows = useMemo(() => generateButtonWithIconsRows(), [])
  const buttonWithIconsColumns = useMemo(() => createButtonWithIconsColumns(), [])

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
      
      <h2 className="section-title" style={{ marginTop: 32 }}>Buttons with Icons</h2>
      <p className="section-description">
        Кнопки с иконками слева, справа или с обеих сторон. Отступ между текстом и иконкой — 8px.
        Размер иконки зависит от размера кнопки: xs=14px, s=16px, m=18px, l=20px.
      </p>
      <BasicGrid<ButtonWithIconsRow>
        columns={buttonWithIconsColumns}
        rows={buttonWithIconsRows}
        height={400}
        headerRowHeight={44}
        rowHeight={56}
        showRowMarkers={false}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


import {useMemo} from 'react'
import {
    BasicGrid,
    type BasicGridColumn,
    button,
    createColumn,
    layout,
    layoutRow,
    renderComponents,
    tag,
    text
} from '../components/BasicGrid'
import {HeaderCard} from './components/HeaderCard'

interface LayoutTestRow extends Record<string, unknown> {
  id: string
  description: string
}

const layoutTestRows: LayoutTestRow[] = [
  { id: '1', description: 'Layout Test Row 1' },
  { id: '2', description: 'Layout Test Row 2' },
  { id: '3', description: 'Layout Test Row 3' },
  { id: '4', description: 'Layout Test Row 4' },
  { id: '5', description: 'Layout Test Row 5' },
]

export function CanvasLayoutTestExample() {
  const columns = useMemo<BasicGridColumn<LayoutTestRow>[]>(() => [
    {
      title: 'ID',
      children: [
        createColumn<LayoutTestRow>('id', 'string', 'ID', { width: 60 }),
      ],
    },
    {
      title: 'Canvas Layout Test',
      headerContent: <HeaderCard icon="📏" iconTone="purple" title="Layout Test" subtitle="Flexbox-like tests" compact />,
      children: [
        createColumn<LayoutTestRow>('description', 'canvas', 'Layout Visualization', {
          width: 800,
          canvasOptions: {
            render: (ctx, rect, theme, hoverX, hoverY, _row) => {
              // Create a comprehensive layout test structure
              const testLayout = layout(
                [
                  // Row 1: Start Alignment (Default)
                  layoutRow(
                    [
                      text({ text: 'Start:', color: theme.textLight }),
                      button({ text: 'Btn 1', variant: 'primary' }),
                      tag({ text: 'Tag A', color: '#084298', background: '#cfe2ff' }),
                      button({ text: 'Btn 2', variant: 'secondary' }),
                    ],
                    { gap: 10, height: 30 }
                  ),
                  // Row 2: Center Alignment
                  layoutRow(
                    [
                      text({ text: 'Center:', color: theme.textLight }),
                      button({ text: 'Center Btn', variant: 'primary' }),
                      tag({ text: 'Centered Tag', color: '#0f5132', background: '#d1e7dd' }),
                    ],
                    { gap: 10, justify: 'center', height: 30 }
                  ),
                  // Row 3: End Alignment
                  layoutRow(
                    [
                      text({ text: 'End:', color: theme.textLight }),
                      button({ text: 'Right Btn', variant: 'danger' }),
                      tag({ text: 'Right Tag', color: '#842029', background: '#f8d7da' }),
                    ],
                    { gap: 10, justify: 'end', height: 30 }
                  ),
                  // Row 4: Space Between
                  layoutRow(
                    [
                      text({ text: 'Space Between:', color: theme.textLight }),
                      button({ text: 'Left', variant: 'secondary' }),
                      tag({ text: 'Middle', color: '#664d03', background: '#fff3cd' }),
                      button({ text: 'Right', variant: 'secondary' }),
                    ],
                    { gap: 10, justify: 'space-between', height: 30 }
                  ),
                   // Row 5: Space Around
                   layoutRow(
                    [
                      text({ text: 'Space Around:', color: theme.textLight }),
                      button({ text: 'Item 1', variant: 'secondary' }),
                      button({ text: 'Item 2', variant: 'secondary' }),
                    ],
                    { gap: 10, justify: 'space-around', height: 30 }
                  ),
                ],
                {
                  padding: { top: 10, bottom: 10, left: 10, right: 10 },
                  rowGap: 15,
                  width: 'fill',
                }
              )

              return renderComponents([testLayout], ctx, rect, theme, hoverX, hoverY)
            },
          },
        }),
      ],
    },
  ], [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Canvas Layout Test</h2>
      <p className="section-description">
        Visual test for canvas layout engine: Justify Content (Start, Center, End, Space-Between, Space-Around)
      </p>
      <BasicGrid<any>
        columns={columns}
        rows={layoutTestRows}
        height={500}
        rowHeight={250}
        headerRowHeight={50}
        getRowId={(row) => row.id}
      />
    </div>
  )
}


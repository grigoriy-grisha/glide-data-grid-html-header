import { useEffect, useRef } from 'react'
import { CanvasRoot } from '../components/BasicGrid/components/CanvasHeader/core/CanvasRoot'
import { CanvasContainer } from '../components/BasicGrid/components/CanvasHeader/core/CanvasContainer'
import { CanvasText } from '../components/BasicGrid/components/CanvasHeader/primitives/CanvasText'
import { CanvasButton } from '../components/BasicGrid/components/CanvasHeader/primitives/CanvasButton'
import { CanvasIconButton } from '../components/BasicGrid/components/CanvasHeader/primitives/CanvasIconButton'

export function StandaloneCanvasExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<CanvasRoot | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Setup the scene graph
    // Root container (Column direction now to hold rows)
    const mainContainer = new CanvasContainer('root', {
      direction: 'column', // Changed to column to stack rows
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      padding: 20,
    })

    // Row 1: Text items
    const row1 = new CanvasContainer('row1', {
      direction: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      columnGap: 20,
    })

    row1.addChild(new CanvasText('text1', 'Left Text'))

    // Long text with wordWrap enabled and a constrained width
    const longText = new CanvasText(
      'text2',
      'Middle фвфывфыв фывфыловфывофыдлв  лдфывлдофылдовлд фыдлвофлыдовлдфы фыдлволф оылво фыдлво лдфыов лд ф ы олвфо лвдофы Text',
      { wordWrap: true }
    )

    row1.addChild(longText)
    row1.addChild(new CanvasText('text3', 'Right Text'))

    mainContainer.addChild(row1)
    const row2 = new CanvasContainer('row2', {
      direction: 'row',
      alignItems: 'center',
      justifyContent: "flex-start",
      columnGap: 15,
    })

    row2.addChild(new CanvasButton('btn1', 'Click Me', { variant: 'primary', onClick: () => console.log('Clicked!') }))
    row2.addChild(new CanvasText('text4', 'Description text for the button'))

    mainContainer.addChild(row2)

    const row3 = new CanvasContainer('row3', {
      direction: 'row',
      alignItems: 'flex-start',
      columnGap: 15,
    })


    const longText2 = new CanvasText(
      'text5',
      'Another very long text description that should wrap properly if it gets too long for the container width available.',
      { wordWrap: true }
    )

    longText2.style = { width: 200 }
    // Allow it to grow/shrink
    longText2.style.flexGrow = 1;
    longText2.style.flexShrink = 1;

    const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';

    row3.addChild(new CanvasIconButton('iconBtn1', iconSvg, { variant: 'secondary', onClick: () => console.log('Icon clicked') }))

    row3.addChild(new CanvasButton('btn2', 'Action', { variant: 'secondary' }))


    row3.addChild(longText2)

    mainContainer.addChild(row3)

    const row4 = new CanvasContainer('row4', {
      direction: 'row',
      alignItems: 'center',
      columnGap: 10,
    })
    row4.style.alignSelf = 'stretch'

    const row4IconGroup = new CanvasContainer('row4-icon-group', {
      direction: 'row',
      alignItems: 'flex-start',
    })
    row4IconGroup.style.flexShrink = 0

    row4IconGroup.addChild(
      new CanvasIconButton('iconBtn2', iconSvg, {
        variant: 'secondary',
        onClick: () => console.log('Secondary icon click'),
      })
    )

    const row4Content = new CanvasContainer('row4-content', {
      direction: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: 12,
    })

    row4Content.style.width = '100%'

    row4Content.addChild(new CanvasText('text6', 'Row 4 label text'))
    row4Content.addChild(new CanvasButton('btn3', 'Confirm', { variant: 'primary' }))

    row4.addChild(row4IconGroup)
    row4.addChild(row4Content)

    mainContainer.addChild(row4)


    // Initialize Root
    const root = new CanvasRoot(canvas, mainContainer)
    rootRef.current = root

    // Animation Loop
    let animationFrameId: number
    const renderLoop = () => {
      root.render()
      animationFrameId = requestAnimationFrame(renderLoop)
    }

    // Handle High DPI and Resizing correctly
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()

      // Set actual canvas size to handle high DPI
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      // We do NOT scale context here anymore because CanvasRoot.render() handles it every frame
      // Just ensure mainContainer knows the full width if we want it to fill screen
      // But CanvasRoot.render() updates rootNode.rect.width every frame too.
      // However, to prevent CanvasContainer.measure() from shrinking it, we can enforce style.

      // Actually, passing style.width in options is cleaner but we don't have dynamic update there easily
      // unless we update it here.
      mainContainer.style.width = rect.width; // Logical width
      // mainContainer.style.height = rect.height; // Optional, let it grow with content?
      // If we want it to fill height, set it.
      mainContainer.style.height = rect.height;

      // Immediate render on resize to avoid flicker
      root.render()
    }



    // Initial sizing
    handleResize()

    // Start loop
    renderLoop()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Standalone Canvas</h2>
      <p className="section-description">
        Simple layout test: Rows with text and buttons.
      </p>
      <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '300px', display: 'block' }}
        />
      </div>
    </div>
  )
}

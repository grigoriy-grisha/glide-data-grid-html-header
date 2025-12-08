import React, { useRef, useEffect } from 'react'
import { DragState } from '../hooks/useHeaderDragDrop'
import {
  DragIndicator,
  DragGhost,
  DragSnapshot,
  DragSnapshotCanvas,
} from '../../../BasicGrid.styled'

const GHOST_HEIGHT_OFFSET = 8

interface DragOverlaysProps {
  dragState: DragState | null
  height: number
  dropIndicatorRef: React.RefObject<HTMLDivElement>
  ghostRef: React.RefObject<HTMLDivElement>
}

interface SnapshotImageProps {
  snapshot: ImageBitmap | string
  width: number
  height: number
}

const SnapshotImage: React.FC<SnapshotImageProps> = React.memo(({ 
  snapshot, 
  width, 
  height 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (typeof snapshot === 'string' || !canvasRef.current) {
      return
    }

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, width, height)
    canvasRef.current.width = snapshot.width
    canvasRef.current.height = snapshot.height
    ctx.drawImage(snapshot, 0, 0)
  }, [snapshot, width, height])
  
  if (typeof snapshot === 'string') {
    return <DragSnapshot src={snapshot} alt="" />
  }
  
  return <DragSnapshotCanvas ref={canvasRef} />
})

SnapshotImage.displayName = 'SnapshotImage'

export const DragOverlays: React.FC<DragOverlaysProps> = React.memo(({
  dragState,
  height,
  dropIndicatorRef,
  ghostRef
}) => {
  if (!dragState) {
    return null
  }

  const ghostHeight = height - GHOST_HEIGHT_OFFSET

  const ghostStyle: React.CSSProperties = {
    width: dragState.columnWidth,
    height: ghostHeight,
    transform: `translateX(${dragState.initialLeft}px)`,
  }

  return (
    <>
      <DragIndicator ref={dropIndicatorRef} />
      <DragGhost ref={ghostRef} style={ghostStyle}>
        {dragState.snapshot ? (
          <SnapshotImage 
            snapshot={dragState.snapshot} 
            width={dragState.columnWidth} 
            height={ghostHeight} 
          />
        ) : (
          dragState.columnTitle
        )}
      </DragGhost>
    </>
  )
})

DragOverlays.displayName = 'DragOverlays'

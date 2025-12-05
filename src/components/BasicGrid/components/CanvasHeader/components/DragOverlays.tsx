import React, { useRef, useEffect } from 'react'
import { DragState } from '../hooks/useHeaderDragDrop'

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
    return (
      <img 
        src={snapshot} 
        alt="" 
        className="drag-overlay__snapshot"
      />
    )
  }
  
  return (
    <canvas 
      ref={canvasRef}
      className="drag-overlay__snapshot"
    />
  )
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
      <div
        ref={dropIndicatorRef}
        className="drag-overlay__indicator"
      />
      <div
        ref={ghostRef}
        className="drag-overlay__ghost"
        style={ghostStyle}
      >
        {dragState.snapshot ? (
          <SnapshotImage 
            snapshot={dragState.snapshot} 
            width={dragState.columnWidth} 
            height={ghostHeight} 
          />
        ) : (
          dragState.columnTitle
        )}
      </div>
    </>
  )
})

DragOverlays.displayName = 'DragOverlays'

import React, { useRef, useEffect } from 'react'
import { DragState } from '../hooks/useHeaderDragDrop'

interface DragOverlaysProps {
    dragState: DragState | null
    height: number
    dropIndicatorRef: React.RefObject<HTMLDivElement>
    ghostRef: React.RefObject<HTMLDivElement>
}

// Component to render ImageBitmap or string snapshot
const SnapshotImage: React.FC<{ snapshot: ImageBitmap | string; width: number; height: number }> = ({ 
    snapshot, 
    width, 
    height 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    
    useEffect(() => {
        if (typeof snapshot !== 'string' && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) {
                ctx.clearRect(0, 0, width, height)
            
                canvasRef.current.width = snapshot.width
                canvasRef.current.height = snapshot.height
                
                ctx.drawImage(snapshot, 0, 0)
            }
        }
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
}

export const DragOverlays: React.FC<DragOverlaysProps> = ({
    dragState,
    height,
    dropIndicatorRef,
    ghostRef
}) => {
    if (!dragState) return null

    const ghostHeight = height - 8

    const ghostStyle: React.CSSProperties = {
        width: dragState.columnWidth,
        height: ghostHeight,
        transform: `translateX(${dragState.initialLeft}px)`,
    }

    return (
        <>
            {/* Drop Indicator */}
            <div
                ref={dropIndicatorRef}
                className="drag-overlay__indicator"
            />
            {/* Ghost Element */}
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
}

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
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain', // Prevent stretching for string images too
                    opacity: 0.9
                }} 
            />
        )
    }
    
    return (
        <canvas 
            ref={canvasRef}
            style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain', // CSS object-fit doesn't work on canvas content drawing, but useful intent
                opacity: 0.9
            }} 
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

    // Use original captured height if available (implied we might need to add it to DragState)
    // But currently dragState only has columnWidth.
    // For now, stick to 'height - 8' but maybe we can do better?
    // If we can't change DragState now, we fix the image rendering.
    const ghostHeight = height - 8

    return (
        <>
            {/* Drop Indicator */}
            <div
                ref={dropIndicatorRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: 2,
                    backgroundColor: '#1e88e5',
                    zIndex: 100,
                    pointerEvents: 'none',
                    willChange: 'transform'
                }}
            />
            {/* Ghost Element */}
            <div
                ref={ghostRef}
                style={{
                    position: 'absolute',
                    top: 4,
                    left: 0,
                    width: dragState.columnWidth,
                    height: ghostHeight,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #1e88e5',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    zIndex: 101,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 8,
                    borderRadius: 4,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '13px',
                    color: '#1e88e5',
                    fontWeight: 600,
                    transform: `translateX(${dragState.initialLeft}px)`,
                    willChange: 'transform',
                    opacity: 0.5,
                    overflow: 'hidden' // Ensure image doesn't overflow border radius
                }}
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

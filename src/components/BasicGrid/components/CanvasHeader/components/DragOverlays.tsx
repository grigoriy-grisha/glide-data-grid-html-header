import React from 'react'
import { DragState } from '../hooks/useHeaderDragDrop'

interface DragOverlaysProps {
    dragState: DragState | null
    height: number
    dropIndicatorRef: React.RefObject<HTMLDivElement>
    ghostRef: React.RefObject<HTMLDivElement>
}

export const DragOverlays: React.FC<DragOverlaysProps> = ({
    dragState,
    height,
    dropIndicatorRef,
    ghostRef
}) => {
    if (!dragState) return null

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
                    left: 0, // controlled by transform
                    width: dragState.columnWidth,
                    height: height - 8,
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
                    opacity: 0.5
                }}
            >
                {dragState.snapshot ? (
                    <img 
                        src={dragState.snapshot} 
                        alt="" 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain',
                            opacity: 0.9
                        }} 
                    />
                ) : (
                    dragState.columnTitle
                )}
            </div>
        </>
    )
}


import { useState, useRef, useEffect, useCallback } from 'react'

export interface DragState {
    sourceIndex: number
    columnTitle: string
    columnWidth: number
    startX: number
    initialLeft: number
    snapshot?: ImageBitmap | string
}

interface UseHeaderDragDropProps {
    canvasRef: React.RefObject<HTMLCanvasElement>
    columnCount: number
    columnPositions: number[]
    columnWidths: number[]
    scrollLeft: number
    enableColumnReorder?: boolean
    onColumnReorder?: (sourceIndex: number, targetIndex: number) => void
}

/**
 * Binary search to find target column index based on X position.
 * Returns the index where the column should be inserted.
 */
function findTargetIndex(
    relativeX: number,
    columnPositions: number[],
    columnWidths: number[],
    columnCount: number
): number {
    if (columnCount === 0) return 0
    
    let left = 0
    let right = columnCount - 1
    
    while (left <= right) {
        const mid = (left + right) >>> 1
        const pos = columnPositions[mid]
        const width = columnWidths[mid]
        const center = pos + width * 0.5
        
        if (relativeX < center) {
            right = mid - 1
        } else {
            left = mid + 1
        }
    }
    
    return left
}

export const useHeaderDragDrop = ({
    canvasRef,
    columnCount,
    columnPositions,
    columnWidths,
    scrollLeft,
    enableColumnReorder,
    onColumnReorder
}: UseHeaderDragDropProps) => {
    const [dragState, setDragState] = useState<DragState | null>(null)
    
    const ghostRef = useRef<HTMLDivElement>(null)
    const dropIndicatorRef = useRef<HTMLDivElement>(null)
    
    // Cache refs to avoid closure issues
    const scrollLeftRef = useRef(scrollLeft)
    const columnPositionsRef = useRef(columnPositions)
    const columnWidthsRef = useRef(columnWidths)
    const columnCountRef = useRef(columnCount)
    const onColumnReorderRef = useRef(onColumnReorder)
    
    // Update refs when props change
    scrollLeftRef.current = scrollLeft
    columnPositionsRef.current = columnPositions
    columnWidthsRef.current = columnWidths
    columnCountRef.current = columnCount
    onColumnReorderRef.current = onColumnReorder

    // Handler to start dragging
    const handleDragStart = useCallback((
        e: MouseEvent | React.MouseEvent, 
        columnIndex: number, 
        title: string, 
        width: number,
        rect: { x: number, y: number, width: number, height: number }
    ) => {
        if (!enableColumnReorder) return
        
        const nativeEvent = (e as React.MouseEvent).nativeEvent || e
        if ('button' in nativeEvent && nativeEvent.button !== 0) return
        
        const currentScrollLeft = scrollLeftRef.current
        const positions = columnPositionsRef.current
        const initialLeft = (positions[columnIndex] ?? 0) - currentScrollLeft

        // Capture snapshot asynchronously using ImageBitmap (faster than toDataURL)
        let snapshot: ImageBitmap | string | undefined
        const canvas = canvasRef.current
        if (canvas) {
            const dpr = window.devicePixelRatio || 1
            const sx = rect.x * dpr
            const sy = rect.y * dpr
            const sw = rect.width * dpr
            const sh = rect.height * dpr
            
            // Try ImageBitmap first (faster, no encoding)
            if (typeof createImageBitmap === 'function') {
                createImageBitmap(canvas, sx, sy, sw, sh).then(bitmap => {
                    setDragState(prev => prev ? { ...prev, snapshot: bitmap } : null)
                }).catch(() => {
                    // Fallback to canvas copy
                })
            }
        }

        setDragState({
            sourceIndex: columnIndex,
            columnTitle: title,
            columnWidth: width,
            startX: 'clientX' in nativeEvent ? nativeEvent.clientX : 0,
            initialLeft,
            snapshot
        })
    }, [enableColumnReorder, canvasRef])

    // Global Drag Events
    useEffect(() => {
        if (!dragState) return
        
        const ghost = ghostRef.current
        const dropIndicator = dropIndicatorRef.current
        const canvas = canvasRef.current
        
        // Cache header rect to avoid repeated getBoundingClientRect calls
        let headerRect: DOMRect | null = null
        let lastTargetIndex = -1

        const handleMouseMove = (e: MouseEvent) => {
            if (!ghost) return

            const deltaX = e.clientX - dragState.startX
            ghost.style.transform = `translateX(${dragState.initialLeft + deltaX}px)`

            // Lazy init header rect
            if (!headerRect && canvas) {
                headerRect = canvas.getBoundingClientRect()
            }
            if (!headerRect) return

            const currentScrollLeft = scrollLeftRef.current
            const positions = columnPositionsRef.current
            const widths = columnWidthsRef.current
            const count = columnCountRef.current
            
            const relativeX = e.clientX - headerRect.left + currentScrollLeft
            
            // Binary search for target index
            const targetIndex = findTargetIndex(relativeX, positions, widths, count)

            // Only update DOM if target changed
            if (dropIndicator && targetIndex !== lastTargetIndex) {
                lastTargetIndex = targetIndex
                
                let indicatorX: number
                if (targetIndex < count) {
                    indicatorX = (positions[targetIndex] ?? 0) - currentScrollLeft
                } else {
                    const lastIndex = count - 1
                    indicatorX = (positions[lastIndex] ?? 0) + (widths[lastIndex] ?? 0) - currentScrollLeft
                }
                
                dropIndicator.style.transform = `translateX(${indicatorX}px)`
                dropIndicator.dataset.targetIndex = String(targetIndex)
            }
        }

        const handleMouseUp = () => {
            if (dropIndicator) {
                const targetIndexStr = dropIndicator.dataset.targetIndex
                if (targetIndexStr) {
                    const targetIndex = parseInt(targetIndexStr, 10)
                    const sourceIndex = dragState.sourceIndex
                    
                    // Only reorder if position actually changed
                    if (!isNaN(targetIndex) && targetIndex !== sourceIndex && targetIndex !== sourceIndex + 1) {
                        // Use ref to get latest callback
                        onColumnReorderRef.current?.(sourceIndex, targetIndex)
                    }
                }
            }

            // Cleanup snapshot if it's an ImageBitmap
            if (dragState.snapshot && typeof dragState.snapshot !== 'string') {
                dragState.snapshot.close()
            }

            setDragState(null)
            if (canvas) canvas.style.cursor = 'default'
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragState, canvasRef])

    return {
        dragState,
        handleDragStart,
        ghostRef,
        dropIndicatorRef
    }
}

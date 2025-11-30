import { useState, useRef, useEffect, useCallback } from 'react'
import { GridColumn } from '../../../models/GridColumn'

export interface DragState {
    sourceIndex: number
    columnTitle: string
    columnWidth: number
    startX: number
    initialLeft: number
    snapshot?: string
}

interface UseHeaderDragDropProps {
    canvasRef: React.RefObject<HTMLCanvasElement>
    orderedColumns: GridColumn<any>[]
    columnPositions: number[]
    columnWidths: number[]
    scrollLeft: number
    enableColumnReorder?: boolean
    onColumnReorder?: (sourceIndex: number, targetIndex: number) => void
}

export const useHeaderDragDrop = ({
    canvasRef,
    orderedColumns,
    columnPositions,
    columnWidths,
    scrollLeft,
    enableColumnReorder,
    onColumnReorder
}: UseHeaderDragDropProps) => {
    const [dragState, setDragState] = useState<DragState | null>(null)
    
    const ghostRef = useRef<HTMLDivElement>(null)
    const dropIndicatorRef = useRef<HTMLDivElement>(null)

    // Handler to start dragging (passed to the Scene builder)
    const handleDragStart = useCallback((
        e: MouseEvent | React.MouseEvent, 
        columnIndex: number, 
        title: string, 
        width: number,
        rect: { x: number, y: number, width: number, height: number }
    ) => {
        if (!enableColumnReorder) return
        
        // If it's a synthetic event, access native
        const nativeEvent = (e as React.MouseEvent).nativeEvent || e
        
        // Only left click
        if ('button' in nativeEvent && nativeEvent.button !== 0) return
        
        const initialLeft = (columnPositions[columnIndex] ?? 0) - scrollLeft

        let snapshot: string | undefined
        if (canvasRef.current) {
            // Capture snapshot of the cell area
            const dpr = window.devicePixelRatio || 1
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = rect.width * dpr
            tempCanvas.height = rect.height * dpr
            const tempCtx = tempCanvas.getContext('2d')
            if (tempCtx) {
                tempCtx.drawImage(
                    canvasRef.current,
                    rect.x * dpr, rect.y * dpr, rect.width * dpr, rect.height * dpr,
                    0, 0, rect.width * dpr, rect.height * dpr
                )
                snapshot = tempCanvas.toDataURL()
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
    }, [enableColumnReorder, columnPositions, scrollLeft, canvasRef])

    // Global Drag Events
    useEffect(() => {
        if (!dragState) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!ghostRef.current) return

            const deltaX = e.clientX - dragState.startX
            ghostRef.current.style.transform = `translateX(${dragState.initialLeft + deltaX}px)`

            // Calculate Drop Position
            const headerRect = canvasRef.current?.getBoundingClientRect()
            if (!headerRect) return

            const relativeX = e.clientX - headerRect.left + scrollLeft
            
            // Find target index
            let targetIndex = orderedColumns.length
            for(let i = 0; i < orderedColumns.length; i++) {
                const pos = columnPositions[i] ?? 0
                const width = columnWidths[i] ?? 0
                const center = pos + width / 2
                if (relativeX < center) {
                    targetIndex = i
                    break
                }
            }

            // Update Drop Indicator
            if (dropIndicatorRef.current) {
                 let indicatorX = 0
                 if (targetIndex < orderedColumns.length) {
                     indicatorX = (columnPositions[targetIndex] ?? 0) - scrollLeft
                 } else {
                     const lastIndex = orderedColumns.length - 1
                     indicatorX = (columnPositions[lastIndex] ?? 0) + (columnWidths[lastIndex] ?? 0) - scrollLeft
                 }
                 
                 dropIndicatorRef.current.style.transform = `translateX(${indicatorX}px)`
                 dropIndicatorRef.current.dataset.targetIndex = String(targetIndex)
            }
        }

        const handleMouseUp = () => {
            if (dropIndicatorRef.current) {
                const targetIndexStr = dropIndicatorRef.current.dataset.targetIndex
                if (targetIndexStr) {
                    const targetIndex = parseInt(targetIndexStr, 10)
                    if (!isNaN(targetIndex) && targetIndex !== dragState.sourceIndex && targetIndex !== dragState.sourceIndex + 1) {
                         onColumnReorder?.(dragState.sourceIndex, targetIndex)
                    }
                }
            }

            setDragState(null)
            if (canvasRef.current) canvasRef.current.style.cursor = 'default'
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragState, columnPositions, columnWidths, scrollLeft, orderedColumns, onColumnReorder, canvasRef])

    return {
        dragState,
        handleDragStart,
        ghostRef,
        dropIndicatorRef
    }
}


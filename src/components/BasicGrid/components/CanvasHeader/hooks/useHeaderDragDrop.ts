import { useState, useRef, useEffect, useCallback } from 'react'
import { lockPortalHover } from '../../../lib/canvas'

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

    const scrollLeftRef = useRef(scrollLeft)
    const columnPositionsRef = useRef(columnPositions)
    const columnWidthsRef = useRef(columnWidths)
    const columnCountRef = useRef(columnCount)
    const onColumnReorderRef = useRef(onColumnReorder)
    const unlockPortalHoverRef = useRef<(() => void) | null>(null)

    scrollLeftRef.current = scrollLeft
    columnPositionsRef.current = columnPositions
    columnWidthsRef.current = columnWidths
    columnCountRef.current = columnCount
    onColumnReorderRef.current = onColumnReorder

    const captureSnapshot = useCallback((
        canvas: HTMLCanvasElement,
        rect: { x: number, y: number, width: number, height: number }
    ) => {
        if (typeof createImageBitmap !== 'function') {
            return undefined
        }

        const dpr = window.devicePixelRatio || 1
        const sx = rect.x * dpr
        const sy = rect.y * dpr
        const sw = rect.width * dpr
        const sh = rect.height * dpr

        createImageBitmap(canvas, sx, sy, sw, sh)
            .then((bitmap) => {
                setDragState((prev) => (prev ? { ...prev, snapshot: bitmap } : null))
            })
            .catch(() => {})

        return undefined
    }, [])

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

        const canvas = canvasRef.current
        const snapshot = canvas ? captureSnapshot(canvas, rect) : undefined

        unlockPortalHoverRef.current = lockPortalHover()

        setDragState({
            sourceIndex: columnIndex,
            columnTitle: title,
            columnWidth: width,
            startX: 'clientX' in nativeEvent ? nativeEvent.clientX : 0,
            initialLeft,
            snapshot
        })
    }, [captureSnapshot, canvasRef, enableColumnReorder])

    useEffect(() => {
        if (!dragState) return

        const ghost = ghostRef.current
        const dropIndicator = dropIndicatorRef.current
        const canvas = canvasRef.current

        let headerRect: DOMRect | null = null
        let lastTargetIndex = -1

        const handleMouseMove = (e: MouseEvent) => {
            if (!ghost) return

            const deltaX = e.clientX - dragState.startX
            ghost.style.transform = `translateX(${dragState.initialLeft + deltaX}px)`

            if (!headerRect && canvas) {
                headerRect = canvas.getBoundingClientRect()
            }
            if (!headerRect) return

            const currentScrollLeft = scrollLeftRef.current
            const positions = columnPositionsRef.current
            const widths = columnWidthsRef.current
            const count = columnCountRef.current

            const relativeX = e.clientX - headerRect.left + currentScrollLeft
            const targetIndex = findTargetIndex(relativeX, positions, widths, count)

            if (!dropIndicator || targetIndex === lastTargetIndex) {
                return
            }

            lastTargetIndex = targetIndex

            const indicatorX = count === 0
                ? -currentScrollLeft
                : targetIndex < count
                    ? (positions[targetIndex] ?? 0) - currentScrollLeft
                    : (positions[count - 1] ?? 0) + (widths[count - 1] ?? 0) - currentScrollLeft

            dropIndicator.style.transform = `translateX(${indicatorX}px)`
            dropIndicator.dataset.targetIndex = String(targetIndex)
        }

        const handleMouseUp = () => {
            if (dropIndicator?.dataset.targetIndex) {
                const targetIndex = Number(dropIndicator.dataset.targetIndex)
                const { sourceIndex } = dragState

                if (!Number.isNaN(targetIndex) && targetIndex !== sourceIndex && targetIndex !== sourceIndex + 1) {
                    onColumnReorderRef.current?.(sourceIndex, targetIndex)
                }
            }

            if (dragState.snapshot && typeof dragState.snapshot !== 'string') {
                dragState.snapshot.close()
            }

            setDragState(null)
            if (canvas) canvas.style.cursor = 'default'
            unlockPortalHoverRef.current?.()
            unlockPortalHoverRef.current = null
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

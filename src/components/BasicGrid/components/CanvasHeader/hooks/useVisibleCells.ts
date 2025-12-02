import { useMemo } from 'react'
import type { GridHeaderCell } from '../../../models/GridHeaderCell'

interface VisibleIndices {
    start: number
    end: number
}

/**
 * Groups header cells by their level for efficient lookup
 */
function groupCellsByLevel(headerCells: GridHeaderCell[]): GridHeaderCell[][] {
    const groups: GridHeaderCell[][] = []
    for (const cell of headerCells) {
        if (!groups[cell.level]) {
            groups[cell.level] = []
        }
        groups[cell.level].push(cell)
    }
    return groups
}

/**
 * Binary search to find first visible cell in a sorted array
 */
function findFirstVisibleIndex(cells: GridHeaderCell[], start: number): number {
    let left = 0
    let right = cells.length - 1
    let result = -1

    while (left <= right) {
        const mid = (left + right) >> 1
        const cell = cells[mid]
        if (cell.startIndex + cell.colSpan > start) {
            result = mid
            right = mid - 1
        } else {
            left = mid + 1
        }
    }

    return result
}

/**
 * Filters cells to only include those visible in the current viewport
 */
function filterVisibleCells(
    cellsByLevel: GridHeaderCell[][],
    visibleIndices: VisibleIndices
): GridHeaderCell[] {
    const { start, end } = visibleIndices
    const result: GridHeaderCell[] = []

    for (const levelCells of cellsByLevel) {
        if (!levelCells) continue

        const startIdx = findFirstVisibleIndex(levelCells, start)
        if (startIdx === -1) continue

        for (let i = startIdx; i < levelCells.length; i++) {
            const cell = levelCells[i]
            if (cell.startIndex >= end) break
            result.push(cell)
        }
    }

    return result
}

/**
 * Hook that computes visible cells based on current viewport.
 * Uses binary search for efficient lookup in large datasets.
 */
export function useVisibleCells(
    headerCells: GridHeaderCell[],
    visibleIndices: VisibleIndices | null
): GridHeaderCell[] {
    // Group cells by level for efficient lookup
    const cellsByLevel = useMemo(
        () => groupCellsByLevel(headerCells),
        [headerCells]
    )

    // Filter to visible cells only
    return useMemo(() => {
        if (!visibleIndices) return headerCells
        return filterVisibleCells(cellsByLevel, visibleIndices)
    }, [cellsByLevel, visibleIndices, headerCells])
}


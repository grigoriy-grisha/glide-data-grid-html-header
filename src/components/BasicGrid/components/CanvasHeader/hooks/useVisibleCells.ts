import { useMemo } from 'react'
import type { GridHeaderCell } from '../../../models/GridHeaderCell'

interface VisibleIndices {
    start: number
    end: number
}

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

export function useVisibleCells(
    headerCells: GridHeaderCell[],
    visibleIndices: VisibleIndices | null
): GridHeaderCell[] {
    const cellsByLevel = useMemo(
        () => groupCellsByLevel(headerCells),
        [headerCells]
    )

    return useMemo(() => {
        if (!visibleIndices) return headerCells
        return filterVisibleCells(cellsByLevel, visibleIndices)
    }, [cellsByLevel, visibleIndices, headerCells])
}


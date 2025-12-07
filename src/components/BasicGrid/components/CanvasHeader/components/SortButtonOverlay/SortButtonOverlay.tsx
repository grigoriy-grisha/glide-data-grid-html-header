import React from 'react'
import { createPortal } from 'react-dom'
import { IconSortAlphabetAsc, IconSortAlphabetDesc, IconSettingsFilter } from '@salutejs/plasma-icons'
import { usePortalHover } from '../../hooks/usePortalHover'
import { OverlayContainer, IconWrapper } from './SortButtonOverlay.styled'
import { 
  parseSortNodeId, 
  getNextSortDirection, 
  isDefaultSortState,
  type SortButtonData,
  type SortDirection 
} from './sortUtils'

const LEAVE_ANIMATION_DURATION = 200

export interface SortButtonOverlayProps {
  sortColumn?: string
  sortDirection?: SortDirection
  onColumnSort?: (columnId: string, direction: SortDirection) => void
}

function getSortIcon(isColumnSorted: boolean, sortDirection: SortDirection) {
  if (isColumnSorted && sortDirection === 'asc') return IconSortAlphabetAsc
  if (isColumnSorted && sortDirection === 'desc') return IconSortAlphabetDesc
  return IconSettingsFilter
}

export const SortButtonOverlay: React.FC<SortButtonOverlayProps> = React.memo(({
  sortColumn,
  sortDirection,
  onColumnSort,
}) => {
  const state = usePortalHover<SortButtonData>({
    source: 'header',
    filter: parseSortNodeId,
    leaveAnimationDuration: LEAVE_ANIMATION_DURATION,
  })

  const columnId = state.data?.columnId

  const handleClick = React.useCallback(() => {
    if (!columnId || !onColumnSort) return
    const nextDirection = getNextSortDirection(sortColumn, columnId, sortDirection)
    onColumnSort(columnId, nextDirection)
  }, [columnId, sortColumn, sortDirection, onColumnSort])

  if (!state.visible || !columnId) return null

  const isCurrentColumnSorted = sortColumn === columnId
  const isDefault = isDefaultSortState(sortColumn, columnId, sortDirection)
  const IconComponent = getSortIcon(isCurrentColumnSorted, sortDirection)

  return createPortal(
    <OverlayContainer
      $x={state.x}
      $y={state.y}
      $width={state.width}
      $height={state.height}
      onClick={handleClick}
    >
      <IconWrapper $isDefault={isDefault} $leaving={state.leaving}>
        <IconComponent size="s" color="inherit" />
      </IconWrapper>
    </OverlayContainer>,
    document.body
  )
})

SortButtonOverlay.displayName = 'SortButtonOverlay'






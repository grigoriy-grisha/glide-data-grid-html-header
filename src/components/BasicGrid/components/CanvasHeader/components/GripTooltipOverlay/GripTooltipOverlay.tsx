import React from 'react'
import {createPortal} from 'react-dom'
import {Tooltip} from '@salutejs/sdds-finai'
import {usePortalHover} from '../../hooks/usePortalHover'
import {type GripData, parseGripNodeId} from './gripUtils'

const LEAVE_ANIMATION_DURATION = 100
const TOOLTIP_TEXT = 'Перетащить колонку'

export const GripTooltipOverlay: React.FC = React.memo(() => {

  const state = usePortalHover<GripData>({
    source: 'header',
    filter: parseGripNodeId,
    leaveAnimationDuration: LEAVE_ANIMATION_DURATION,
  })

  if (!state.visible) return null

  return createPortal(
    <div
      className="asdasd124e"
      style={{
        position: 'fixed',
        left: state.x + window.scrollX,
        top: state.y + window.scrollY,
        width: Math.max(0, state.width),
        height: Math.max(0, state.height),
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }}
    >
      <Tooltip
        opened={state.visible && !state.leaving}
        placement="top"
        text={TOOLTIP_TEXT}
        view="default"
        style={{
            position: 'relative',
        }}
        target={
          <div
            style={{
              width: Math.max(0, state.width),
              height: Math.max(0, state.height * 2),
            }}
          />
        }
      />
    </div>,
    document.body
  )
})

GripTooltipOverlay.displayName = 'GripTooltipOverlay'



import React, { useEffect, useRef } from 'react'
import { RowOverlayWrapper, RowOverlayContent } from '../BasicGrid.styled'

interface RowOverlayProps<RowType> {
  overlayRow: RowType | null | undefined
  overlayContent: React.ReactNode | null | undefined
  overlayPosition: { top: number } | null | undefined
  onOverlayClose?: () => void
}

export function RowOverlay<RowType>({
  overlayRow,
  overlayContent,
  overlayPosition,
  onOverlayClose,
}: RowOverlayProps<RowType>) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const overlayVisibleRef = useRef(false)

  useEffect(() => {
    const hasOverlay = Boolean(overlayRow && overlayContent && overlayPosition)
    if (overlayVisibleRef.current && !hasOverlay) {
      onOverlayClose?.()
    }
    overlayVisibleRef.current = hasOverlay
  }, [onOverlayClose, overlayContent, overlayPosition, overlayRow])

  if (!overlayRow || !overlayContent || !overlayPosition) {
    return null
  }

  return (
    <RowOverlayWrapper style={{ top: overlayPosition.top }} ref={overlayRef}>
      <RowOverlayContent>{overlayContent}</RowOverlayContent>
    </RowOverlayWrapper>
  )
}

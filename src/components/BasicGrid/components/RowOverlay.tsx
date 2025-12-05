import React, { useEffect, useRef } from 'react'

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
    <div className="basic-grid-row-overlay" style={{ top: overlayPosition.top }} ref={overlayRef}>
      <div className="basic-grid-row-overlay-content">{overlayContent}</div>
    </div>
  )
}


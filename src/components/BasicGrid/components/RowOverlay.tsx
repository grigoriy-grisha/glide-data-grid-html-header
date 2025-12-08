import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { RowOverlayContent } from '../BasicGrid.styled'
import styled, { keyframes } from 'styled-components'

const overlayEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const PortalOverlayWrapper = styled.div`
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  animation: ${overlayEnter} 0.2s ease-out;
`

interface RowOverlayProps<RowType> {
  overlayRow: RowType | null | undefined
  overlayContent: React.ReactNode | null | undefined
  overlayPosition: { top: number } | null | undefined
  onOverlayClose?: () => void
  gridBodyRef?: React.RefObject<HTMLDivElement>
}

interface PortalPosition {
  top: number
  left: number
  width: number
}

export function RowOverlay<RowType>({
  overlayRow,
  overlayContent,
  overlayPosition,
  onOverlayClose,
  gridBodyRef,
}: RowOverlayProps<RowType>) {
  const overlayVisibleRef = useRef(false)
  const [portalPosition, setPortalPosition] = useState<PortalPosition | null>(null)

  useEffect(() => {
    const hasOverlay = Boolean(overlayRow && overlayContent && overlayPosition)
    if (overlayVisibleRef.current && !hasOverlay) {
      onOverlayClose?.()
    }
    overlayVisibleRef.current = hasOverlay
  }, [onOverlayClose, overlayContent, overlayPosition, overlayRow])

  const updatePosition = useCallback(() => {
    if (!gridBodyRef?.current || !overlayPosition) return

    const bodyRect = gridBodyRef.current.getBoundingClientRect()
    
    setPortalPosition({
      top: bodyRect.top + overlayPosition.top,
      left: bodyRect.left + 16,
      width: bodyRect.width - 32,
    })
  }, [gridBodyRef, overlayPosition])

  useLayoutEffect(() => {
    if (!overlayRow || !overlayContent || !overlayPosition || !gridBodyRef?.current) {
      setPortalPosition(null)
      return
    }

    updatePosition()

    let rafId: number
    const handleScroll = () => {
      rafId = requestAnimationFrame(updatePosition)
    }

    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', updatePosition)
    
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [overlayRow, overlayContent, overlayPosition, gridBodyRef, updatePosition])

  if (!overlayRow || !overlayContent || !overlayPosition || !portalPosition) {
    return null
  }

  return createPortal(
    <PortalOverlayWrapper
      style={{
        top: portalPosition.top,
        left: portalPosition.left,
        width: portalPosition.width,
      }}
    >
      <RowOverlayContent>{overlayContent}</RowOverlayContent>
    </PortalOverlayWrapper>,
    document.body
  )
}

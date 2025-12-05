import React, { useRef } from 'react'

interface VirtualResizeLineProps {
  style: React.CSSProperties
}

export function VirtualResizeLine({ style }: VirtualResizeLineProps) {
  const virtualResizeLineRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={virtualResizeLineRef}
      className="basic-grid-virtual-resize-line"
      style={style}
    />
  )
}


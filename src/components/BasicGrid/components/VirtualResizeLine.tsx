import React, { useRef } from 'react'
import { VirtualResizeLineStyled } from '../BasicGrid.styled'

interface VirtualResizeLineProps {
  style: React.CSSProperties
}

export function VirtualResizeLine({ style }: VirtualResizeLineProps) {
  const virtualResizeLineRef = useRef<HTMLDivElement>(null)

  return <VirtualResizeLineStyled ref={virtualResizeLineRef} style={style} />
}

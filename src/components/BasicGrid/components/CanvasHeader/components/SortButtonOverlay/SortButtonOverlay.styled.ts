import styled, { keyframes } from 'styled-components'

const ANIMATION_DURATION = '0.2s'

export const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

export const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(8px);
  }
`

export const OverlayContainer = styled.div<{
  $x: number
  $y: number
  $width: number
  $height: number
}>`
  cursor: pointer;
  position: fixed;
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow: hidden;
`

export const IconWrapper = styled.span<{ $isDefault: boolean; $leaving: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $isDefault }) => ($isDefault ? 1 : 0)};
  animation: ${({ $isDefault, $leaving }) => 
    $isDefault ? ($leaving ? slideOut : slideIn) : 'none'
  } ${ANIMATION_DURATION} ease-out forwards;
`






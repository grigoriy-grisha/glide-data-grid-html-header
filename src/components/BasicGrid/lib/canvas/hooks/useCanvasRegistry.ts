import { useRef, useCallback } from 'react'
import { CanvasRegistry } from '../core/CanvasRegistry'

export function useCanvasRegistry() {
  const registryRef = useRef<CanvasRegistry | null>(null)
  
  const getRegistry = useCallback(() => {
    if (!registryRef.current) {
      registryRef.current = new CanvasRegistry()
    }
    return registryRef.current
  }, [])

  return {
    registry: getRegistry(),
    getRegistry,
  }
}


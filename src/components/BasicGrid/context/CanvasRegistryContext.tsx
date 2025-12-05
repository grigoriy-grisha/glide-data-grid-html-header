import { createContext, useContext } from 'react';
import { CanvasRegistry } from '../lib/canvas';

export const CanvasRegistryContext = createContext<CanvasRegistry | null>(null);

export function useCanvasRegistry() {
  const context = useContext(CanvasRegistryContext);
  if (!context) {
    throw new Error('useCanvasRegistry must be used within a CanvasRegistryProvider');
  }
  return context;
}



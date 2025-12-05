import { CanvasRegistry } from '../lib/canvas'
import { createSafeContext } from './createSafeContext'

export const [CanvasRegistryContext, useCanvasRegistry] = createSafeContext<CanvasRegistry>('CanvasRegistry')

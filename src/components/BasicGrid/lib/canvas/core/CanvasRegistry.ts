import { CanvasNode } from './CanvasNode'

export type RegistryListener = (id: string) => void

export class CanvasRegistry {
  private nodes: Map<string, CanvasNode> = new Map()
  private listeners: Set<RegistryListener> = new Set()

  register(id: string, node: CanvasNode): void {
    this.nodes.set(id, node)
    this.notify(id)
  }

  unregister(id: string): void {
    this.nodes.delete(id)
  }

  get(id: string): CanvasNode | undefined {
    return this.nodes.get(id)
  }

  subscribe(listener: RegistryListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(id: string): void {
    this.listeners.forEach((listener) => listener(id))
  }
}


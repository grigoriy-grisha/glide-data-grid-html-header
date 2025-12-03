import { CanvasNode } from '../components/CanvasHeader/core/CanvasNode';

export class CanvasRegistry {
  private nodes: Map<string, CanvasNode> = new Map();
  private listeners: Set<(id: string) => void> = new Set();

  constructor() {}

  register(id: string, node: CanvasNode) {
    this.nodes.set(id, node);
    this.notify(id);
  }

  unregister(id: string) {
    this.nodes.delete(id);
    // We might want to notify here too if needed, 
    // but unregister usually happens when React unmounts, 
    // so the cell is likely no longer visible anyway.
  }

  get(id: string): CanvasNode | undefined {
    return this.nodes.get(id);
  }

  subscribe(listener: (id: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(id: string) {
    this.listeners.forEach((listener) => listener(id));
  }
}


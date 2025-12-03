import { useState, useEffect } from 'react'

export class RenderRequestRegistry {
    private requests = new Set<string>()
    private lastSeen = new Map<string, number>()
    private listeners = new Set<() => void>()
    
    // How many frames a cell can be unseen before we unmount it
    private static TTL_FRAMES = 60 // ~1 second at 60fps

    // Mark a cell as "seen" this frame
    request(id: string) {
        if (!this.requests.has(id)) {
            this.requests.add(id)
            this.notify()
        }
        this.lastSeen.set(id, Date.now())
    }

    // Garbage collect cells that haven't been requested recently
    // This should be called periodically, e.g., every 1-2 seconds
    cleanup() {
        const now = Date.now()
        const TTL_MS = 5000 // 5 seconds
        
        let changed = false
        for (const [id, time] of this.lastSeen.entries()) {
            if (now - time > TTL_MS) {
                this.requests.delete(id)
                this.lastSeen.delete(id)
                changed = true
            }
        }
        
        if (changed) {
            this.notify()
        }
    }

    subscribe(listener: () => void) {
        this.listeners.add(listener)
        return () => {
            this.listeners.delete(listener)
        }
    }
    
    getRequestedIds() {
        return Array.from(this.requests)
    }

    private notify() {
        this.listeners.forEach(l => l())
    }
}

// Global instance (or context based)
export const renderRequestRegistry = new RenderRequestRegistry()

// Hook for React layer to know what to render
export function useRenderRequests() {
    const [ids, setIds] = useState<string[]>([])
    
    useEffect(() => {
        const update = () => setIds(renderRequestRegistry.getRequestedIds())
        // Initial state
        update()
        return renderRequestRegistry.subscribe(update)
    }, [])
    
    return ids
}






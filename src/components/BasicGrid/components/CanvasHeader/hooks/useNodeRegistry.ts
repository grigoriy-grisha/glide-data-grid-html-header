import { useRef, useCallback } from 'react'
import type { ReactElement } from 'react'

/**
 * Registry for storing JSX content from React components
 * to be rendered on Canvas.
 */
export interface NodeRegistry {
    /** Store JSX content for a cell */
    set(cellId: string, content: ReactElement): void
    /** Get JSX content for a cell */
    get(cellId: string): ReactElement | undefined
    /** Remove JSX content for a cell */
    delete(cellId: string): void
    /** Check if content exists for a cell */
    has(cellId: string): boolean
}

/**
 * Subscription function type for registry changes
 */
export type UnsubscribeFn = () => void
export type SubscribeFn = (callback: () => void) => UnsubscribeFn

/**
 * Hook that provides a node registry with pub/sub for changes.
 * Uses requestAnimationFrame for debouncing multiple rapid updates.
 */
export function useNodeRegistry() {
    // Internal storage
    const registryRef = useRef(new Map<string, ReactElement>())
    
    // Subscribers for change notifications
    const subscribersRef = useRef(new Set<() => void>())
    
    // Pending notification frame ID
    const pendingFrameRef = useRef<number | null>(null)

    // Notify subscribers with debounce via rAF
    const notifyChange = useCallback(() => {
        if (pendingFrameRef.current !== null) {
            cancelAnimationFrame(pendingFrameRef.current)
        }
        
        pendingFrameRef.current = requestAnimationFrame(() => {
            pendingFrameRef.current = null
            subscribersRef.current.forEach(fn => fn())
        })
    }, [])

    // Registry interface
    const registry: NodeRegistry = {
        set: (cellId, content) => {
            registryRef.current.set(cellId, content)
        },
        get: (cellId) => registryRef.current.get(cellId),
        delete: (cellId) => {
            registryRef.current.delete(cellId)
        },
        has: (cellId) => registryRef.current.has(cellId),
    }

    // Subscribe to changes
    const subscribe: SubscribeFn = useCallback((callback) => {
        subscribersRef.current.add(callback)
        return () => {
            subscribersRef.current.delete(callback)
        }
    }, [])

    return {
        registry,
        registryRef,
        notifyChange,
        subscribe,
    }
}


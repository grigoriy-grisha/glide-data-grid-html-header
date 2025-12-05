import { useRef, useCallback } from 'react'
import type { ReactElement } from 'react'

export interface NodeRegistry {
    set(cellId: string, content: ReactElement): void
    get(cellId: string): ReactElement | undefined
    delete(cellId: string): void
    has(cellId: string): boolean
}

export type UnsubscribeFn = () => void
export type SubscribeFn = (callback: () => void) => UnsubscribeFn

function scheduleMicrotask(callback: () => void) {
    if (typeof queueMicrotask === 'function') {
        queueMicrotask(callback)
    } else {
        Promise.resolve().then(callback).catch(() => {})
    }
}

export function useNodeRegistry() {
    const registryRef = useRef(new Map<string, ReactElement>())
    const subscribersRef = useRef(new Set<() => void>())
    const notificationPendingRef = useRef(false)

    const notifyChange = useCallback(() => {
        if (notificationPendingRef.current) {
            return
        }

        notificationPendingRef.current = true
        scheduleMicrotask(() => {
            notificationPendingRef.current = false
            subscribersRef.current.forEach((fn) => {
                fn()
            })
        })
    }, [])

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


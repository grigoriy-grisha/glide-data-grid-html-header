import { createContext, useContext } from 'react'

/**
 * Creates a context with a hook that throws if used outside provider
 */
export function createSafeContext<T>(displayName: string) {
  const Context = createContext<T | null>(null)
  Context.displayName = displayName

  function useSafeContext(): T {
    const context = useContext(Context)
    if (!context) {
      throw new Error(`use${displayName} must be used within ${displayName}Provider`)
    }
    return context
  }

  return [Context, useSafeContext] as const
}





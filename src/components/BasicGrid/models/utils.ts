/**
 * Resolves a nested property value from an object using dot notation.
 * @example resolveAccessorValue({ user: { name: 'John' } }, 'user.name') // 'John'
 */
export function resolveAccessorValue(
  obj: Record<string, unknown>,
  accessor: string | number | symbol
): unknown {
  if (typeof accessor === 'string' && accessor.includes('.')) {
    return accessor.split('.').reduce<unknown>((acc, key) => {
      if (acc == null || typeof acc !== 'object') {
        return undefined
      }
      return (acc as Record<string, unknown>)[key]
    }, obj)
  }
  return obj[accessor as keyof typeof obj]
}

/**
 * Compares two sets for equality.
 */
export function areSetsEqual<T>(first: Set<T>, second: Set<T>): boolean {
  if (first.size !== second.size) {
    return false
  }
  for (const value of first) {
    if (!second.has(value)) {
      return false
    }
  }
  return true
}





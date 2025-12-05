import { useState, useCallback, useRef } from 'react'

type NumericRecord = { [K: string]: number }

export function useThrottledIndices<T extends NumericRecord>(
  initialIndices: T,
  threshold: number = 5
): [T, (newIndices: Partial<T>) => void] {
  const [indices, setIndices] = useState<T>(initialIndices)
  const isInitialMountRef = useRef(true)

  const updateIndices = useCallback(
    (newIndices: Partial<T>) => {
      setIndices((prev) => {
        if (isInitialMountRef.current) {
          isInitialMountRef.current = false
          return { ...prev, ...newIndices }
        }

        let changed = false
        const result = { ...prev }

        for (const key of Object.keys(newIndices) as Array<keyof T>) {
          const newValue = newIndices[key]
          if (newValue !== undefined && Math.abs(prev[key] - newValue) >= threshold) {
            result[key] = newValue as T[keyof T]
            changed = true
          }
        }

        return changed ? result : prev
      })
    },
    [threshold]
  )

  return [indices, updateIndices]
}
